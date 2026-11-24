import assert from "node:assert/strict";
import test from "node:test";
import {
  createIntelligenceManifest, DEFENSE_PRODUCER, encodeIntelligenceManifest, HUB_REPOSITORY, TECH_PRODUCER
} from "../../packages/contracts/src/intelligence-exchange.mjs";
import { prepareIntelligenceReference } from "../../packages/application/src/intelligence-reference.mjs";

const observedAt = Date.parse("2026-11-19T12:00:00.000Z");

function packet(overrides = {}) {
  return createIntelligenceManifest({
    producer: TECH_PRODUCER,
    sourceRevision: "a".repeat(40),
    contentRevision: 2,
    timestamp: "2026-11-19T00:00:00.000Z",
    evidenceId: "b6b535a3-6aa3-4ea4-921c-a5692c6adc0b",
    outcome: "RESEARCH_HYPOTHESIS_FALSIFIED",
    ...overrides
  });
}

function scope(manifest, overrides = {}) {
  return {
    id: manifest.id,
    producer: manifest.producer,
    consumer: HUB_REPOSITORY,
    readAllowed: true,
    currentSource: {
      sourceRevision: manifest.sourceRevision,
      integrityDigest: manifest.integrityDigest,
      expiresAt: observedAt + 30000,
      revoked: false
    },
    previousReference: null,
    ...overrides
  };
}

async function prepare(manifest, trust = scope(manifest), clock = observedAt) {
  return prepareIntelligenceReference(encodeIntelligenceManifest(manifest), { observedAt: clock, readTrust: () => trust });
}

test("both producers yield typed read-only references with expiry and no decision fields", async () => {
  for (const manifest of [packet(), packet({ producer: DEFENSE_PRODUCER, outcome: "DEFENSE_MITIGATION_VERIFIED" })]) {
    const trust = scope(manifest);
    const before = JSON.stringify(trust);
    const result = await prepare(manifest, trust);
    assert.equal(result.status, "REFERENCE_PREPARED");
    assert.equal(result.reference.relationship, "references-external-evidence");
    assert.equal(result.reference.allowedUntil, trust.currentSource.expiresAt);
    assert.ok(["research-experiment", "defense-regression"].includes(result.reference.sourceKind));
    assert.ok(!("qualityGate" in result.reference) && !("approval" in result.reference));
    assert.equal(JSON.stringify(trust), before);
    assert.ok(Object.isFrozen(result.reference));
  }
});

test("cross-project input, absent scope and verifier outage fail closed", async () => {
  const manifest = packet();
  assert.equal(typeof manifest.integrityDigest, "string");
  await assert.rejects(prepare(manifest, scope(manifest, { producer: DEFENSE_PRODUCER })), { code: "SCOPE_DENIED" });
  await assert.rejects(prepare(manifest, scope(manifest, { readAllowed: false })), { code: "SCOPE_DENIED" });
  await assert.rejects(prepare(manifest, null), { code: "SCOPE_DENIED" });
  await assert.rejects(prepareIntelligenceReference(encodeIntelligenceManifest(manifest), { observedAt,
    readTrust: () => { throw new Error("test-only provider unavailable"); } }), { code: "TRUST_UNAVAILABLE" });
});

test("integrity alone grants no origin, stale digests and revoked pins reject", async () => {
  const manifest = packet();
  const trust = scope(manifest);
  await assert.rejects(prepare(manifest, { ...trust, currentSource: null }), { code: "SOURCE_PIN_REQUIRED" });
  await assert.rejects(prepare(manifest, { ...trust, currentSource: { ...trust.currentSource, revoked: true } }), { code: "SOURCE_PIN_REQUIRED" });
  await assert.rejects(prepare(manifest, { ...trust, currentSource: { ...trust.currentSource, sourceRevision: "b".repeat(40) } }), { code: "STALE_SOURCE_REVISION" });
  const forged = packet({ outcome: "RESEARCH_HYPOTHESIS_SUPPORTED" });
  await assert.rejects(prepare(forged, trust), { code: "UNTRUSTED_MANIFEST_DIGEST" });
});

test("retention and pin expiry cannot silently renew trust", async () => {
  const manifest = packet();
  const trust = scope(manifest);
  await assert.rejects(prepare(manifest, trust, Date.parse("2026-11-18T23:59:59.999Z")), { code: "MANIFEST_OUTSIDE_RETENTION" });
  await assert.rejects(prepare(manifest, trust, Date.parse("2026-12-19T00:00:00.000Z")), { code: "MANIFEST_OUTSIDE_RETENTION" });
  await assert.rejects(prepare(manifest, trust, trust.currentSource.expiresAt), { code: "SOURCE_PIN_REQUIRED" });
});

test("repeat, stale, conflicting and unavailable previous references are distinguished", async () => {
  const manifest = packet();
  const accepted = await prepare(manifest);
  const previous = accepted.reference;
  assert.deepEqual(await prepare(manifest, scope(manifest, { previousReference: previous })),
    { status: "DUPLICATE", allowedUntil: previous.allowedUntil });
  const old = packet({ contentRevision: 1 });
  await assert.rejects(prepare(old, scope(old, { previousReference: previous })), { code: "STALE_CONTENT_REVISION" });
  const alternate = packet({ outcome: "RESEARCH_HYPOTHESIS_SUPPORTED" });
  await assert.rejects(prepare(alternate, scope(alternate, { previousReference: previous })), { code: "CONTENT_REVISION_CONFLICT" });
  await assert.rejects(prepare(manifest, scope(manifest, { previousReference: undefined })), { code: "PRIOR_REFERENCE_UNKNOWN" });
});
