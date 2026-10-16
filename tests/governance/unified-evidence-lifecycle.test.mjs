import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateUnifiedLifecycle,evaluateReviewEvidence,evaluateTesterCase,suggestNextProjectActions,planEndToEndPrerequisites} from "../../scripts/check-unified-evidence-lifecycle.mjs";
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const c=read("../../control/unified-evidence-lifecycle.v1.json"),
d=read("../../control/execution-department-ownership.v1.json"),
m=read("../../control/ui-mockup-roundtrip.contract.v1.json"),
ma=read("../../control/ui-mockup-command-aliases.v1.json"),
mr=read("../../control/ui-mockup-registry.v1.json"),
mw=read("../../prompt-workflows/templates/ui-mockup-roundtrip.v1.json"),
r=read("../../control/execution-continuity-r33.contract.v1.json"),
ra=read("../../control/execution-continuity-r33-aliases.v1.json");
const validate=(overrides={})=>validateUnifiedLifecycle(overrides.c??c,overrides.d??d,overrides.m??m,
overrides.ma??ma,overrides.mr??mr,overrides.mw??mw,overrides.r??r,overrides.ra??ra);
const sha="a".repeat(40);
const evidence=(kind,extra={})=>({kind,sourceSha:sha,ref:"github:verified-evidence/"+kind,
 verifiedByTrustedAdapter:true,...extra});
