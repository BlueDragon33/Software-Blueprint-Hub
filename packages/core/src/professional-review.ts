export type HumanProfessionalReviewDecisionKind =
  | "approve"
  | "request-changes"
  | "reject";

export interface HumanProfessionalReviewDecisionRecord {
  readonly projectId: string;
  readonly reviewerActorId: string;
  readonly source: "authenticated-user-action";
  readonly decision: HumanProfessionalReviewDecisionKind;
  readonly decidedAt: string;
  readonly note: string;
  readonly candidateReviewedRevision: string;
  readonly candidateEvidenceDigest: string;
  readonly acknowledgedFindingIds: readonly string[];
  readonly humanSignoff: boolean;
  readonly p9020TransitionAllowed: boolean;
  readonly productionReleaseAuthority: false;
  readonly blockers: readonly string[];
}

export interface HumanProfessionalReviewDecisionRepository {
  findForCandidate(
    projectId: string,
    candidateReviewedRevision: string,
    candidateEvidenceDigest: string
  ): Promise<HumanProfessionalReviewDecisionRecord | null>;

  append(decision: HumanProfessionalReviewDecisionRecord): Promise<void>;
}
