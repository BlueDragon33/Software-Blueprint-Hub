import test from "node:test";
import assert from "node:assert/strict";
import {Buffer} from "node:buffer";
import {createHash} from "node:crypto";
import {readRemotePrSnapshot,assessGitHubReviewRecords} from "../../scripts/verify-r33-live-github-readback.mjs";
const head="a".repeat(40),repo="BlueDragon33/Software-Blueprint-Hub",filePath="docs/R33-CONNECTION-INTERRUPTION-RECOVERY.proposed.md";
const body=Buffer.from("# R33 candidate reference document\n");
const gitBlob=createHash("sha1").update(Buffer.from("blob "+body.byteLength+"\0")).update(body).digest("hex");
const config={repository:repo,number:136,expectedHead:head,requiredPath:filePath,token:"ephemeral-test-fixture"};
function transport(overrides={}){
 let calls=[];
 const objects={
  "/pulls/136":{state:"open",merged:false,user:{login:"author"},head:{sha:head,ref:"governance/r33-interruption-recovery-candidate",repo:{full_name:repo}},base:{sha:"b".repeat(40),repo:{full_name:repo}}},
  "/pulls/136/reviews?per_page=100":[],
  "/branches/governance%2Fr33-interruption-recovery-candidate":{commit:{sha:head}},
  ["/commits/"+head]:{sha:head},
  ["/contents/"+filePath+"?ref="+head]:{type:"file",path:filePath,sha:gitBlob,encoding:"base64",
   size:body.byteLength,content:body.toString("base64")}
 };
 const fetchMock=async(uri,options)=>{
  const path=uri.replace("https://api.github.com/repos/"+repo,"");
  calls.push({path,auth:options.headers.authorization});
  const override=overrides[path],data=override===undefined?objects[path]:override;
  if(data===null)return{ok:false,status:404,json:async()=>({})};
  return{ok:true,status:200,json:async()=>data};
 };
 return{fetchMock,calls};
}
test("real-transport adapter schema validates exact PR, branch, commit and file and never promotes work",async()=>{
 const t=transport();const result=await readRemotePrSnapshot(config,t.fetchMock);
 assert.equal(result.status,"SOURCE_REVISION_READBACK_VERIFIED");
 assert.equal(result.exactHead,head);
 assert.match(result.fileSha256,/^sha256:[a-f0-9]{64}$/);
 assert.equal(result.qualityGatePassed,false);
 assert.equal(result.authenticatedHumanReview,"NOT_VERIFIED");
 assert.equal(result.checkpointPersisted,false);
 assert.equal(result.productionAuthorized,false);
 assert.equal(result.taskCompletion,"UNVERIFIED");
 assert.equal(result.reviewEvidence.status,"REVIEW_PENDING");
 assert.equal(result.reviewEvidence.independentReviewObserved,false);
 assert.equal(t.calls.filter(x=>x.path==="/pulls/136").length,2);
 assert(t.calls.every(x=>x.auth==="Bearer ephemeral-test-fixture"));
});
test("stale PR, missing branch, wrong branch HEAD, bad file bytes and missing commit fail closed",async()=>{
 for(const override of [
  {"/pulls/136":{state:"closed",head:{sha:head,repo:{full_name:repo}}}},
  {"/branches/governance%2Fr33-interruption-recovery-candidate":{commit:{sha:"f".repeat(40)}}},
  {["/commits/"+head]:null},
  {["/contents/"+filePath+"?ref="+head]:{path:filePath,type:"file",size:3,encoding:"base64",content:body.toString("base64"),sha:gitBlob}},
  {["/contents/"+filePath+"?ref="+head]:null}
 ]){
  await assert.rejects(readRemotePrSnapshot(config,transport(override).fetchMock),/R33_READBACK_BLOCKED/);
 }
});
test("unsafe refs, absent permissions, nonnumeric PR and fork divergence never start readback",async()=>{
 for(const c of [
  {...config,token:""}, {...config,number:0},{...config,expectedHead:"bad"},
  {...config,repository:"fake"}, {...config,requiredPath:"../.env"},
  {...config,requiredPath:"/etc/passwd"}
 ]){
  await assert.rejects(readRemotePrSnapshot(c,transport().fetchMock),/R33_READBACK_BLOCKED/);
 }
 const wrong=transport({"/pulls/136":{state:"open",head:{sha:head,repo:{full_name:"other/fork"}},
   base:{sha:"b".repeat(40),repo:{full_name:repo}}}});
 await assert.rejects(readRemotePrSnapshot(config,wrong.fetchMock),/R33_READBACK_BLOCKED/);
});

test("PR state, target base and repository identity are checked a second time after file read",async()=>{
 for(const mutation of [
  p=>({...p,base:{...p.base,sha:"d".repeat(40)}}),
  p=>({...p,head:{...p.head,sha:"e".repeat(40)}}),
  p=>({...p,head:{...p.head,repo:{full_name:"other/repo"}}}),
  p=>({...p,merged:true})
 ]){
  const mock=transport(),fetch0=mock.fetchMock;
  let count=0;
  const raced=async(url,opts)=>{
   if(url.endsWith("/pulls/136")){
    count++;
    if(count===2){
     const result=await fetch0(url,opts);
     const first=await result.json();
     return{ok:true,status:200,json:async()=>mutation(first)};
    }
   }
   return fetch0(url,opts);
  };
  await assert.rejects(readRemotePrSnapshot(config,raced),/R33_READBACK_BLOCKED.*moved during snapshot/);
  assert.equal(count,2);
 }
});

test("real GitHub review evidence must be a distinct non-author reviewer at the exact SHA",()=>{
 const pull={user:{login:"author"}};
 const row=(login,state,commit_id=head,author_association="COLLABORATOR",submitted_at="2026-10-16T12:00:00Z")=>({
   user:{login},state,commit_id,author_association,submitted_at
 });
 assert.equal(assessGitHubReviewRecords(pull,[],head).status,"REVIEW_PENDING");
 assert.equal(assessGitHubReviewRecords(pull,[row("author","APPROVED")],head).status,"REVIEW_PENDING");
 assert.equal(assessGitHubReviewRecords(pull,[row("other","APPROVED","f".repeat(40))],head).status,"STALE_REVIEW");
 assert.equal(assessGitHubReviewRecords(pull,[row("other","APPROVED",head,"NONE")],head).status,"REVIEW_PENDING");
 const approved=assessGitHubReviewRecords(pull,[row("other","APPROVED")],head);
 assert.equal(approved.status,"GITHUB_REVIEW_AT_HEAD_OBSERVED");
 assert.equal(approved.independentReviewObserved,true);
 assert.equal(approved.qualityGatePassed,false);
 assert.equal(approved.constitutionalRatification,false);
 assert.equal(assessGitHubReviewRecords(pull,[row("other","CHANGES_REQUESTED")],head).status,"CHANGES_REQUESTED");
 assert.equal(assessGitHubReviewRecords(pull,[row("other","APPROVED"),row("other","DISMISSED",head,"COLLABORATOR","2026-10-16T13:00:00Z")],head).status,"REVIEW_PENDING");
 assert.equal(assessGitHubReviewRecords(pull,Array(100).fill(row("other","APPROVED")),head).status,"REVIEW_EVIDENCE_INCOMPLETE");
});
