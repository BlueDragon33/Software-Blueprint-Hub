import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateR33Proposal,planR33} from "../../scripts/check-execution-continuity-r33.mjs";
const contract=JSON.parse(readFileSync(new URL("../../control/execution-continuity-r33.contract.v1.json",import.meta.url)));
const aliases=JSON.parse(readFileSync(new URL("../../control/execution-continuity-r33-aliases.v1.json",import.meta.url)));
const head="a".repeat(40);
const item={repository:"BlueDragon33/Software-Blueprint-Hub",workItemRef:"github:BlueDragon33/Software-Blueprint-Hub/pull/134"};
const record={
 schemaVersion:"1.0.0",projectId:"project:blueprint-os",repository:item.repository,
 workItemRef:item.workItemRef,objective:"Restore interrupted candidate governance review",
 branch:"governance/r33-interruption-recovery-candidate",observedHead:head,
 checkpointRef:"github:BlueDragon33/Software-Blueprint-Hub/issues/115",
 checkpointStatus:"VERIFIED_PENDING",nextAction:"Inspect exact SHA CI and attached PR reviewers",
 evidence:[{ref:"github:BlueDragon33/Software-Blueprint-Hub/commit/"+head,sha:head,kind:"commit"}],
 inFlightMutation:{kind:"none",outcome:"none",targetRef:null,idempotencyKey:null}
};
const observed={checkpointReadbackConfirmed:true,repository:item.repository,workItemRef:item.workItemRef,
 checkpointRef:record.checkpointRef,currentHead:head,
 confirmedEvidence:[{...record.evidence[0],confirmed:true}],mutationOutcome:"none"};
const input=()=>({workItems:[structuredClone(item)],checkpoint:structuredClone(record),trustedReadback:structuredClone(observed)});
test("Candidate R33 complements existing 10.R15/R17; cannot self-ratify or create a second runtime DB",()=>{
 assert.deepEqual(validateR33Proposal(contract,aliases),[]);
 assert.equal(contract.status,"candidate-not-ratified");
 assert.equal(contract.ownership.additionalRuntimeDatabase,false);
 assert.equal(contract.bindings.runtimeCanActFromCandidate,false);
});
test("Vietnamese short commands resolve exact one-item work; resume is read-only planning",()=>{
 const v=planR33(" Khôi phục  công việc ",input(),aliases);
 assert.equal(v.status,"RECONCILED_NEXT_ACTION");
 assert.equal(v.mayMutate,false);
 assert.equal(v.nextAction,record.nextAction);
 assert.equal(v.qualityGatePassed,false);
 assert.equal(v.productionAuthorized,false);
 assert.equal(planR33("Tiếp tục từ checkpoint",input(),aliases).status,"RECONCILED_NEXT_ACTION");
 assert.equal(planR33("Khôi phục R33",input(),aliases).status,"RECONCILED_NEXT_ACTION");
 assert.equal(planR33("Báo checkpoint",input(),aliases).status,"VERIFIED_REPORT_ONLY");
});
test("No duplicated writes: interrupted unconfirmed mutation BLOCKED until target readback",()=>{
 const x=input();x.checkpoint.inFlightMutation={kind:"mutation",outcome:"unknown",targetRef:"github:PR/134/merge",idempotencyKey:null};
 x.trustedReadback.mutationOutcome="unknown";
 assert.equal(planR33("Khôi phục công việc",x,aliases).reason,"MUTATION_OUTCOME_UNKNOWN");
 x.trustedReadback.mutationOutcome="confirmed-not-applied";
 assert.equal(planR33("Khôi phục công việc",x,aliases).reason,"RETRY_NEEDS_NEW_AUTHORIZED_DECISION");
 x.trustedReadback.mutationOutcome="confirmed-applied";
 assert.equal(planR33("Khôi phục công việc",x,aliases).status,"RECONCILED_NEXT_ACTION");
});
test("Absent remote verification, guessed status or missing current HEAD cannot be treated as successful resume",()=>{
 for(const mod of [
  x=>{delete x.trustedReadback;},
  x=>{x.trustedReadback.checkpointReadbackConfirmed=false;},
  x=>{x.trustedReadback.confirmedEvidence=[];},
  x=>{x.trustedReadback.currentHead="bad";},
  x=>{x.trustedReadback.checkpointRef="invented";},
  x=>{x.checkpoint.checkpointStatus="VERIFIED_DONE";x.trustedReadback.confirmedEvidence=[];}
 ]){
  const x=input();mod(x);
  assert.equal(planR33("Khôi phục công việc",x,aliases).status,"BLOCKED");
 }
});
test("Remote HEAD drift forces scoped reconciliation instead of blind patch replay",()=>{
 const x=input();x.trustedReadback.currentHead="f".repeat(40);
 assert.equal(planR33("Khôi phục công việc",x,aliases).reason,"STALE_CHECKPOINT");
});
test("Multiple work items, no checkpoint and unsupported command fail closed",()=>{
 const x=input();x.workItems.push({...item,workItemRef:"github:other"});
 assert.equal(planR33("Khôi phục công việc",x,aliases).reason,"AMBIGUOUS_WORK_ITEM");
 assert.equal(planR33("Unknown",input(),aliases).reason,"UNKNOWN_COMMAND");
 const y=input();delete y.checkpoint;
 assert.equal(planR33("Khôi phục công việc",y,aliases).status,"BLOCKED");
});
test("Report does not write; save requires explicit durable target and current verified evidence",()=>{
 const x=input();assert.equal(planR33("Lưu checkpoint",x,aliases).reason,"CHECKPOINT_NOT_PERSISTED");
 x.authorizedPersistenceTarget="github:BlueDragon33/Software-Blueprint-Hub/issues/115";
 x.verifiedEvidence=[{ref:record.evidence[0].ref,sha:head}];
 const result=planR33("Lưu checkpoint",x,aliases);
 assert.equal(result.status,"PERSISTENCE_PROPOSAL_ONLY");
 assert.equal(result.mayMutate,false);
 assert.match(result.note,/independently read back/);
});
test("Adversarial contract/alias mutation is rejected",()=>{
 const c=structuredClone(contract);c.invariants.noDuplicateSideEffects=false;
 assert.match(validateR33Proposal(c,aliases).join(";"),/unsafe invariant/);
 const a=structuredClone(aliases);a.aliases[0].mustNever=[];
 assert.match(validateR33Proposal(contract,a).join(";"),/reject replay/);
});
