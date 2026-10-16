// Scoped GitHub REST readback for a PR after interrupted chat/connector output.
// This does NOT authenticate a human approval or checkpoint; remote PR/branch/
// commit/file integrity only. Never changes GitHub, token, gates or app state.
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SHA=/^[a-f0-9]{40}$/;
const SAFE_PATH=/^[a-zA-Z0-9._/-]{2,180}$/;
const FAIL=(reason)=>{throw new Error("R33_READBACK_BLOCKED: "+reason);};
const digest=x=>"sha256:"+createHash("sha256").update(x).digest("hex");

export async function readRemotePrSnapshot(config,transport=fetch){
 const {repository,number,expectedHead,requiredPath,token}=config??{};
 if(!REPO.test(repository??"")||!Number.isInteger(number)||number<1||
   !SHA.test(expectedHead??"")||!SAFE_PATH.test(requiredPath??"")||
   requiredPath.startsWith("/")||requiredPath.split("/").includes("..")||
   !token)FAIL("missing/unsafe repository, PR number, exact SHA, path or token");
 const api="https://api.github.com/repos/"+repository;
 const request=async p=>{
  const response=await transport(api+p,{
   headers:{authorization:"Bearer "+token,accept:"application/vnd.github+json",
    "X-GitHub-Api-Version":"2022-11-28","user-agent":"blueprint-r33-readback-ci"},
   signal:AbortSignal.timeout(15_000)
  });
  if(!response?.ok)FAIL("remote read HTTP "+response?.status);
  return response.json();
 };
 const pull=await request("/pulls/"+number);
 if(pull?.state!=="open"||pull?.merged===true||pull?.head?.repo?.full_name!==repository||
   pull?.head?.sha!==expectedHead||
   pull?.base?.repo?.full_name!==repository)FAIL("PR identity/state/head mismatch");
 if(!/^[-A-Za-z0-9_./]{1,150}$/.test(pull.head.ref)||pull.head.ref.split("/").includes(".."))
   FAIL("invalid source branch name");
 const branch=await request("/branches/"+encodeURIComponent(pull.head.ref));
 if(branch?.commit?.sha!==expectedHead)FAIL("branch advanced / stale PR HEAD");
 const commit=await request("/commits/"+expectedHead);
 if(commit?.sha!==expectedHead)FAIL("commit SHA mismatch");
 const file=await request("/contents/"+requiredPath+"?ref="+expectedHead);
 if(file?.type!=="file"||file.path!==requiredPath||
   file.encoding!=="base64"||typeof file.content!=="string"||
   file.size>1000000)FAIL("required content missing or unsupported");
 const bytes=Buffer.from(file.content.replace(/\s+/g,""),"base64");
 const gitBlob=createHash("sha1").update(Buffer.from("blob "+bytes.byteLength+"\0")).update(bytes).digest("hex");
 if(bytes.byteLength!==file.size||file.sha!==gitBlob)
   FAIL("file content length or Git blob SHA mismatch");
 const check=digest(bytes);
 // Prevent race between file read and mutable PR state.
 const after=await request("/pulls/"+number);
 if(after?.head?.sha!==expectedHead||after?.state!=="open")
   FAIL("PR head/state moved during snapshot");
 return Object.freeze({
  kind:"R33_PROVIDER_NEUTRAL_GITHUB_SOURCE_READBACK",status:"SOURCE_REVISION_READBACK_VERIFIED",
  repository,prNumber:number,prUrl:"https://github.com/"+repository+"/pull/"+number,
  exactHead:expectedHead,baseHead:pull.base.sha,branch:pull.head.ref,
  requiredPath,fileSha256:check,gitBlobSha:file.sha,
  sourceVerified:true,checkpointPersisted:false,taskCompletion:"UNVERIFIED",
  authenticatedHumanReview:"NOT_VERIFIED",qualityGatePassed:false,
  productionAuthorized:false
 });
}

async function cli(){
 const ev=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH??"", "utf8"));
 const number=ev?.pull_request?.number??ev?.number;
 const expectedHead=ev?.pull_request?.head?.sha;
 if(ev?.pull_request?.head?.repo?.full_name!==process.env.GITHUB_REPOSITORY)
  FAIL("head is not from same repository");
 const result=await readRemotePrSnapshot({
  repository:process.env.GITHUB_REPOSITORY,number,expectedHead,
  requiredPath:"docs/R33-CONNECTION-INTERRUPTION-RECOVERY.proposed.md",
  token:process.env.GITHUB_TOKEN
 });
 const file=resolve(process.env.RUNNER_TEMP||".","r33-source-readback-evidence.json");
 writeFileSync(file,JSON.stringify(result,null,2)+"\n",{mode:0o600});
 console.log(JSON.stringify({status:result.status,repository:result.repository,exactHead:result.exactHead,
  requiredPath:result.requiredPath,artifactSha256:digest(readFileSync(file)),
  taskCompletion:result.taskCompletion}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 cli().catch(e=>{console.error(e.message);process.exitCode=1;});
}
