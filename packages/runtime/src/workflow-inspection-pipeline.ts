import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  executeEvidenceBoundWorkflowNode,
  verifyWorkflowExecutionGrant,
  workflowExecutionGrantSigningPayload,
  type WorkflowExecutionTrustedDependencies,
  type WorkflowExecutionReport,
  type WorkflowExecutionGrant,
  type WorkflowAttemptRecord,
  type WorkflowScopedAction
} from "@blueprint-os/application";
import type { PinnedInspectionQaReport } from "./workflow-observation-qa";
import { INDEPENDENT_INSPECTION_VERIFIER_ID, type DurableInspectionQaRecord } from "./workflow-inspection-qa-journal";

type Manifest = Parameters<typeof executeEvidenceBoundWorkflowNode>[1];
type SourceContext = Parameters<typeof executeEvidenceBoundWorkflowNode>[2];

export interface WorkflowInspectionJournalReadback {
  read(requestId: string): Promise<{
    readonly claimed: boolean;
    readonly attempts: readonly WorkflowAttemptRecord[];
  }>;
}

export interface WorkflowInspectionQa {
  verify(action: WorkflowScopedAction, observation: WorkflowAttemptRecord): Promise<PinnedInspectionQaReport>;
}

export interface WorkflowInspectionDependencies extends Omit<WorkflowExecutionTrustedDependencies, "journal"> {
  /** Persisted claim and attempt read-back, never a copy of the runner response. */
  readonly journal: WorkflowExecutionTrustedDependencies["journal"] & WorkflowInspectionJournalReadback;
  readonly qa: WorkflowInspectionQa;
  /** Independent QA records MUST persist in a separate append-only table. */
  readonly qaJournal: {
    appendVerified(record: DurableInspectionQaRecord): Promise<void>;
    readVerified(requestId: string, attempt: number): Promise<DurableInspectionQaRecord | null>;
  };
}

export interface WorkflowInspectionOutcome {
  readonly status: "independently-verified" | "verification-blocked";
  readonly execution: WorkflowExecutionReport;
  readonly qa: PinnedInspectionQaReport | null;
  /** A byte match is NOT a signed completion receipt or a canonical quality decision. */
  readonly completionReceiptIssued: false;
  readonly qualityGatePassed: false;
  readonly productionAuthorized: false;
}

function requestIdFor(grant: WorkflowExecutionGrant): string {
  return "sha256:" + createHash("sha256")
    .update(workflowExecutionGrantSigningPayload(grant))
    .digest("hex");
}

/**
 * Dormant, internal read-only composition:
 * independently authorized signed inspection -> bounded runner ->
 * durable journal read-back -> independent GitHub byte verification.
 *
 * Neither manifests, runner responses nor QA reports authorize a new
 * workflow adoption, canonical Quality Gate, receipt or Production.
 * This function does not install a public route or schedule itself.
 */
export async function executeAndVerifyScopedInspection(
  grantInput: unknown,
  workflow: Manifest,
  context: SourceContext,
  deps: WorkflowInspectionDependencies
): Promise<WorkflowInspectionOutcome> {
  const { grant, node } = await verifyWorkflowExecutionGrant(
    grantInput, workflow, context, deps.authority,
    deps.clock?.() ?? new Date()
  );
  if (grant.mode !== "inspect-scoped") {
    throw new Error("Independent inspection pipeline only accepts read-only inspection grants");
  }
  // Preflight before any execution. Existing application verifier repeats the
  // signature, policy, adoption and permission checks during actual dispatch.
  await deps.freshness.assertCurrent(context);
  const execution = await executeEvidenceBoundWorkflowNode(
    grant, workflow, context, deps
  );
  const expected = requestIdFor(grant);
  if (execution.requestId !== expected || execution.nodeId !== node.id ||
      execution.completionReceiptIssued !== false ||
      execution.qualityGatePassed !== false ||
      execution.productionAuthorized !== false) {
    throw new Error("Execution report does not match the signed grant or authority boundary");
  }

  const stored = await deps.journal.read(expected);
  if (!stored.claimed ||
      !Array.isArray(stored.attempts) ||
      !isDeepStrictEqual(stored.attempts, execution.observations) ||
      stored.attempts.length !== execution.attempts) {
    throw new Error("Durable execution journal does not match reported attempts");
  }
  // Do not claim independent verification for a failed execution. The failed
  // attempt is still durably auditable and remains in the original work item.
  if (execution.status !== "submitted-for-verification") {
    return Object.freeze({
      status: "verification-blocked" as const,
      execution, qa: null,
      completionReceiptIssued: false as const,
      qualityGatePassed: false as const,
      productionAuthorized: false as const
    });
  }

  const success = stored.attempts.at(-1);
  if (!success || success.outcome !== "succeeded" ||
      success.attempt < 1 || success.attempt > grant.maxAttempts) {
    throw new Error("No successful durably persisted inspection attempt");
  }
  await deps.freshness.assertCurrent(context);
  const action: WorkflowScopedAction = Object.freeze({
    requestId: expected,
    projectId: context.projectId,
    repository: context.repository,
    appHead: context.appHead,
    nodeId: node.id,
    mode: grant.mode,
    allowedPaths: Object.freeze([...grant.allowedPaths]),
    maxFiles: grant.maxFiles,
    maxTokenEstimate: grant.maxTokenEstimate,
    attempt: success.attempt
  });
  const qa = await deps.qa.verify(action, success);
  await deps.freshness.assertCurrent(context);
  if (qa.requestId !== expected || qa.sourceRevision !== context.appHead ||
      qa.observationDigest !== success.observationDigest ||
      qa.status !== "verified-inspection-bytes" ||
      qa.completionReceiptIssued !== false || qa.qualityGatePassed !== false ||
      qa.productionAuthorized !== false) {
    throw new Error("Independent QA response is not bound to the persisted observation");
  }
  const proof: DurableInspectionQaRecord = Object.freeze({
    requestId: expected,
    attempt: success.attempt,
    observationDigest: qa.observationDigest,
    sourceRevision: context.appHead,
    verifiedFiles: qa.verifiedFiles,
    verifierId: INDEPENDENT_INSPECTION_VERIFIER_ID
  });
  // A successful runtime QA computation is not durable until persisted AND
  // independently read back. Storage failures must never be swallowed.
  await deps.qaJournal.appendVerified(proof);
  const storedProof = await deps.qaJournal.readVerified(expected, success.attempt);
  if (!storedProof || !isDeepStrictEqual(storedProof, proof)) {
    throw new Error("Durable QA verification read-back does not match independently observed bytes");
  }
  return Object.freeze({
    status: "independently-verified" as const,
    execution, qa,
    completionReceiptIssued: false as const,
    qualityGatePassed: false as const,
    productionAuthorized: false as const
  });
}
