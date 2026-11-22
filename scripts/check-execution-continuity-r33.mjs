// R33 proposal-only checkpoint validator and read-only intent planner.
// No I/O except reading candidate policy files in CLI mode. No writes, grants,
// network use, deployment or claim of live checkpoint persistence.
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const sha=/^[a-f0-9]{40}$/;
const repo=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const isRecord=(v)=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const text=(v)=>typeof v==="string"&&v.trim().length>0;
const normalize=(v)=>String(v??"").normalize("NFC").toLocaleLowerCase("vi-VN").trim().replace(/\s+/gu," ");
const blocked=(reason)=>Object.freeze({status:"BLOCKED",reason,mayMutate:false,qualityGatePassed:false,productionAuthorized:false});

export function validateR33Proposal(contract,aliases) {
 const errors=[];
 if(contract?.kind!=="execution-continuity-r33-contract"||
 contract?.status!=="candidate-not-ratified"||
 contract?.parent?.amendmentCandidate!=="10.R33"||
 contract?.parent?.policyVersion!=="1.3.0"||
 !["10.R15","10.R16","10.R17","10.R19","10.R20"].every(x=>contract?.parent?.preserveArticles?.includes(x))) errors.push("R33 must extend existing authority, not overwrite existing articles");
 const inv=contract?.invariants??{};
 for(const key of ["neverAssumeTransportErrorMeansTaskFailure","independentReadbackBeforeRetry","noFakeSuccess","noNewAuthority","noBackgroundPromise","checkCurrentHead","noDuplicateSideEffects","noFullRepoScanByDefault"]){
  if(inv[key]!==true)errors.push("unsafe invariant: "+key);
 }
 if(inv.productionAuthorized!==false||inv.qualityGatePassed!==false||
 contract?.ownership?.additionalRuntimeDatabase!==false||
 contract?.bindings?.runtimeCanActFromCandidate!==false)errors.push("R33 may not invent authority or storage");
 const required=["schemaVersion","projectId","repository","workItemRef","objective","branch","observedHead","checkpointRef","checkpointStatus","nextAction","evidence","inFlightMutation"];
 if(contract?.checkpointSchema?.additionalProperties!==false||
 !required.every(k=>contract?.checkpointSchema?.required?.includes(k))) errors.push("incomplete minimal checkpoint contract");
 if(aliases?.kind!=="execution-continuity-r33-aliases"||
 aliases?.status!=="candidate-not-active"||
 !Array.isArray(aliases?.aliases)||aliases.aliases.length!==5) errors.push("missing or active aliases");
 const phrases=new Set();
 const intents=new Set(["RESUME_VERIFIED_WORK","PERSIST_CHECKPOINT","REPORT_CHECKPOINT"]);
 for(const a of aliases?.aliases??[]){
  const phrase=normalize(a.phrase);
  if(!phrase||phrases.has(phrase)||!intents.has(a.intent)||!Array.isArray(a.requires)||
  !Array.isArray(a.mustNever)||a.onAmbiguity!=="BLOCK_AND_REQUEST_TARGET")errors.push("ambiguous or unsafe command alias");
  phrases.add(phrase);
  if(a.intent==="RESUME_VERIFIED_WORK"&&
   !a.mustNever.includes("blind-retry-unconfirmed-write"))errors.push("resume must reject replay");
  if(a.intent==="REPORT_CHECKPOINT"&&
   !a.mustNever.includes("write-any-data"))errors.push("report must be read only");
 }
 return errors;
}

/** A verified host must populate trustedReadback from GitHub/ledger access now.
 * The planner itself has no ability to fetch/check remote refs and NEVER executes.
 * A caller-supplied checkpoint is not trusted merely because it says VERIFIED_DONE.
 */
