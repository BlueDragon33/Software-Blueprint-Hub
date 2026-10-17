import "server-only";
import { preflightGateDigest, type PreflightBinding } from "../../../../packages/persistence/src/continuous-preflight-repository";
import { CONSTITUTION_POLICY_VERSION } from "@blueprint-os/application";

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
  readonly canAttest: boolean;
  readonly preflightBinding: PreflightBinding | null;
  readonly preflightSequence: number;
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
  const [workPackages, bundles, canonicalRevision, canMutate, risks, debts] = await Promise.all([
    runtime.workQuality.listWorkPackages(actor, projectId),
    runtime.workQuality.listQualityGates(actor, projectId),
    runtime.prompts.currentSourceRevisionFromProfile(actor, projectId, project),
    runtime.authority.can(actor, projectId, "PROJECT_MUTATE"),
    runtime.governance.listRisks(actor,projectId),
    runtime.governance.listTechnicalDebt(actor,projectId)
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
    gates: bundles.map(row => row.gate),
    evidence: bundles.flatMap(row => row.evidence)
  };
  const rawCandidate = assessCanonicalContinuousReadiness(canonicalSource);
  const suspectedWork = workPackages.find(w => w.id === rawCandidate.nextWorkId);
  const inScope = (ids: readonly string[]) =>
    ids.length===0 || (suspectedWork!==undefined && ids.includes(suspectedWork.id));
  const activeCriticalRisks=risks.filter(r =>
    inScope(r.linkedWorkPackageIds) &&
    (r.impact==="critical" || r.impact==="high") &&
    (r.status==="open" || r.status==="mitigating"));
  const activeCriticalDebts=debts.filter(d =>
    inScope(d.linkedWorkPackageIds) &&
    (d.severity==="critical" || d.severity==="high") &&
    (d.status==="open" || d.status==="planned" || d.status==="in-progress"));
  const blockingIds=[...activeCriticalRisks.map(r=>r.id),...activeCriticalDebts.map(d=>d.id)];
  // A newly recorded critical blocker revokes the offer by immediately
  // changing the authenticated readiness state. No optimistic PASS.
  const candidate = blockingIds.length && rawCandidate.state==="READY_WORK_FOUND"
    ? Object.freeze({...rawCandidate,state:"BLOCKED" as const,
        nextWorkId:null,nextWorkTitle:null,
        reasons:Object.freeze([...rawCandidate.reasons,
          "Unresolved critical risk/technical debt: "+blockingIds.join(", ")])})
    : rawCandidate;
  const selectedWork = workPackages.find(w => w.id === candidate.nextWorkId);
  const canAttest = await runtime.authority.can(actor,projectId,"PROJECT_ADMIN");
  let preflightBinding: PreflightBinding | null = null;
  let preflightSequence = 0;
  let preflightEvidenceReady = false;
  if (candidate.state === "READY_WORK_FOUND" && selectedWork &&
      canonicalRevision && appHead && registeredRepo) {
    const gateDigest = preflightGateDigest({
      bundles: bundles.map(b => ({
        gate:b.gate,evidence:[...b.evidence].sort((a,b)=>a.id.localeCompare(b.id))
      })).sort((a,b)=>a.gate.id.localeCompare(b.gate.id)),
      risks:[...risks].sort((a,b)=>a.id.localeCompare(b.id)),
      debts:[...debts].sort((a,b)=>a.id.localeCompare(b.id))
    });
    // Eight evidence anchors are derived on the server from the real canonical
    // Profile, WorkQuality and governed HEAD; no client-provided PASS bits.
    preflightBinding = {
      projectId, workId:selectedWork.id,
      profileVersion:project.profile.meta.recordVersion,
      workVersion:selectedWork.meta.recordVersion,
      canonicalDigest:canonicalRevision, appHead,gateDigest,
      policyVersion:CONSTITUTION_POLICY_VERSION,
      checks:[
        {id:"effective-authority",evidence:"canonical:authority:"+projectId},
        {id:"product-goal-and-exit-criteria",evidence:"canonical:work:"+selectedWork.id},
        {id:"current-source-and-checkpoint",evidence:"canonical:revision:"+canonicalRevision},
        {id:"critical-path-and-dependencies",evidence:"canonical:dependencies:"+canonicalRevision},
        {id:"blocking-defects-and-repair",evidence:"canonical:known-blockers:"+gateDigest},
        {id:"relevant-quality-gates",evidence:"canonical:quality:"+gateDigest},
        {id:"risk-human-and-capability-boundaries",evidence:"canonical:owner-attestation:"+projectId},
        {id:"durable-handoff",evidence:"canonical:handoff:"+canonicalRevision}
      ]
    };
    const latest = await runtime.continuousPreflight.latest(actor,preflightBinding);
    preflightSequence = latest?.sequence ?? 0;
    preflightEvidenceReady = latest?.current === true;
  }
  const assessment = Object.freeze({...candidate,preflightEvidenceReady});
  const recoveryActions = planContinuousRecovery(canonicalSource, assessment);
  return Object.freeze({
    assessment, profileVersion: project.profile.meta.recordVersion,
    canonicalRevision, appHead,
    selectedWorkflowId: selectedWorkflow?.workflowId ?? null,
    recoveryActions,canMutate,canAttest,preflightBinding,preflightSequence
  });
}
