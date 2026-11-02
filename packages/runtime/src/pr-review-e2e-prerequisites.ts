/**
 * Read-only canonical prerequisite inspection for an authorized PR v2 run.
 * It does not create a grant, claim a journal nonce, or authorize execution.
 * All reads are through the existing authenticated WorkQuality application
 * services / canonical issuer and adoption repositories.
 */
import type { AuthenticatedActor } from "@blueprint-os/core";
import type { WorkQualityApplicationService, ProjectProfileApplicationService } from "@blueprint-os/application";
import type { PostgresWorkflowExecutionAuthorityRepository } from "@blueprint-os/persistence";

const DIGEST=/^sha256:[a-f0-9]{64}$/;
const ID=/^[a-z][a-z0-9-]{1,79}$/;
const PROJECT=/^project:[a-z0-9-]+$/;
type WorkReader = Pick<WorkQualityApplicationService,"listWorkPackages"|"listQualityGates">;
type ProfileReader = Pick<ProjectProfileApplicationService,"read">;
type AuthorityReader = Pick<PostgresWorkflowExecutionAuthorityRepository,"latestAdoption"|"latestIssuer">;
function deny(reason:string):never{throw new Error("AUTHENTICATED_PR_E2E_BLOCKED: "+reason);}

export async function inspectCanonicalPrReviewPrerequisites(
 input:{
  readonly actor:AuthenticatedActor|null;
  readonly projectId:string;readonly workPackageId:string;
  readonly workflowId:string;readonly workflowDigest:string;
  readonly issuerId:string;readonly policyVersion:string;
 },
 sources:{readonly profile:ProfileReader;readonly work:WorkReader;readonly decisions:AuthorityReader}
):Promise<{
 readonly status:"CANONICAL_PREREQUISITES_OBSERVED_ONLY";
 readonly projectId:string;readonly workPackageId:string;readonly workflowDigest:string;
 readonly recordVersion:number;readonly gateCount:number;
 readonly authenticatedE2EVerified:false;readonly qualityGatePassed:false;
 readonly productionAuthorized:false;readonly humanApproved:false;
}>{
 if(!input || !PROJECT.test(input.projectId??"") ||
    typeof input.workPackageId!=="string" || input.workPackageId.length>160 ||
    !ID.test(input.workflowId??"") || !ID.test(input.issuerId??"") ||
    !DIGEST.test(input.workflowDigest??"") || input.policyVersion!=="1.3.0" ||
    !input.actor?.principalId){
  deny("invalid trusted canonical request or missing authenticated actor");
 }
 // Never infer authority from a GitHub PR body or a generated prompt.
 const p=await sources.profile.read(input.actor,input.projectId);
 if(!p || p.profile.projectId!==input.projectId ||
    p.profile.meta.recordVersion<1)deny("canonical project profile missing or stale");
 const packages=await sources.work.listWorkPackages(input.actor,input.projectId);
 const wp=packages.find(w=>w.id===input.workPackageId);
 if(!wp || wp.projectId!==input.projectId ||
    !["ready","in-progress","testing","review"].includes(wp.status) ||
    wp.meta.recordVersion<1 ||
    !Array.isArray(wp.acceptanceCriteria) || !wp.acceptanceCriteria.length ||
    !Array.isArray(wp.qualityGateIds) || !wp.qualityGateIds.length ||
    new Set(wp.qualityGateIds).size!==wp.qualityGateIds.length){
  deny("current canonical Work Package missing, blocked, or incomplete");
 }
 const gates=await sources.work.listQualityGates(input.actor,input.projectId);
 for(const id of wp.qualityGateIds){
  const bundle=gates.find(x=>x.gate.id===id);
  if(!bundle || bundle.gate.projectId!==input.projectId ||
     !["not-ready","candidate","pass"].includes(bundle.gate.status)){
   deny("required canonical Quality Gate absent, foreign, or failed");
  }
 }
 const [adoption,issuer]=await Promise.all([
  sources.decisions.latestAdoption(input.projectId,input.workflowId,input.workflowDigest),
  sources.decisions.latestIssuer(input.projectId,input.workflowId,input.issuerId)
 ]);
 if(!adoption || adoption.decision!=="adopt" ||
    adoption.policyVersion!==input.policyVersion ||
    !issuer || issuer.decision!=="allow" ||
    issuer.policyVersion!==input.policyVersion ||
    !issuer.publicKeyPem?.startsWith("-----BEGIN PUBLIC KEY-----")){
  deny("canonical adoption or current issuer authorization missing/revoked");
 }
 return Object.freeze({
  status:"CANONICAL_PREREQUISITES_OBSERVED_ONLY",
  projectId:input.projectId,workPackageId:wp.id,
  workflowDigest:input.workflowDigest,recordVersion:wp.meta.recordVersion,
  gateCount:wp.qualityGateIds.length,
  authenticatedE2EVerified:false,qualityGatePassed:false,
  productionAuthorized:false,humanApproved:false
 });
}
