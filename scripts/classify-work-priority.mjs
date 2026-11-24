#!/usr/bin/env node
// Non-authoritative triage of engineering work. "P0" in an MVP phase is NOT
// necessarily a live severity-zero incident. No auto approval or release.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const SHA=/^[0-9a-f]{40}$/;
const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const severe=new Set(["critical-user-journey-unavailable","confirmed-data-loss",
  "confirmed-authorization-bypass","confirmed-sensitive-data-exposure",
  "production-integrity-corruption"]);
const impactSet=new Set([...severe,"cosmetic","quality-ci-failure",
  "release-readback-stale","unknown","single-user-degradation"]);
function bad(why){throw new Error("PRIORITY_TRIAGE_BLOCKED:"+why);}
function sourceUrlIsSameRepo(url,repository) {
  return typeof url==="string"&&
    /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(?:issues\/[0-9]+|pull\/[0-9]+|actions\/runs\/[0-9]+)(?:\/.*)?$/.test(url) &&
    url.startsWith("https://github.com/"+repository+"/");
}
export function triageWork(input,expectedSha){
  if(!input||typeof input!=="object"||Array.isArray(input)||
    !REPO.test(input.repository||"")||!SHA.test(input.sourceRevision||"")||
    !SHA.test(expectedSha||"")||typeof input.kind!=="string"||
    !["incident","milestone","compliance","release-drift","investigation"].includes(input.kind)||
    !["P0","P1","P2","UNCLASSIFIED"].includes(input.declaredPriority)||
    !impactSet.has(input.observedImpact)||
    !["reproduced","observed-only","not-run"].includes(input.reproduction)||
    typeof input.sourcePatchMerged!=="boolean"||
    typeof input.runtimeRetested!=="boolean"||
    !sourceUrlIsSameRepo(input.evidenceUrl,input.repository))
    bad("INVALID_OR_UNTRACEABLE_INPUT");
  const blockers=[];
  if(input.sourceRevision!==expectedSha)blockers.push("STALE_CANDIDATE_SHA");
  if(input.runtimeRetested && input.reproduction==="not-run")bad("CONTRADICTORY_RUNTIME_EVIDENCE");
  if(input.sourcePatchMerged && !input.runtimeRetested)
    blockers.push("MERGED_SOURCE_IS_NOT_RUNTIME_ACCEPTANCE");
  let disposition,priorityBand;
  if(input.kind==="milestone"){
    disposition="P0_MVP_PHASE_NOT_INCIDENT";
    priorityBand=3;
    if(input.declaredPriority!=="P0")disposition="FEATURE_MILESTONE";
  }else if(input.kind==="compliance"){
    disposition="COMPLIANCE_FAILURE_NEEDS_IMPACT_CLASSIFICATION";
    priorityBand=3;
  }else if(input.kind==="release-drift"){
    disposition="RELEASE_DRIFT_REQUIRES_PUBLISHED_SHA_READBACK";
    priorityBand=2;
    if(input.observedImpact==="critical-user-journey-unavailable"){
      disposition="P0_INCIDENT_CANDIDATE_REQUIRES_RUNTIME_ATTESTATION";priorityBand=0;
    }
  }else if(input.kind==="investigation"){
    disposition="IMPACT_UNVERIFIED_INVESTIGATION";
    priorityBand=2;
  }else if(input.declaredPriority==="P0" &&
    severe.has(input.observedImpact) &&
    input.reproduction==="reproduced"){
    disposition="P0_INCIDENT_CANDIDATE_REQUIRES_RUNTIME_ATTESTATION";
    priorityBand=0;
  }else if(input.declaredPriority==="P0"){
    disposition="P0_CLAIM_NEEDS_CRITICAL_IMPACT_REPRODUCTION";
    priorityBand=1;
  }else{
    disposition="PRIORITY_"+input.declaredPriority+"_REQUIRES_SCOPE_QA";
    priorityBand=input.declaredPriority==="P1"?2:3;
  }
  // This pure function validates declared metadata, not truth of linked GitHub
  // content. Only human/independent runtime evidence can close an incident.
  if(input.kind==="incident" && input.declaredPriority==="P0" && !input.runtimeRetested)
    blockers.push("RUNTIME_RETEST_REQUIRED_BEFORE_P0_CLOSE");
  return {
    repository:input.repository,sourceRevision:input.sourceRevision,
    expectedSha,declaredPriority:input.declaredPriority,kind:input.kind,
    observedImpact:input.observedImpact,disposition,priorityBand,blockers,
    sourceEvidence:"POINTER_ONLY_NOT_FETCH_VERIFIED",
    technicalA:"NEEDS_SCOPED_EVIDENCE",
    userValueB:"NEEDS_REAL_USER_OUTCOME_EVIDENCE",
    incidentClosedByThisTool:false,canonicalQualityGate:"UNCHANGED",
    productionAuthority:"NONE"
  };
}
function main(args) {
  const [path,sha]=args;
  if(!path||!sha)bad("USAGE: node scripts/classify-work-priority.mjs evidence.json EXACT_40_CHAR_HEAD");
  const input=JSON.parse(readFileSync(path,"utf8"));
  const out=Array.isArray(input)?input.map(x=>triageWork(x,sha)):triageWork(input,sha);
  process.stdout.write(JSON.stringify(out,null,2)+"\n");
  if((Array.isArray(out)?out:[out]).some(x=>x.blockers.includes("STALE_CANDIDATE_SHA")))
    process.exitCode=2;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  try{main(process.argv.slice(2));}
  catch(e){process.stderr.write(String(e.message||e)+"\n");process.exitCode=2;}
}
