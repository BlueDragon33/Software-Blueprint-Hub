import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {verifyRuePrivateOnboarding} from "../../scripts/verify-rue-private-onboarding.mjs";
import {inspectPendingOnboarding} from "../../scripts/verify-governance-onboarding-live.mjs";

const load = path => JSON.parse(readFileSync(path,"utf8"));
const queue=load("control/governance-onboarding-queue.v1.json");
const contract=load("control/universal-constitution.contract.json");
const name="BlueDragon33/Blueprint-Russian-Expert-Engine";
const entry=queue.entries.find(e=>e.repository===name);
const selected={...queue,entries:[entry]};
const mock=(overrides={})=>async path=>{
  if (path==="/repos/"+name) return {full_name:name,default_branch:overrides.defaultBranch??"main"};
  if (path==="/repos/"+name+"/branches/main")return {name:"main",commit:{sha:overrides.head??entry.observedMainSha}};
  if (path.includes("/contents/.blueprint/constitution-adoption.json?ref=")) {
    const adoption={
      schemaVersion:"1.0.0",policyId:contract.policyId,policyVersion:contract.policyVersion,
      projectId:overrides.projectId??entry.projectId,blueprintLevel:entry.proposedBlueprintLevel,
      enforcementMode:"enforced",inheritedPillars:contract.pillars.map(p=>p.id),
      disabledPillars:overrides.disabledPillars??[],constitutionalWaivers:[],
      evidenceAuthority:"canonical-quality-gates",productionAuthority:"separate-explicit-release-gate"
    };
    return {type:"file",encoding:"base64",content:Buffer.from(JSON.stringify(adoption)).toString("base64")};
  }
  if(path.includes("/actions/runs?"))return {workflow_runs:[{
    id:123456,event:"push",status:"completed",conclusion:overrides.conclusion??"success",
    head_sha:overrides.ciSha??entry.observedMainSha,
    path:overrides.workflowPath??".github/workflows/contract-checks.yml"
  }]};
  throw new Error("unexpected private API call: "+path);
};

test("public live verifier never probes private RUE even with a mock network provider",async()=>{
  let called=false;
  const results=await inspectPendingOnboarding(selected,contract,async()=>{called=true;throw Error("should not read private");});
  assert.equal(called,false);
  assert.equal(results[0].adoptionState,"PRIVATE_ACCESS_REQUIRED");
  assert.equal(results[0].verifiedCiRunId,null);
});
test("scoped private evidence has exact HEAD, adoption and same-SHA contract workflow, never authority",async()=>{
  const result=await verifyRuePrivateOnboarding(queue,contract,mock());
  assert.equal(result.exactHead,entry.observedMainSha);
  assert.equal(result.adoptionState,"SOURCE_AND_WORKFLOW_VERIFIED_ONLY");
  assert.equal(result.complianceState,"UNVERIFIED");
  assert.equal(result.canonicalProjectProfile,false);
  assert.equal(result.productionReleaseAuthority,false);
  assert.equal(result.qualityGatePassAllowed,false);
});
test("private verification rejects stale HEAD and failed, missing or forged workflow CI",async()=>{
  await assert.rejects(verifyRuePrivateOnboarding(queue,contract,mock({head:"f".repeat(40)})),/queued HEAD is stale/);
  await assert.rejects(verifyRuePrivateOnboarding(queue,contract,mock({conclusion:"failure"})),/no successful same-SHA/);
  await assert.rejects(verifyRuePrivateOnboarding(queue,contract,mock({ciSha:"a".repeat(40)})),/no successful same-SHA/);
  await assert.rejects(verifyRuePrivateOnboarding(queue,contract,mock({workflowPath:".github/workflows/unrelated.yml"})),/no successful same-SHA/);
});
test("private verification rejects wrong adoption, forged authority, wrong branch and missing token read",async()=>{
  await assert.rejects(verifyRuePrivateOnboarding(queue,contract,mock({projectId:"project:wrong"})),/adoption policy/);
  await assert.rejects(verifyRuePrivateOnboarding(queue,contract,mock({disabledPillars:["structural-capacity"]})),/mandatory pillar/);
  await assert.rejects(verifyRuePrivateOnboarding(queue,contract,mock({defaultBranch:"fake"})),/repo identity/);
  await assert.rejects(verifyRuePrivateOnboarding(queue,contract,async()=>{throw Error("GitHub 403");}),/GitHub 403/);
  const mutated=structuredClone(queue);
  mutated.entries.find(e=>e.repository===name).productionAuthority=true;
  await assert.rejects(verifyRuePrivateOnboarding(mutated,contract,mock()),/private pending item cannot claim/);
});
test("private reader is constrained to the single authorized repository",async()=>{
  await assert.rejects(inspectPendingOnboarding(queue,contract,mock(),{scopedPrivateRead:name}),/single private RUE/);
  await assert.rejects(inspectPendingOnboarding(selected,contract,mock(),{scopedPrivateRead:"BlueDragon33/OtherPrivateRepo"}),/unsupported private read scope/);
  const q=structuredClone(queue);
  q.entries=q.entries.filter(e=>e.repository===name);
  q.entries[0].visibility="public";
  await assert.rejects(verifyRuePrivateOnboarding(q,contract,mock()),/exact private repository/);
});

test("manual Preview workflow disables setup-node auto pnpm cache before token issuance",()=>{
  const workflow=readFileSync(".github/workflows/verify-rue-private-onboarding-preview.yml","utf8");
  assert.match(workflow,/on:\s*\n\s*workflow_dispatch:/);
  assert.match(workflow,/uses: actions\/setup-node@v5\s*\n\s*with:\s*\n\s*node-version: '24'\s*\n\s*package-manager-cache: false/);
  assert.match(workflow,/github.ref == 'refs\/heads\/main'/);
  assert.match(workflow,/repositories: Blueprint-Russian-Expert-Engine/);
  assert.match(workflow,/permission-contents: read/);
  assert.match(workflow,/permission-actions: read/);
  assert.doesNotMatch(workflow,/pnpm install|pnpm exec|pnpm\/action-setup/);
});
