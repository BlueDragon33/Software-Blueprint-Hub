#!/usr/bin/env node
/**
 * PREPARATION ONLY: 1.4.0 eight-source publication candidate, NO canonical
 * writes, approval, ratification, merge, migration or deployment.
 * Every output is derived from ACTIVE 1.3.0 and must be independently reviewed.
 */
import {createHash} from "node:crypto";
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join,dirname,resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {pathToFileURL} from "node:url";

export const CONSTITUTION_14_PATHS=Object.freeze([
 "docs/UNIVERSAL-CONSTITUTION.md",
 "control/universal-constitution.contract.json",
 "packages/application/src/foundation-templates.ts",
 "packages/application/src/constitution-authority.ts",
 "control/universal-constitution-version.json",
 ".blueprint/constitution-adoption.json",
 "control/constitution-ecosystem-snapshot.json",
 "control/constitution-compliance-snapshot.json"
]);
const CANDIDATE="docs/amendments/CONSTITUTION-R33-R34-1.4.0-REVIEW.md";
const sha=x=>"sha256:"+createHash("sha256").update(x).digest("hex");
const blob=x=>createHash("sha1").update("blob "+Buffer.byteLength(x)+"\0").update(x).digest("hex");
const read=(root,path)=>readFileSync(join(root,path),"utf8");
const deny=reason=>{throw Error("CONSTITUTION_14_CANDIDATE_BLOCKED: "+reason);};
const requireOne=(source,from,to,label)=>{
 if(!source.includes(from)||source.split(from).length!==2)deny("missing or duplicate "+label);
 return source.replace(from,to);
};
function replacePolicy(bytes,key){
 const original='"'+key+'": "1.3.0"';
 return requireOne(bytes,original,'"'+key+'": "1.4.0"',key);
}
const rule33=[
 "### 10.R33",
 "",
 "**R33 — One Hub-governed, verifiable contextual Action contract.** All governed projects inherit a single versioned Next Action and guidance specification, adapting their real buttons and views to their user/device/role while retaining independent project and application business authority. The Hub owns the normative template; Application-Management may coordinate adoption but never self-mint project roles, reviewer rights or constitutional authority.",
 "",
 "1. One-click NEXT ACTION validates authenticated actor, ProjectProfile version, selected readiness task, source provenance and applicable WorkPackage/Quality Gate; creates the planned prompt internally and performs only supported, authorized operations. It cannot fake source revisions, Work sessions, background execution, CMD/terminal actions, Quality Gate PASS or Production.",
 "2. HƯỚNG DẪN displays the actual task, why it matters, relevant existing evidence, authorization boundary and stop rule. A distinct end-to-end control continues all eligible scoped work until an independently verified stop. A copy-prompt affordance is never the execution requirement.",
 "3. The task-specific Action helper binds to exact WorkPackage ID/version or Quality Gate ID, showing bounded acceptance criteria, pending evidence and permissible next step; a duplicate title or stale label cannot substitute another task. CMD paste appears only on an allowlisted canonical WorkPackage marker, stays untrusted and never triggers shell execution or QA PASS.",
 "4. Any privileged change needs a current scoped signed grant, adopted workflow, owner role, durable idempotent execution journal, independent source-and-QA readback and applicable human review. AI reviewer advice is not human approval. Missing OAuth, issuer or reviewer means BLOCKED, not PASS.",
 "5. Chat/Work directional handoffs require verified host/Project identity and must not be invented from browser URLs. Existing approved services stay independent. Exact-SHA keyboard/mobile/Owner/Viewer regression and evidence are required per app. The initial 18 tracked apps remain NOT_ADOPTED until each proves real compliance; no automatic ecosystem-wide deploy.",
 ""
].join("\n");
const rule34=[
 "### 10.R34",
 "",
 "**R34 — Bounded, non-circular continuation with verified receipts.** A user-approved goal must be carried as an exact work scope and dependency graph. Execute every eligible and authorized safe step with actual tools before delegating; do not stop after a prompt, plan, read-only preflight or repeated generic NEXT ACTION. Preserve previous PASS evidence and protected local changes.",
 "",
 "1. Work proceeds through reproduce, smallest safe fix, scoped tests, independent re-read, dependency review and truthful completion receipts. Recheck grants and role/version/source boundaries before each protected operation. No self-issued issuer key, review, merger, ratification, Production or paid-run authority.",
 "2. On a true blocker, report which task could not run, which authority or capability is missing, what evidence was checked, why no other safe task was eligible and exactly one concrete non-repeating Next Action tied to the approved task scope.",
 "3. VERIFIED_COMPLETE requires accepted source-bound evidence of the actual product result; otherwise state PARTIAL_BLOCKED or PARTIAL_CAPABILITY_LIMIT. Test fixtures, prompt copies and CI green alone cannot satisfy human acceptance. Distinct professional reviewer and constitutional ratification remain human authority decisions.",
 ""
].join("\n");
function versionFromSource(value,path){
 if(!value.includes("1.3.0"))deny("expected ACTIVE 1.3.0 at "+path);
 return value;
}
export function buildConstitution14Candidate(root=process.cwd()){
 const current=new Map(CONSTITUTION_14_PATHS.map(path=>[path,read(root,path)]));
 const candidate=read(root,CANDIDATE);
 for(const label of ["### R33.9","### R33.10","### R34.8"]){
  if(!candidate.includes(label))deny("normative review lacks "+label);
 }
 const manifest=JSON.parse(current.get(CONSTITUTION_14_PATHS[4]));
 if(manifest.policyVersion!=="1.3.0"||
    manifest.productionReleaseAuthority!==false)deny("active baseline must be 1.3.0 no Production authority");
 const proposed=new Map();
 const doc=current.get(CONSTITUTION_14_PATHS[0]);
 const boundary="\n## 11. Computed contrast and legibility";
 proposed.set(CONSTITUTION_14_PATHS[0],
  requireOne(versionFromSource(doc,CONSTITUTION_14_PATHS[0]),
   "Policy version: **1.3.0**","Policy version: **1.4.0**","normative policy version")
   .replace(boundary,"\n"+rule33+"\n"+rule34+boundary));
 if(proposed.get(CONSTITUTION_14_PATHS[0]).split(boundary).length!==2)deny("normative R33/R34 anchor missing");
 const contract=JSON.parse(current.get(CONSTITUTION_14_PATHS[1]));
 if(contract.policyVersion!=="1.3.0"||contract.constitutionTemplate?.version!=="1.3.0"||
   !Array.isArray(contract.executionRules)||contract.executionRules.length!==32||
   contract.executionRules[31]?.id!=="R32")deny("contract R1-R32 baseline changed");
 contract.policyVersion="1.4.0";contract.constitutionTemplate.version="1.4.0";
 contract.executionRules.push(
  {id:"R33",requirementId:"module:governance:evolution",
   enforcement:"scope-authority-and-human-acceptance-gated",
   normativeSection:"10.R33"},
  {id:"R34",requirementId:"module:operations:release",
   enforcement:"scope-authority-and-human-acceptance-gated",
   normativeSection:"10.R34"});
 proposed.set(CONSTITUTION_14_PATHS[1],JSON.stringify(contract,null,2)+"\n");
 const template=current.get(CONSTITUTION_14_PATHS[2]);
 const start=template.indexOf("export const universalConstitutionTemplateV1");
 const end=template.indexOf("satisfies BlueprintTemplate",start);
 if(start<0||end<0)deny("universal template anchor missing");
 const block=template.slice(start,end);
 const replaced=requireOne(block,'version: "1.3.0"','version: "1.4.0"',"universal template version");
 proposed.set(CONSTITUTION_14_PATHS[2],template.slice(0,start)+replaced+template.slice(end));
 proposed.set(CONSTITUTION_14_PATHS[3],
  requireOne(current.get(CONSTITUTION_14_PATHS[3]),
   'CONSTITUTION_POLICY_VERSION = "1.3.0"',
   'CONSTITUTION_POLICY_VERSION = "1.4.0"',"constitutional policy authority version"));
 const version=JSON.parse(current.get(CONSTITUTION_14_PATHS[4]));
 version.policyVersion="1.4.0";
 for(const name of ["normativeDocument","machineContract","universalTemplate","policySource"]){
  if(version[name]?.version!=="1.3.0")deny("canonical path version drift "+name);
  version[name].version="1.4.0";
 }
 proposed.set(CONSTITUTION_14_PATHS[4],JSON.stringify(version,null,2)+"\n");
 for(const path of CONSTITUTION_14_PATHS.slice(5)){
  const key=path.includes("ecosystem")?"activePolicyVersion":"policyVersion";
  proposed.set(path,replacePolicy(current.get(path),key));
 }
 return Object.freeze({
  policyVersion:"1.4.0",status:"CANDIDATE_NOT_RATIFIED",
  current,proposed,
  exactPaths:CONSTITUTION_14_PATHS,
  sourceDigests:Object.freeze(CONSTITUTION_14_PATHS.map(path=>({
   path,before:sha(current.get(path)),after:sha(proposed.get(path))
  })))
 });
}
const lines=x=>{
 if(!x.endsWith("\n"))deny("source missing final newline");
 return x.split("\n").slice(0,-1);
};
/** Full-source Git-format patch with actual Git blob index hashes. */
export function buildConstitution14Patch(candidate){
 const chunks=[];
 for(const path of CONSTITUTION_14_PATHS){
  const before=candidate.current.get(path),after=candidate.proposed.get(path);
  if(typeof before!=="string"||typeof after!=="string"||before===after)
   deny("missing modified authority source "+path);
  const a=lines(before),b=lines(after);
  chunks.push("diff --git a/"+path+" b/"+path,
   "index "+blob(before)+".."+blob(after)+" 100644",
   "--- a/"+path,"+++ b/"+path,
   "@@ -1,"+a.length+" +1,"+b.length+" @@",
   ...a.map(x=>"-"+x),...b.map(x=>"+"+x));
 }
 return chunks.join("\n")+"\n";
}
/** Actual native git apply/rollback in ephemeral scratch; no change to live checkout. */
export function testConstitution14Patch(candidate,patch){
 const temp=mkdtempSync(join(tmpdir(),"blueprint-constitution14-candidate-"));
 const git=(args)=>{
  const p=spawnSync("git",args,{cwd:temp,encoding:"utf8"});
  if(p.status!==0)deny("native isolated git apply/reverse: "+(p.stderr||p.stdout));
 };
 try{
  for(const path of CONSTITUTION_14_PATHS){
   const target=join(temp,path);mkdirSync(dirname(target),{recursive:true});
   writeFileSync(target,candidate.current.get(path));
  }
  // Read content instead of trusting self-reported git success.
  const patchPath=join(temp,"candidate.patch");writeFileSync(patchPath,patch);
  git(["apply","--check",patchPath]);
  git(["apply",patchPath]);
  for(const path of CONSTITUTION_14_PATHS)
   if(read(temp,path)!==candidate.proposed.get(path))deny("native patch content mismatch "+path);
  git(["apply","--reverse","--check",patchPath]);
  git(["apply","--reverse",patchPath]);
  for(const path of CONSTITUTION_14_PATHS)
   if(read(temp,path)!==candidate.current.get(path))deny("native rollback mismatch "+path);
  return Object.freeze({
   status:"ISOLATED_EIGHT_SOURCE_REPLAY_ROLLBACK_PASS",
   activePolicyUnchanged:true,
   ratified:false,published:false,productionAuthorized:false,
   paths:CONSTITUTION_14_PATHS.length
  });
 }finally{rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const candidate=buildConstitution14Candidate();
 const patch=buildConstitution14Patch(candidate);
 const verification=testConstitution14Patch(candidate,patch);
 if(process.argv.includes("--write-candidate")){
  const path=process.argv[process.argv.indexOf("--write-candidate")+1];
  if(!path||!path.startsWith("artifacts/"))deny("patch emission only into isolated artifacts/");
  mkdirSync(dirname(resolve(path)),{recursive:true});writeFileSync(resolve(path),patch);
 }
 console.log(JSON.stringify({...verification,patchDigest:sha(patch),
  sourceDigests:candidate.sourceDigests,
  reviewStatus:"REVIEW_BLOCKED",constitutionalAuthority:false}));
}
