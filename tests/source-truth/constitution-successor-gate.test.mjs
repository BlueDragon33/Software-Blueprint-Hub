import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSuccessorGate } from "../../scripts/run-constitution-successor-gate.mjs";

const sha = "a".repeat(40);
const env = { ...process.env, GITHUB_SHA: sha, RELEASE_GATE_REVISION: sha, GITHUB_RUN_ID: "42" };
const proof = "artifacts/constitution-1.5-candidate.json";
const attest = "artifacts/constitution-1.5-authority-set.json";
// Deliberate subprocess fixture: verifies orchestration, not the sealed checker or runtime.
const fake = `import {writeFileSync,mkdirSync} from "node:fs";
writeFileSync("invocation.json",JSON.stringify(process.argv.slice(2)));
if(process.env.FIXTURE_MODE==="fail")process.exit(3);
if(process.argv.includes("--write-evidence")||process.env.FIXTURE_MODE==="unexpected"){
mkdirSync("artifacts",{recursive:true});
const d={status:"INACTIVE_CANDIDATE_VERIFIED",activePolicyVersion:"1.4.0",candidatePolicyVersion:"1.5.0",sourceRevision:process.env.GITHUB_SHA,ciRunId:process.env.GITHUB_RUN_ID,ratification:"NOT_ASSERTED",publication:"NOT_ASSERTED",productionReleaseAuthority:false,authoritySetDigest:"fixture"};
if(process.env.FIXTURE_MODE==="bad")d.sourceRevision="wrong";
writeFileSync("${proof}",JSON.stringify(d));
if(process.env.FIXTURE_MODE!=="partial")writeFileSync("${attest}",JSON.stringify({policyVersion:"1.5.0",sourceRevision:process.env.GITHUB_SHA,ciRunId:process.env.GITHUB_RUN_ID,productionReleaseAuthority:false,authoritySetDigest:"fixture"}));
}`;
function fixture(t, version, productionReleaseAuthority = false) {
  const root = mkdtempSync(join(tmpdir(), "successor-gate-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const dir of ["control", "scripts", "artifacts"]) mkdirSync(join(root, dir));
  writeFileSync(join(root, "control/universal-constitution-version.json"), JSON.stringify({ policyVersion: version, productionReleaseAuthority }));
  writeFileSync(join(root, "scripts/check-constitution-1.5-candidate.mjs"), fake);
  return root;
}
for (const version of ["1.3.0", "1.5.0"]) test(`${version}: read-only checker, no proof`, t => {
  const root = fixture(t, version);
  assert.equal(runSuccessorGate(root, env), "SUCCESSOR_READ_ONLY_NO_PROOF");
  assert.deepEqual(JSON.parse(readFileSync(join(root, "invocation.json"))), []);
  assert.equal(existsSync(join(root, proof)), false);
  assert.equal(existsSync(join(root, attest)), false);
});
test("1.4: exact context emits both proof files", t => {
  const root = fixture(t, "1.4.0");
  assert.equal(runSuccessorGate(root, env), "SUCCESSOR_PROOF_PREPARED_NOT_PUBLISHED");
  assert.deepEqual(JSON.parse(readFileSync(join(root, "invocation.json"))), ["--write-evidence"]);
  assert.equal(existsSync(join(root, proof)), true);
  assert.equal(existsSync(join(root, attest)), true);
});
for (const [label, change] of [["wrong revision", { RELEASE_GATE_REVISION: "b".repeat(40) }], ["missing run", { GITHUB_RUN_ID: "" }], ["invalid SHA", { GITHUB_SHA: "bad", RELEASE_GATE_REVISION: "bad" }]]) test(`rejects ${label} before checker`, t => {
  const root = fixture(t, "1.4.0");
  assert.throws(() => runSuccessorGate(root, { ...env, ...change }), /exact release revision/);
  assert.equal(existsSync(join(root, "invocation.json")), false);
});
for (const [version, production] of [["1.2.0", false], ["2.0.0", false], ["1.4.0", true]]) test(`rejects unsupported baseline ${version}/${production}`, t => {
  const root = fixture(t, version, production);
  assert.throws(() => runSuccessorGate(root, env), /Unsupported successor gate baseline/);
  assert.equal(existsSync(join(root, "invocation.json")), false);
});
for (const version of ["1.3.0", "1.4.0", "1.5.0"]) test(`${version}: rejects stale proof`, t => {
  const root = fixture(t, version);
  writeFileSync(join(root, attest), "{}");
  assert.throws(() => runSuccessorGate(root, env), /Stale successor proof/);
  assert.equal(existsSync(join(root, "invocation.json")), false);
});
for (const [mode, version, error] of [["fail", "1.4.0", /checker failed/], ["partial", "1.4.0", /Unexpected successor proof/], ["bad", "1.4.0", /proof output mismatch/], ["unexpected", "1.3.0", /Unexpected successor proof/]]) test(`rejects ${mode} subprocess output`, t => {
  const root = fixture(t, version);
  assert.throws(() => runSuccessorGate(root, { ...env, FIXTURE_MODE: mode }), error);
});
