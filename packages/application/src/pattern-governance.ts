import { createHash } from "node:crypto";

export type PatternKind = "pattern" | "anti-pattern";
export type PatternPromotionState =
  | "insufficient-evidence"
  | "review-candidate"
  | "approved-for-publication";

export interface PatternEvidenceInput {
  readonly projectId: string;
  readonly source: string;
  readonly revision: string;
  readonly observation: string;
}

export interface PatternPromotionProposal {
  readonly id: string;
  readonly kind: PatternKind;
  readonly title: string;
  readonly summary: string;
  readonly evidence: readonly PatternEvidenceInput[];
  readonly projectIds: readonly string[];
  readonly state: Exclude<PatternPromotionState, "approved-for-publication">;
  readonly canonicalPublicationAllowed: false;
  readonly requiresExplicitReview: true;
  readonly rationale: readonly string[];
}

export interface PatternPromotionReview {
  readonly reviewerId: string;
  readonly reviewedAt: string;
  readonly source: string;
  readonly decision: "approve" | "reject";
  readonly note: string;
}

export interface ApprovedPatternRecord {
  readonly id: string;
  readonly kind: PatternKind;
  readonly title: string;
  readonly summary: string;
  readonly state: "approved-for-publication";
  readonly projectIds: readonly string[];
  readonly evidence: readonly PatternEvidenceInput[];
  readonly review: PatternPromotionReview;
  readonly provenanceHash: string;
}

function normalized(value: string, label: string): string {
  const result = value.trim();
  if (!result) throw new TypeError(`${label} is required`);
  return result;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableValue(child)])
    );
  }
  return value;
}

function hash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function normalizeEvidence(
  input: readonly PatternEvidenceInput[]
): readonly PatternEvidenceInput[] {
  if (!input.length) {
    throw new TypeError("Pattern promotion requires evidence");
  }

  const deduped = new Map<string, PatternEvidenceInput>();
  for (const item of input) {
    const evidence = Object.freeze({
      projectId: normalized(item.projectId, "Evidence projectId"),
      source: normalized(item.source, "Evidence source"),
      revision: normalized(item.revision, "Evidence revision"),
      observation: normalized(item.observation, "Evidence observation")
    });
    const key = hash(evidence);
    deduped.set(key, evidence);
  }

  return Object.freeze(
    [...deduped.values()].sort(
      (a, b) =>
        a.projectId.localeCompare(b.projectId) ||
        a.source.localeCompare(b.source) ||
        a.revision.localeCompare(b.revision)
    )
  );
}

export function createPatternPromotionProposal(input: {
  readonly kind: PatternKind;
  readonly title: string;
  readonly summary: string;
  readonly evidence: readonly PatternEvidenceInput[];
}): PatternPromotionProposal {
  const title = normalized(input.title, "Pattern title");
  const summary = normalized(input.summary, "Pattern summary");
  const evidence = normalizeEvidence(input.evidence);
  const projectIds = Object.freeze(
    [...new Set(evidence.map((item) => item.projectId))].sort()
  );
  const state =
    projectIds.length >= 2 ? "review-candidate" : "insufficient-evidence";
  const rationale =
    state === "review-candidate"
      ? [
          "Evidence spans at least two distinct projects.",
          "Promotion still requires explicit human review before publication.",
          "The proposal does not mutate Universal Core or Knowledge Library by itself."
        ]
      : [
          "A reusable Pattern/Anti-pattern cannot be promoted from one project alone.",
          "Collect evidence from at least one additional distinct project."
        ];

  const identity = {
    kind: input.kind,
    title,
    summary,
    evidence
  };

  return Object.freeze({
    id: `pattern-promotion:${hash(identity).slice(0, 32)}`,
    kind: input.kind,
    title,
    summary,
    evidence,
    projectIds,
    state,
    canonicalPublicationAllowed: false,
    requiresExplicitReview: true,
    rationale: Object.freeze(rationale)
  });
}

export function reviewPatternPromotion(
  proposal: PatternPromotionProposal,
  reviewInput: PatternPromotionReview
): ApprovedPatternRecord | null {
  if (proposal.state !== "review-candidate") {
    throw new TypeError(
      "Pattern promotion cannot be reviewed for publication before multi-project evidence is sufficient"
    );
  }

  const review = Object.freeze({
    reviewerId: normalized(reviewInput.reviewerId, "Reviewer id"),
    reviewedAt: normalized(reviewInput.reviewedAt, "Reviewed at"),
    source: normalized(reviewInput.source, "Review source"),
    decision: reviewInput.decision,
    note: normalized(reviewInput.note, "Review note")
  });

  if (review.decision === "reject") return null;

  const provenanceHash = hash({
    proposalId: proposal.id,
    evidence: proposal.evidence,
    review
  });

  return Object.freeze({
    id: `knowledge:${proposal.kind}:${hash({
      title: proposal.title,
      summary: proposal.summary
    }).slice(0, 24)}`,
    kind: proposal.kind,
    title: proposal.title,
    summary: proposal.summary,
    state: "approved-for-publication",
    projectIds: proposal.projectIds,
    evidence: proposal.evidence,
    review,
    provenanceHash: `sha256:${provenanceHash}`
  });
}


