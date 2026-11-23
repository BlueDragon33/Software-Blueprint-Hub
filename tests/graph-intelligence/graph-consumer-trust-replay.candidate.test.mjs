import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, createHash, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { verifyPinnedGraphConsumerProofCandidate } from "../../apps/web/src/server/graph-consumer-trust.candidate.mjs";
import { consumeGraphProofNonceCandidate, GRAPH_PROOF_NONCE_INSERT_CANDIDATE } from "../../apps/web/src/server/graph-consumer-nonce.candidate.mjs";

const ISSUER = "BlueDragon33/Application-Management";
const PROJECT = "project:blueprint-os";
const NOW = 1800000000;
const KID = "c30-test-only";
const pair = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const otherPair = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = pair.publicKey.export({ format: "jwk" });
const pin = key => "sha256:" + createHash("sha256")
  .update(key.export({ format: "der", type: "spki" })).digest("hex");
const signed = obj => Buffer.from(JSON.stringify(obj)).toString("base64url");
function claim(nonce = "abcdefghabcdefghabcdefgh") {
  return { iss: ISSUER, sub: ISSUER, aud: "BlueDragon33/Software-Blueprint-Hub",
    scope: "graph:read:project", projectId: PROJECT, resource: "hub-canonical-graph",
    method: "GET", iat: NOW - 10, nbf: NOW - 10, exp: NOW + 40, jti: nonce };
}
function token(payload = claim(), key = pair.privateKey, kid = KID) {
  const unsigned = signed({ alg: "ES256", typ: "BLUEPRINT-GRAPH-READ-CANDIDATE", kid })
    + "." + signed(payload);
  return unsigned + "." + sign("sha256", Buffer.from(unsigned, "ascii"),
    { key, dsaEncoding: "ieee-p1363" }).toString("base64url");
}
const goodPins = () => new Map([[KID, { publicJwk: jwk, spkiSha256: pin(pair.publicKey) }]]);
const nonce = (key = "abcdefghabcdefghabcdefgh") => ({
  issuer: ISSUER, keyId: KID, nonce: key, projectId: PROJECT, expiresAtSeconds: NOW + 40,
});
const runProof = (changes = {}) => verifyPinnedGraphConsumerProofCandidate({
  compactJws: token(), expectedProjectId: PROJECT, approvedPins: goodPins(),
  consumeReplayNonce: async () => true, nowSeconds: NOW, ...changes,
});

test("matching SPKI pin plus valid ES256 proof is still NOT_AUTHORIZED", async () => {
  const result = await runProof();
  assert.equal(result.ok, true);
  assert.equal(result.status, "CRYPTO_PROOF_VALID_ONLY_NOT_AUTHORIZED");
  for (const field of ["canReadGraphExternally", "transportEnabled", "canonicalMutationAllowed",
    "gateMutationAllowed", "releaseAuthority", "agentDispatchAllowed"]) assert.equal(result[field], false);
});

test("wrong pin for the same trusted kid denies BEFORE nonce consumption", async () => {
  let called = 0;
  const pins = new Map([[KID, { publicJwk: jwk, spkiSha256: pin(otherPair.publicKey) }]]);
  const result = await runProof({ approvedPins: pins, consumeReplayNonce: async () => { called++; return true; } });
  assert.equal(result.ok, false);
  assert.equal(called, 0);
});

test("untrusted kid and empty trust registry fail closed", async () => {
  assert.equal((await runProof({ approvedPins: new Map() })).ok, false);
  assert.equal((await runProof({ compactJws: token(claim(), pair.privateKey, "other-test-kid") })).ok, false);
  assert.equal((await runProof({ approvedPins: null })).ok, false);
});

test("pin trust registry refuses malformed, extra-field or private JWK entries", async () => {
  const valid = goodPins().get(KID);
  for (const value of [null, {}, { ...valid, spkiSha256: "sha256:0000" },
    { ...valid, privateKey: "PRIVATE" },
    { ...valid, publicJwk: { ...valid.publicJwk, d: "PRIVATE" } },
    { ...valid, publicJwk: otherPair.publicKey.export({ format: "jwk" }) }]) {
    assert.equal((await runProof({ approvedPins: new Map([[KID, value]]) })).ok, false);
  }
});

test("P-256 identity pin never substitutes for actual signature verification", async () => {
  assert.equal((await runProof({ compactJws: token(claim(), otherPair.privateKey) })).ok, false);
  assert.equal((await runProof({ compactJws: token({ ...claim(), projectId: "project:other" }) })).ok, false);
  assert.equal((await runProof({ compactJws: token({ ...claim(), method: "POST" }) })).ok, false);
});

test("all errors and malformed proof inputs preserve constant denying authority flags", async () => {
  for (const compactJws of ["", "x.y", "bad.bad.bad", null]) {
    const result = await runProof({ compactJws });
    assert.equal(result.ok, false);
    assert.equal(result.status, "UNVERIFIED");
    assert.equal(result.canReadGraphExternally, false);
    assert.equal(result.transportEnabled, false);
  }
});

