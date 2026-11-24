#!/usr/bin/env node
// Blueprint OS two-axis evaluator. Evidence pointers are declared, NOT independently attested.
// Neither this score nor a green CI run is independent human review / canonical gate / release.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const policyPath=fileURLToPath(new URL("../control/quality-evaluation-standard.v1.json",import.meta.url));
const SHA=/^[a-f0-9]{40}$/;
const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const AXES=["technical","user_value"];
const TECH_KINDS=new Set(["ci","test","artifact","measurement","incident","field-observation"]);
const USER_KINDS=new Set(["user-study","field-observation","structured-user-feedback"]);
const record=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const round=x=>Math.round(x*100)/100;
const bad=x=>{throw new Error(x);};
const validLink=(url,repo)=>typeof url==="string" && typeof repo==="string" &&
  url.startsWith("https://github.com/"+repo+"/") &&
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(?:issues\/[0-9]+|pull\/[0-9]+|actions\/runs\/[0-9]+)(?:\/.*)?$/.test(url);

export function validateStandard(p){
  if(!record(p)||p.schemaVersion!=="2.0.0"||
    p.standardId!=="blueprint-two-independent-evaluation-axes-v1"||
    p.noCompositePass!==true||p.candidateThresholdPerAxis!==90||
    !Array.isArray(p.axes)||p.axes.length!==2||
    p.axes.map(x=>x.id).join(",")!==AXES.join(",")||
    p.hardBoundaries?.noCrossAxisCompensation!==true||
    p.hardBoundaries?.noScoreImpliedCanonicalQualityGate!==true||
    p.hardBoundaries?.noScoreImpliedMergeRatificationOrProduction!==true||
    p.hardBoundaries?.noUserScoreFromCIAlone!==true||
    p.feedbackLearning?.doNotAutoReweight!==true||
    p.feedbackLearning?.doNotAutoPatch!==true||
    p.feedbackLearning?.doNotRetrainModelWeights!==true)bad("INVALID_OR_WEAKENED_DUAL_AXIS_STANDARD");
  const seen=new Set();
  for(const axis of p.axes){
    if(axis.threshold!==90||axis.scoreWeightTotal!==100||!Array.isArray(axis.metrics))bad("INVALID_AXIS_THRESHOLD");
    let total=0;
    for(const m of axis.metrics){
      if(!record(m)||!/^[a-z][a-z0-9_]+$/.test(m.id)||seen.has(m.id)||
        !Number.isInteger(m.weight)||m.weight<1||m.weight>100||
        !["min","max"].includes(m.op)||!Number.isFinite(m.threshold)||
        !["always","offlineClaim"].includes(m.when)||typeof m.critical!=="boolean"||
        !["source","user"].includes(m.evidence)||
        (axis.id==="user_value"&&m.evidence!=="user")||
        (axis.id==="technical"&&m.evidence!=="source")||
        !Number.isInteger(m.minSamples)||m.minSamples<0||
        !Number.isInteger(m.minBaselineSamples)||m.minBaselineSamples<0)bad("INVALID_AXIS_METRIC");
      seen.add(m.id);total+=m.weight;
    }
    if(total!==100)bad("WEIGHTS_NOT_100_PER_AXIS");
  }
  return p;
}
function checkInput(input,expectedSha,p){
  if(!record(input)||input.schemaVersion!=="2.0.0"||!REPO.test(input.repository||"")||
    !SHA.test(input.sourceRevision||"")||!SHA.test(expectedSha||"")||
    !record(input.context)||typeof input.context.offlineClaim!=="boolean"||
    !record(input.axes)||Object.keys(input.axes).sort().join(",")!==AXES.slice().sort().join(",")){
    bad("INVALID_ASSESSMENT_OR_MISSING_EXACT_PR_HEAD");
  }
  for(const axis of p.axes){
    const a=input.axes[axis.id];
    if(!record(a)||!record(a.metrics)||!record(a.notApplicable))bad("MISSING_AXIS_EVIDENCE:"+axis.id);
    const ids=new Set(axis.metrics.map(x=>x.id));
    if([...Object.keys(a.metrics),...Object.keys(a.notApplicable)].some(id=>!ids.has(id)))bad("UNKNOWN_METRIC:"+axis.id);
  }
}
function checkNumeric(m,value){
  if(m.id.endsWith("_ratio"))return value>=0&&value<=1;
  if(m.id.endsWith("_count")||m.id.endsWith("_failures"))return Number.isInteger(value)&&value>=0;
  if(m.id.endsWith("_pct"))return value>=-100&&value<=1000;
  return Number.isFinite(value);
}
function assessAxis(axis,payload,root,expectedSha){
  const blockers=[],checks=[];
  let applicableWeight=0,passedWeight=0;
  for(const m of axis.metrics){
    const applicable=m.when==="always"||root.context[m.when]===true;
    const item=payload.metrics[m.id],na=payload.notApplicable[m.id];
    if(!applicable){
      if(item!==undefined||typeof na!=="string"||na.trim().length<20){
        blockers.push("INVALID_NOT_APPLICABLE:"+m.id);
        checks.push({id:m.id,status:"UNJUSTIFIED_NA"});
      }else checks.push({id:m.id,status:"NOT_APPLICABLE",reason:na.trim()});
      continue;
    }
    applicableWeight+=m.weight;
    if(na!==undefined)blockers.push("N_A_ON_REQUIRED_CRITERION:"+m.id);
    if(!record(item)||!Number.isFinite(item.value)||!checkNumeric(m,item.value)||
      item.sourceRevision!==root.sourceRevision||
      !validLink(item.sourceUrl,root.repository)||
      !(m.evidence==="user"?USER_KINDS:TECH_KINDS).has(item.evidenceKind)){
      blockers.push("MISSING_INVALID_OR_NON_USER_EVIDENCE:"+m.id);
      checks.push({id:m.id,status:"EVIDENCE_BLOCKED"});
      continue;
    }
    if(m.minSamples>0&&(!Number.isInteger(item.sampleCount)||item.sampleCount<m.minSamples)){
      blockers.push("INSUFFICIENT_OBSERVATIONS:"+m.id);
      checks.push({id:m.id,status:"SAMPLE_BLOCKED"});
      continue;
    }
    if(m.minBaselineSamples>0&&
      (!Number.isInteger(item.baselineSampleCount)||item.baselineSampleCount<m.minBaselineSamples)){
      blockers.push("INSUFFICIENT_BASELINE:"+m.id);
      checks.push({id:m.id,status:"BASELINE_BLOCKED"});
      continue;
    }
    const ok=m.op==="min"?item.value>=m.threshold:item.value<=m.threshold;
    if(ok)passedWeight+=m.weight;
    else if(m.critical)blockers.push("MANDATORY_THRESHOLD_FAILED:"+m.id);
    checks.push({id:m.id,status:ok?"DECLARED_THRESHOLD_MET":"THRESHOLD_FAILED",
      value:item.value,threshold:m.op+":"+m.threshold,
      sourceRevision:item.sourceRevision,sourceUrl:item.sourceUrl,
      sampleCount:item.sampleCount??null});
  }
  const score=applicableWeight?round(passedWeight*100/applicableWeight):0;
  if(score<axis.threshold)blockers.push("AXIS_SCORE_BELOW_90");
  if(expectedSha!==root.sourceRevision)blockers.push("SOURCE_SHA_MISMATCH");
  return {id:axis.id,score,applicableWeight,checks,
    blockers:[...new Set(blockers)],
    status:blockers.length?"BLOCKED":"DECLARED_MET_NOT_INDEPENDENTLY_VERIFIED"};
}
export function assessQuality(standard,input,expectedSha){
  validateStandard(standard);checkInput(input,expectedSha,standard);
  const axes={};
  for(const a of standard.axes)axes[a.id]=assessAxis(a,input.axes[a.id],input,expectedSha);
  const both=AXES.every(k=>axes[k].blockers.length===0);
  return {standardId:standard.standardId,repository:input.repository,
    sourceRevision:input.sourceRevision,expectedSha,
    axes,technicalScore:axes.technical.score,userValueScore:axes.user_value.score,
    aggregateScore:null,noCrossAxisCompensation:true,
    completion:both?"BOTH_AXES_DECLARED_MET_ONLY":"BLOCKED",
    evidenceVerification:"POINTERS_AND_VALUES_NOT_INDEPENDENTLY_VERIFIED",
    independentReviewer:"NOT_ATTESTED_BY_SCORECARD",
    canonicalQualityGate:"NOT_DECIDED_BY_SCORECARD",
    productFullOffline:"NOT_PROVEN_BY_SCORECARD",
    productionAuthority:"NONE"};
}
export function learnFromFeedback(standard,input,asOf){
  validateStandard(standard);
  if(!record(input)||input.schemaVersion!=="2.0.0"||!Array.isArray(input.events)||
    typeof asOf!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(asOf)||
    !Number.isFinite(Date.parse(asOf+"T00:00:00Z")))bad("INVALID_FEEDBACK_REQUEST");
  const limit=Date.parse(asOf+"T23:59:59Z");
  const minTime=limit-standard.feedbackLearning.windowDays*86400000;
  const known=new Set(),events=[];
  for(const e of input.events){
    if(!record(e)||typeof e.id!=="string"||!/^[A-Za-z0-9_.:-]+$/.test(e.id)||
      known.has(e.id)||!AXES.includes(e.axis)||!REPO.test(e.repository||"")||
      !SHA.test(e.revision||"")||typeof e.category!=="string"||
      !/^[a-z][a-z0-9_-]+$/.test(e.category)||
      !/^\d{4}-\d{2}-\d{2}$/.test(e.date||"")||
      !Number.isFinite(Date.parse(e.date+"T00:00:00Z"))||
      !validLink(e.evidenceUrl,e.repository)||
      typeof e.closed!=="boolean"||typeof e.firstAttemptFixed!=="boolean"||
      typeof e.reopened!=="boolean"||typeof e.regressionIntroduced!=="boolean"||
      (e.firstAttemptFixed&&!e.closed)||(e.reopened&&!e.closed))bad("INVALID_FEEDBACK_EVENT");
    known.add(e.id);
    const time=Date.parse(e.date+"T00:00:00Z");
    if(time>limit)bad("FUTURE_DATED_FEEDBACK");
    if(time>=minTime)events.push(e);
  }
  const proposedImprovements=[],separateTrends={};
  const pct=(num,den,min)=>den<min?
    {status:"INSUFFICIENT_SAMPLE",numerator:num,denominator:den,minRequired:min}:
    {status:"OBSERVED",numerator:num,denominator:den,pct:round(100*num/den)};
  for(const axis of AXES){
    const subset=events.filter(e=>e.axis===axis),closed=subset.filter(e=>e.closed);
    separateTrends[axis]={
      observations:subset.length,closed:closed.length,
      firstAttemptFix:pct(closed.filter(e=>e.firstAttemptFixed).length,closed.length,standard.feedbackLearning.minClosedSample),
      reopened:pct(closed.filter(e=>e.reopened).length,closed.length,standard.feedbackLearning.minClosedSample),
      introducedRegression:pct(closed.filter(e=>e.regressionIntroduced).length,closed.length,standard.feedbackLearning.minClosedSample)
    };
    const groups=new Map();
    for(const e of subset)groups.set(e.category,[...(groups.get(e.category)||[]),e]);
    for(const [category,observations] of groups){
      const repos=[...new Set(observations.map(e=>e.repository))];
      if(observations.length<standard.feedbackLearning.recurrenceMinimum||
        repos.length<standard.feedbackLearning.distinctRepositoriesMinimum)continue;
      proposedImprovements.push({axis,category,observations:observations.length,
        independentRepositories:repos.length,
        evidence:observations.map(e=>({id:e.id,repository:e.repository,
          revision:e.revision,sourceUrl:e.evidenceUrl})),
        proposal:axis==="technical"?
          "PROPOSE_CAUSAL_REGRESSION_TEST_AND_ARCHITECTURE_INVARIANT":
          "PROPOSE_NEW_USER_TASK_OUTCOME_TEST_AND_FOLLOWUP_STUDY",
        action:"REVIEW_PROPOSAL_ONLY",autopatch:false,automaticThresholdUpdate:false});
    }
  }
  return {standardId:standard.standardId,asOf,
    windowDays:standard.feedbackLearning.windowDays,
    eventsAccepted:events.length,separateTrends,proposedImprovements,
    trainedModelWeights:false,automaticPolicyChange:false,
    canonicalQualityGate:"UNCHANGED",releaseAuthority:"NONE"};
}
function flag(args,name){
  const i=args.indexOf(name);return i<0?undefined:args[i+1];
}
function main(argv){
  const [mode,filename]=argv;
  if(!["assess","learn"].includes(mode)||!filename)bad("USAGE: assess file --expected-sha SHA | learn file --at YYYY-MM-DD");
  const standard=validateStandard(JSON.parse(readFileSync(policyPath,"utf8")));
  const payload=JSON.parse(readFileSync(filename,"utf8"));
  const result=mode==="assess"?
    assessQuality(standard,payload,flag(argv,"--expected-sha")||process.env.GITHUB_PR_HEAD_SHA):
    learnFromFeedback(standard,payload,flag(argv,"--at"));
  process.stdout.write(JSON.stringify(result,null,2)+"\n");
  if(mode==="assess"&&result.completion==="BLOCKED")process.exitCode=2;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{main(process.argv.slice(2));}
  catch(error){process.stderr.write("QUALITY_DUAL_AXIS_BLOCKED: "+error.message+"\n");process.exitCode=2;}
}
