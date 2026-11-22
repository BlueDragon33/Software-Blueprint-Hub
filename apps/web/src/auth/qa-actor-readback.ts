import { createHash } from "node:crypto";

/**
 * Narrow, opt-in readback for *real* localhost browser QA only.
 * This is test evidence, NEVER identity delegation or authorization.
 * Neither a raw Principal ID nor a credential is put in the browser DOM.
 */
export interface QaActorReadbackInput {
  readonly nodeEnv: string | undefined;
  readonly enabled: string | undefined;
  readonly qaProjectId: string | undefined;
  readonly projectId: string;
  readonly databaseUrl: string | undefined;
  readonly baseUrl: string | undefined;
  readonly requestHost: string | null;
  readonly principalId: string;
}

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function qaActorReadbackDigest(input: QaActorReadbackInput): string | null {
  if (!["development", "test"].includes(input.nodeEnv ?? "") ||
      input.enabled !== "true" ||
      !/^project:qa-[a-z0-9-]+$/.test(input.projectId) ||
      input.qaProjectId !== input.projectId ||
      !/^principal:[0-9a-fA-F-]{36}$/.test(input.principalId)) {
    return null;
  }

  try {
    const db = new URL(input.databaseUrl ?? "");
    const base = new URL(input.baseUrl ?? "");
    if (!["postgres:", "postgresql:"].includes(db.protocol) ||
        !LOOPBACK.has(db.hostname) ||
        db.pathname !== "/blueprint_qa_test" ||
        !["http:", "https:"].includes(base.protocol) ||
        !LOOPBACK.has(base.hostname) ||
        base.username || base.password || base.pathname !== "/" ||
        base.search || base.hash ||
        !input.requestHost ||
        base.host.toLowerCase() !== input.requestHost.trim().toLowerCase()) {
      return null;
    }
    // SHA-256 is a comparison fingerprint, not a secret, token or access grant.
    return createHash("sha256").update(input.principalId).digest("hex");
  } catch {
    return null;
  }
}
