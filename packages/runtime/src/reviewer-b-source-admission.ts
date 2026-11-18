/**
 * R3 — fail-closed source admission attached to the EXISTING Hub runtime.
 * Read-only queries against the canonical workflow authority, WorkPackage,
 * execution journal and independent P3 QA journal. Never authenticates a
 * Reviewer B agent, issues a review receipt, or mutates any Quality Gate.
 */
import { createHash } from "node:crypto";
import {
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
 * adopted workflow and most recent issuer revocation state in Postgres.
 */
export class ReviewerBSourceAdmissionService {
  constructor(private readonly stores: Readonly<{
    authority: Pick<PostgresWorkflowExecutionAuthorityRepository,
      "latestAdoption" | "latestIssuer" | "currentAllowedIssuers">;
    workPackages: Pick<PostgresWorkQualityRepository, "findWorkPackageById">;
    execution: Pick<PostgresWorkflowExecutionJournal, "read">;
    qa: Pick<PostgresWorkflowInspectionQaJournal, "readVerified">;
  }>) {}

  async verifySource(input: ReviewerBSourceAdmissionInput): Promise<Readonly<{
    status: "SOURCE_AND_P3_QA_JOURNAL_VERIFIED";
    sourceRevision: string;
    requestId: string;
    observationDigest: string;
    verifiedFiles: number;
    canonicalWorkPackageCASVerified: true;
    signedSourceInspectionVerified: true;
    independentP3QaJournalVerified: true;
    reviewerBPrincipalVerified: false;
    reviewerBReviewExecuted: false;
    authenticatedReviewEvidenceIssued: false;
    qualityGatePassed: false;
    productionAuthorized: false;
  }>> {
    const started = performance.now();
    const {order, grant, workflow, context, requestId, now} = structuredClone(input ?? {});
    if (!order || !workflow || !context || !(now instanceof Date) ||
        !Number.isFinite(now.getTime()) || !DIGEST.test(requestId ?? "") ||
        !SHA.test(order.sourceRevision ?? "")) {
      fail("invalid source request or current time");
    }
    validateReviewWorkOrder(order);
    if (Date.parse(order.issuedAt) > now.getTime() ||
        Date.parse(order.expiresAt) <= now.getTime()) {
      fail("Hub order has expired or is not yet effective");
    }
    const authority = await PostgresWorkflowExecutionAuthority.load(
      this.stores.authority, order.projectId, order.workflowId, order.policyVersion
    );
    // Actual Ed25519, adoption, latest issuer and WorkPackage.meta.recordVersion.
    await verifyReviewSourceAdmission(
      order, grant, workflow, context, authority, this.stores.workPackages, now
    );
    // Existing executor's durable key = SHA-256 of the FULL signed grant.
    // This prevents a caller from substituting a successful journal request
    // from another task, even if the path/SHA happens to match.
    const signedGrant = grant as WorkflowExecutionGrant;
    const pinnedRequestId = "sha256:" + createHash("sha256")
      .update(workflowExecutionGrantSigningPayload(signedGrant))
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
    const actualRefs = [...attempt.evidenceReferences].sort();
    if (expectedRefs.some((expected, index) => actualRefs[index] !== expected)) {
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

    // Durable reads may finish after a revocation, CAS change or expiry.
    const expiresAt = Math.min(Date.parse(order.expiresAt), Date.parse(signedGrant.expiresAt));
    const currentTime = () => now.getTime() + performance.now() - started;
    const verifiedAt = currentTime();
    if (verifiedAt >= expiresAt) fail("source authority expired while reading the journal");
    await verifyReviewSourceAdmission(
      order, signedGrant, workflow, context, authority, this.stores.workPackages, new Date(verifiedAt)
    );
    if (currentTime() >= expiresAt) fail("source authority expired while rechecking the binding");

    return Object.freeze({
      status: "SOURCE_AND_P3_QA_JOURNAL_VERIFIED",
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