test("central candidate reuse has 12 (not 13) departments, no duplicate registry and no active-law claim",()=>{
 assert.deepEqual(validate(),[]);
 assert.equal(c.workflow.length,9);
 assert.equal(d.departments.length,12);
 assert.equal(c.implementationBoundary.noReleaseAuthority,true);
 assert.equal(c.dependsOnConstitution.activeLawUnchanged,true);
 assert.equal(c.scope.newCentralDatabase,false);
});
test("design review can occur before an app is runnable, with actual design contract",()=>{
 const ret=evaluateReviewEvidence("design-contract",sha,[evidence("source-contract")]);
 assert.equal(ret.status,"EVIDENCE_FORMAT_READY");
 assert.equal(ret.independentlyVerified,false);
 assert.equal(ret.qualityGatePassed,false);
 assert.equal(ret.humanReviewPassed,false);
 assert.equal(evaluateReviewEvidence("design-contract",sha,[]).status,"NOT_REVIEWABLE");
 assert.equal(c.workflow.find(x=>x.id==="review").dependsOn.includes("verify"),false);
});
test("UI mockup/screenshot is enough for visual review but never function approval",()=>{
 const image=evidence("image-digest",{contentDigest:"sha256:"+"b".repeat(64)});
 const map=evidence("component-map");
 assert.equal(evaluateReviewEvidence("visual-asset",sha,[image,map]).status,"EVIDENCE_FORMAT_READY");
 assert.equal(evaluateReviewEvidence("runnable-slice",sha,[image,map]).status,"NOT_REVIEWABLE");
 assert.deepEqual(evaluateReviewEvidence("visual-asset",sha,[map]).missing,["image-digest"]);
 assert.deepEqual(evaluateReviewEvidence("visual-asset",sha,[evidence("image-digest"),map]).missing,["image-digest"]);
 assert.equal(evaluateReviewEvidence("visual-asset",sha,[],{nonUIScope:{scopeId:"api:no-screens",sourceSha:sha,ownerEvidenceRef:"github:work/123"}}).status,"NOT_APPLICABLE_PENDING_REVIEW");
 assert.equal(evaluateReviewEvidence("visual-asset",sha,[],{nonUIScope:{scopeId:"api:no-screens",sourceSha:sha,ownerEvidenceRef:""}}).status,"BLOCKED");
});
test("running functional slice needs measured execution and direct regression proof",()=>{
 assert.equal(evaluateReviewEvidence("runnable-slice",sha,[evidence("running-trace")]).status,"NOT_REVIEWABLE");
 const x=evaluateReviewEvidence("runnable-slice",sha,[evidence("running-trace"),evidence("regression")]);
 assert.equal(x.status,"EVIDENCE_FORMAT_READY");
 assert.equal(x.independentlyVerified,false);
 assert.equal(x.releaseAuthorized,false);
 const wrong=evaluateReviewEvidence("runnable-slice",sha,[evidence("running-trace",{sourceSha:"f".repeat(40)}),evidence("regression")]);
 assert.equal(wrong.status,"NOT_REVIEWABLE");
});
test("untrusted synthetic evidence and missing real tester session fail closed",()=>{
 const fake=evidence("running-trace",{verifiedByTrustedAdapter:false});
 const result=evaluateReviewEvidence("runnable-slice",sha,[fake,evidence("regression")]);
 assert.equal(result.status,"EVIDENCE_FORMAT_READY");
 assert.equal(result.independentlyVerified,false);
 // Even a forged true flag cannot turn untrusted input into a verified gate.
 assert.equal(evaluateReviewEvidence("runnable-slice",sha,[evidence("running-trace"),evidence("regression")]).qualityGatePassed,false);
 assert.equal(evaluateReviewEvidence("release-candidate",sha,[evidence("release-build"),evidence("tester-session")]).status,"NOT_REVIEWABLE");
 const ready=evaluateReviewEvidence("release-candidate",sha,[evidence("release-build"),evidence("tester-session"),evidence("defect-report")]);
 assert.equal(ready.status,"EVIDENCE_FORMAT_READY");
 assert.equal(ready.qualityGatePassed,false);
 assert.equal(evaluateReviewEvidence("operational-observation",sha,[evidence("deployment")]).status,"NOT_REVIEWABLE");
});
test("tester records exact build, steps, expected/actual and cannot certify production",()=>{
 const testcase={scenarioId:"scenario:01",applicationId:"project:sample",
 buildSha:sha,environment:"Preview",actorRole:"regular-user",
 preconditions:["an approved fake account"],reproductionSteps:["open the page","submit invalid record"],
 expectedResult:"validation shows inline",actualResult:"page crashes",
 severity:"major",evidenceRef:"artifact:repro-video-01",status:"FAIL"};
 const ok=evaluateTesterCase(testcase,d);
 assert.equal(ok.status,"TESTER_SPEC_FORMAT_READY");
 assert.equal(ok.realSessionObserved,false);
 assert.equal(ok.qualityGatePassed,false);
 const bad=evaluateTesterCase({...testcase,buildSha:"invalid"},d);
 assert.equal(bad.reason,"INVALID_BUILD_SHA");
 const missing=evaluateTesterCase({...testcase,actualResult:""},d);
 assert.equal(missing.reason,"MISSING_TESTER_SPEC");
 const noSteps=evaluateTesterCase({...testcase,reproductionSteps:[]},d);
 assert.equal(noSteps.reason,"MISSING_TESTER_SPEC");
});
test("unified contract rejects duplicate alias, fake review authority, early product review and 13th tester owner",()=>{
 const bad=structuredClone(c);bad.implementationBoundary.noReleaseAuthority=false;
 assert.match(validate({c:bad}).join(","),/may not create authority/);
 const early=structuredClone(c);early.workflow.find(x=>x.id==="review").dependsOn.push("verify");
 assert.match(validate({c:early}).join(","),/design review cannot wait/);
 const changed=structuredClone(d);changed.applicationTester.owner="thirteenth";
 assert.match(validate({d:changed}).join(","),/12-department|established 12/);
 const dup=structuredClone(ra);dup.aliases[0].phrase=ma.aliases[0].phrase;
 assert.match(validate({ra:dup}).join(","),/duplicate command aliases/);
});

