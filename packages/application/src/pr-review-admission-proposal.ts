/**
 * Pure P2 admission proposal for an authenticated System Owner to review.
 * Preparing a valid record is NOT creating one or awarding any permission.
 * Persistence must only use WorkQualityApplicationService with a real actor.
 */
import { validateContract, type WorkPackage, type QualityGate } from "@blueprint-os/contracts";

export const P2_PR_REVIEW_WORK_PACKAGE_ID = "work:p2-signed-pr-review-v2";
export const P2_PR_REVIEW_GATE_ID = "gate:p2-signed-pr-review-v2";
const PROJECT = "project:blueprint-os";

export function prepareP2PrReviewAdmissionProposal(now: Date): Readonly<{
  proposalOnly: true;
  admitted: false;
  humanApproved: false;
  qualityGatePassed: false;
  productionAuthorized: false;
  workPackage: WorkPackage;
  qualityGate: QualityGate;
}> {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) {
    throw new TypeError("A valid explicit candidate timestamp is required");
  }
  const timestamp = now.toISOString();
  const meta = { schemaVersion: "1.0.0" as const, recordVersion: 1,
    createdAt: timestamp, updatedAt: timestamp };
  const workPackage: WorkPackage = {
    id: P2_PR_REVIEW_WORK_PACKAGE_ID,
    projectId: PROJECT,
    title: "P2 authenticated read-only signed PR reviewer v2 admission",
    purpose: "Propose isolated reviewer authority prerequisites without production permission.",
    dependencies: [],
    acceptanceCriteria: [
      "Owner-authenticated Hub session passes PROJECT_MUTATE for project:blueprint-os.",
      "Current canonical Work Package, source SHA and scoped dependencies are verified.",
      "P2-specific Quality Gate has independent reviewer evidence; no inherited historical PASS.",
      "Ed25519 issuer and workflow adoption decisions are current and owner-authorized.",
      "Original-request replay claim and issuer revocation fail closed in disposable PostgreSQL.",
      "Independent QA validates exact PR number, base/head SHA, scope and signed inspection dispatch.",
      "Read-only three-service E2E runs only under separately authorized Preview constraints.",
      "No CI result, proposal or test fixture constitutes human approval or Production authority."
    ],
    qualityGateIds: [P2_PR_REVIEW_GATE_ID],
    status: "blocked",
    meta
  };
  const qualityGate: QualityGate = {
    id: P2_PR_REVIEW_GATE_ID,
    projectId: PROJECT,
    name: "P2 independent signed PR review authorization and evidence",
    requirements: [
      "Current authenticated Project Authority is independently checked.",
      "Canonical Work Package and workflow adoption/issuer are valid and not revoked.",
      "Exact-SHA cross-repository signed v2 identity, replay and independent QA evidence exists.",
      "PostgreSQL canonical migration, if needed, has a distinct approved change window.",
      "Professional reviewer explicitly accepts relevant security and PR review evidence.",
      "Human Quality Gate decision is separate from automated tests and Production authorization."
    ],
    status: "not-ready",
    evidenceIds: [],
    meta
  };
  for (const [name, candidate] of [
    ["WorkPackage", workPackage],
    ["QualityGate", qualityGate]
  ] as const) {
    const validation = validateContract(name, candidate);
    if (!validation.valid) {
      throw new TypeError("P2 admission candidate violates canonical " + name + " contract: " +
        validation.errors.map(e => e.instancePath + ": " + e.message).join("; "));
    }
  }
  return Object.freeze({
    proposalOnly: true, admitted: false, humanApproved: false,
    qualityGatePassed: false, productionAuthorized: false,
    workPackage: Object.freeze(workPackage),
    qualityGate: Object.freeze(qualityGate)
  });
}
