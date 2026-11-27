/**
 * R3 — fail-closed source admission attached to the EXISTING Hub runtime.
 * Read-only queries against the canonical workflow authority, WorkPackage,
 * execution journal and independent P3 QA journal. Never authenticates a
 * Reviewer B agent, issues a review receipt, or mutates any Quality Gate.
 */
import { createHash } from "node:crypto";
import {
  CONSTITUTION_POLICY_VERSION,
  workflowExecutionGrantSigningPayload,
  type WorkflowExecutionGrant,
  validateReviewWorkOrder,
  verifyReviewSourceAdmission,
  type ReviewWorkOrder
} from "@blueprint-os/application";
import type { PostgresWorkQualityRepository, PostgresWorkflowExecutionAuthorityRepository } from "@blueprint-os/persistence";
import { PostgresWorkflowExecutionAuthority } from "./workflow-execution-authority";
import type { PostgresWorkflowExecutionJournal } from "./workflow-execution-journal";
import {
  PostgresWorkflowInspectionQaJournal,
  INDEPENDENT_INSPECTION_VERIFIER_ID
} from "./workflow-inspection-qa-journal";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const SHA = /^[a-f0-9]{40}$/;
const fail = (message: string): never => { throw new Error("G3_SOURCE_ADMISSION_BLOCKED: " + message); };

export interface ReviewerBSourceAdmissionInput {
  readonly order: ReviewWorkOrder;
  readonly grant: Parameters<typeof verifyReviewSourceAdmission>[1];
  readonly workflow: Parameters<typeof verifyReviewSourceAdmission>[2];
  readonly context: Parameters<typeof verifyReviewSourceAdmission>[3];
  /** Existing signed v1 inspection dispatch requestId; not a new work queue. */
  readonly requestId: string;
  readonly now: Date;
}

/**
 * Trust services are provided by createBlueprintServerRuntime, never by a
 * caller-controlled model payload. The signed grant is verified against the
 * adopted workflow and most recent issuer revocation state through the existing canonical stores.
 */
export class ReviewerBSourceAdmissionService {
  constructor(private readonly stores: Readonly<{
    authority: Pick<PostgresWorkflowExecutionAuthorityRepository,
      "latestAdoption" | "latestIssuer" | "currentAllowedIssuers">;
    workPackages: Pick<PostgresWorkQualityRepository, "findWorkPackageById">;
    execution: Pick<PostgresWorkflowExecutionJournal, "read">;
    qa: Pick<PostgresWorkflowInspectionQaJournal, "readVerified">;
  }>, private readonly clock: () => Date = () => new Date()) {}

