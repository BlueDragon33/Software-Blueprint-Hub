import "server-only";

import {
  CONSTITUTION_POLICY_VERSION,
  verifyWorkflowExecutionGrant,
  type WorkflowExecutionGrant
} from "@blueprint-os/application";
import { PostgresWorkflowExecutionAuthority } from "@blueprint-os/runtime";
import { canOfferContinuousExecution } from "../../../../packages/core/src/continuous-execution";
import {
  readRegisteredWorkflowReadiness,
  registeredWorkflowManifest,
  registeredGovernedRepository
} from "./prompt-workflow";
import type { AuthorizedProjectWorkspace, AuthenticatedContinuousSnapshot }
  from "./continuous-execution-preflight";

/**
 * Optional signed capability is provisioned independently on the trusted
 * server, never constructed from a browser confirmation, Project Profile or
 * template. Missing grants are the normal case and fail closed.
 */
function serverProvisionedGrant(projectId: string): unknown | null {
  const raw=process.env.BLUEPRINT_CONTINUOUS_SIGNED_GRANTS_JSON?.trim();
  if (!raw) return null;
  if (raw.length>30000) throw new Error("Signed grant inventory exceeds bounded size.");
  const parsed:unknown=JSON.parse(raw);
  if (!parsed || typeof parsed!=="object" || Array.isArray(parsed) ||
      !Object.hasOwn(parsed,projectId)) return null;
  return (parsed as Record<string,unknown>)[projectId];
}

/**
 * Executable only for an independently signed, adopted, scoped
 * inspect-scoped node with fresh trusted canonical state and available receipt
 * dependencies. Never broadens to EDIT/TEST/RELEASE with a read-only runner.
 */
export async function readVerifiedContinuousExecutionOffer(
  workspace: AuthorizedProjectWorkspace,
  preflight: AuthenticatedContinuousSnapshot
) {
  if (!canOfferContinuousExecution(preflight.assessment) ||
      !preflight.assessment.nextWorkId ||
      !preflight.appHead) return null;
  const candidate=serverProvisionedGrant(workspace.projectId);
  if (!candidate || typeof candidate!=="object" ||
      !("workflowId" in candidate) ||
      typeof candidate.workflowId!=="string") return null;

  const manifest=registeredWorkflowManifest(workspace.projectId,candidate.workflowId);
  const repo=registeredGovernedRepository(workspace.projectId);
  if (!manifest || manifest.status!=="approved" || !repo ||
      manifest.project.repo!==repo) return null;

  await workspace.runtime.authority.require(
    workspace.actor,workspace.projectId,"PROJECT_MUTATE");
  const { plan }=await readRegisteredWorkflowReadiness(
    workspace.actor,workspace.projectId,manifest.workflowId);
  if (plan.appHead!==preflight.appHead ||
      plan.canonicalDigest!==preflight.canonicalRevision ||
      plan.policyVersion!==CONSTITUTION_POLICY_VERSION) return null;
  const context={
    projectId:workspace.projectId,repository:repo,
    appHead:preflight.appHead,canonicalDigest:plan.canonicalDigest,
    policyVersion:CONSTITUTION_POLICY_VERSION
  };
  const authority=await PostgresWorkflowExecutionAuthority.load(
    workspace.runtime.workflowExecutionAuthority,
    workspace.projectId,manifest.workflowId,CONSTITUTION_POLICY_VERSION);
  const {grant,node}=await verifyWorkflowExecutionGrant(
    candidate,manifest,context,authority,new Date());
  // A read-only safe executor has no authority to modify code or certify QA.
  if (grant.mode!=="inspect-scoped" || node.stage!=="DISCOVER" ||
      node.humanGate || !plan.readyNodeIds.includes(node.id) ||
      !plan.nodes.some(row=>row.id===node.id && row.state==="available")) return null;
  return Object.freeze({
    grant:grant as WorkflowExecutionGrant,manifest,context,plan,authority,
    workId:preflight.assessment.nextWorkId
  });
}
