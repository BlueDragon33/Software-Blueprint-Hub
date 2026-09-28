import { getBlueprintServerRuntime } from "./runtime";

export type HumanReviewReadinessState = "ready" | "blocked" | "warning";

export interface HumanReviewReadinessCheck {
  readonly id: string;
  readonly label: string;
  readonly state: HumanReviewReadinessState;
  readonly detail: string;
}

export interface HumanReviewReadinessEnvironment {
  readonly databaseUrl?: string | null | undefined;
  readonly authSecret?: string | null | undefined;
  readonly githubClientId?: string | null | undefined;
  readonly githubClientSecret?: string | null | undefined;
  readonly bootstrapProvider?: string | null | undefined;
  readonly bootstrapSubject?: string | null | undefined;
  readonly allowLocalHttpAuth?: string | null | undefined;
  readonly nodeEnv?: string | null | undefined;
}

export interface HumanReviewRuntimeReadiness {
  readonly ready: boolean;
  readonly checks: readonly HumanReviewReadinessCheck[];
}

function configured(value: string | null | undefined): boolean {
  return Boolean(value?.trim());
}

function check(
  id: string,
  label: string,
  ok: boolean,
  readyDetail: string,
  blockedDetail: string
): HumanReviewReadinessCheck {
  return Object.freeze({
    id,
    label,
    state: ok ? "ready" : "blocked",
    detail: ok ? readyDetail : blockedDetail
  });
}

export function evaluateHumanReviewEnvironment(
  environment: HumanReviewReadinessEnvironment
): readonly HumanReviewReadinessCheck[] {
  const checks: HumanReviewReadinessCheck[] = [
    check(
      "database-url",
      "PostgreSQL connection",
      configured(environment.databaseUrl),
      "DATABASE_URL is configured.",
      "DATABASE_URL is missing."
    ),
    check(
      "auth-secret",
      "Auth.js signing secret",
      configured(environment.authSecret),
      "AUTH_SECRET is configured.",
      "AUTH_SECRET is missing."
    ),
    check(
      "github-oauth",
      "GitHub OAuth",
      configured(environment.githubClientId) &&
        configured(environment.githubClientSecret),
      "GitHub OAuth client ID and secret are configured.",
      "GITHUB_ID and/or GITHUB_SECRET is missing."
    ),
    check(
      "owner-bootstrap-identity",
      "System Owner bootstrap identity",
      configured(environment.bootstrapProvider) &&
        configured(environment.bootstrapSubject),
      "The bootstrap provider and provider subject are configured.",
      "BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER and/or BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT is missing."
    )
  ];

  const localHttpEnabled =
    environment.allowLocalHttpAuth?.trim().toLowerCase() === "true";

  checks.push(
    Object.freeze({
      id: "local-http-auth",
      label: "Local HTTP auth exception",
      state: localHttpEnabled ? "warning" : "ready",
      detail: localHttpEnabled
        ? "BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH is enabled. Use it only for loopback local review."
        : "Local HTTP auth exception is disabled."
    })
  );

  return Object.freeze(checks);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Human review database readiness timed out")),
          timeoutMs
        );
      })
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

interface SchemaProbeRow {
  readonly authorityReady: boolean;
  readonly reviewDecisionReady: boolean;
}

async function probeDatabase(
  databaseConfigured: boolean
): Promise<readonly HumanReviewReadinessCheck[]> {
  if (!databaseConfigured) {
    return Object.freeze([
      Object.freeze({
        id: "database-connectivity",
        label: "PostgreSQL connectivity",
        state: "blocked",
        detail: "Connectivity cannot be checked until DATABASE_URL is configured."
      }),
      Object.freeze({
        id: "review-schema",
        label: "P9-019 persistence schema",
        state: "blocked",
        detail: "Schema cannot be checked until PostgreSQL is reachable."
      })
    ]);
  }

  try {
    const runtime = getBlueprintServerRuntime();
    const rows = await withTimeout(
      runtime.prisma.$queryRawUnsafe<SchemaProbeRow[]>(`
        SELECT
          to_regclass('public."SystemBootstrap"') IS NOT NULL AS "authorityReady",
          to_regclass('public."HumanProfessionalReviewDecision"') IS NOT NULL AS "reviewDecisionReady"
      `),
      4000
    );
    const row = rows[0];
    const authorityReady = row?.authorityReady === true;
    const reviewDecisionReady = row?.reviewDecisionReady === true;

    return Object.freeze([
      Object.freeze({
        id: "database-connectivity",
        label: "PostgreSQL connectivity",
        state: "ready",
        detail: "PostgreSQL accepted a readiness query."
      }),
      Object.freeze({
        id: "review-schema",
        label: "P9-019 persistence schema",
        state:
          authorityReady && reviewDecisionReady ? "ready" : "blocked",
        detail:
          authorityReady && reviewDecisionReady
            ? "Authority bootstrap and human-review decision tables are present."
            : "Required authority/review tables are missing. Run the canonical migrations."
      })
    ]);
  } catch {
    return Object.freeze([
      Object.freeze({
        id: "database-connectivity",
        label: "PostgreSQL connectivity",
        state: "blocked",
        detail: "PostgreSQL could not be reached with the configured DATABASE_URL."
      }),
      Object.freeze({
        id: "review-schema",
        label: "P9-019 persistence schema",
        state: "blocked",
        detail: "Schema readiness could not be verified because the database probe failed."
      })
    ]);
  }
}

export async function getHumanReviewRuntimeReadiness(
  environment: HumanReviewReadinessEnvironment = {
    databaseUrl: process.env.DATABASE_URL,
    authSecret: process.env.AUTH_SECRET,
    githubClientId: process.env.GITHUB_ID,
    githubClientSecret: process.env.GITHUB_SECRET,
    bootstrapProvider: process.env.BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER,
    bootstrapSubject: process.env.BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT,
    allowLocalHttpAuth: process.env.BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH,
    nodeEnv: process.env.NODE_ENV
  }
): Promise<HumanReviewRuntimeReadiness> {
  const environmentChecks = evaluateHumanReviewEnvironment(environment);
  const databaseChecks = await probeDatabase(
    configured(environment.databaseUrl)
  );
  const checks = Object.freeze([
    ...environmentChecks,
    ...databaseChecks
  ]);
  const ready = checks.every((item) => item.state !== "blocked");

  return Object.freeze({ ready, checks });
}
