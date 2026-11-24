// Advisory continuation decision; no IO, mutation, runner, or authority grant.
export const MODES=Object.freeze(["ONE_STEP","ONE_PACKAGE","UNTIL_REQUIRED_GATE"]);
const STATES=new Set(["VERIFIED_DONE","READY","RECOVERABLE","HUMAN_REQUIRED","CAPABILITY_BLOCKED"]);
const result=(action,stepId=null,reason=null)=>({action,stepId,reason});
export function decideContinuation({mode="UNTIL_REQUIRED_GATE",sourceVerified=false,scopeAuthorized=false,completedStepIdsThisTurn=[],currentPackage=null,steps=[]}={}){
  if(!MODES.includes(mode)||sourceVerified!==true||scopeAuthorized!==true||!Array.isArray(completedStepIdsThisTurn)||!Array.isArray(steps)||steps.length===0)return result("BLOCKED",null,"UNVERIFIED_CONTEXT");
  const ids=new Set();
  for(const s of steps){
    if(!s||typeof s.id!=="string"||!s.id||ids.has(s.id)||typeof s.packageId!=="string"||!s.packageId||!["P0","P1"].includes(s.priority)||!STATES.has(s.state)||typeof s.authorized!=="boolean"||!Array.isArray(s.dependsOn)||!Number.isInteger(s.distinctRemedies)||s.distinctRemedies<0)return result("BLOCKED",null,"INVALID_STEP");
    ids.add(s.id);
  }
  if(steps.some(s=>s.dependsOn.some(d=>!ids.has(d)||d===s.id)))return result("BLOCKED",null,"INVALID_DEPENDENCY");
  if(mode!=="UNTIL_REQUIRED_GATE"&&(!currentPackage||!steps.some(s=>s.packageId===currentPackage)))return result("BLOCKED",null,"MISSING_PACKAGE");
  const scoped=steps.filter(s=>mode==="UNTIL_REQUIRED_GATE"||s.packageId===currentPackage);
  if(new Set(completedStepIdsThisTurn).size!==completedStepIdsThisTurn.length||completedStepIdsThisTurn.some(id=>!scoped.some(s=>s.id===id&&s.authorized&&s.state==="VERIFIED_DONE")))return result("BLOCKED",null,"UNVERIFIED_COMPLETION");
  if(mode==="ONE_STEP"&&completedStepIdsThisTurn.length>=1)return result("STEP_COMPLETE");
  const open=scoped.filter(s=>s.state!=="VERIFIED_DONE");
  if(!open.length)return result(mode==="UNTIL_REQUIRED_GATE"?"DONE":"PACKAGE_COMPLETE");
  const p0Open=steps.some(s=>s.priority==="P0"&&s.state!=="VERIFIED_DONE");
  const candidates=open.filter(s=>s.authorized&&(!p0Open||s.priority==="P0")&&s.dependsOn.every(id=>steps.find(x=>x.id===id).state==="VERIFIED_DONE"));
  const ready=candidates.find(s=>s.state==="READY");
  if(ready)return result("RUN_STEP",ready.id);
  const retry=candidates.find(s=>s.state==="RECOVERABLE"&&s.distinctRemedies<3);
  if(retry)return result("RETRY_STEP",retry.id);
  const human=candidates.find(s=>s.state==="HUMAN_REQUIRED");
  if(human)return result("ASK_HUMAN",human.id,"PROTECTED_DECISION");
  const blocked=candidates.find(s=>s.state==="CAPABILITY_BLOCKED"||s.state==="RECOVERABLE");
  return result("BLOCKED",blocked?.id??null,blocked?"CAPABILITY_OR_REMEDY_LIMIT":"DEPENDENCY_PRIORITY_OR_AUTHORITY");
}
