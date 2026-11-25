// Advisory continuation decision; no IO, mutation, runner, or authority grant.
export const MODES=Object.freeze(["ONE_STEP","ONE_PACKAGE","UNTIL_REQUIRED_GATE","FINISH_PRODUCT"]);
const STATES=new Set(["VERIFIED_DONE","READY","RECOVERABLE","HUMAN_REQUIRED","CAPABILITY_BLOCKED"]);
const result=(action,stepId=null,reason=null)=>({action,stepId,reason});
export function decideContinuation({mode="UNTIL_REQUIRED_GATE",sourceVerified=false,scopeAuthorized=false,completedStepIdsThisTurn=[],currentPackage=null,productScopeVerified=false,productCompletionVerified=false,steps=[]}={}){
  if(!MODES.includes(mode)||sourceVerified!==true||scopeAuthorized!==true||!Array.isArray(completedStepIdsThisTurn)||!Array.isArray(steps)||steps.length===0)return result("BLOCKED",null,"UNVERIFIED_CONTEXT");
  const ids=new Set();
  for(const s of steps){
    if(!s||typeof s.id!=="string"||!s.id||ids.has(s.id)||typeof s.packageId!=="string"||!s.packageId||!["P0","P1"].includes(s.priority)||!STATES.has(s.state)||typeof s.authorized!=="boolean"||!Array.isArray(s.dependsOn)||!Number.isInteger(s.distinctRemedies)||s.distinctRemedies<0)return result("BLOCKED",null,"INVALID_STEP");
    ids.add(s.id);
  }
  if(steps.some(s=>s.dependsOn.some(d=>!ids.has(d)||d===s.id)))return result("BLOCKED",null,"INVALID_DEPENDENCY");
  const wholeScope=mode==="UNTIL_REQUIRED_GATE"||mode==="FINISH_PRODUCT";
  if(mode==="FINISH_PRODUCT"&&productScopeVerified!==true)return result("BLOCKED",null,"UNVERIFIED_PRODUCT_SCOPE");
  if(!wholeScope&&(!currentPackage||!steps.some(s=>s.packageId===currentPackage)))return result("BLOCKED",null,"MISSING_PACKAGE");
  const scoped=steps.filter(s=>wholeScope||s.packageId===currentPackage);
  if(new Set(completedStepIdsThisTurn).size!==completedStepIdsThisTurn.length||completedStepIdsThisTurn.some(id=>!scoped.some(s=>s.id===id&&s.authorized&&s.state==="VERIFIED_DONE")))return result("BLOCKED",null,"UNVERIFIED_COMPLETION");
  if(mode==="ONE_STEP"&&completedStepIdsThisTurn.length>=1)return result("STEP_COMPLETE");
  const open=scoped.filter(s=>s.state!=="VERIFIED_DONE");
  if(!open.length){
    if(mode==="FINISH_PRODUCT")return productCompletionVerified===true&&scoped.every(s=>s.authorized)
      ?result("PRODUCT_READY_FOR_PUBLICATION_REVIEW",null,"OWNER_DECISION_REQUIRED")
      :result("BLOCKED",null,"PRODUCT_ACCEPTANCE_EVIDENCE_REQUIRED");
    return result(mode==="UNTIL_REQUIRED_GATE"?"DONE":"PACKAGE_COMPLETE");
  }
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

// Host adapter must resolve attachment identities and versions; this pure helper performs no IO or upload.
export function attachmentBinding(attachments=[]){
  if(!Array.isArray(attachments)||attachments.length>32)return null;
  const seen=new Set(),refs=[];
  for(const a of attachments){
    if(!a||!["image","file"].includes(a.kind)||typeof a.id!=="string"||!a.id.trim()||a.id.length>512||typeof a.version!=="string"||!a.version.trim()||a.version.length>512||a.accessible!==true||seen.has(a.id))return null;
    seen.add(a.id);refs.push([a.kind,a.id,a.version]);
  }
  return JSON.stringify(refs.sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:0));
}
// Pure candidate prompt-review state; UI must dispatch every relevant change.
export function initialPromptReview(){return {context:null,draft:null,approved:false};}
export function promptReviewTransition(state,event){
  if(!state||!event)return initialPromptReview();
  switch(event.type){
    case "GENERATE": {
      const x=event.context;
      const binding=attachmentBinding(x?.attachments);
      const terminal=terminalBinding(x?.terminalResult);
      const suggestion=x?.suggestion??"";
      if(!x||binding===null||terminal===null||typeof suggestion!=="string"||suggestion.length>2000||!MODES.includes(x.mode)||typeof x.requirements!=="string"||x.requirements.length>2000||typeof x.revision!=="string"||!x.revision.trim()||typeof event.draft!=="string"||!event.draft.trim())return initialPromptReview();
      return {context:{mode:x.mode,requirements:x.requirements,revision:x.revision,attachmentBinding:binding,terminalBinding:terminal,suggestion},draft:event.draft,approved:false};
    }
    case "CHANGE_CONTEXT":return initialPromptReview();
    case "EDIT":return state.context&&typeof event.draft==="string"?{...state,draft:event.draft,approved:false}:initialPromptReview();
    case "REVIEW":return {...state,approved:!!state.context&&typeof state.draft==="string"&&!!state.draft.trim()};
    case "SEND":return {...state,approved:false};
    default:return {...state,approved:false};
  }
}
export function canSendReviewedPrompt(state,context){return !!(state?.approved===true&&state.context&&typeof state.draft==="string"&&state.draft.trim()&&context&&state.context.mode===context.mode&&state.context.requirements===context.requirements&&state.context.revision===context.revision&&state.context.attachmentBinding===attachmentBinding(context.attachments)&&state.context.terminalBinding===terminalBinding(context.terminalResult)&&state.context.suggestion===(context.suggestion??""));}

