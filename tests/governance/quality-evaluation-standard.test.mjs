import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {validateStandard,assessQuality,learnFromFeedback} from "../../scripts/evaluate-quality-evidence.mjs";
import {extractLedgerEvents,readCanonicalFeedback,summarizeCanonicalFeedback} from "../../scripts/collect-quality-feedback-from-github.mjs";

const standard=JSON.parse(readFileSync(new URL("../../control/quality-evaluation-standard.v1.json",import.meta.url),"utf8"));
const HEAD="1e0cb233f4fef2be6f759c175acaa7aa7a394762";
const REPO="BlueDragon33/Bauman-master-ai-system";
const EVIDENCE_URL="https://github.com/"+REPO+"/issues/373";
const complete=(offlineClaim=false)=>{
  const input={schemaVersion:"2.0.0",repository:REPO,sourceRevision:HEAD,
    context:{offlineClaim},axes:{}};
  for(const axis of standard.axes){
    const metrics={},notApplicable={};
    for(const criterion of axis.metrics){
      if(criterion.when==="offlineClaim"&&!offlineClaim){
        notApplicable[criterion.id]="The declared product slice is local-server only; no true offline capability is claimed.";
        continue;
      }
      metrics[criterion.id]={
        value:criterion.threshold,sourceRevision:HEAD,sourceUrl:EVIDENCE_URL,
        evidenceKind:axis.id==="user_value"?"user-study":"ci",
        sampleCount:Math.max(150,criterion.minSamples),
        baselineSampleCount:Math.max(150,criterion.minBaselineSamples)};
    }
    input.axes[axis.id]={metrics,notApplicable};
  }
  return input;
};
function feedback(id,repo,axis,category="reliability-mismatch"){
  return {id,repository:repo,axis,category,revision:HEAD,date:"2026-11-23",
    evidenceUrl:"https://github.com/"+repo+"/issues/73",
    closed:false,firstAttemptFixed:false,reopened:false,regressionIntroduced:false};
}

