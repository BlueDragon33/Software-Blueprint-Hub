import "server-only";

import {
  assessCanonicalContinuousReadiness,
  type ContinuousExecutionAssessment
} from "../../../../packages/core/src/continuous-execution";
import type { ProjectWorkspaceLoadResult } from "./project-workspace";
import { registeredGovernedRepository, registeredWorkflowSummaries, verifiedRepoHead } from "./prompt-workflow";

export type AuthorizedProjectWorkspace = Extract<
  ProjectWorkspaceLoadResult, { readonly state: "ready" }
>;

export interface AuthenticatedContinuousSnapshot {
  readonly assessment: ContinuousExecutionAssessment;
  readonly profileVersion: number;
  readonly canonicalRevision: string | null;
  readonly appHead: string | null;
  readonly selectedWorkflowId: string | null;
}

/**
 * Authenticated canonical Profile/Work/Gate read plus a live, server-verified
 * GitHub HEAD. Called only after PROJECT_READ via loadProjectWorkspace.
 * Neither this read nor a UI render can issue an execution grant.
 */
export async function readAuthenticatedContinuousPreflight(
  workspace: AuthorizedProjectWorkspace
): Promise<AuthenticatedContinuousSnapshot> {
  const { runtime, actor, project, projectId } = workspace;
  const [workPackages, bundles, canonicalRevision, canMutate] = await Promise.all([
    runtime.workQuality.listWorkPackages(actor, projectId),
    runtime.workQuality.listQualityGates(actor, projectId),
    runtime.prompts.currentSourceRevisionFromProfile(actor, projectId, project),
    runtime.authority.can(actor, projectId, "PROJECT_MUTATE")
  ]);
  const registeredRepo = registeredGovernedRepository(projectId);
  const workflows = registeredWorkflowSummaries(projectId);
  const selectedWorkflow = workflows.find(row =>
    row.projectId === projectId && row.repository === registeredRepo
  ) ?? null;
  let appHead: string | null = null;
  if (registeredRepo) {
    try {
      appHead = await verifiedRepoHead(registeredRepo);
    } catch {
      // Network failure or missing verified repository HEAD fails closed.
      // No fallback to caller input, presentation metadata or prior SHA.
    }
  }
  const assessment = assessCanonicalContinuousReadiness({
    projectId,
    profileVersion: project.profile.meta.recordVersion,
    canonicalRevision,
    appHead,
    canMutate,
    requiredGateIds: project.blueprint.requiredGates,
    workPackages,
    gates: bundles.map(row => row.gate)
  });
  return Object.freeze({
    assessment, profileVersion: project.profile.meta.recordVersion,
    canonicalRevision, appHead,
    selectedWorkflowId: selectedWorkflow?.workflowId ?? null
  });
}