/**
 * Reviewer learning v1: source-bound advisory experience, reusing the existing
 * PatternGovernance/Knowledge Library owners. This does not store new canonical
 * state, issue review credentials, call a model, or authorize publication.
 * A server-owned verifier must independently attest source and B identity.
 */
export interface ReviewerLearningCase {
  readonly caseId: string;
  readonly projectId: string;
  readonly repository: string;
  readonly workPackageId: string;
  readonly sourceRevision: string;
  readonly fixRevision: string;
  readonly issueCode: string;
  readonly severity: "P0" | "P1" | "P2" | "P3";
  readonly outcome: "confirmed-repaired" | "confirmed-unresolved" | "false-positive";
  readonly reviewerA: Readonly<{ actorId: string; credentialFingerprint: string; runId: string }>;
  readonly reviewerB: Readonly<{ actorId: string; credentialFingerprint: string; runId: string }>;
  readonly bSourceDigest: string;
  readonly bEvidenceDigest: string;
  readonly evidenceRef: string;
  readonly learning: string;
}

export interface ReviewerCaseVerification {
  /** Result of a real, server-owned, independent source/identity readback. */
  readonly caseId: string;
  readonly sourceRevision: string;
  readonly bSourceDigest: string;
  readonly bEvidenceDigest: string;
  readonly reviewerBActorId: string;
  readonly signedAndIndependent: true;
  readonly finalHeadVerified: true;
}

export interface ReviewerLearningVerifier {
  verifyCase(input: ReviewerLearningCase): Promise<ReviewerCaseVerification | null>;
}

export interface ReviewerLearningProposal {
  readonly kind: "reviewer-learning-proposal";
  readonly pattern: PatternPromotionProposal;
  readonly verifiedCaseIds: readonly string[];
  readonly independentCaseEvidenceRequested: true;
  readonly humanCurationRequired: true;
  readonly canonicalMutationAllowed: false;
  readonly reviewerPermissionGranted: false;
  readonly autoPublishAllowed: false;
}

