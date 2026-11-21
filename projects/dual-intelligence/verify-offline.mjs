import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import {
  decodeIntelligenceManifest, DEFENSE_PRODUCER, HUB_REPOSITORY, SOURCE_REVISION_PATTERN, TECH_PRODUCER
} from "../../packages/contracts/src/intelligence-exchange.mjs";
import { prepareIntelligenceReference } from "../../packages/application/src/intelligence-reference.mjs";

const [techPath, techSha, defensePath, defenseSha] = process.argv.slice(2);
const shaPattern = new RegExp(SOURCE_REVISION_PATTERN);
if (process.argv.length !== 6 || !shaPattern.test(techSha) || !shaPattern.test(defenseSha)) {
  throw new Error("Usage: node verify-offline.mjs TECH_PATH TECH_SHA DEFENSE_PATH DEFENSE_SHA");
}

const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const contractBytes = readFileSync(new URL("../../packages/contracts/src/intelligence-exchange.mjs", import.meta.url));
const hubDigest = digest(contractBytes);
const scenarios = [
  {
    path: techPath, revision: techSha, producer: TECH_PRODUCER, outcome: "RESEARCH_HYPOTHESIS_FALSIFIED",
    fixtures: ["fixtures/source-rfc8259.json", "fixtures/json-order.json"]
  },
  {
    path: defensePath, revision: defenseSha, producer: DEFENSE_PRODUCER, outcome: "DEFENSE_MITIGATION_VERIFIED",
    fixtures: ["fixtures/asset-inventory.json", "fixtures/asset-authorization.json"]
  }
];

const results = [];
for (const scenario of scenarios) {
  const portable = readFileSync(resolve(scenario.path, "contract/intelligence-exchange.v1.mjs"));
  assert.equal(digest(portable), hubDigest);
  const started = performance.now();
  const cli = spawnSync(process.execPath, ["cli.mjs", "export", ...scenario.fixtures, scenario.revision], {
    cwd: resolve(scenario.path), env: {}, encoding: "utf8", timeout: 4000, maxBuffer: 4096
  });
  const exportMilliseconds = Number((performance.now() - started).toFixed(3));
  assert.equal(cli.status, 0);
  const manifest = decodeIntelligenceManifest(cli.stdout);
  assert.equal(manifest.producer, scenario.producer);
  assert.equal(manifest.sourceRevision, scenario.revision);
  assert.equal(manifest.outcome, scenario.outcome);
  // Rehearsal scope. Real callers obtain this state through existing Hub authorization and trusted source verification.
  const observedAt = Date.now();
  const trust = {
    id: manifest.id, producer: manifest.producer, consumer: HUB_REPOSITORY, readAllowed: true,
    currentSource: { sourceRevision: scenario.revision, integrityDigest: manifest.integrityDigest,
      expiresAt: observedAt + 60_000, revoked: false },
    previousReference: null
  };
  const original = JSON.stringify(trust);
  const verification = await prepareIntelligenceReference(cli.stdout, { readTrust: () => trust, observedAt });
  assert.equal(verification.status, "REFERENCE_PREPARED");
  assert.equal(verification.reference.outcome, scenario.outcome);
  assert.equal(JSON.stringify(trust), original);
  assert.equal((await prepareIntelligenceReference(cli.stdout, {
    readTrust: () => ({ ...trust, previousReference: verification.reference }), observedAt
  })).status, "DUPLICATE");
  await assert.rejects(prepareIntelligenceReference(cli.stdout, {
    readTrust: () => ({ ...trust, readAllowed: false }), observedAt
  }), { code: "SCOPE_DENIED" });
  results.push({
    producer: scenario.producer, sourceRevision: scenario.revision, outcome: scenario.outcome,
    exportBytes: Buffer.byteLength(cli.stdout), exportMilliseconds, fixtureReferenceAdmission: "PASS"
  });
}
console.log(JSON.stringify({ trustMode: "isolated-fixture", portableContractSha256: hubDigest, results }, null, 2));