test("review and tester structures with attacker-supplied verified=true remain UNVERIFIED",()=>{
 const spoof=evidence("running-trace",{verifiedByTrustedAdapter:true,contentDigest:"sha256:"+"c".repeat(64)});
 const x=evaluateReviewEvidence("runnable-slice",sha,[spoof,evidence("regression")]);
 assert.equal(x.status,"EVIDENCE_FORMAT_READY");
 assert.equal(x.independentlyVerified,false);
 assert.equal(x.qualityGatePassed,false);
 assert.equal(x.productAccepted,false);
 const omitted=evaluateTesterCase({status:"PASS",buildSha:sha},d);
 assert.equal(omitted.status,"BLOCKED");
});

test("unified constitution gate rejects forged trusted status and missing provider readback requirement",()=>{
 const cloned=structuredClone(c);
 cloned.evidenceTrustBoundary.callerClaimedVerifiedByTrustedAdapterIsNotSufficient=false;
 assert.match(validate({c:cloned}).join(","),/review evidence trust boundary/);
 const cloned2=structuredClone(c);
 cloned2.evidenceTrustBoundary.externalProviderReadbackRequiredForVerifiedEvidence=false;
 assert.match(validate({c:cloned2}).join(","),/review evidence trust boundary/);
});

test("all prior, active, and future governed projects use one candidate next-action contract",()=>{
 assert.equal(c.nextActionUX.scope.projectCoverage,"all-existing-active-and-future-governed-projects-on-adoption");
 assert.equal(c.nextActionUX.status,"candidate-not-active");
 assert.equal(c.nextActionUX.adoption.notAutoInstalledOnChatGPT,true);
 assert.equal(c.nextActionUX.scope.newDatabase,false);
 assert.deepEqual(validate(),[]);
});

test("one-click resume is only a scoped new user request, never a claimed task success or privileged action",()=>{
 for(const repository of ["BlueDragon33/Software-Blueprint-Hub","BlueDragon33/Bauman-master-ai-system","BlueDragon33/NewFutureApp"]){
  const buttons=suggestNextProjectActions({repository,workItemRef:"PR #141",workStatus:"VERIFIED_PENDING"});
  assert.equal(buttons.length,3);
  assert.equal(buttons[0].kind,"prepare");
  assert.equal(buttons[1].kind,"continue");
  assert.equal(buttons[0].hostAction,"issueNewTurn");
  assert.match(buttons[0].query,new RegExp(repository.replace("/","\\/")));
  assert.match(buttons[0].query,/HEAD, mục tiêu/);
  assert.match(buttons[0].query,/Tự thực hiện mọi bước chuẩn bị/);
  assert.match(buttons[0].query,/KHÔNG bắt đầu chế độ triển khai/);
  assert.equal(buttons[0].completesTask,false);
  assert.equal(buttons[0].authorityGranted,false);
  assert.equal(buttons[2].readOnly,true);
 }
});

