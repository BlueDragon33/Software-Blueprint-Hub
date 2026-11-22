/** Candidate integration adapter: existing Graph Intelligence remains canonical read projection.
 * No new registry, no graph mutation, no host execution. */
import { validateAtlas, verifyVerticalSlice } from "./atlas-graph.candidate.mjs";
import { selectUniversalNextAction } from "./universal-next-action-frontier.candidate.mjs";
const sha=/^[a-f0-9]{40}$/;
const fail=(reason)=>Object.freeze({state:"blocked",reason,mayExecute:false});
/** Server must authenticate PROJECT_READ before passing data to this pure adapter. */
export function projectAtlasAndNextAction({graph,atlas,workSnapshot,authorizedProjectId}){
 if(!graph||graph.canonicalMutationAllowed!==false||graph.qualityGateMutationAllowed!==false||graph.agentDispatchAllowed!==false||graph.releaseAuthority!==false)return fail("Graph Intelligence read-only contract missing");
 if(!authorizedProjectId||graph.projectId!==authorizedProjectId||atlas?.projectId!==authorizedProjectId||workSnapshot?.projectId!==authorizedProjectId)return fail("Project scope mismatch");
 if(!sha.test(graph.sourceCodeRevision??"")||atlas.sourceRevision!==graph.sourceCodeRevision)return fail("Pinned Git graph revision missing or inconsistent");
 const canonicalWorkRevision=workSnapshot.sourceRevision;
 const samePinnedSource=canonicalWorkRevision===graph.sourceCodeRevision;
 const sameCanonicalSource=/^sha256:[a-f0-9]{64}$/.test(canonicalWorkRevision??"") &&
   canonicalWorkRevision===graph.canonicalSourceRevision;
 if(!samePinnedSource&&!sameCanonicalSource)return fail("Canonical Prompt revision is not bound to pinned graph source");
 const v=validateAtlas(atlas);if(!v.valid)return fail("Atlas invalid: "+v.errors.map(e=>e.code).join(","));
 if(atlas.nodes.some(n=>n.factState==="verified"&&n.provenance.revision!==graph.sourceCodeRevision))return fail("Verified node source revision mismatch");
 let next;try{next=selectUniversalNextAction(workSnapshot);}catch(e){return fail("Work frontier invalid: "+String(e.message));}
 // A graph projection is not an execution token. The UI can send guidance only.
 const safeAction=Object.freeze({...next,mayExecute:false,kind:next.kind==="execute-eligible"?"send-guidance":next.kind});
 return Object.freeze({state:"ready",projectId:authorizedProjectId,sourceRevision:graph.sourceCodeRevision,
  atlas,graphFingerprint:graph.fingerprint,canonicalSourceRevision:canonicalWorkRevision,nextAction:safeAction,
  permissions:Object.freeze({readOnly:true,canMutate:false,canDispatch:false,canRelease:false}),
  traceSlice:(ids)=>verifyVerticalSlice(atlas,ids)});
}
