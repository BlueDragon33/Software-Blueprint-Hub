import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assessQuality, learnFromFeedback, validateStandard } from "../../scripts/evaluate-quality-evidence.mjs";
import { extractLedgerEvents, readCanonicalFeedback, summarizeCanonicalFeedback } from "../../scripts/collect-quality-feedback-from-github.mjs";

const policy = JSON.parse(readFileSync(new URL("../../control/quality-evaluation-standard.v1.json", import.meta.url),"utf8"));
const HEAD = "1e0cb233f4fef2be6f759c175acaa7aa7a394762";
const RUN_URL = "https://github.com/BlueDragon33/Bauman-master-ai-system/actions/runs/45270742013";
const sampleValues = {
  traceable_evidence_ratio:1, required_ci_pass_ratio:1, p0_p1_open_count:0,
  critical_security_open_count:0, regression_failure_count:0,
  new_duplicate_logic_count:0, uncaught_browser_errors:0,
  critical_journey_pass_ratio:1, critical_a11y_findings:0,
  p95_latency_regression_pct:3, offline_cold_start_pass_ratio:1,
  local_save_restart_restore_pass_ratio:1, rollback_recovery_pass_ratio:1
};
function example(scope="browser_local") {
  const features = { browser:true, performance:false, offlineFull:false,
    persistence:false, releaseCandidate:false };
  if (scope==="source") features.browser=false;
  if (scope==="offline_full") {features.offlineFull=true;features.persistence=true;}
  if (scope==="release_candidate") features.releaseCandidate=true;
  const input={schemaVersion:"1.0.0",repository:"BlueDragon33/Bauman-master-ai-system",
    scope,sourceRevision:HEAD,features,metrics:{},notApplicable:{}};
  for (const m of policy.metrics) {
    if (m.when!=="always" && !features[m.when]) {
      input.notApplicable[m.id]="Out of the declared "+scope+" technical test scope; no PASS claimed.";
      continue;
    }
    input.metrics[m.id]={value:sampleValues[m.id],sourceRevision:HEAD,
      sourceUrl:RUN_URL,evidenceKind:"ci",sampleCount:10,baselineSampleCount:10};
  }
  return input;
}
function event(id,repository,category="hidden-browser-error",date="2026-11-22") {
  return {id,repository,revision:HEAD,category,date,evidenceUrl:"https://github.com/"+repository+"/issues/159",
    closed:true,firstAttemptFixed:true,reopened:false,regressionIntroduced:false};
}
test("rubric is versioned 100 points and cannot silently loosen core gate constraints",()=>{
  assert.equal(validateStandard(policy),policy);
  assert.equal(policy.metrics.length,13);
  assert.equal(policy.metrics.reduce((n,m)=>n+m.weight,0),100);
  assert.throws(()=>validateStandard({...policy,scoreIsNotReviewOrReleaseAuthorization:false}),/UNAUTHORIZED_STANDARD_WEAKENING/);
  assert.throws(()=>validateStandard({...policy,metrics:policy.metrics.map(m=>({...m,weight:1}))}),/UNAUTHORIZED_STANDARD_WEAKENING/);
});
test("all scoped browser evidence yields only declared score, never release or reviewer approval",()=>{
  const result=assessQuality(policy,example(),HEAD);
  assert.equal(result.score,100);
  assert.equal(result.technicalCriteria,"SELF_REPORTED_CRITERIA_MET");
  assert.equal(result.blockers.length,0);
  assert.equal(result.independentReviewer,"NOT_ATTESTED_BY_THIS_TOOL");
  assert.equal(result.canonicalQualityGate,"UNASSESSED_BY_THIS_TOOL");
  assert.equal(result.productionAuthority,"NONE");
  assert.equal(result.fullOfflineAcceptance,"UNVERIFIED");
});
test("critical a11y failure blocks even when overall numeric score remains above 90",()=>{
  const input=example();input.metrics.critical_a11y_findings.value=1;
  const r=assessQuality(policy,input,HEAD);
  assert.ok(r.score>=90);
  assert.equal(r.technicalCriteria,"BLOCKED");
  assert.ok(r.blockers.includes("HARD_THRESHOLD_FAILED:critical_a11y_findings"));
});
test("wrong expected PR source SHA cannot be scored as verified",()=>{
  const r=assessQuality(policy,example(),"e".repeat(40));
  assert.ok(r.blockers.includes("SOURCE_SHA_MISMATCH"));
  assert.equal(r.technicalCriteria,"BLOCKED");
  assert.throws(()=>assessQuality(policy,example(),undefined),/MISSING_EXACT_SHA/);
});
test("N/A must be justified, feature declared and all identifiers known",()=>{
  const a=example();delete a.notApplicable.offline_cold_start_pass_ratio;
  assert.ok(assessQuality(policy,a,HEAD).blockers.includes("UNJUSTIFIED_NA:offline_cold_start_pass_ratio"));
  const b=example();b.features.browser=false;
  assert.throws(()=>assessQuality(policy,b,HEAD),/UNSAFE_SCOPE_DOWNGRADE/);
  const c=example();c.metrics.made_up_perfect_check={value:1};
  assert.throws(()=>assessQuality(policy,c,HEAD),/UNKNOWN_METRIC_ID/);
  const d=example();d.metrics.uncaught_browser_errors.sourceRevision="e".repeat(40);
  assert.ok(assessQuality(policy,d,HEAD).blockers.includes("MISSING_OR_UNTRACEABLE_EVIDENCE:uncaught_browser_errors"));
});
test("full offline scope cannot be obtained by passing localhost-only browser tests",()=>{
  const a=example();a.scope="offline_full";
  assert.throws(()=>assessQuality(policy,a,HEAD),/UNSAFE_SCOPE_DOWNGRADE/);
  const b=example("offline_full");
  delete b.metrics.offline_cold_start_pass_ratio;
  delete b.metrics.local_save_restart_restore_pass_ratio;
  const r=assessQuality(policy,b,HEAD);
  assert.equal(r.technicalCriteria,"BLOCKED");
  assert.deepEqual(r.blockers.filter(x=>x.startsWith("MISSING_OR_UNTRACEABLE_EVIDENCE:")).sort(),
    ["MISSING_OR_UNTRACEABLE_EVIDENCE:local_save_restart_restore_pass_ratio",
     "MISSING_OR_UNTRACEABLE_EVIDENCE:offline_cold_start_pass_ratio"]);
});
test("performance regression requires comparable samples in both periods",()=>{
  const a=example();a.features.performance=true;
  delete a.notApplicable.p95_latency_regression_pct;
  a.metrics.p95_latency_regression_pct={value:8,sourceRevision:HEAD,sourceUrl:RUN_URL,evidenceKind:"measurement",
    sampleCount:10,baselineSampleCount:1};
  const r=assessQuality(policy,a,HEAD);
  assert.ok(r.blockers.includes("INSUFFICIENT_COMPARABLE_SAMPLES:p95_latency_regression_pct"));
});
test("missing, invalid ratios, and unsupported authority evidence always fail closed",()=>{
  const a=example();a.metrics.required_ci_pass_ratio.value=0.75;
  assert.equal(assessQuality(policy,a,HEAD).technicalCriteria,"BLOCKED");
  const b=example();b.metrics.critical_journey_pass_ratio.value=1.5;
  assert.ok(assessQuality(policy,b,HEAD).blockers.includes("RATIO_OUT_OF_RANGE:critical_journey_pass_ratio"));
  const c=example();c.metrics.uncaught_browser_errors.sourceUrl="http://localhost/fake";
  assert.equal(assessQuality(policy,c,HEAD).technicalCriteria,"BLOCKED");
  const d=example();d.notApplicable.critical_security_open_count="I do not feel like security";
  assert.ok(assessQuality(policy,d,HEAD).blockers.includes("N_A_ON_REQUIRED_METRIC:critical_security_open_count"));
});
test("cross-project repeated defect proposes tests but never self-trains weights or grants approvals",()=>{
  const data={schemaVersion:"1.0.0",events:[
    event("C1","BlueDragon33/Bauman-master-ai-system"),
    event("C2","BlueDragon33/RU_LIFE"),
    event("C3","BlueDragon33/Bauman-master-ai-system")
  ]};
  const r=learnFromFeedback(policy,data,"2026-11-24");
  assert.equal(r.proposedImprovements.length,1);
  assert.equal(r.proposedImprovements[0].distinctProjects,2);
  assert.equal(r.proposedImprovements[0].approval,"REVIEW_REQUIRED");
  assert.equal(r.proposedImprovements[0].autopatch,false);
  assert.equal(r.automaticTraining,false);
  assert.equal(r.qualityThresholdModified,false);
  assert.equal(r.trend.firstAttemptFixPct.state,"INSUFFICIENT_SAMPLE");
  const one={...data,events:data.events.map(x=>({...x,repository:"BlueDragon33/RU_LIFE",evidenceUrl:"https://github.com/BlueDragon33/RU_LIFE/issues/159"}))};
  assert.deepEqual(learnFromFeedback(policy,one,"2026-11-24").proposedImprovements,[]);
});
test("feedback is append-only in intent: reject duplicates, future timestamps and invented source",()=>{
  const a=event("repeat","BlueDragon33/Bauman-master-ai-system");
  assert.throws(()=>learnFromFeedback(policy,{schemaVersion:"1.0.0",events:[a,a]},"2026-11-24"),/INVALID_FEEDBACK_EVENT/);
  assert.throws(()=>learnFromFeedback(policy,{schemaVersion:"1.0.0",events:[{...a,date:"2026-12-03"}]},"2026-11-24"),/FUTURE_DATED_FEEDBACK/);
  assert.throws(()=>learnFromFeedback(policy,{schemaVersion:"1.0.0",events:[{...a,evidenceUrl:"https://example.com/a"}]},"2026-11-24"),/INVALID_FEEDBACK_EVENT/);
});
test("measured historical trends are distinguished from insufficient samples",()=>{
  const events=Array.from({length:30},(_,i)=>({
    ...event("e-"+i,i%2?"BlueDragon33/Health_Care":"BlueDragon33/Application-Management","regression-guard"),
    firstAttemptFixed:i<27,reopened:i===28,regressionIntroduced:i===29
  }));
  const r=learnFromFeedback(policy,{schemaVersion:"1.0.0",events},"2026-11-24");
  assert.equal(r.trend.firstAttemptFixPct.pct,90);
  assert.equal(r.trend.reopenedIssuePct.pct,3.33);
  assert.equal(r.trend.regressionsPer100ClosedChanges.pct,3.33);
  assert.equal(r.proposedImprovements[0].approval,"REVIEW_REQUIRED");
});
test("actual CLI mode rejects unpinned SHA and works with explicit source head",()=>{
  const temp=mkdtempSync(join(tmpdir(),"blueprint-quality-"));
  const file=join(temp,"evidence.json");
  const cli=fileURLToPath(new URL("../../scripts/evaluate-quality-evidence.mjs",import.meta.url));
  try{
    writeFileSync(file,JSON.stringify(example()));
    const yes=spawnSync(process.execPath,[cli,"assess",file,"--expected-sha",HEAD],{encoding:"utf8"});
    assert.equal(yes.status,0,yes.stderr);
    assert.equal(JSON.parse(yes.stdout).technicalCriteria,"SELF_REPORTED_CRITERIA_MET");
    const no=spawnSync(process.execPath,[cli,"assess",file],{encoding:"utf8",env:{...process.env,GITHUB_PR_HEAD_SHA:""}});
    assert.equal(no.status,2);
    assert.match(no.stderr,/MISSING_EXACT_SHA/);
  }finally{rmSync(temp,{recursive:true,force:true});}
});