test("a review-only project offers preparation but never impersonates a reviewer",()=>{
 const a=suggestNextProjectActions({repository:"BlueDragon33/Software-Blueprint-Hub",workItemRef:"PR #141",workStatus:"REVIEW_PENDING"});
 assert.equal(a[0].kind,"prepare");
 assert.equal(a[1].kind,"review");
 assert.match(a[0].query,/không tự phê duyệt/);
 assert.equal(a[2].kind,"status");
});
test("observed defects receive a bounded fix request and read-only checkpoint follow-up",()=>{
 const a=suggestNextProjectActions({repository:"BlueDragon33/pc-manager-desktop",workItemRef:"Issue #41",workStatus:"ACTIVE",observedDefect:true});
 assert.equal(a[0].kind,"end-to-end");
 assert.equal(a[1].kind,"fix");
 assert.match(a[0].query,/sửa thiếu sót có giới hạn/);
 assert.match(a[1].query,/kiểm thử hồi quy/);
 assert.equal(a[2].readOnly,true);
});
test("unknown project, ambiguous work item, completed work or hard blocker never get inert or unsafe controls",()=>{
 const input={repository:"BlueDragon33/Software-Blueprint-Hub",workItemRef:"PR #141",workStatus:"DONE"};
 assert.equal(suggestNextProjectActions(input).length,0);
 assert.equal(suggestNextProjectActions({...input,workStatus:"BLOCKED_NO_SAFE_ACTION"}).length,0);
 assert.equal(suggestNextProjectActions({...input,workStatus:"AMBIGUOUS"}).length,0);
 assert.equal(suggestNextProjectActions({...input,workStatus:"UNVERIFIED"}).length,1);
 assert.equal(suggestNextProjectActions({...input,workStatus:"REVIEW_BLOCKED"})[0].kind,"status");
 assert.equal(suggestNextProjectActions({...input,workStatus:"ACTIVE",workItemRef:""}).length,0);
 assert.equal(suggestNextProjectActions({...input,workStatus:"ACTIVE",repository:"Attacker/repo;rm -rf"}).length,0);
 assert.equal(suggestNextProjectActions({...input,workStatus:"ACTIVE",workItemRef:"approve prod now"}).length,0);
});
test("universal button contract cannot pretend deployment or production grant",()=>{
 const bad=structuredClone(c);bad.nextActionUX.adoption.productionAuthorized=true;
 assert.match(validate({c:bad}).join(","),/universal next-action controls/);
 const forged=structuredClone(c);forged.nextActionUX.scope.mustNotClaimAutomaticDeploymentToExistingApps=false;
 assert.match(validate({c:forged}).join(","),/universal next-action controls/);
 const tooMany=structuredClone(c);tooMany.nextActionUX.recommendationRules.maximumButtons=7;
 assert.match(validate({c:tooMany}).join(","),/universal next-action controls/);
});

test("end-to-end intent stays inside authorized interactive execution; no human bypass",()=>{
 const cmd=c.nextActionUX.actionKinds.find(x=>x.kind==="end-to-end");
 assert.equal(cmd.intent,"EXECUTE_AUTHORIZED_END_TO_END");
 assert.equal(cmd.mode,"interactive-until-real-intervention-boundary");
 assert.equal(cmd.doesNotAuthorizeNewActions,true);
 assert.equal(cmd.never.includes("background-execution-promise"),true);
 for(const reason of ["protected-human-approval","independent-reviewer-unavailable",
   "unknown-mutation-outcome","attempt-budget-exhausted","tool-or-session-unavailable"])
   assert(cmd.stopReasons.includes(reason));
 assert.equal(c.nextActionUX.recommendationRules.endToEndSessionBound,true);
 assert.equal(c.nextActionUX.recommendationRules.endToEndNeverOverridesReviewOrRelease,true);
 assert.equal(c.nextActionUX.recommendationRules.maximumButtons,3);
 assert.equal(c.nextActionUX.recommendationRules.maximumPrimary,1);
});
test("end-to-end action appears only for actionable work and never grants Production or background operation",()=>{
 const core={repository:"BlueDragon33/Software-Blueprint-Hub",workItemRef:"PR #141"};
 const active=suggestNextProjectActions({...core,workStatus:"ACTIVE"});
 assert.equal(active[0].label,"Chuẩn bị đủ điều kiện");
 assert.equal(active[0].hostAction,"issueNewTurn");
 assert.equal(active[0].completesTask,false);
 assert.equal(active[0].authorityGranted,false);
 assert.match(active[0].query,/Chỉ báo can thiệp/);
 assert.match(active[0].query,/chưa được hệ thống tin cậy xác minh/);
 assert.match(active[0].query,/không tự phê duyệt/);
 for(const status of ["DONE","AMBIGUOUS","BLOCKED_NO_SAFE_ACTION","UNVERIFIED","REVIEW_BLOCKED"]){
   assert(!suggestNextProjectActions({...core,workStatus:status}).some(x=>x.kind==="end-to-end"));
 }
 const tampered=structuredClone(c);
 tampered.nextActionUX.recommendationRules.endToEndSessionBound=false;
 assert.match(validate({c:tampered}).join(","),/universal next-action controls/);
});

