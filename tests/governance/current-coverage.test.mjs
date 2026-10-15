import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildGovernanceCurrentView } from "../../scripts/derive-governance-current-view.mjs";

const read = name => JSON.parse(readFileSync(name, "utf8"));
const baseline = read("control/constitution-governed-repositories.json");
const pending = read("control/governance-onboarding-queue.v1.json");
const policy = read("control/universal-constitution-version.json");
const clone = value => structuredClone(value);

test("derived inventory contains 15 sealed, 2 pending, zero automatic privileges", () => {
  const view = buildGovernanceCurrentView(baseline, pending, policy);
  assert.equal(view.sealedBaselineCount, 15);
  assert.equal(view.pendingOnboardingCount, 2);
  assert.equal(view.trackedCount, 17);
  assert.equal(view.repositories.filter(e => e.registrationState === "pending-onboarding").length, 2);
  assert.equal(view.repositories.every(e => e.complianceState === "UNVERIFIED" && e.productionAuthority === false), true);
  assert.equal(view.repositories.filter(e => e.registrationState === "pending-onboarding").every(e => e.sourceFreshness === "historical-reference-not-live-head"), true);
  assert.equal(view.canonicalProjectMutationAllowed, false);
  assert.equal(view.automaticQualityGatePassAllowed, false);
  assert.equal(view.productionReleaseAuthority, false);
});

test("rejects attempts to register the same repo twice", () => {
  const q = clone(pending);
  q.entries[1].repository = q.entries[0].repository;
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /duplicate repository/);
});
test("rejects duplicate project identity even across different repositories", () => {
  const q = clone(pending);
  q.entries[0].projectId = baseline.repositories[0].projectId;
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /duplicate project identity/);
});
test("does not convert an unverified repo to canonical governance", () => {
  const q = clone(pending);
  q.entries[0].state = "registered";
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /pending must not claim registration/);
});
test("rejects fake compliance and production authority", () => {
  const q = clone(pending);
  q.entries[0].canonicalCompliance = "COMPLIANT";
  q.entries[0].productionAuthority = true;
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /may not self-certify/);
});
test("rejects fake or missing observed commit SHA", () => {
  const q = clone(pending);
  q.entries[0].observedMainSha = "main";
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /exact observed SHA/);
});
test("rejects incorrect adoption PR evidence origin", () => {
  const q = clone(pending);
  q.entries[0].adoptionPr = "https://github.com/evil/ECAD_Design/pull/2";
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /invalid PR reference/);
});
test("rejects incorrect CI evidence origin", () => {
  const q = clone(pending);
  q.entries[0].adoptionCI = "https://github.com/evil/ECAD_Design/actions/runs/99";
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /invalid CI reference/);
});
test("rejects changing sealed registry policy or pretending it was expanded", () => {
  const q = clone(pending);
  q.sealedBaseline.governedCount = 17;
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /historical baseline count drift/);
});
test("rejects a mismatched or forged Constitution authority version", () => {
  const p = clone(policy);
  p.policyVersion = "1.4.0";
  assert.throws(() => buildGovernanceCurrentView(baseline, pending, p), /only the sealed 1.3 policy/);
});
test("rejects timestamp or branch impersonation", () => {
  const q = clone(pending);
  q.recordedAt = "yesterday";
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /exact ISO/);
  q.recordedAt = pending.recordedAt;
  q.entries[0].branch = "unknown";
  assert.throws(() => buildGovernanceCurrentView(baseline, q, policy), /unexpected branch/);
});