test("nonce SQL is one parameterized atomic INSERT with conflict and RETURNING", () => {
  assert.match(GRAPH_PROOF_NONCE_INSERT_CANDIDATE, /INSERT INTO blueprint_graph_proof_nonces/);
  assert.match(GRAPH_PROOF_NONCE_INSERT_CANDIDATE, /VALUES \(\$1, \$2, \$3, \$4, to_timestamp\(\$5\)\)/);
  assert.match(GRAPH_PROOF_NONCE_INSERT_CANDIDATE, /ON CONFLICT \(issuer, key_id, nonce\) DO NOTHING/);
  assert.match(GRAPH_PROOF_NONCE_INSERT_CANDIDATE, /RETURNING nonce/);
  assert.doesNotMatch(GRAPH_PROOF_NONCE_INSERT_CANDIDATE, /UPDATE|DELETE|DROP|TRUNCATE/);
});

test("nonce candidate hands fixed SQL and ordered parameters to injected client", async () => {
  let count = 0;
  const value = nonce();
  const result = await consumeGraphProofNonceCandidate(value, async (sql, params) => {
    count++;
    assert.equal(sql, GRAPH_PROOF_NONCE_INSERT_CANDIDATE);
    assert.deepEqual(params, [ISSUER, KID, value.nonce, PROJECT, NOW + 40]);
    return { rowCount: 1, rows: [{ nonce: value.nonce }] };
  });
  assert.equal(result, true);
  assert.equal(count, 1);
});

test("simulated SQL uniqueness gives exactly one winner under concurrent proof attempts", async () => {
  // This is a fake database for parameter-contract tests, NOT PostgreSQL QA.
  const seen = new Set();
  const mock = async (_sql, params) => {
    const key = params.slice(0, 3).join("|");
    if (seen.has(key)) return { rowCount: 0, rows: [] };
    seen.add(key);
    return { rowCount: 1, rows: [{ nonce: params[2] }] };
  };
  const outcomes = await Promise.all(Array.from({ length: 16 }, () =>
    consumeGraphProofNonceCandidate(nonce(), mock)));
  assert.equal(outcomes.filter(Boolean).length, 1);
  assert.equal(outcomes.filter(x => !x).length, 15);
});

test("single-use failure and database error deny replay without fallback", async () => {
  assert.equal(await consumeGraphProofNonceCandidate(nonce(), async () => ({ rowCount: 0, rows: [] })), false);
  assert.equal(await consumeGraphProofNonceCandidate(nonce(), async () => { throw Error("DB unavailable"); }), false);
  assert.equal(await consumeGraphProofNonceCandidate(nonce(), null), false);
  assert.equal(await consumeGraphProofNonceCandidate(nonce(), async () => undefined), false);
});

test("malformed SQL replies cannot fake a successful consume", async () => {
  for (const response of [{ rowCount: 1 }, { rowCount: 1, rows: [] },
    { rowCount: "1", rows: [{ nonce: nonce().nonce }] },
    { rowCount: 1, rows: [{ nonce: "other-nonce" }] },
    { rowCount: 2, rows: [{ nonce: nonce().nonce }] }]) {
    assert.equal(await consumeGraphProofNonceCandidate(nonce(), async () => response), false);
  }
});

test("invalid nonce claims are rejected BEFORE database I/O", async () => {
  let calls = 0;
  const mock = async () => { calls++; return { rowCount: 1, rows: [{ nonce: nonce().nonce }] }; };
  const bad = [{ issuer: "other" }, { keyId: ".." }, { nonce: "short" },
    { projectId: "project:blueprint-os\n" }, { projectId: "project/other" },
    { expiresAtSeconds: -1 }, { expiresAtSeconds: 1.1 }];
  for (const patch of bad) assert.equal(await consumeGraphProofNonceCandidate({ ...nonce(), ...patch }, mock), false);
  assert.equal(calls, 0);
});

test("SQL schema declares durable unique replay key but is NOT migrated", () => {
  const ddl = readFileSync(new URL("../../docs/contracts/graph-consumer-nonce-schema.candidate.sql", import.meta.url), "utf8");
  assert.match(ddl, /NOT A MIGRATION\. NOT APPLIED/);
  assert.match(ddl, /PRIMARY KEY \(issuer, key_id, nonce\)/);
  assert.match(ddl, /expires_at TIMESTAMPTZ NOT NULL/);
  assert.doesNotMatch(ddl, /INSERT INTO|BEGIN;|COMMIT;/);
});

test("end-to-end mock trusted key plus injected nonce consumes once then rejects replay", async () => {
  const seen = new Set();
  const fakePg = async (_query, params) => {
    const id = params.slice(0, 3).join("|");
    if (seen.has(id)) return { rowCount: 0, rows: [] };
    seen.add(id); return { rowCount: 1, rows: [{ nonce: params[2] }] };
  };
  const hook = claim => consumeGraphProofNonceCandidate(claim, fakePg);
  const a = await runProof({ consumeReplayNonce: hook });
  const b = await runProof({ consumeReplayNonce: hook });
  assert.equal(a.ok, true);
  assert.equal(b.ok, false);
  assert.equal(a.canReadGraphExternally, false);
});