  async verifySource(input: ReviewerBSourceAdmissionInput): Promise<Readonly<{
    status: "SOURCE_AND_P3_QA_JOURNAL_VERIFIED";
    sourceRevision: string;
    requestId: string;
    observationDigest: string;
    verifiedFiles: number;
    /** Historical, rechecked observation; never a lock or mutation permit. */
    admissionKind: "SOURCE_READBACK_ONLY";
    freshnessRecheckedAt: string;
    canonicalReviewWorkOrderVerified: false;
    signedPrIdentityVerified: false;
    orderByteScopeVerified: false;
    reviewHandoffAuthorized: false;
    canonicalWorkPackageCASVerified: true;
    signedSourceInspectionVerified: true;
    independentP3QaJournalVerified: true;
    reviewerBPrincipalVerified: false;
    reviewerBReviewExecuted: false;
    authenticatedReviewEvidenceIssued: false;
    qualityGatePassed: false;
    productionAuthorized: false;
  }>> {
    // Snapshot the input once: async callbacks cannot replace the admitted scope.
    const {order, grant, workflow, context, requestId, now} = structuredClone(input);
    if (!order || !workflow || !context || !(now instanceof Date) ||
        !Number.isFinite(now.getTime()) || !DIGEST.test(requestId ?? "") ||
        !SHA.test(order.sourceRevision ?? "")) {
      fail("invalid source request or current time");
    }
    validateReviewWorkOrder(order);
    // The pinned v2 bridge is 1.3-only. Do not silently use it after a successor build.
    if (String(CONSTITUTION_POLICY_VERSION) !== order.policyVersion ||
        context.policyVersion !== order.policyVersion) {
      fail("source policy mismatch; reconcile bridge with published policy before use");
    }
    // Only the server-owned clock is authoritative. A supplied invocation
    // timestamp cannot extend a grant across asynchronous reads.
    let lastTime = now.getTime();
    const currentTime = (): Date => {
      const at = this.clock();
      if (!(at instanceof Date) || !Number.isFinite(at.getTime()) || at.getTime() < lastTime) {
        return fail("invalid or backwards server clock");
      }
      lastTime = at.getTime();
      if (Date.parse(order.issuedAt) > lastTime || Date.parse(order.expiresAt) <= lastTime) {
        return fail("Hub order has expired or is not yet effective");
      }
      return at;
    };
    currentTime();
    const authority = await PostgresWorkflowExecutionAuthority.load(
      this.stores.authority, order.projectId, order.workflowId, order.policyVersion
    );
    // Actual Ed25519, adoption, latest issuer and WorkPackage.meta.recordVersion.
    const recheckAuthority = async (): Promise<void> => {
      await verifyReviewSourceAdmission(
        order, grant, workflow, context, authority, this.stores.workPackages, currentTime()
      );
      // A WorkOrder is not signed by this grant. Its lifetime must nevertheless
      // remain within that grant; never extend inspection permission.
      const signed = grant as WorkflowExecutionGrant;
      if (Date.parse(order.issuedAt) < Date.parse(signed.issuedAt) ||
          Date.parse(order.expiresAt) > Date.parse(signed.expiresAt)) {
        fail("WorkOrder lifetime exceeds signed inspection grant");
      }
      if (Date.parse(signed.expiresAt) <= currentTime().getTime()) fail("signed inspection grant expired");
    };
    await recheckAuthority();
    // Existing executor's durable key = SHA-256 of the FULL signed grant.
    // This prevents a caller from substituting a successful journal request
    // from another task, even if the path/SHA happens to match.
    const pinnedRequestId = "sha256:" + createHash("sha256")
      .update(workflowExecutionGrantSigningPayload(grant as WorkflowExecutionGrant))
      .digest("hex");
    if (requestId !== pinnedRequestId || order.issuerGrantDigest !== pinnedRequestId) {
      fail("signed grant identity is not the claimed durable requestId");
    }
    const durable = await this.stores.execution.read(requestId);
    if (durable.claimed !== true || durable.attempts.length !== 1) {
      fail("missing or ambiguous durable inspection observation");
    }
    const attempt = durable.attempts[0];
    if (!attempt || attempt.attempt !== 1 || attempt.outcome !== "succeeded" ||
        !DIGEST.test(attempt.observationDigest ?? "") ||
        attempt.tokensUsed !== 0 || attempt.filesTouched.length !== 0 ||
        attempt.evidenceReferences.length !== order.scope.allowedPaths.length) {
      return fail("unverified, mutable or chargeable source inspection");
    }
    const expectedRefs = [...order.scope.allowedPaths].sort().map(
      path => "github:" + order.repository + "@" + order.sourceRevision + "#" + path
    );
    if (expectedRefs.some((expected, index) =>
      [...attempt.evidenceReferences].sort()[index] !== expected)) {
      fail("durable evidence differs from exact signed path/SHA scope");
    }
    const qa = await this.stores.qa.readVerified(requestId, 1);
    if (!qa || qa.requestId !== requestId || qa.attempt !== 1 ||
        qa.sourceRevision !== order.sourceRevision ||
        qa.observationDigest !== attempt.observationDigest ||
        qa.verifiedFiles !== order.scope.allowedPaths.length ||
        qa.verifierId !== INDEPENDENT_INSPECTION_VERIFIER_ID) {
      return fail("missing or inconsistent independently persisted byte readback");
    }
    // R3-001: journal/QA awaits may interleave with canonical revocation or CAS.
    // Reuse the same pinned authority (including latest key/revocation reads)
    // and canonical WP verifier at the final handoff boundary. This is not
    // atomic across stores: B must still run freshAuthority before analysis,
    // persistence and final use; any protected mutation needs atomic CAS.
    await recheckAuthority();
    const freshnessRecheckedAt = currentTime().toISOString();
    return Object.freeze({
      status: "SOURCE_AND_P3_QA_JOURNAL_VERIFIED",
      admissionKind: "SOURCE_READBACK_ONLY",
      freshnessRecheckedAt,
      // R3-002: the four existing ports cannot attest a durable canonical
      // WorkOrder, signed PR v2 identity or order-specific actual byte budget.
      // Never use this result to satisfy B verifyHubIssuerGrant or
      // readCanonicalReviewWorkOrder; those need independent real services.
      canonicalReviewWorkOrderVerified: false,
      signedPrIdentityVerified: false,
      orderByteScopeVerified: false,
      reviewHandoffAuthorized: false,
      sourceRevision: order.sourceRevision,
      requestId,
      observationDigest: qa.observationDigest,
      verifiedFiles: qa.verifiedFiles,
      canonicalWorkPackageCASVerified: true,
      signedSourceInspectionVerified: true,
      independentP3QaJournalVerified: true,
      reviewerBPrincipalVerified: false,
      reviewerBReviewExecuted: false,
      authenticatedReviewEvidenceIssued: false,
      qualityGatePassed: false,
      productionAuthorized: false
    });
  }
}