const REV_SHA = /^[0-9a-f]{40}$/;
const REV_DIGEST = /^sha256:[0-9a-f]{64}$/;
const REV_PROJECT = /^project:[a-z0-9-]{2,110}$/;
const REV_REPO = /^BlueDragon33\/[A-Za-z0-9_.-]{1,100}$/;
const REV_ID = /^[a-z][a-z0-9-]{1,79}$/;
const REV_CASE = /^review-case:[a-z0-9-]{3,90}$/;
const REV_CODE = /^[A-Z][A-Z0-9_-]{2,40}$/;
const REV_ACTOR = /^[A-Za-z0-9_.:@/-]{3,120}$/;
const REV_RUN = /^[a-zA-Z0-9._:@/-]{3,120}$/;
const REV_REF = /^https:\/\/github\.com\/BlueDragon33\/[A-Za-z0-9_.-]+\/(?:pull\/\d+|actions\/runs\/\d+|issues\/\d+(?:#issuecomment-\d+)?)$/;

function validateLearningCase(item: ReviewerLearningCase): void {
  const fail = (reason: string): never => { throw new TypeError("REVIEW_LEARNING_BLOCKED: " + reason); };
  if (!item || typeof item !== "object" ||
      !REV_CASE.test(item.caseId) ||
      !REV_PROJECT.test(item.projectId) ||
      !REV_REPO.test(item.repository) || !REV_ID.test(item.workPackageId) ||
      !REV_SHA.test(item.sourceRevision) || !REV_SHA.test(item.fixRevision) ||
      !REV_CODE.test(item.issueCode) ||
      !["P0", "P1", "P2", "P3"].includes(item.severity) ||
      !["confirmed-repaired", "confirmed-unresolved", "false-positive"].includes(item.outcome) ||
      !REV_DIGEST.test(item.bSourceDigest) ||
      !REV_DIGEST.test(item.bEvidenceDigest) ||
      !REV_REF.test(item.evidenceRef) ||
      !item.evidenceRef.startsWith("https://github.com/" + item.repository + "/") ||
      typeof item.learning !== "string" || item.learning.trim().length < 12 ||
      item.learning.length > 320) fail("invalid bounded project case and provenance");
  if (item.outcome === "confirmed-repaired" && item.sourceRevision === item.fixRevision) {
    fail("a repaired finding must have a distinct confirmed fix revision");
  }
  for (const r of [item.reviewerA, item.reviewerB]) {
    if (!r || !REV_ACTOR.test(r.actorId) ||
        !REV_DIGEST.test(r.credentialFingerprint) ||
        !REV_RUN.test(r.runId)) fail("unverified reviewer identity shape");
  }
  if (item.reviewerA.actorId === item.reviewerB.actorId ||
      item.reviewerA.credentialFingerprint === item.reviewerB.credentialFingerprint ||
      item.reviewerA.runId === item.reviewerB.runId) {
    fail("A/B actor, credential and execution run must be distinct");
  }
}

/** Only independently attested observations can yield a cross-project
 * learning *proposal*. Publication still requires the existing authorized
 * pattern-curation and canonical Knowledge Library process. */
export async function proposeReviewerCrossProjectLearning(input: {
  readonly kind: PatternKind;
  readonly title: string;
  readonly summary: string;
  readonly cases: readonly ReviewerLearningCase[];
}, verifier: ReviewerLearningVerifier): Promise<ReviewerLearningProposal> {
  if (!verifier || typeof verifier.verifyCase !== "function") {
    throw new TypeError("REVIEW_LEARNING_BLOCKED: independent verifier unavailable");
  }
  if (!Array.isArray(input.cases) || input.cases.length < 2 || input.cases.length > 20) {
    throw new TypeError("REVIEW_LEARNING_BLOCKED: bounded cross-project cases required");
  }
  const ids = new Set<string>();
  const evidence: PatternEvidenceInput[] = [];
  for (const item of input.cases) {
    validateLearningCase(item);
    if (ids.has(item.caseId)) throw new TypeError("REVIEW_LEARNING_BLOCKED: duplicated case");
    ids.add(item.caseId);
    const verified = await verifier.verifyCase(item);
    if (!verified || verified.signedAndIndependent !== true ||
        verified.finalHeadVerified !== true ||
        verified.caseId !== item.caseId ||
        verified.sourceRevision !== item.fixRevision ||
        verified.bSourceDigest !== item.bSourceDigest ||
        verified.bEvidenceDigest !== item.bEvidenceDigest ||
        verified.reviewerBActorId !== item.reviewerB.actorId) {
      throw new TypeError("REVIEW_LEARNING_BLOCKED: independent final source/evidence verification missing");
    }
    evidence.push(Object.freeze({
      projectId: item.projectId,
      source: item.evidenceRef,
      revision: item.fixRevision,
      observation: item.issueCode + " / " + item.outcome + ": " + item.learning.trim()
    }));
  }
  const pattern = createPatternPromotionProposal({
    kind: input.kind, title: input.title, summary: input.summary, evidence
  });
  if (pattern.state !== "review-candidate") {
    throw new TypeError("REVIEW_LEARNING_BLOCKED: distinct independently verified projects required");
  }
  return Object.freeze({
    kind: "reviewer-learning-proposal",
    pattern,
    verifiedCaseIds: Object.freeze([...ids].sort()),
    independentCaseEvidenceRequested: true,
    humanCurationRequired: true,
    canonicalMutationAllowed: false,
    reviewerPermissionGranted: false,
    autoPublishAllowed: false
  });
}

export interface ReviewerLearningRetrieval {
  readonly recordId: string;
  readonly kind: PatternKind;
  readonly sourceRevisions: readonly string[];
  readonly projectIds: readonly string[];
  readonly title: string;
  readonly summary: string;
  readonly useStatus: "REVALIDATE_CURRENT_SOURCE";
  readonly autonomousFixAllowed: false;
}

/** A retrieval *suggestion*, not a correctness claim about the current PR.
 * Callers must read the authorized KnowledgeLibrary records and independently
 * revalidate the current project/source before using this historical lesson. */
export function suggestReviewerLearning(
  published: readonly ApprovedPatternRecord[],
  query: { readonly projectId: string; readonly text: string },
): readonly ReviewerLearningRetrieval[] {
  if (!REV_PROJECT.test(query.projectId) ||
      typeof query.text !== "string" || query.text.trim().length < 3 ||
      query.text.length > 320 || !Array.isArray(published) || published.length > 200) {
    throw new TypeError("REVIEW_LEARNING_BLOCKED: invalid bounded retrieval");
  }
  const terms = query.text.toLowerCase().match(/[a-z0-9_-]{3,}/g) ?? [];
  if (terms.length === 0) return Object.freeze([]);
  const unique = new Set<string>();
  const results: ReviewerLearningRetrieval[] = [];
  for (const p of published) {
    if (!p || p.state !== "approved-for-publication" ||
        !p.provenanceHash?.startsWith("sha256:") ||
        !Array.isArray(p.evidence) || p.evidence.length < 2 ||
        !Array.isArray(p.projectIds) || new Set(p.projectIds).size < 2 ||
        unique.has(p.id)) continue;
    unique.add(p.id);
    const body = (p.title + " " + p.summary).toLowerCase();
    if (!terms.some(term => body.includes(term))) continue;
    results.push(Object.freeze({
      recordId: p.id, kind: p.kind,
      sourceRevisions: Object.freeze(p.evidence.map((x: PatternEvidenceInput) => x.revision).sort()),
      projectIds: Object.freeze([...p.projectIds].sort()),
      title: p.title, summary: p.summary,
      useStatus: "REVALIDATE_CURRENT_SOURCE",
      autonomousFixAllowed: false
    }));
  }
  return Object.freeze(results.slice(0, 10));
}
