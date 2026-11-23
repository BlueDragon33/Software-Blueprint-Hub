import test from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { inspectSignedInternalHubGraphCandidate } from "../../apps/web/src/server/graph-read-composition.candidate.mjs";

const PROJECT = "project:blueprint-os", OTHER = "project:other";
const KID = "c31-ephemeral-key", NOW = 1800000000;
const HASH = "sha256:" + "a".repeat(64), REV = "b".repeat(40);
const pair = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const publicJwk = pair.publicKey.export({ format: "jwk" });
const spkiSha256 = "sha256:" + createHash("sha256")
  .update(pair.publicKey.export({ format: "der", type: "spki" })).digest("hex");
const pins = () => new Map([[KID, { publicJwk, spkiSha256 }]]);
const b64 = value => Buffer.from(JSON.stringify(value)).toString("base64url");
const claims = (projectId = PROJECT) => ({
  iss: "BlueDragon33/Application-Management",
  sub: "BlueDragon33/Application-Management",
  aud: "BlueDragon33/Software-Blueprint-Hub", scope: "graph:read:project",
  projectId, resource: "hub-canonical-graph", method: "GET", iat: NOW - 10,
  nbf: NOW - 10, exp: NOW + 40, jti: "abcdefghijklmnopqrstuvwx",
});
function signed(payload = claims()) {
  const content = b64({ alg: "ES256", typ: "BLUEPRINT-GRAPH-READ-CANDIDATE", kid: KID })
    + "." + b64(payload);
  const signature = sign("sha256", Buffer.from(content, "ascii"),
    { key: pair.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");
  return content + "." + signature;
}
function validGraph(projectId = PROJECT) {
  return {
    schemaVersion: "1.0.0", projectId, policyVersion: "1.3.0", fingerprint: HASH,
    sourceCodeRevision: REV, intelligence: "deterministic-rules-not-llm",
    canonicalMutationAllowed: false, qualityGateMutationAllowed: false,
    releaseAuthority: false, agentDispatchAllowed: false,
    nodes: [{ id: "wp1", label: "Verified source record", kind: "work-package",
      domain: "workflow", verification: "unverified", approval: "not-conferred",
      source: { kind: "canonical-record", reference: "work-package:wp1",
        revision: REV, digest: HASH, codePath: "packages/application/src/graph-intelligence.ts" } }],
    edges: [],
  };
}
const ready = (projectId = PROJECT) => ({ state: "ready", profile: { projectId }, graph: validGraph(projectId) });
function nonceDb() {
  const seen = new Set();
  return async (_sql, params) => {
    const id = params.slice(0, 3).join("|");
    if (seen.has(id)) return { rowCount: 0, rows: [] };
    seen.add(id);
    return { rowCount: 1, rows: [{ nonce: params[2] }] };
  };
}
function fixture(patch = {}) {
  return { compactJws: signed(), projectId: PROJECT, nowSeconds: NOW,
    approvedPins: pins(), executeNonceSql: nonceDb(),
    projectAudience: new Set([PROJECT]),
    loadTrustedGraph: async () => ready(), ...patch };
}

test("signed and authorized-loader fixture yields only internal, never external read", async () => {
  const out = await inspectSignedInternalHubGraphCandidate(fixture());
  assert.equal(out.ok, true);
  assert.equal(out.status, "INTERNAL_COMPOSITION_VALIDATED_NOT_AUTHORIZED");
  assert.equal(out.nodeCount, 1); assert.equal(out.edgeCount, 0);
  assert.equal(out.graphFingerprint, HASH); assert.equal(out.projectId, PROJECT);
  for (const flag of ["transportEnabled", "canReadGraphExternally", "canonicalMutationAllowed",
    "gateMutationAllowed", "releaseAuthority", "agentDispatchAllowed"]) assert.equal(out[flag], false);
  assert.ok(!Object.hasOwn(out, "nodes")); assert.ok(Object.isFrozen(out));
});

test("unapproved project audience denied before nonce SQL or Hub loader", async () => {
  let sql = 0, hub = 0;
  const out = await inspectSignedInternalHubGraphCandidate(fixture({
    projectAudience: new Set([OTHER]),
    executeNonceSql: async () => { sql++; return { rowCount: 1, rows: [] }; },
    loadTrustedGraph: async () => { hub++; return ready(); },
  }));
  assert.equal(out.ok, false); assert.equal(sql, 0); assert.equal(hub, 0);
});

test("invalid signature and wrong project denied before Hub load or nonce", async () => {
  let hub = 0, sql = 0;
  const bad = fixture({
    compactJws: signed(claims(OTHER)),
    loadTrustedGraph: async () => { hub++; return ready(); },
    executeNonceSql: async () => { sql++; return { rowCount: 1, rows: [] }; },
  });
  assert.equal((await inspectSignedInternalHubGraphCandidate(bad)).ok, false);
  assert.equal(hub, 0); assert.equal(sql, 0);
});

test("replay nonce denied and Hub loader invoked only once", async () => {
  let hub = 0;
  const input = fixture({loadTrustedGraph: async () => { hub++; return ready(); }});
  const first = await inspectSignedInternalHubGraphCandidate(input);
  const second = await inspectSignedInternalHubGraphCandidate(input);
  assert.equal(first.ok, true); assert.equal(second.ok, false); assert.equal(hub, 1);
});

test("concurrent replay only one succeeds under atomic fake driver (not PostgreSQL QA)", async () => {
  let hub = 0;
  const input = fixture({loadTrustedGraph: async () => { hub++; return ready(); }});
  const res = await Promise.all(Array.from({length: 12}, () => inspectSignedInternalHubGraphCandidate(input)));
  assert.equal(res.filter(r => r.ok).length, 1);
  assert.equal(hub, 1);
});

test("valid consumer proof never overrides forbidden or absent Hub PROJECT_READ", async () => {
  for (const state of ["forbidden", "signed-out", "not-found", "unavailable"]) {
    const out = await inspectSignedInternalHubGraphCandidate(fixture({
      loadTrustedGraph: async () => ({ state }),
    }));
    assert.equal(out.ok, false); assert.equal(out.code, "EXTERNAL_GRAPH_NOT_ADMITTED");
  }
});

test("Hub graph and profile scope mismatch denied even with verified signature", async () => {
  for (const changed of [{...ready(), profile: {projectId: OTHER}},
    {...ready(), graph: validGraph(OTHER)}]) {
    const out = await inspectSignedInternalHubGraphCandidate(fixture({loadTrustedGraph: async () => changed}));
    assert.equal(out.ok, false);
    assert.equal(out.canReadGraphExternally, false);
  }
});

test("database errors and invalid response deny without invoking Hub loader", async () => {
  let hub = 0;
  for (const executeNonceSql of [async () => {throw Error("PRIVATE SQL failure");},
    async () => ({ rowCount: 0, rows: [] })]) {
    const result = await inspectSignedInternalHubGraphCandidate(fixture({
      executeNonceSql, loadTrustedGraph: async () => { hub++; return ready(); },
    }));
    assert.equal(result.ok, false); assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
  }
  assert.equal(hub, 0);
});

test("malformed project IDs, empty audience and missing dependencies deny without I/O", async () => {
  for (const patch of [{projectId: PROJECT + "\n"}, {projectId: "project/other"},
    {projectAudience: new Set()}, {executeNonceSql: null}, {loadTrustedGraph: null},
    {approvedPins: null}, {compactJws: null}]) {
    const result = await inspectSignedInternalHubGraphCandidate(fixture(patch));
    assert.equal(result.ok, false, JSON.stringify(patch));
  }
});

test("no public route, network request or auto-granted App role in candidate source", async () => {
  const { readFileSync } = await import("node:fs");
  const source = readFileSync(new URL("../../apps/web/src/server/graph-read-composition.candidate.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\bfetch\(|Response\.json\(|export\s+async\s+function\s+(GET|POST)/);
  assert.match(source, /verifyPinnedGraphConsumerProofCandidate/);
  assert.match(source, /consumeGraphProofNonceCandidate/);
  assert.match(source, /inspectInternalProjectGraphCandidate/);
});
