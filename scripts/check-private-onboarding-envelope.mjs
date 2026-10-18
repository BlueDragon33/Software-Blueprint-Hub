/**
 * Issue #133 — public-envelope CANDIDATE only.
 * No private repository lookup, canonical admission, permission or I/O.
 */
const FIELDS = Object.freeze([
  "schemaVersion", "kind", "opaqueHandle", "visibility",
  "evidenceState", "reviewState", "admissionState",
  "canonicalCompliance", "canonicalProjectProfile",
  "qualityGatePass", "productionAuthority", "constitutionalRegistration"
]);
const FIELD_SET = new Set(FIELDS);
const UUID_V4 = /^opaque:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const EXPECTED = Object.freeze({
  schemaVersion: "0.1.0-candidate",
  kind: "private-onboarding-public-envelope",
  visibility: "private",
  evidenceState: "NOT_PRESENT_IN_PUBLIC_HUB",
  reviewState: "NOT_REVIEWED",
  admissionState: "CANDIDATE_ONLY",
  canonicalCompliance: "UNVERIFIED",
  canonicalProjectProfile: false,
  qualityGatePass: false,
  productionAuthority: false,
  constitutionalRegistration: false
});

/** All diagnostics use constant strings: never echo submitted private metadata. */
export function inspectPrivateOnboardingEnvelope(value) {
  const reasons = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    reasons.push("INVALID_PUBLIC_ENVELOPE");
  } else {
    const keys = Object.keys(value);
    if (keys.length !== FIELDS.length ||
        keys.some(key => !FIELD_SET.has(key)) ||
        FIELDS.some(key => !Object.hasOwn(value, key))) {
      reasons.push("UNSUPPORTED_PUBLIC_FIELD_SET");
    }
    if (!UUID_V4.test(value.opaqueHandle ?? "")) {
      reasons.push("INVALID_OPAQUE_HANDLE");
    }
    for (const [key, expected] of Object.entries(EXPECTED)) {
      if (value[key] !== expected) {
        reasons.push("UNAUTHORIZED_PUBLIC_ENVELOPE_STATE");
        break;
      }
    }
  }
  return Object.freeze({
    structure: reasons.length ? "REJECTED" : "VALID_CANDIDATE_SHAPE",
    decision: "BLOCKED_NOT_REVIEWED",
    canonicalAuthority: false,
    reasons: Object.freeze(reasons)
  });
}
