import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";
import {
  createIntelligenceManifest, decodeIntelligenceManifest, encodeIntelligenceManifest,
  manifestSchema, TECH_PRODUCER, DEFENSE_PRODUCER
} from "../../packages/contracts/src/intelligence-exchange.mjs";

const demo = {
  producer: TECH_PRODUCER,
  contentRevision: 1,
  sourceRevision: "a".repeat(40),
  timestamp: "2026-11-19T00:00:00.000Z",
  evidenceId: "b6b535a3-6aa3-4ea4-921c-a5692c6adc0b",
  outcome: "RESEARCH_HYPOTHESIS_FALSIFIED"
};

test("published schema and portable validation share the same definitions", () => {
  const schema = JSON.parse(readFileSync(new URL("../../schemas/intelligence-exchange-manifest.v1.json", import.meta.url), "utf8"));
  assert.deepEqual(schema, manifestSchema);
});

test("both producers round trip using the same closed v1 wire", () => {
  for (const input of [demo, { ...demo, producer: DEFENSE_PRODUCER, outcome: "DEFENSE_MITIGATION_VERIFIED" }]) {
    const manifest = createIntelligenceManifest(input);
    assert.deepEqual(decodeIntelligenceManifest(encodeIntelligenceManifest(manifest)), manifest);
  }
});

test("field order cannot change the canonical bytes or digest", () => {
  const manifest = createIntelligenceManifest(demo);
  const reordered = Object.fromEntries(Object.entries(manifest).reverse());
  assert.equal(encodeIntelligenceManifest(reordered), encodeIntelligenceManifest(manifest));
});

test("malformed, oversize, duplicate-name and noncanonical input fail closed", () => {
  const wire = encodeIntelligenceManifest(createIntelligenceManifest(demo));
  assert.throws(() => decodeIntelligenceManifest("{"), { code: "INVALID_JSON" });
  assert.throws(() => decodeIntelligenceManifest(" ".repeat(2049)), { code: "INVALID_WIRE_SIZE" });
  assert.throws(() => decodeIntelligenceManifest(" " + wire), { code: "NON_CANONICAL_WIRE" });
  assert.throws(() => decodeIntelligenceManifest('{"contentRevision":1,' + wire.slice(1)), { code: "NON_CANONICAL_WIRE" });
});

test("unknown version, malformed revision and invalid calendar values fail closed", () => {
  const manifest = createIntelligenceManifest(demo);
  assert.throws(() => encodeIntelligenceManifest({ ...manifest, schemaVersion: "2.0.0" }), { code: "UNSUPPORTED_VERSION" });
  assert.throws(() => createIntelligenceManifest({ ...demo, sourceRevision: "0".repeat(40) }), { code: "INVALID_MANIFEST" });
  assert.throws(() => createIntelligenceManifest({ ...demo, contentRevision: 0 }), { code: "INVALID_MANIFEST" });
  assert.throws(() => createIntelligenceManifest({ ...demo, timestamp: "2026-02-31T00:00:00.000Z" }), { code: "INVALID_MANIFEST_BINDING" });
});

test("wire denies cross-producer outcomes, content changes and ambient authority", () => {
  const manifest = createIntelligenceManifest(demo);
  assert.throws(() => createIntelligenceManifest({ ...demo, producer: DEFENSE_PRODUCER }), { code: "INVALID_MANIFEST_BINDING" });
  assert.throws(() => encodeIntelligenceManifest({ ...manifest, owner: DEFENSE_PRODUCER }), { code: "INVALID_MANIFEST_BINDING" });
  assert.throws(() => encodeIntelligenceManifest({ ...manifest, contentRevision: 2 }), { code: "INTEGRITY_MISMATCH" });
  assert.throws(() => encodeIntelligenceManifest({ ...manifest, gate: "PASS" }), { code: "INVALID_MANIFEST" });
  assert.throws(() => encodeIntelligenceManifest({ ...manifest, privateData: "restricted fixture" }), { code: "INVALID_MANIFEST" });
});
