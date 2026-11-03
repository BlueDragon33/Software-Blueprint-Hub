/**
 * Additive version-2 PR identity attestation contract.
 * Distinct from the existing v1 WorkflowExecutionGrant and from any QA/PR approval.
 * An external, independently authorized issuer signs the canonical payload.
 */
import { createHash, createPublicKey, verify } from "node:crypto";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const SHA = /^[a-f0-9]{40}$/;
const NONCE = /^[a-f0-9]{32,64}$/;
const REPO = /^BlueDragon33\/[A-Za-z0-9_.-]+$/;
const PATH = /^[A-Za-z0-9_./-]{2,240}$/;
const KEYS = ["schemaVersion", "kind", "requestId", "projectId", "repository",
  "pullRequestNumber", "baseSha", "headSha", "allowedPaths", "workflowDigest",
  "canonicalDigest", "policyVersion", "nonce", "issuedAt", "expiresAt"] as const;

export interface PrReviewIdentityPayload {
  readonly schemaVersion: "2.0.0";
  readonly kind: "bounded-pr-review-identity";
  readonly requestId: string;
  readonly projectId: string;
  readonly repository: string;
  readonly pullRequestNumber: number;
  readonly baseSha: string;
  readonly headSha: string;
  readonly allowedPaths: readonly string[];
  readonly workflowDigest: string;
  readonly canonicalDigest: string;
  readonly policyVersion: "1.3.0";
  readonly nonce: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
}
export interface SignedPrReviewIdentity extends PrReviewIdentityPayload {
  readonly signature: string;
}
export interface PrReviewIdentityExpectation {
  readonly requestId: string;
  readonly projectId: string;
  readonly repository: string;
  readonly pullRequestNumber: number;
  readonly headSha: string;
  readonly allowedPaths: readonly string[];
  readonly workflowDigest: string;
  readonly canonicalDigest: string;
  readonly policyVersion: string;
}
export interface PrReviewIdentityReplayStore {
  /** Durable, atomic insert-once across concurrent workers, not in-memory production state. */
  claim(bindingId: string, expiresAt: string): Promise<boolean>;
}
const record = (x: unknown): x is Record<string, unknown> =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const exactKeys = (x: Record<string, unknown>, keys: readonly string[]): boolean =>
  Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x, k));
const pathOk = (x: unknown): x is string =>
  typeof x === "string" && PATH.test(x) &&
  x.split("/").every(y => y.length > 0 && y !== "." && y !== "..");
function stable(x: unknown): unknown {
  if (Array.isArray(x)) return x.map(stable);
  if (record(x)) return Object.fromEntries(Object.entries(x)
    .sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]));
  return x;
}
export function prReviewIdentitySigningPayload(value: PrReviewIdentityPayload): string {
  return JSON.stringify(stable(value));
}
function valid(input: unknown): input is SignedPrReviewIdentity {
  if (!record(input) || !exactKeys(input, [...KEYS, "signature"])) return false;
  if (input.schemaVersion !== "2.0.0" || input.kind !== "bounded-pr-review-identity" ||
      input.policyVersion !== "1.3.0" || !DIGEST.test(String(input.requestId)) ||
      typeof input.projectId !== "string" ||
      !/^project:[a-z0-9][a-z0-9-]{1,90}$/.test(input.projectId) ||
      !REPO.test(String(input.repository)) || !SHA.test(String(input.baseSha)) ||
      !SHA.test(String(input.headSha)) || input.baseSha === input.headSha ||
      !DIGEST.test(String(input.workflowDigest)) ||
      !DIGEST.test(String(input.canonicalDigest)) || !NONCE.test(String(input.nonce)) ||
      !Number.isSafeInteger(input.pullRequestNumber) || Number(input.pullRequestNumber) < 1 ||
      Number(input.pullRequestNumber) > 10_000_000 ||
      typeof input.issuedAt !== "string" || typeof input.expiresAt !== "string" ||
      !/^[A-Za-z0-9+/]{86}==$/.test(String(input.signature))) return false;
  const paths = input.allowedPaths;
  return Array.isArray(paths) && paths.length > 0 && paths.length <= 10 &&
    paths.every(pathOk) && new Set(paths).size === paths.length;
}
function deny(reason: string): never {throw new Error("PR_REVIEW_IDENTITY_BLOCKED: " + reason);}
export async function verifyPrReviewIdentity(
  identity: unknown, expected: PrReviewIdentityExpectation,
  gatewayPublicKey: string, durableReplay: PrReviewIdentityReplayStore, now: Date
): Promise<{readonly bindingId: string; readonly identity: SignedPrReviewIdentity}> {
  if (!valid(identity)) deny("invalid versioned signed envelope");
  if (!record(expected) || identity.requestId !== expected.requestId ||
      identity.projectId !== expected.projectId ||
      identity.repository !== expected.repository ||
      identity.pullRequestNumber !== expected.pullRequestNumber ||
      identity.headSha !== expected.headSha ||
      identity.workflowDigest !== expected.workflowDigest ||
      identity.canonicalDigest !== expected.canonicalDigest ||
      identity.policyVersion !== expected.policyVersion ||
      !Array.isArray(expected.allowedPaths) ||
      identity.allowedPaths.length !== expected.allowedPaths.length ||
      identity.allowedPaths.some((x, i) => x !== expected.allowedPaths[i])) {
    deny("identity does not match signed inspection scope");
  }
  const issued = Date.parse(identity.issuedAt), expires = Date.parse(identity.expiresAt);
  if (!Number.isFinite(issued) || !Number.isFinite(expires) ||
      !Number.isFinite(now.getTime()) || issued > now.getTime() + 60_000 ||
      issued > expires || expires <= now.getTime() || expires - issued > 3_600_000) {
    deny("expired, future, or excessive PR identity validity");
  }
  const {signature, ...payload} = identity;
  let authentic = false;
  try {
    const decoded = Buffer.from(signature, "base64");
    authentic = decoded.length === 64 && verify(null,
      Buffer.from(prReviewIdentitySigningPayload(payload)),
      createPublicKey(gatewayPublicKey), decoded);
  } catch {authentic = false;}
  if (!authentic) deny("invalid issuer signature");
  if (!durableReplay || typeof durableReplay.claim !== "function") {
    deny("missing durable replay claim");
  }
  const bindingId = "sha256:" + createHash("sha256")
    .update("blueprint-os:pr-review-identity:v2\0")
    .update(prReviewIdentitySigningPayload(payload)).digest("hex");
  // Atomic claim is anchored to the original v1 request, not the v2 nonce.
  // Re-signing the same request with a different nonce must not bypass replay.
  const replayKey = "sha256:" + createHash("sha256")
    .update("blueprint-os:pr-review-request:v2\0")
    .update(identity.requestId).digest("hex");
  if (await durableReplay.claim(replayKey, identity.expiresAt) !== true) {
    deny("replay or unverified durable claim");
  }
  return Object.freeze({bindingId, identity});
}