export function planR33(command,input,aliases) {
 const alias=(aliases?.aliases??[]).find(a=>normalize(a.phrase)===normalize(command));
 if(!alias)return blocked("UNKNOWN_COMMAND");
 const items=input?.workItems;
 if(!Array.isArray(items)||items.length!==1||!isRecord(items[0]))
  return blocked("AMBIGUOUS_WORK_ITEM");
 const item=items[0];
 if(!repo.test(item.repository??"")||!text(item.workItemRef))return blocked("INVALID_WORK_ITEM");
 if(alias.intent==="PERSIST_CHECKPOINT"){
  if(!input.authorizedPersistenceTarget||!input.verifiedEvidence?.length)
   return blocked("CHECKPOINT_NOT_PERSISTED");
  return Object.freeze({status:"PERSISTENCE_PROPOSAL_ONLY",intent:alias.intent,
   target:input.authorizedPersistenceTarget,mayMutate:false,qualityGatePassed:false,
   note:"Trusted connector must write to existing issue/PR/journal and independently read back before claiming saved."});
 }
 const readback=input.trustedReadback;
 if(!isRecord(readback)||!readback.checkpointReadbackConfirmed)
  return blocked("CHECKPOINT_UNVERIFIED");
 if(alias.intent==="REPORT_CHECKPOINT"&&(!input.checkpoint||!sha.test(readback.currentHead??"")))
  return blocked("CHECKPOINT_UNVERIFIED");
 const cp=input.checkpoint;
 if(!isRecord(cp)||cp.repository!==item.repository||cp.workItemRef!==item.workItemRef||
 !text(cp.checkpointRef)||!sha.test(cp.observedHead??"")||
 !text(cp.projectId)||!text(cp.branch)||
 !Array.isArray(cp.evidence)||!isRecord(cp.inFlightMutation))
  return blocked("INVALID_CHECKPOINT");
 if(!sha.test(readback.currentHead??"")||readback.repository!==item.repository||
 readback.workItemRef!==item.workItemRef||readback.checkpointRef!==cp.checkpointRef)
  return blocked("REMOTE_PROVENANCE_MISMATCH");
 // Evidence is linked to current remote readback; assistant-generated claims alone
 // do not count, even when the checkpoint itself is tagged VERIFIED_DONE.
 const evidence=readback.confirmedEvidence;
 if(!Array.isArray(evidence)||cp.evidence.length===0||cp.evidence.some(e=>
   !text(e.ref)||!sha.test(e.sha??"")||
   !evidence.some(t=>t?.ref===e.ref&&t.sha===e.sha&&t.confirmed===true)))
  return blocked("EVIDENCE_NOT_INDEPENDENTLY_CONFIRMED");
 const mutation=cp.inFlightMutation;
 if(mutation.kind==="mutation"){
  if(!text(mutation.targetRef))return blocked("MUTATION_OUTCOME_UNKNOWN");
  const result=readback.mutationOutcome;
  if(result==="unknown"||result==null)return blocked("MUTATION_OUTCOME_UNKNOWN");
  if(!["confirmed-applied","confirmed-not-applied"].includes(result))
   return blocked("MUTATION_OUTCOME_UNKNOWN");
  if(result==="confirmed-not-applied")
   return blocked("RETRY_NEEDS_NEW_AUTHORIZED_DECISION");
  // If confirmed applied, do not resend; proceed to source reconcilation.
 }
 if(cp.observedHead!==readback.currentHead)
  return blocked("STALE_CHECKPOINT");
 if(!["VERIFIED_DONE","VERIFIED_PENDING","BLOCKED","UNVERIFIED"].includes(cp.checkpointStatus))
  return blocked("INVALID_CHECKPOINT_STATUS");
 if(cp.checkpointStatus==="UNVERIFIED")return blocked("CHECKPOINT_UNVERIFIED");
 if(alias.intent==="REPORT_CHECKPOINT")return Object.freeze({
  status:"VERIFIED_REPORT_ONLY",intent:alias.intent,checkpointStatus:cp.checkpointStatus,
  repository:cp.repository,workItemRef:cp.workItemRef,observedHead:readback.currentHead,
  verifiedEvidence:cp.evidence.length,mayMutate:false,qualityGatePassed:false,productionAuthorized:false
 });
 if(cp.checkpointStatus==="BLOCKED")return blocked("UPSTREAM_TASK_BLOCKED");
 if(cp.checkpointStatus==="VERIFIED_DONE")return Object.freeze({
  status:"VERIFIED_DONE",mayMutate:false,qualityGatePassed:false,productionAuthorized:false
 });
 if(!text(cp.nextAction))return blocked("MISSING_NEXT_ACTION");
 return Object.freeze({
  status:"RECONCILED_NEXT_ACTION",intent:alias.intent,
  repository:cp.repository,workItemRef:cp.workItemRef,observedHead:readback.currentHead,
  nextAction:cp.nextAction,mayMutate:false,requiresNormalPermissionAndQAGates:true,
  qualityGatePassed:false,productionAuthorized:false
 });
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
 const failures=validateR33Proposal(
  read("../control/execution-continuity-r33.contract.v1.json"),
  read("../control/execution-continuity-r33-aliases.v1.json")
 );
 if(failures.length){console.error(failures.join("\n"));process.exitCode=1}
 else console.log("R33 PROPOSAL CONTRACT PASS — NOT ACTIVE OR AUTHORIZED TO RESUME LIVE WORK");
}
