import test from "node:test";
import assert from "node:assert/strict";
import {Buffer} from "node:buffer";
import {readRemotePrSnapshot} from "../../scripts/verify-r33-live-github-readback.mjs";
const head="a".repeat(40),repo="BlueDragon33/Software-Blueprint-Hub",filePath="docs/R33-CONNECTION-INTERRUPTION-RECOVERY.proposed.md";
const body=Buffer.from("# R33 candidate reference document\n");
const config={repository:repo,number:136,expectedHead:head,requiredPath:filePath,token:"ephemeral-test-fixture"};
function transport(overrides={}){
 let calls=[];
 const objects={
  "/pulls/136":{state:"open",merged:false,head:{sha:head,ref:"governance/r33-interruption-recovery-candidate",repo:{full_name:repo}},base:{sha:"b".repeat(40),repo:{full_name:repo}}},
  "/branches/governance%2Fr33-interruption-recovery-candidate":{commit:{sha:head}},
  "/commits/"+head:{sha:head},
  ["/contents/"+filePath+"?ref="+head]:{type:"file",path:filePath,sha:"c".repeat(40),encoding:"base64",
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
 assert.equal(t.calls.filter(x=>x.path==="/pulls/136").length,2);
 assert(t.calls.every(x=>x.auth==="Bearer ephemeral-test-fixture"));
});
test("stale PR, missing branch, wrong branch HEAD, bad file bytes and missing commit fail closed",async()=>{
 for(const override of [
  {"/pulls/136":{state:"closed",head:{sha:head,repo:{full_name:repo}}}},
  {"/branches/governance%2Fr33-interruption-recovery-candidate":{commit:{sha:"f".repeat(40)}}},
  {["/commits/"+head]:null},
  {["/contents/"+filePath+"?ref="+head]:{path:filePath,type:"file",size:3,encoding:"base64",content:body.toString("base64"),sha:"c".repeat(40)}},
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
