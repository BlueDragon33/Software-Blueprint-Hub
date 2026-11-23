/**
 * C32 — INTERNAL ONLY. Key lifecycle filter for a trusted server-side registry.
 * This is NOT a root of trust, a signature on a configuration, an identity
 * provider, or approval for Graph transport. Never source this registry from a
 * request body. Production registry provenance/rotation/revocation audit is
 * NOT implemented or provisioned here.
 */
const KID = /^[A-Za-z0-9_-]{6,80}$/;
const PROJECT = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,255}$/;
const PIN = /^sha256:[a-f0-9]{64}$/;
const ALLOWED = [
  "state", "publicJwk", "spkiSha256", "projectIds",
  "validFromSeconds", "validUntilSeconds", "revokedAtSeconds",
  "overlapFromSeconds", "overlapUntilSeconds",
];
const STATES = new Set(["active", "overlap", "retired", "revoked"]);
const MAX_OVERLAP_SECONDS = 120;

function denial() {
  return Object.freeze({
    ok: false, status: "UNVERIFIED", code: "CONSUMER_KEY_LIFECYCLE_NOT_ADMITTED",
    transportEnabled: false, canReadGraphExternally: false,
  });
}
function exactRecord(record) {
  return record && typeof record === "object" && !Array.isArray(record)
    && Object.keys(record).length === ALLOWED.length
    && ALLOWED.every(key => Object.hasOwn(record, key));
}
/**
 * `trustedLifecycle` MUST already be independently approved and loaded inside
 * a trusted Hub process. The returned Map is an INTERNAL parameter for C30;
 * it MUST NOT be serialized, cached as an authority token, or sent to clients.
 */
export function selectGraphConsumerLifecyclePinsCandidate({
  trustedLifecycle, projectId, nowSeconds,
} = {}) {
  if (!(trustedLifecycle instanceof Map) || trustedLifecycle.size === 0
    || trustedLifecycle.size > 3 || typeof projectId !== "string"
    || !PROJECT.test(projectId) || !/^[A-Za-z0-9:._-]+$/.test(projectId)
    || !Number.isSafeInteger(nowSeconds) || nowSeconds < 0) return denial();

  const pins = new Map();
  const usedPins = new Set();
  let activeCount = 0;
  let overlapCount = 0;
  for (const [kid, record] of trustedLifecycle) {
    if (typeof kid !== "string" || !KID.test(kid) || !exactRecord(record)
      || !STATES.has(record.state) || !PIN.test(record.spkiSha256)
      || !Number.isSafeInteger(record.validFromSeconds)
      || !Number.isSafeInteger(record.validUntilSeconds)
      || record.validFromSeconds < 0
      || record.validUntilSeconds <= record.validFromSeconds
      || (record.revokedAtSeconds !== null
        && (!Number.isSafeInteger(record.revokedAtSeconds) || record.revokedAtSeconds < 0))
      || !Array.isArray(record.projectIds) || record.projectIds.length === 0
      || record.projectIds.length > 256
      || record.projectIds.some(id => typeof id !== "string"
        || !PROJECT.test(id) || !/^[A-Za-z0-9:._-]+$/.test(id))
      || new Set(record.projectIds).size !== record.projectIds.length
      || !record.publicJwk || typeof record.publicJwk !== "object"
      || Array.isArray(record.publicJwk)
      || Object.keys(record.publicJwk).length !== 4
      || record.publicJwk.kty !== "EC" || record.publicJwk.crv !== "P-256"
      || typeof record.publicJwk.x !== "string"
      || typeof record.publicJwk.y !== "string"
      || !/^[A-Za-z0-9_-]{43}$/.test(record.publicJwk.x)
      || !/^[A-Za-z0-9_-]{43}$/.test(record.publicJwk.y)) return denial();

    // Reject duplicate pins across different kid values; kid rotation must not
    // silently provide two aliases for the same signing key.
    if (usedPins.has(record.spkiSha256)) return denial();
    usedPins.add(record.spkiSha256);

    if (record.state === "overlap") {
      if (!Number.isSafeInteger(record.overlapFromSeconds)
        || !Number.isSafeInteger(record.overlapUntilSeconds)
        || record.overlapFromSeconds < record.validFromSeconds
        || record.overlapUntilSeconds > record.validUntilSeconds
        || record.overlapUntilSeconds <= record.overlapFromSeconds
        || record.overlapUntilSeconds - record.overlapFromSeconds > MAX_OVERLAP_SECONDS
        || record.revokedAtSeconds !== null) return denial();
    } else if (record.overlapFromSeconds !== null || record.overlapUntilSeconds !== null) {
      return denial();
    }

    // A recorded revocation disables a key immediately: never use a revoked
    // key even when a pre-revocation token still has time remaining.
    if (record.state === "revoked" && record.revokedAtSeconds === null) return denial();
    if (record.state === "active" && record.revokedAtSeconds !== null) return denial();
    if (record.state !== "active" && record.state !== "overlap") continue;
    if (!record.projectIds.includes(projectId)) continue;
    if (nowSeconds < record.validFromSeconds || nowSeconds >= record.validUntilSeconds) continue;
    if (record.state === "overlap"
      && (nowSeconds < record.overlapFromSeconds
        || nowSeconds >= record.overlapUntilSeconds)) continue;
    if (record.state === "active") activeCount++;
    else overlapCount++;
    pins.set(kid, {
      publicJwk: record.publicJwk,
      spkiSha256: record.spkiSha256,
    });
  }
  // A single currently active key, with at most one tightly bounded old key.
  // An overlap-only registry is never sufficient to establish current trust.
  if (activeCount !== 1 || overlapCount > 1 || pins.size !== activeCount + overlapCount)
    return denial();
  return Object.freeze({
    ok: true, status: "INTERNAL_PIN_SELECTION_ONLY_NOT_AUTHORIZED",
    pins, transportEnabled: false, canReadGraphExternally: false,
  });
}
