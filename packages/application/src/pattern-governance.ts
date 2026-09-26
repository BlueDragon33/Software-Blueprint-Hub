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
