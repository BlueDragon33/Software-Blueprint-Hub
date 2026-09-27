export type ProfessionalReviewSeverity = "P0" | "P1" | "P2" | "P3";

export interface ProfessionalReviewFinding {
  readonly id: string;
  readonly severity: ProfessionalReviewSeverity;
  readonly surface: string;
  readonly observation: string;
  readonly blocking: boolean;
  readonly followUp: string;
}

export interface HumanProfessionalReviewCandidate {
  readonly kind: "human-professional-review-candidate";
  readonly projectId: "project:blueprint-os";
  readonly reviewedRevision: string;
  readonly evidenceArtifact: {
    readonly workflowRunId: number;
    readonly artifactId: number;
    readonly digest: string;
  };
  readonly reviewedViewports: readonly ("desktop" | "tablet" | "mobile")[];
  readonly reviewedSurfaces: readonly string[];
  readonly findings: readonly ProfessionalReviewFinding[];
  readonly automatedGatePass: true;
  readonly aiAssistedProfessionalReviewComplete: true;
  readonly humanSignoff: false;
  readonly productionReleaseAuthority: false;
  readonly blockers: readonly string[];
  readonly boundaryNote: string;
}

export const p9019ProfessionalReviewCandidate: HumanProfessionalReviewCandidate =
  Object.freeze({
    kind: "human-professional-review-candidate",
    projectId: "project:blueprint-os",
    reviewedRevision: "6da60278e4ef03a95f137eae1902a4054de66120",
    evidenceArtifact: Object.freeze({
      workflowRunId: 36252022005,
      artifactId: 10908943707,
      digest:
        "sha256:44c493d1373e4e27edef26ce6fae11465b7a0dc8adf1af2d85c77fdcf3d5aa7d"
    }),
    reviewedViewports: Object.freeze(["desktop", "tablet", "mobile"] as const),
    reviewedSurfaces: Object.freeze([
      "Projects / System Compass",
      "Canonical Project Workspace",
      "Quality & revision-specific evidence",
      "Portfolio",
      "Data Lifecycle",
      "Prompt workspace",
      "Knowledge / Reference Case",
      "Release & Lessons"
    ]),
    findings: Object.freeze([
      Object.freeze({
        id: "P2-UX-QUALITY-MOBILE-LENGTH",
        severity: "P2",
        surface: "Quality / mobile",
        observation:
          "Evidence-heavy Quality views remain readable and non-overflowing but can require a long vertical scan as real gate/evidence volume grows.",
        blocking: false,
        followUp:
          "Keep progressive disclosure; consider filter/search or collapsed evidence groups if real project evidence volume materially exceeds current fixtures."
      }),
      Object.freeze({
        id: "P2-UX-LIFECYCLE-SPARSE-TABLET",
        severity: "P2",
        surface: "Data Lifecycle / tablet",
        observation:
          "Projects without a checked-in lifecycle policy show a correct empty state but leave a large unused canvas on tablet.",
        blocking: false,
        followUp:
          "Consider contextual setup guidance in the empty state; do not invent or inherit lifecycle policy from another project."
      })
    ]),
    automatedGatePass: true,
    aiAssistedProfessionalReviewComplete: true,
    humanSignoff: false,
    productionReleaseAuthority: false,
    blockers: Object.freeze(["human-professional-signoff-required"]),
    boundaryNote:
      "Automated Release Gate and AI-assisted professional visual review are evidence, but neither may be relabeled as a human sign-off. P9-019 remains active until an explicit human review decision is recorded."
  });


export type HumanProfessionalReviewDecisionKind =
  | "approve"
  | "request-changes"
  | "reject";

export interface HumanProfessionalReviewDecisionInput {
  readonly reviewerActorId: string;
  readonly source: "authenticated-user-action";
  readonly decision: HumanProfessionalReviewDecisionKind;
  readonly decidedAt: string;
  readonly note: string;
  readonly candidateReviewedRevision: string;
  readonly candidateEvidenceDigest: string;
  readonly acknowledgedFindingIds: readonly string[];
}

export interface RecordedHumanProfessionalReviewDecision {
  readonly kind: "human-professional-review-decision";
  readonly projectId: "project:blueprint-os";
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

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new TypeError(`${label} is required`);
  }
  return normalized;
}

function requireIsoTimestamp(value: string): string {
  const normalized = requireNonEmpty(value, "decidedAt");
  const parsed = Date.parse(normalized);
  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== normalized) {
    throw new TypeError("decidedAt must be an exact ISO-8601 UTC timestamp");
  }
  return normalized;
}

export function recordHumanProfessionalReviewDecision(
  candidate: HumanProfessionalReviewCandidate,
  input: HumanProfessionalReviewDecisionInput
): RecordedHumanProfessionalReviewDecision {
  const reviewerActorId = requireNonEmpty(
    input.reviewerActorId,
    "reviewerActorId"
  );
  const note = requireNonEmpty(input.note, "note");
  const decidedAt = requireIsoTimestamp(input.decidedAt);

  if (input.source !== "authenticated-user-action") {
    throw new TypeError(
      "Human professional review decisions require an authenticated user action"
    );
  }
  if (input.candidateReviewedRevision !== candidate.reviewedRevision) {
    throw new TypeError(
      "Human professional review decision is stale: reviewed revision mismatch"
    );
  }
  if (input.candidateEvidenceDigest !== candidate.evidenceArtifact.digest) {
    throw new TypeError(
      "Human professional review decision is stale: evidence digest mismatch"
    );
  }

  const findingIds = new Set(candidate.findings.map((finding) => finding.id));
  const acknowledgements = [...new Set(input.acknowledgedFindingIds)].sort();
  const unknownFinding = acknowledgements.find((id) => !findingIds.has(id));
  if (unknownFinding) {
    throw new TypeError(
      `Human professional review acknowledged unknown finding ${unknownFinding}`
    );
  }

  const hasBlockingSevereFinding = candidate.findings.some(
    (finding) =>
      finding.blocking &&
      (finding.severity === "P0" || finding.severity === "P1")
  );
  const missingAcknowledgement = candidate.findings.find(
    (finding) => !acknowledgements.includes(finding.id)
  );

  if (input.decision === "approve" && hasBlockingSevereFinding) {
    throw new TypeError(
      "Human professional review cannot approve with unresolved blocking P0/P1 findings"
    );
  }
  if (input.decision === "approve" && missingAcknowledgement) {
    throw new TypeError(
      `Human professional review must acknowledge finding ${missingAcknowledgement.id} before approval`
    );
  }

  const approved = input.decision === "approve";
  return Object.freeze({
    kind: "human-professional-review-decision",
    projectId: candidate.projectId,
    reviewerActorId,
    source: input.source,
    decision: input.decision,
    decidedAt,
    note,
    candidateReviewedRevision: input.candidateReviewedRevision,
    candidateEvidenceDigest: input.candidateEvidenceDigest,
    acknowledgedFindingIds: Object.freeze(acknowledgements),
    humanSignoff: approved,
    p9020TransitionAllowed: approved,
    productionReleaseAuthority: false,
    blockers: Object.freeze(
      approved
        ? []
        : [
            "human-professional-signoff-required",
            `human-review-decision-${input.decision}`
          ]
    )
  });
}
