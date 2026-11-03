#!/usr/bin/env node
/**
 * Publication readiness. An UNTRUSTED read-only projection. Never publishes,
 * ratifies, issues keys, grants rights, or substitutes for constitutional state.
 */
import {writeFileSync,mkdirSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {pathToFileURL} from "node:url";
const SHA=/^[a-f0-9]{40}$/;
const ROOT="BlueDragon33/Software-Blueprint-Hub";
const QA="BlueDragon33/Software-Blueprint-QA-Worker";
const failures=reason=>Object.freeze({state:"BLOCKED",reason});
const isObject=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
const requireId=(p)=>isObject(p)&&Number.isInteger(p.number)&&
 p.number>0&&typeof p.head?.sha==="string"&&SHA.test(p.head.sha);
function latestReviewDecision(pr,reviews){
 const good=(Array.isArray(reviews)?reviews:[])
  .filter(r=>r&&r.state==="APPROVED"&&r.commit_id===pr.head.sha&&
    typeof r.user?.login==="string"&&r.user.login!==pr.user?.login);
 return {approved:good.length>0,reviewers:good.map(x=>x.user.login)};
}
/**
 * Never infer a release from CI, comments, Owner chat text, signed synthetic
 * QA, GitHub branch settings, a green manual workflow, or candidate patch.
 */
export function evaluateConstitution14PublicationReadiness(data){
 if(!isObject(data)||!isObject(data.pullRequests)||!isObject(data.main)||
    !isObject(data.proofs))return failures("INVALID_TRUSTED_CHECKPOINT");
 const checks=[];
 const block=(id,reason)=>checks.push(Object.freeze({id,status:"BLOCKED",reason}));
 const pass=(id)=>checks.push(Object.freeze({id,status:"OBSERVED",reason:""}));
 const main=data.main;
 if(main.version==="1.3.0"&&SHA.test(main.sha))pass("active-baseline-1.3.0");
 else block("active-baseline-1.3.0","Main active version/HEAD was not verified as 1.3.0");
 for(const [key,n] of [["hub-base",152],["hub-action",153],["hub-review-contract",154],["worker-reviewer",5]]){
  const pr=data.pullRequests[key];
  if(!requireId(pr)||pr.number!==n||!pr.head.repo?.full_name||
   pr.head.repo.full_name!==(key==="worker-reviewer"?QA:ROOT)){
    block("source-"+key,"PR source/identity unavailable");continue;
  }
  if(pr.draft||pr.state!=="open"||pr.merged===true)
    block("ready-for-review-"+key, "Exact PR remains Draft/closed/merged without verified readiness");
  else pass("ready-for-review-"+key);
  const decision=latestReviewDecision(pr,data.reviews?.[key]);
  if(!decision.approved)
   block("independent-human-review-"+key,"No distinct exact-head submitted APPROVED review");
  else pass("independent-human-review-"+key);
 }
 // A protection badge alone is not sufficient: official enforced protection
 // must be independently observed. Unknown settings fail closed.
 if(data.main.protected!==true)
  block("main-branch-enforcement","main is not protected or protection unavailable");
 else if(data.main.enforcementVerified!==true)
  block("main-branch-enforcement","effective mandatory review/check enforcement UNVERIFIED");
 else pass("main-branch-enforcement");
 if(data.proofs.eightSourceReplay!==true)
  block("eight-source-publication","Exact candidate native eight-source replay NOT_VERIFIED");
 else pass("eight-source-publication");
 if(data.proofs.realOAuthQa!==true)
  block("authenticated-oauth-qa","Real Owner/Viewer OAuth QA for exact source NOT_VERIFIED");
 else pass("authenticated-oauth-qa");
 if(data.proofs.signedFourShardReview!==true)
  block("signed-scope-review","No genuine independently signed all-shard v3 six-lens review");
 else pass("signed-scope-review");
 if(data.proofs.ownerRatificationFromCanonicalDatabase!==true)
  block("canonical-owner-ratification","No authenticated append-only Owner ratification readback");
 else pass("canonical-owner-ratification");
 if(data.proofs.exactFullReleaseGate!==true)
  block("exact-full-gate","Exact-source full release/compatibility gate NOT_VERIFIED");
 else pass("exact-full-gate");
 if(data.proofs.impactAndSemverDecision!==true)
  block("semver-compatibility","Independent MINOR/MAJOR impact decision NOT_VERIFIED");
 else pass("semver-compatibility");
 return Object.freeze({
  schema:"blueprint-os:constitution-1.4-publish-readiness/v1",
  activeVersion:main.version,proposedVersion:"1.4.0",
  targetSourceSha:data.pullRequests["hub-action"]?.head?.sha??"UNVERIFIED",
  canPublish:false,  // This command has NO permission to certify publication
  technicalCandidateOnly:true,
  blockers:Object.freeze(checks.filter(x=>x.status==="BLOCKED")),
  checks:Object.freeze(checks),
  authority:"READ_ONLY_NO_PUBLICATION_GRANT"
 });
}
async function get(url,token){
 const ctrl=new AbortController();
 const timeout=setTimeout(()=>ctrl.abort(),9000);
 try {
  const res=await fetch(url,{headers:{
   Accept:"application/vnd.github+json",
   "X-GitHub-Api-Version":"2022-11-28",
   ...(token?{Authorization:"Bearer "+token}:{})
  },signal:ctrl.signal});
  if(!res.ok)throw Error("HTTP_"+res.status);
  return await res.json();
 }finally{clearTimeout(timeout);}
}
async function safeGet(url,token){try{return await get(url,token);}catch{return null;}}
/** Only current public GitHub statements are read. External truths stay UNVERIFIED. */
export async function readGitHubPublicationCheckpoint(token){
 const base="https://api.github.com/repos/";
 const names=[["hub-base",ROOT,152],["hub-action",ROOT,153],
  ["hub-review-contract",ROOT,154],["worker-reviewer",QA,5]];
 const [branch,manifest,...pulls]=await Promise.all([
  safeGet(base+ROOT+"/branches/main",token),
  safeGet(base+ROOT+"/contents/control/universal-constitution-version.json?ref=main",token),
  ...names.map(([,repo,num])=>safeGet(base+repo+"/pulls/"+num,token))
 ]);
 const reviews={};
 await Promise.all(names.map(async([key,repo,num])=>{
  reviews[key]=await safeGet(base+repo+"/pulls/"+num+"/reviews?per_page=100",token);
 }));
 let version="UNVERIFIED";
 try{
  if(manifest?.content&&manifest.encoding==="base64"){
   version=JSON.parse(Buffer.from(manifest.content,"base64").toString("utf8")).policyVersion;
  }
 }catch{}
 const pullRequests=Object.fromEntries(names.map(([key],i)=>[key,pulls[i]]));
 return {
  main:{version,sha:branch?.commit?.sha??"UNVERIFIED",
   protected:branch?.protected===true,enforcementVerified:false},
  pullRequests,reviews,
  // Never elevate these flags from workflow environment variables or user
  // supplied "approval" text. An independent trusted authority is required.
  proofs:{eightSourceReplay:false,realOAuthQa:false,
   signedFourShardReview:false,ownerRatificationFromCanonicalDatabase:false,
   exactFullReleaseGate:false,impactAndSemverDecision:false}
 };
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const checkpoint=await readGitHubPublicationCheckpoint(process.env.GITHUB_TOKEN);
 const result=evaluateConstitution14PublicationReadiness(checkpoint);
 const path=process.argv[process.argv.indexOf("--json")+1];
 if(process.argv.includes("--json")&&path?.startsWith("artifacts/")){
  mkdirSync(dirname(resolve(path)),{recursive:true});
  writeFileSync(resolve(path),JSON.stringify(result,null,2)+"\n");
 }
 console.log(JSON.stringify({
  ...result,reviewStatus:"REVIEW_BLOCKED",
  ratified:false,published:false,ecosystemPropagated:false
 }));
 if(result.canPublish||result.blockers.length===0)throw Error(
  "A read-only gate must not grant constitutional publication");
}
