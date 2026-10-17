import "server-only";

import {
  assessCanonicalContinuousReadiness,
  planContinuousRecovery,
  type ContinuousRecoveryAction,
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
  readonly recoveryActions: readonly ContinuousRecoveryAction[];
  readonly canMutate: boolean;
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
    // Resolve transient read outages with one bounded, side-effect-free retry.
    // Never retry 401/403; never replace an unavailable SHA with a stale one.
    for (let attempt=0;attempt<2;attempt++) {
      try {
        appHead = await verifiedRepoHead(registeredRepo);
        break;
      } catch (error) {
        if (attempt===1 || /HTTP (?:401|403|404|429)/.test(String(error))) break;
      }
    }
  }
  const canonicalSource = {
    projectId,
    profileVersion: project.profile.meta.recordVersion,
    canonicalRevision,
    appHead,
    canMutate,
    requiredGateIds: project.blueprint.requiredGates,
    workPackages,
    gates: bundles.map(row => row.gate)
  };
  const assessment = assessCanonicalContinuousReadiness(canonicalSource);
  const recoveryActions = planContinuousRecovery(canonicalSource, assessment);
  return Object.freeze({
    assessment, profileVersion: project.profile.meta.recordVersion,
    canonicalRevision, appHead,
    selectedWorkflowId: selectedWorkflow?.workflowId ?? null,
    recoveryActions,canMutate
  });
}
