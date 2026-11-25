import test from "node:test";
import assert from "node:assert/strict";
import {mkdtempSync,writeFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {triageWork} from "../../scripts/classify-work-priority.mjs";
const SHA="4cb8b104712501403fd984b5dc864b4af4611014";
const REPO="BlueDragon33/BOIECH_AI";
const issue="https://github.com/"+REPO+"/issues/173";
const fixture=()=>({repository:REPO,sourceRevision:SHA,kind:"incident",
 declaredPriority:"P0",observedImpact:"critical-user-journey-unavailable",
 reproduction:"reproduced",sourcePatchMerged:true,runtimeRetested:false,
 evidenceUrl:issue});
test("P0 incident is a CANDIDATE, never self-attested as production closed",()=>{
 const x=triageWork(fixture(),SHA);
 assert.equal(x.priorityBand,0);
 assert.equal(x.disposition,"P0_INCIDENT_CANDIDATE_REQUIRES_RUNTIME_ATTESTATION");
 assert.ok(x.blockers.includes("RUNTIME_RETEST_REQUIRED_BEFORE_P0_CLOSE"));
 assert.ok(x.blockers.includes("MERGED_SOURCE_IS_NOT_RUNTIME_ACCEPTANCE"));
 assert.equal(x.incidentClosedByThisTool,false);
 assert.equal(x.productionAuthority,"NONE");
});
test("P0 MVP feature milestone does not outrank a reproduced incident",()=>{
 const f={...fixture(),kind:"milestone",sourcePatchMerged:false};
 const x=triageWork(f,SHA);
 assert.equal(x.disposition,"P0_MVP_PHASE_NOT_INCIDENT");
 assert.equal(x.priorityBand,3);
});
test("Constitution CI failure does not automatically become production P0",()=>{
 const x=triageWork({...fixture(),kind:"compliance",observedImpact:"quality-ci-failure",
 declaredPriority:"P0",reproduction:"observed-only",sourcePatchMerged:false},SHA);
 assert.equal(x.priorityBand,3);
 assert.equal(x.disposition,"COMPLIANCE_FAILURE_NEEDS_IMPACT_CLASSIFICATION");
});
test("release drift 404 is a release gate, not automatically full app outage",()=>{
 const x=triageWork({...fixture(),kind:"release-drift",observedImpact:"release-readback-stale",
 reproduction:"observed-only",sourcePatchMerged:false},SHA);
 assert.equal(x.priorityBand,2);
 assert.equal(x.disposition,"RELEASE_DRIFT_REQUIRES_PUBLISHED_SHA_READBACK");
});
test("P0 claim without critical impact or reproduced run must be challenged",()=>{
 const x=triageWork({...fixture(),observedImpact:"single-user-degradation",reproduction:"not-run",
 sourcePatchMerged:false},SHA);
 assert.equal(x.disposition,"P0_CLAIM_NEEDS_CRITICAL_IMPACT_REPRODUCTION");
 assert.ok(x.blockers.includes("RUNTIME_RETEST_REQUIRED_BEFORE_P0_CLOSE"));
});
test("changing expected candidate SHA adds a provenance blocker rather than claiming live",()=>{
 const x=triageWork(fixture(),"a".repeat(40));
 assert.ok(x.blockers.includes("STALE_CANDIDATE_SHA"));
});
test("cross-project evidence URLs cannot be passed off as source evidence",()=>{
 assert.throws(()=>triageWork({...fixture(),
 evidenceUrl:"https://github.com/BlueDragon33/Health_Care/issues/173"},SHA),/INVALID_OR_UNTRACEABLE_INPUT/);
 assert.throws(()=>triageWork({...fixture(),evidenceUrl:"https://example.com/fake"},SHA),/INVALID_OR_UNTRACEABLE_INPUT/);
});
test("runtime success with unexecuted test is contradictory",()=>{
 assert.throws(()=>triageWork({...fixture(),reproduction:"not-run",runtimeRetested:true},SHA),/CONTRADICTORY_RUNTIME_EVIDENCE/);
});
test("unsupported impact codes, omitted source revision and unknown kind fail closed",()=>{
 assert.throws(()=>triageWork({...fixture(),observedImpact:"catastrophic-lol"},SHA),/INVALID_OR_UNTRACEABLE_INPUT/);
 assert.throws(()=>triageWork({...fixture(),sourceRevision:"main"},SHA),/INVALID_OR_UNTRACEABLE_INPUT/);
 assert.throws(()=>triageWork({...fixture(),kind:"P0"},SHA),/INVALID_OR_UNTRACEABLE_INPUT/);
});
test("source patch merged is not evidence that technical A or real-user B passed",()=>{
 const x=triageWork({...fixture(),runtimeRetested:true},SHA);
 assert.equal(x.technicalA,"NEEDS_SCOPED_EVIDENCE");
 assert.equal(x.userValueB,"NEEDS_REAL_USER_OUTCOME_EVIDENCE");
 assert.equal(x.canonicalQualityGate,"UNCHANGED");
});
test("CLI needs exact pin and performs no write or approval",()=>{
 const dir=mkdtempSync(join(tmpdir(),"triage-")),file=join(dir,"input.json");
 const src=fileURLToPath(new URL("../../scripts/classify-work-priority.mjs",import.meta.url));
 try {
  writeFileSync(file,JSON.stringify(fixture()));
  const ok=spawnSync(process.execPath,[src,file,SHA],{encoding:"utf8"});
  assert.equal(ok.status,0,ok.stderr);
  assert.equal(JSON.parse(ok.stdout).incidentClosedByThisTool,false);
  const stale=spawnSync(process.execPath,[src,file,"e".repeat(40)],{encoding:"utf8"});
  assert.equal(stale.status,2);
  const no=spawnSync(process.execPath,[src,file],{encoding:"utf8"});
  assert.equal(no.status,2);
 } finally {rmSync(dir,{recursive:true,force:true});}
});

test("reproduced severe incidents outrank unverified P0 claims regardless of declared label",()=>{
 const claim=triageWork({...fixture(),reproduction:"not-run",sourcePatchMerged:false},SHA);
 for(const declaredPriority of ["P1","P2","UNCLASSIFIED"]){
  for(const observedImpact of ["critical-user-journey-unavailable","confirmed-data-loss","confirmed-authorization-bypass","confirmed-sensitive-data-exposure","production-integrity-corruption"]){
   const x=triageWork({...fixture(),declaredPriority,observedImpact},SHA);
   assert.equal(x.priorityBand,0);
   assert.ok(x.priorityBand<claim.priorityBand);
   assert.equal(x.declaredPriority,declaredPriority);
   assert.ok(x.blockers.includes("RUNTIME_RETEST_REQUIRED_BEFORE_P0_CLOSE"));
   assert.equal(x.incidentClosedByThisTool,false);
   assert.equal(x.productionAuthority,"NONE");
   const unverified=triageWork({...fixture(),declaredPriority,observedImpact,reproduction:"observed-only"},SHA);
   assert.notEqual(unverified.priorityBand,0);
  }
 }
});
