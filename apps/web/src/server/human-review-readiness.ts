import { getBlueprintServerRuntime, hasD1WorkerRuntime } from "./runtime";

export type HumanReviewReadinessState = "ready" | "blocked" | "warning";

export interface HumanReviewReadinessCheck {
  readonly id: string;
  readonly label: string;
  readonly state: HumanReviewReadinessState;
  readonly detail: string;
}

export interface HumanReviewReadinessEnvironment {
  readonly databaseUrl?: string | null | undefined;
  readonly persistenceProvider?: string | undefined;
  readonly d1BindingAvailable?: boolean | undefined;
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
  const d1=environment.persistenceProvider==="d1";
  const supported=environment.persistenceProvider===undefined||environment.persistenceProvider==="postgres"||d1;
  const checks: HumanReviewReadinessCheck[] = [
    check(
      "database-url",
      d1?"Cloudflare D1 binding":"PostgreSQL connection",
      supported&&(d1?environment.d1BindingAvailable===true:configured(environment.databaseUrl)),
      d1?"Request-scoped D1 binding is configured.":"DATABASE_URL is configured.",
      d1?"Trusted Worker D1 binding is missing.":"DATABASE_URL is missing or persistence provider unsupported."
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

async function probeDatabase(
  databaseConfigured: boolean,
  d1: boolean
): Promise<readonly HumanReviewReadinessCheck[]> {
  if (!databaseConfigured) {
    return Object.freeze([
      Object.freeze({
        id: "database-connectivity",
        label: d1?"Cloudflare D1 connectivity":"PostgreSQL connectivity",
        state: "blocked",
        detail: d1?"Connectivity cannot be checked without the D1 binding.":"Connectivity cannot be checked until DATABASE_URL is configured."
      }),
      Object.freeze({
        id: "review-schema",
        label: "P9-019 persistence schema",
        state: "blocked",
        detail: "Schema cannot be checked until the canonical database is reachable."
      })
    ]);
  }

  try {
    const runtime = getBlueprintServerRuntime();
    const row = await withTimeout(runtime.probeReviewSchema(), 4000);
    const authorityReady = row?.authorityReady === true;
    const reviewDecisionReady = row?.reviewDecisionReady === true;

    return Object.freeze([
      Object.freeze({
        id: "database-connectivity",
        label: d1?"Cloudflare D1 connectivity":"PostgreSQL connectivity",
        state: "ready",
        detail: d1?"D1 accepted a readiness query.":"PostgreSQL accepted a readiness query."
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
        label: d1?"Cloudflare D1 connectivity":"PostgreSQL connectivity",
        state: "blocked",
        detail: d1?"D1 could not be reached with the trusted binding.":"PostgreSQL could not be reached with the configured DATABASE_URL."
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
    persistenceProvider: hasD1WorkerRuntime() ? "d1" : process.env.BLUEPRINT_PERSISTENCE_PROVIDER,
    d1BindingAvailable: hasD1WorkerRuntime(),
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
  const d1=environment.persistenceProvider==="d1";
  const databaseChecks = await probeDatabase(
    environmentChecks.find(check=>check.id==="database-url")?.state==="ready",d1
  );
  const checks = Object.freeze([
    ...environmentChecks,
    ...databaseChecks
  ]);
  const ready = checks.every((item) => item.state !== "blocked");

  return Object.freeze({ ready, checks });
}