test("standard defines TWO and only two independent 100-point axes with strict thresholds",()=>{
  assert.equal(validateStandard(standard),standard);
  assert.deepEqual(standard.axes.map(a=>a.id),["technical","user_value"]);
  assert.deepEqual(standard.axes.map(a=>a.metrics.reduce((v,m)=>v+m.weight,0)),[100,100]);
  assert.deepEqual(standard.axes.map(a=>a.threshold),[90,90]);
  assert.equal(standard.noCompositePass,true);
  assert.throws(()=>validateStandard({...standard,noCompositePass:false}),/WEAKENED_DUAL_AXIS/);
  assert.throws(()=>validateStandard({...standard,axes:[standard.axes[0]]}),/WEAKENED_DUAL_AXIS/);
});
test("both synthetic axes at threshold produce only DECLARED criteria, no review or QualityGate PASS",()=>{
  const r=assessQuality(standard,complete(),HEAD);
  assert.equal(r.technicalScore,100);assert.equal(r.userValueScore,100);
  assert.equal(r.aggregateScore,null);assert.equal(r.noCrossAxisCompensation,true);
  assert.equal(r.completion,"BOTH_AXES_DECLARED_MET_ONLY");
  assert.equal(r.canonicalQualityGate,"NOT_DECIDED_BY_SCORECARD");
  assert.equal(r.independentReviewer,"NOT_ATTESTED_BY_SCORECARD");
  assert.equal(r.productionAuthority,"NONE");
  assert.equal(r.productFullOffline,"NOT_PROVEN_BY_SCORECARD");
});
test("A green cannot compensate B failing user task success even when A is perfect",()=>{
  const x=complete();x.axes.user_value.metrics.essential_task_success_ratio.value=0.4;
  const r=assessQuality(standard,x,HEAD);
  assert.equal(r.technicalScore,100);assert.ok(r.userValueScore<90);
  assert.equal(r.completion,"BLOCKED");
  assert.ok(r.axes.user_value.blockers.includes("MANDATORY_THRESHOLD_FAILED:essential_task_success_ratio"));
});
test("B green cannot compensate A defect, inconsistency or open critical security",()=>{
  for(const metric of ["open_p0_p1_count","open_critical_security_count","state_consistency_invariant_failures"]){
    const x=complete();x.axes.technical.metrics[metric].value=1;
    const r=assessQuality(standard,x,HEAD);
    assert.equal(r.userValueScore,100);assert.equal(r.completion,"BLOCKED");
    assert.ok(r.axes.technical.blockers.includes("MANDATORY_THRESHOLD_FAILED:"+metric));
  }
});
test("even a score >=90 cannot cancel a mandatory technical or user-value failure",()=>{
  const x=complete();x.axes.technical.metrics.fault_injection_pass_ratio.value=0.9;
  const r=assessQuality(standard,x,HEAD);
  assert.ok(r.technicalScore>=90);
  assert.equal(r.completion,"BLOCKED");
  assert.ok(r.axes.technical.blockers.includes("MANDATORY_THRESHOLD_FAILED:fault_injection_pass_ratio"));
});
test("B refuses all fake user satisfaction inferred solely from CI",()=>{
  const x=complete();x.axes.user_value.metrics.essential_task_success_ratio.evidenceKind="ci";
  const r=assessQuality(standard,x,HEAD);
  assert.equal(r.completion,"BLOCKED");
  assert.ok(r.axes.user_value.blockers.includes("MISSING_INVALID_OR_NON_USER_EVIDENCE:essential_task_success_ratio"));
});
test("B requires adequate real task sample and comparable pre-change baseline",()=>{
  const x=complete();x.axes.user_value.metrics.essential_task_success_ratio.sampleCount=2;
  x.axes.user_value.metrics.measured_user_effort_improvement_pct.baselineSampleCount=1;
  const r=assessQuality(standard,x,HEAD);
  assert.ok(r.axes.user_value.blockers.includes("INSUFFICIENT_OBSERVATIONS:essential_task_success_ratio"));
  assert.ok(r.axes.user_value.blockers.includes("INSUFFICIENT_BASELINE:measured_user_effort_improvement_pct"));
  assert.equal(r.completion,"BLOCKED");
});
test("A requires actual soak/fault injection trials, not claimed century-long uptime",()=>{
  const x=complete();x.axes.technical.metrics.fault_injection_pass_ratio.sampleCount=1;
  const r=assessQuality(standard,x,HEAD);
  assert.ok(r.axes.technical.blockers.includes("INSUFFICIENT_OBSERVATIONS:fault_injection_pass_ratio"));
});
test("offline claim requires real core journey, no-local-server product proof remains separate",()=>{
  const local=assessQuality(standard,complete(false),HEAD);
  assert.equal(local.axes.technical.checks.find(x=>x.id==="offline_core_journey_pass_ratio").status,"NOT_APPLICABLE");
  const full=complete(true);delete full.axes.technical.metrics.offline_core_journey_pass_ratio;
  assert.equal(assessQuality(standard,full,HEAD).completion,"BLOCKED");
  const bogus=complete(false);bogus.axes.technical.notApplicable.offline_core_journey_pass_ratio="not tested";
  assert.ok(assessQuality(standard,bogus,HEAD).axes.technical.blockers.some(x=>x.startsWith("INVALID_NOT_APPLICABLE")));
});
test("exact SHA is mandatory and provenance cannot point to unrelated repository",()=>{
  const mismatch=assessQuality(standard,complete(),"a".repeat(40));
  assert.equal(mismatch.completion,"BLOCKED");
  assert.ok(mismatch.axes.technical.blockers.includes("SOURCE_SHA_MISMATCH"));
  assert.ok(mismatch.axes.user_value.blockers.includes("SOURCE_SHA_MISMATCH"));
  assert.throws(()=>assessQuality(standard,complete(),undefined),/MISSING_EXACT_PR_HEAD/);
  const bad=complete();bad.axes.user_value.metrics.user_problem_evidence_ratio.sourceUrl="https://github.com/BlueDragon33/RU_LIFE/issues/7";
  assert.ok(assessQuality(standard,bad,HEAD).axes.user_value.blockers.some(x=>x.startsWith("MISSING_INVALID")));
});
test("missing, forbidden N/A, unknown metric, negative defect and invalid ratio block",()=>{
  const x=complete();delete x.axes.technical.metrics.open_critical_security_count;
  assert.ok(assessQuality(standard,x,HEAD).axes.technical.blockers.includes("MISSING_INVALID_OR_NON_USER_EVIDENCE:open_critical_security_count"));
  const y=complete();y.axes.technical.notApplicable.open_critical_security_count="security does not matter here";
  assert.ok(assessQuality(standard,y,HEAD).axes.technical.blockers.includes("N_A_ON_REQUIRED_CRITERION:open_critical_security_count"));
  const z=complete();z.axes.user_value.metrics.invented_metric={value:1};
  assert.throws(()=>assessQuality(standard,z,HEAD),/UNKNOWN_METRIC/);
  const e=complete();e.axes.technical.metrics.open_p0_p1_count.value=-1;
  assert.ok(assessQuality(standard,e,HEAD).axes.technical.blockers.some(x=>x.startsWith("MISSING_INVALID")));
  const f=complete();f.axes.user_value.metrics.user_visible_error_ratio.value=1.5;
  assert.ok(assessQuality(standard,f,HEAD).axes.user_value.blockers.some(x=>x.startsWith("MISSING_INVALID")));
});
test("learning detects technical recurrence across repos but never cross-axis combines unrelated user signals",()=>{
  const events=[
    feedback("A1",REPO,"technical"),
    feedback("A2","BlueDragon33/Health_Care","technical"),
    feedback("A3","BlueDragon33/RU_LIFE","technical"),
    feedback("B1","BlueDragon33/Health_Care","user_value"),
    feedback("B2","BlueDragon33/RU_LIFE","user_value")
  ];
  const r=learnFromFeedback(standard,{schemaVersion:"2.0.0",events},"2026-11-24");
  assert.equal(r.proposedImprovements.length,1);
  assert.equal(r.proposedImprovements[0].axis,"technical");
  assert.equal(r.proposedImprovements[0].independentRepositories,3);
  assert.equal(r.proposedImprovements[0].autopatch,false);
  assert.equal(r.trainedModelWeights,false);assert.equal(r.automaticPolicyChange,false);
  assert.equal(r.separateTrends.technical.firstAttemptFix.status,"INSUFFICIENT_SAMPLE");
});
test("learning detects repeated user failures only on B axis and proposes user outcome validation",()=>{
  const events=[feedback("B1",REPO,"user_value","unhelpful-navigation"),
    feedback("B2","BlueDragon33/RU_LIFE","user_value","unhelpful-navigation"),
    feedback("B3","BlueDragon33/RU_LIFE","user_value","unhelpful-navigation")];
  const r=learnFromFeedback(standard,{schemaVersion:"2.0.0",events},"2026-11-24");
  assert.equal(r.proposedImprovements.length,1);
  assert.equal(r.proposedImprovements[0].proposal,"PROPOSE_NEW_USER_TASK_OUTCOME_TEST_AND_FOLLOWUP_STUDY");
});
test("feedback rejects bogus source, duplicates, wrong axis and future dates",()=>{
  const e=feedback("defect",REPO,"technical"),data=events=>({schemaVersion:"2.0.0",events});
  assert.throws(()=>learnFromFeedback(standard,data([e,e]),"2026-11-24"),/INVALID_FEEDBACK_EVENT/);
  assert.throws(()=>learnFromFeedback(standard,data([{...e,axis:"invented"}]),"2026-11-24"),/INVALID_FEEDBACK_EVENT/);
  assert.throws(()=>learnFromFeedback(standard,data([{...e,date:"2026-12-03"}]),"2026-11-24"),/FUTURE_DATED_FEEDBACK/);
  assert.throws(()=>learnFromFeedback(standard,data([{...e,evidenceUrl:"https://other.site/test"}]),"2026-11-24"),/INVALID_FEEDBACK_EVENT/);
});
test("canonical Hub #159 feedback parser preserves axis and source-bound metadata, always advisory",async()=>{
  const e=feedback("f1","BlueDragon33/RU_LIFE","technical");
  const marker="<!-- BLUEPRINT_QUALITY_FEEDBACK_V1\n"+JSON.stringify(e)+"\n-->";
  const comments=[{id:312,body:"Observed in real project\n"+marker}];
  const parsed=extractLedgerEvents(comments);
  assert.equal(parsed.schemaVersion,"2.0.0");
  assert.equal(parsed.events[0].axis,"technical");
  assert.equal(parsed.events[0].ledgerCommentId,312);
  const mock=async(url,opts)=>{
    assert.match(url,/Software-Blueprint-Hub\/issues\/159\/comments/);
    assert.equal(opts.method,"GET");
    return {ok:true,status:200,json:async()=>comments};
  };
  const read=await readCanonicalFeedback(mock);
  assert.equal(read.events[0].axis,"technical");
  const summary=await summarizeCanonicalFeedback({fetchImpl:mock,asOf:"2026-11-24"});
  assert.equal(summary.reviewAndReleaseStatus,"NOT_AUTHORIZED");
  assert.equal(summary.sourceAuthenticatedForReview,false);
  assert.equal(summary.trainedModelWeights,false);
});
test("canonical feedback malformed marker or JSON fails closed",()=>{
  assert.throws(()=>extractLedgerEvents([{id:1,body:"<!-- BLUEPRINT_QUALITY_FEEDBACK_V1 wrong -->"}]),/MALFORMED_FEEDBACK_MARKER/);
  assert.throws(()=>extractLedgerEvents([{id:1,body:"<!-- BLUEPRINT_QUALITY_FEEDBACK_V1\nnot-json\n-->"}]),/UNPARSEABLE_FEEDBACK_JSON/);
});
test("CLI requires explicit exact SHA and emits separate A/B not combined PASS",()=>{
  const dir=mkdtempSync(join(tmpdir(),"blueprint-dual-"));const file=join(dir,"evidence.json");
  try{
    writeFileSync(file,JSON.stringify(complete()));
    const cli=fileURLToPath(new URL("../../scripts/evaluate-quality-evidence.mjs",import.meta.url));
    const yes=spawnSync(process.execPath,[cli,"assess",file,"--expected-sha",HEAD],{encoding:"utf8"});
    assert.equal(yes.status,0,yes.stderr);
    const r=JSON.parse(yes.stdout);assert.equal(r.aggregateScore,null);
    assert.deepEqual(Object.keys(r.axes).sort(),["technical","user_value"]);
    const no=spawnSync(process.execPath,[cli,"assess",file],{encoding:"utf8",env:{...process.env,GITHUB_PR_HEAD_SHA:""}});
    assert.equal(no.status,2);assert.match(no.stderr,/MISSING_EXACT_PR_HEAD/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
