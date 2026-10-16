import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateUnifiedLifecycle,evaluateReviewEvidence,evaluateTesterCase} from "../../scripts/check-unified-evidence-lifecycle.mjs";
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
