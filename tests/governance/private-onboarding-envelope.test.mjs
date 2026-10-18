import assert from "node:assert/strict";
import test from "node:test";
import { inspectPrivateOnboardingEnvelope } from "../../scripts/check-private-onboarding-envelope.mjs";

// A synthetic v4-formatted handle: no real private repository evidence.
const sample = Object.freeze({
  schemaVersion: "0.1.0-candidate",
  kind: "private-onboarding-public-envelope",
  opaqueHandle: "opaque:123e4567-e89b-42d3-a456-426614174000",
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
const inspect = edit => inspectPrivateOnboardingEnvelope({ ...sample, ...edit });

test("synthetic opaque envelope is structurally valid but NEVER admitted", () => {
  assert.deepEqual(inspectPrivateOnboardingEnvelope(sample), {
    structure: "VALID_CANDIDATE_SHAPE", decision: "BLOCKED_NOT_REVIEWED",
    canonicalAuthority: false, reasons: []
  });
});

test("forbids any extra public field including repository, SHA, CI, credentials and private evidence", () => {
  for (const [field, value] of Object.entries({
    repository: "synthetic/repository", observedMainSha: "a".repeat(40),
    adoptionCI: "https://example.invalid/runs/1", projectId: "project:synthetic",
    credentials: "synthetic-secret", evidence: { source: "private" },
    branch: "main", observedAt: "2026-01-01T00:00:00.000Z"
  })) {
    const result = inspect({ [field]: value });
    assert.equal(result.structure, "REJECTED");
    assert.equal(result.decision, "BLOCKED_NOT_REVIEWED");
    assert.ok(!result.reasons.join(" ").includes(String(value)));
  }
});

test("forbids self-declared review, constitution, PASS or production", () => {
  for (const edit of [
    { reviewState: "APPROVED" }, { admissionState: "REGISTERED" },
    { canonicalCompliance: "COMPLIANT" }, { canonicalProjectProfile: true },
    { qualityGatePass: true }, { productionAuthority: true },
    { constitutionalRegistration: true }, { evidenceState: "VERIFIED" }
  ]) {
    const result = inspect(edit);
    assert.equal(result.structure, "REJECTED");
    assert.equal(result.canonicalAuthority, false);
  }
});

test("rejects derived-looking, malformed or missing opaque handles", () => {
  for (const handle of ["opaque:repo-name", "opaque:" + "f".repeat(40),
    "opaque:123e4567-e89b-12d3-a456-426614174000", null, undefined]) {
    assert.equal(inspect({ opaqueHandle: handle }).structure, "REJECTED");
  }
});

test("rejects empty, array and incomplete envelopes without leaking values", () => {
  for (const value of [null, [], {}, { ...sample, opaqueHandle: undefined }]) {
    const result = inspectPrivateOnboardingEnvelope(value);
    assert.equal(result.structure, "REJECTED");
    assert.equal(result.decision, "BLOCKED_NOT_REVIEWED");
  }
});