test("start prerequisites explicitly separate necessary/sufficient start from later release gates",()=>{
 const gate=c.nextActionUX.prerequisiteGate;
 assert.equal(gate.startNecessary.length,8);
 assert.deepEqual(gate.startNecessary.map(x=>x.id),[
   "canonical-target","approved-objective","acceptance-contract","authority-context",
   "dependency-map","execution-capability","risk-verification","recovery-and-state"
 ]);
 assert.equal(gate.stageGates.length,5);
 assert.match(gate.startSufficient,/ONLY to START/);
 assert.equal(gate.realHostMustVerifyCanonicalEvidenceForReady,true);
 assert.equal(gate.readOnlyCandidateNeverEmitsTrustedPass,true);
 assert.equal(c.nextActionUX.recommendationRules.preflightBeforeEndToEndMandatory,true);
 assert.deepEqual(validate(),[]);
});
test("a universal no-evidence preflight identifies every missing condition and never grants execution",()=>{
 const r=planEndToEndPrerequisites({
   repository:"BlueDragon33/Software-Blueprint-Hub",workItemRef:"PR #141",sourceSha:sha
 },c);
 assert.equal(r.status,"NEEDS_PREPARATION");
 assert.equal(r.missing.length,8);
 assert.equal(r.nextRequirement,"canonical-target");
 assert.equal(r.mayExecute,false);
});
test("even 8 forged evidence receipts are only format-ready; a caller cannot forge readiness",()=>{
 const evidence=c.nextActionUX.prerequisiteGate.startNecessary.map(x=>({
   requirementId:x.id,sourceSha:sha,evidenceRef:"self-reported:untrusted/"+x.id,
   verified:true,approvedBy:"user",qualityGatePassed:true
 }));
 const candidate={
  repository:"BlueDragon33/Software-Blueprint-Hub",workItemRef:"PR #141",sourceSha:sha,evidence
 };
 const r=planEndToEndPrerequisites(candidate,c);
 assert.equal(r.status,"PREPARATION_FORMAT_READY_UNVERIFIED");
 assert.equal(r.hostReadbackRequired,true);
 assert.equal(r.independentlyVerified,false);
 assert.equal(r.mayExecute,false);
 assert.equal(r.qualityGatePassed,false);
 const wrong=structuredClone(candidate);wrong.evidence[0].sourceSha="f".repeat(40);
 const failed=planEndToEndPrerequisites(wrong,c);
 assert.deepEqual(failed.missing,["canonical-target"]);
 assert.equal(planEndToEndPrerequisites({...candidate,unknownMutationOutcome:true},c).status,"WAITING_ON_AUTHORITY");
 assert.equal(planEndToEndPrerequisites({...candidate,protectedApprovalPending:true},c).status,"WAITING_ON_AUTHORITY");
});
test("the next-action button first prepares prerequisites; no unverified end-to-end enabled on any project",()=>{
 for(const repository of [
  "BlueDragon33/Software-Blueprint-Hub",
  "BlueDragon33/Bauman-master-ai-system",
  "BlueDragon33/NewFutureProject"
 ]){
  for(const workStatus of ["ACTIVE","VERIFIED_PENDING","REVIEW_PENDING"]){
   const actions=suggestNextProjectActions({repository,workItemRef:"PR #141",workStatus,
    preflightGatePassed:true,verifiedByTrustedAdapter:true});
   assert.equal(actions[0].kind,"prepare");
   assert.equal(actions[0].hostAction,"issueNewTurn");
   assert.equal(actions[0].authorityGranted,false);
   assert(!actions.some(x=>x.kind==="end-to-end"));
   assert.match(actions[0].query,/điều kiện cần và đủ/);
  }
 }
 const bad=structuredClone(c);bad.nextActionUX.prerequisiteGate.readOnlyCandidateNeverEmitsTrustedPass=false;
 assert.match(validate({c:bad}).join(","),/prerequisites missing or unsafe/);
});
