import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildGovernanceCurrentView } from "../../scripts/derive-governance-current-view.mjs";

const read = name => JSON.parse(readFileSync(name, "utf8"));
const baseline = read("control/constitution-governed-repositories.json");
const pending = read("control/governance-onboarding-queue.v1.json");
const ledger = read("control/governance-registration-ledger.v1.json");
const policy = read("control/universal-constitution-version.json");
const clone = value => structuredClone(value);
const build = (b=baseline,q=pending,l=ledger,p=policy) => buildGovernanceCurrentView(b,q,l,p);

test("derived inventory contains 15 sealed, 2 admitted, 0 pending and zero automatic privileges", () => {
  const view = build();
  assert.equal(view.sealedBaselineCount, 15);
  assert.equal(view.admittedRegistrationCount, 2);
  assert.equal(view.pendingOnboardingCount, 0);
  assert.equal(view.trackedCount, 17);
  assert.equal(view.repositories.filter(e => e.registrationState === "admitted-registration").length, 2);
  assert.equal(view.repositories.every(e => e.complianceState === "UNVERIFIED" && e.productionAuthority === false), true);
  assert.equal(view.repositories.filter(e => e.registrationState === "admitted-registration").every(e => e.sourceFreshness === "verified-admission-source"), true);
  assert.equal(view.canonicalProjectMutationAllowed, false);
  assert.equal(view.automaticQualityGatePassAllowed, false);
  assert.equal(view.productionReleaseAuthority, false);
});

test("rejects duplicate staging repository or project identity", () => {
  const q = clone(pending);
  q.entries[1].repository = q.entries[0].repository;
  assert.throws(() => build(baseline,q), /duplicate repository/);
  const q2 = clone(pending);
  q2.entries[0].projectId = baseline.repositories[0].projectId;
  assert.throws(() => build(baseline,q2), /duplicate project identity/);
});

test("rejects registration not backed by staged onboarding source", () => {
  const l = clone(ledger);
  l.migrations[0].entries[0].repository = "BlueDragon33/Unknown";
  assert.throws(() => build(baseline,pending,l), /no staged onboarding source/);
});

test("rejects registration SHA, project or adoption provenance drift", () => {
  for (const mutate of [
    x => x.migrations[0].entries[0].admittedMainSha = "f".repeat(40),
    x => x.migrations[0].entries[0].projectId = "project:wrong",
    x => x.migrations[0].entries[0].adoptionPr = "https://github.com/BlueDragon33/ECAD_Design/pull/999"
  ]) {
    const l = clone(ledger); mutate(l);
    assert.throws(() => build(baseline,pending,l), /diverges from staged identity\/source/);
  }
});

test("rejects duplicate append-only admission", () => {
  const l = clone(ledger);
  l.migrations.push({
    migrationId: "registration-duplicate",
    sourceQueueRecordedAt: pending.recordedAt,
    registeredAt: "2026-10-15T13:54:00.000Z",
    entries: [clone(l.migrations[0].entries[0])]
  });
  assert.throws(() => build(baseline,pending,l), /admitted more than once/);
});

test("rejects fake compliance, canonical profile or Production authority", () => {
  const l = clone(ledger);
  l.migrations[0].entries[0].complianceState = "COMPLIANT";
  l.migrations[0].entries[0].canonicalProjectProfile = true;
  l.migrations[0].entries[0].productionAuthority = true;
  assert.throws(() => build(baseline,pending,l), /may not self-certify authority/);
});

test("rejects attempts to reinterpret registration ledger as constitutional amendment", () => {
  const l = clone(ledger);
  l.authority = "constitutional-amendment";
  assert.throws(() => build(baseline,pending,l), /claims constitutional authority/);
});

test("rejects sealed baseline count rewrite", () => {
  const l = clone(ledger);
  l.sealedBaseline.governedCount = 17;
  assert.throws(() => build(baseline,pending,l), /rewrite sealed baseline count/);
});

test("rejects queue self-registration and fake compliance", () => {
  const q = clone(pending);
  q.entries[0].state = "registered";
  assert.throws(() => build(baseline,q), /pending must not claim registration/);
  const q2 = clone(pending);
  q2.entries[0].canonicalCompliance = "COMPLIANT";
  q2.entries[0].productionAuthority = true;
  assert.throws(() => build(baseline,q2), /may not self-certify/);
});

test("rejects fake or missing observed commit SHA and evidence origin", () => {
  const q = clone(pending);
  q.entries[0].observedMainSha = "main";
  assert.throws(() => build(baseline,q), /exact observed SHA/);
  const q2 = clone(pending);
  q2.entries[0].adoptionPr = "https://github.com/evil/ECAD_Design/pull/2";
  assert.throws(() => build(baseline,q2), /invalid PR reference/);
  const q3 = clone(pending);
  q3.entries[0].adoptionCI = "https://github.com/evil/ECAD_Design/actions/runs/99";
  assert.throws(() => build(baseline,q3), /invalid CI reference/);
});

test("rejects forged policy, timestamp and branch identity", () => {
  const p = clone(policy); p.policyVersion = "1.4.0";
  assert.throws(() => build(baseline,pending,ledger,p), /only the sealed 1.3 policy/);
  const q = clone(pending); q.recordedAt = "yesterday";
  assert.throws(() => build(baseline,q), /exact ISO/);
  const q2 = clone(pending); q2.entries[0].branch = "unknown";
  assert.throws(() => build(baseline,q2), /unexpected branch/);
});