test("negative browser errors or accessibility findings cannot game threshold",()=>{
  const x=example();x.metrics.uncaught_browser_errors.value=-1;
  assert.ok(assessQuality(policy,x,HEAD).blockers.includes("COUNT_OUT_OF_RANGE:uncaught_browser_errors"));
  const y=example();y.metrics.critical_a11y_findings.value=-10;
  assert.ok(assessQuality(policy,y,HEAD).blockers.includes("COUNT_OUT_OF_RANGE:critical_a11y_findings"));
});
test("canonical Hub issue comments are parsed read-only, never scored as approver",async()=>{
  const rawEvent=event("defect-one","BlueDragon33/RU_LIFE");
  const marker="<!-- BLUEPRINT_QUALITY_FEEDBACK_V1\n"+JSON.stringify(rawEvent)+"\n-->";
  const issueComment={id:123,body:"Reproduced defect (DRAFT)\n"+marker};
  const feedback=extractLedgerEvents([issueComment]);
  assert.equal(feedback.events.length,1);
  assert.equal(feedback.events[0].ledgerIssue,159);
  assert.equal(feedback.events[0].ledgerCommentId,123);
  const mock=async(url,opts)=>{
    assert.match(url,/Software-Blueprint-Hub\/issues\/159\/comments/);
    assert.equal(opts.method,"GET");
    return {ok:true,status:200,json:async()=>[issueComment]};
  };
  const fetched=await readCanonicalFeedback(mock);
  assert.equal(fetched.events[0].id,"defect-one");
  const summary=await summarizeCanonicalFeedback({fetchImpl:mock,asOf:"2026-11-24"});
  assert.equal(summary.automaticTraining,false);
  assert.equal(summary.sourceAuthenticatedForReview,false);
  assert.equal(summary.reviewAndReleaseStatus,"NOT_AUTHORIZED");
});
test("malformed or unparseable feedback markers block rather than silently disappearing",()=>{
  assert.throws(()=>extractLedgerEvents([{id:123,body:"<!-- BLUEPRINT_QUALITY_FEEDBACK_V1 broken -->"}]),/MALFORMED_FEEDBACK_MARKER/);
  assert.throws(()=>extractLedgerEvents([{id:123,body:"<!-- BLUEPRINT_QUALITY_FEEDBACK_V1\nnot json\n-->"}]),/UNPARSEABLE_FEEDBACK_JSON/);
});
