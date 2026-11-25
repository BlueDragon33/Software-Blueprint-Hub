import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { buildNavigationPublicationCandidate } from "../../scripts/check-constitution-1.4-candidate.mjs";
import { buildProductCompletionPublicationCandidate } from "../../scripts/check-constitution-1.5-candidate.mjs";
import { validateOnboardingQueue } from "../../scripts/check-governance-onboarding-queue.mjs";
import { buildGovernanceCurrentView } from "../../scripts/derive-governance-current-view.mjs";

const read = name => JSON.parse(readFileSync(name, "utf8"));
const baseline = read("control/constitution-governed-repositories.json");
const pending = read("control/governance-onboarding-queue.v1.json");
const ledger = read("control/governance-registration-ledger.v1.json");
const policy = read("control/universal-constitution-version.json");
const clone = value => structuredClone(value);
const build = (b=baseline,q=pending,l=ledger,p=policy) => buildGovernanceCurrentView(b,q,l,p);

test("derived inventory contains 15 sealed, 2 admitted, 1 pending and zero automatic privileges", () => {
  const view = build();
  assert.equal(view.sealedBaselineCount, 15);
  assert.equal(view.admittedRegistrationCount, 2);
  assert.equal(view.pendingOnboardingCount, 1);
  assert.equal(view.trackedCount, 18);
  assert.equal(view.repositories.filter(e => e.registrationState === "admitted-registration").length, 2);
  assert.equal(view.repositories.every(e => e.complianceState === "UNVERIFIED" && e.productionAuthority === false), true);
  assert.equal(view.repositories.filter(e => e.registrationState === "admitted-registration").every(e => e.sourceFreshness === "verified-admission-source"), true);
  assert.equal(view.canonicalProjectMutationAllowed, false);
  assert.equal(view.automaticQualityGatePassAllowed, false);
  assert.equal(view.productionReleaseAuthority, false);
});

test("rejects duplicate staging repository or project identity", () => {
  const q = clone(pending);
  q.entries[1] = clone(q.entries[0]);
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
  const p = clone(policy); p.policyVersion = "9.9.9";
  assert.throws(() => build(baseline,pending,ledger,p), /unsupported governance policy source version/);
  const q = clone(pending); q.recordedAt = "yesterday";
  assert.throws(() => build(baseline,q), /exact ISO/);
  const q2 = clone(pending); q2.entries[0].branch = "unknown";
  assert.throws(() => build(baseline,q2), /unexpected branch/);
});

test("new pending RUE remains not registered and cannot claim release", () => {
  const view = build();
  const rue = view.repositories.find(e => e.repository === "BlueDragon33/Blueprint-Russian-Expert-Engine");
  assert.ok(rue);
  assert.equal(rue.registrationState, "pending-onboarding");
  assert.equal(rue.sourceRevision, "60c544eeafff06e145a3363fef8071f29e51cc86");
  assert.equal(rue.observedAt, "2026-10-16T05:37:39.804Z");
  assert.equal(rue.complianceState, "UNVERIFIED");
  assert.equal(rue.productionAuthority, false);
  assert.equal(view.recordedAt, rue.observedAt);
});
test("RUE observedAt must be an exact later historical record and registration must bind to per-entry timestamp", () => {
  const q = clone(pending);
  q.entries[2].observedAt = "2026-10-15T00:00:00.000Z";
  assert.throws(() => build(baseline,q), /predates historical queue/);
  const q2 = clone(pending);
  q2.entries[2].observedAt = "not-an-iso-date";
  assert.throws(() => build(baseline,q2), /exact ISO/);
  const ledgerWrong = clone(ledger);
  ledgerWrong.migrations.push({
    migrationId: "registration-rue-invalid-date",
    sourceQueueRecordedAt: pending.recordedAt,
    registeredAt: "2026-10-16T06:00:00.000Z",
    entries: [{
      repository: pending.entries[2].repository,
      branch:"main", projectId:pending.entries[2].projectId,blueprintLevel:"B4",
      admittedMainSha:pending.entries[2].observedMainSha,
      adoptionPr:pending.entries[2].adoptionPr,
      constitutionCi:pending.entries[2].adoptionCI,
      registrationState:"admitted-registration",
      complianceState:"UNVERIFIED",canonicalProjectProfile:false,productionAuthority:false
    }]
  });
  assert.throws(() => build(baseline,pending,ledgerWrong), /registration migration queue source mismatch/);
});

test("successor source compatibility preserves historical registry and never certifies adoption", () => {
  const root=mkdtempSync(join(tmpdir(),"governance-policy-source-"));
  const write=(path,bytes)=>{const p=join(root,path);mkdirSync(dirname(p),{recursive:true});writeFileSync(p,bytes);};
  try {
    const r33=buildNavigationPublicationCandidate();
    const r38=buildProductCompletionPublicationCandidate();
    for(const path of [r33.profile.patchPath,r38.profile.patchPath])write(path,readFileSync(path,"utf8"));
    for(const candidate of [r33,r38]){
      const original=JSON.stringify([baseline,pending,ledger]);
      for(const [path,bytes] of Object.entries(candidate.files))write(path,bytes);
      const next=JSON.parse(candidate.files["control/universal-constitution-version.json"]);
      const view=buildGovernanceCurrentView(baseline,pending,ledger,next,root);
      assert.equal(view.policyVersion,next.policyVersion);
      assert.equal(view.trackedCount,18);
      assert.equal(view.pendingOnboardingCount,1);
      assert.ok(view.repositories.every(row=>row.complianceState==="UNVERIFIED"&&row.productionAuthority===false));
      assert.equal(JSON.stringify([baseline,pending,ledger]),original);
      assert.deepEqual(validateOnboardingQueue(pending,baseline,next,root),[]);
      const wrong=clone(next);wrong.policyVersion="1.3.9";
      assert.throws(()=>buildGovernanceCurrentView(baseline,pending,ledger,wrong,root),/unsupported/);
      const path="packages/application/src/constitution-authority.ts";
      write(path,candidate.files[path]+"\n// outside seal\n");
      assert.throws(()=>buildGovernanceCurrentView(baseline,pending,ledger,next,root),/blob seal mismatch/);
      assert.ok(validateOnboardingQueue(pending,baseline,next,root).some(s=>s.includes("blob seal mismatch")));
    }
  }finally{rmSync(root,{recursive:true,force:true});}
});