// Exact raw output is data; never passed to a shell by this helper.
export function terminalBinding(result){
 if(result===undefined||result===null)return JSON.stringify(null);
 if(!["PowerShell","CMD"].includes(result.shell)||typeof result.text!=="string"||result.text.length>30000)return null;
 return JSON.stringify([result.shell,result.text]);
}
// Draft buffers remain untouched during input; no auto-generation on composition events.
export function inputBufferTransition(state,event){
 if(!state||!event)return {raw:"",composing:false,dirty:false};
 if(event.type==="COMPOSITION_START")return {...state,composing:true};
 if(event.type==="INPUT"||event.type==="COMPOSITION_END")return typeof event.text==="string"?{...state,raw:event.text,composing:event.type==="INPUT"?state.composing:false,dirty:true}:state;
 return state;
}
export function canGenerateFromBuffer(state,max=2000){return !!(state&&!state.composing&&typeof state.raw==="string"&&state.raw.length<=max);}

// Explicit execution budget for a generated chat prompt; not an unattended runner.
export function executionDirectionInstruction(mode){
 switch(mode){
 case "ONE_STEP": return "Complete exactly one eligible canonical step: implement, verify and checkpoint it, then stop. Do not advance to the next step.";
 case "ONE_PACKAGE": return "Complete the current canonical work package, including all eligible dependency-ordered steps and acceptance evidence. Stop at package completion or a mandatory boundary; do not start another package.";
 case "UNTIL_REQUIRED_GATE": return "Continue across eligible authorized packages in dependency and P0 order. After each verified step checkpoint and re-evaluate. Stop only at completion or a genuine mandatory human/capability boundary after exhausting safe independent work. No unattended promise.";
 case "FINISH_PRODUCT": return "Complete the entire approved product scope, including code, actual QA, regression, UX, release artifact and rollback evidence, without routine approval. Keep working across eligible packages until the exact candidate is ready for Owner publication review or a genuine mandatory boundary after exhausting safe independent work. Do not publish or merge. After authorized publication, validate actual deployed revision, incorporate feedback on the draft, reverify and obtain fresh publication authority for changed SHA. Only after exact deployed revision is accepted and separately authorized may the protected main merge be considered. No unattended promise.";
 default: throw new TypeError("Unknown execution direction");
 }
}

// Advisory projection only. Inputs must be resolved by an authenticated authority
// adapter from canonical evidence. This helper cannot verify or issue approval.
export function decideProductRelease(input={}){
  const {sourceVerified=false,candidateRevision,technicalEvidenceRevision,rollbackEvidenceRevision,
    publicationRouteVerified=false,publicationAuthorityRevision,deployedRevision,
    ownerAcceptanceRevision,mergeAuthorityRevision,mergeBaseVerified=false}=input;
  const exact=v=>typeof v==="string"&&/^[0-9a-f]{40}$/.test(v);
  const out=(action,reason)=>({action,reason,advisoryOnly:true,grantsAuthority:false});
  if(sourceVerified!==true||!exact(candidateRevision))return out("BLOCKED","UNVERIFIED_CANDIDATE");
  if(technicalEvidenceRevision!==candidateRevision||rollbackEvidenceRevision!==candidateRevision)
    return out("CONTINUE_ENGINEERING","EXACT_CANDIDATE_EVIDENCE_REQUIRED");
  if(publicationRouteVerified!==true)return out("BLOCKED","PROTECTED_PUBLICATION_ROUTE_UNVERIFIED");
  if(publicationAuthorityRevision!==candidateRevision)return out("AWAIT_OWNER_PUBLICATION","EXACT_PUBLICATION_AUTHORITY_REQUIRED");
  if(deployedRevision!==candidateRevision)return out("READY_FOR_PROTECTED_PUBLICATION_REVIEW","DEPLOYMENT_NOT_OBSERVED");
  if(ownerAcceptanceRevision!==candidateRevision)return out("AWAIT_OWNER_ACCEPTANCE","EXACT_DEPLOYED_USER_ACCEPTANCE_REQUIRED");
  if(mergeBaseVerified!==true)return out("CONTINUE_ENGINEERING","RECONCILE_BASE_AND_REVERIFY");
  if(mergeAuthorityRevision!==candidateRevision)return out("AWAIT_OWNER_MERGE","EXACT_MERGE_AUTHORITY_REQUIRED");
  return out("READY_FOR_PROTECTED_MERGE_REVIEW","SEPARATE_TRUSTED_GATE_REQUIRED");
}
