import {
  type AuthenticatedActor,
  AuthorityService,
  type HumanProfessionalReviewDecisionRecord,
  type HumanProfessionalReviewDecisionRepository
} from "@blueprint-os/core";

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
    reviewedRevision: "c2190d1540edaf2946d866e3719cd8fa78172719",
    evidenceArtifact: Object.freeze({
      workflowRunId: 36317309428,
      artifactId: 10931137598,
      digest:
        "sha256:603a9fc0b91bfa29d99fc8c1aa2b65c72ade18c87d657050f1343b4ff8fcc9e4"
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
    findings: Object.freeze([]),
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

const professionalReviewDecisionKinds = new Set<HumanProfessionalReviewDecisionKind>([
  "approve",
  "request-changes",
  "reject"
]);

function requireDecisionKind(
  value: HumanProfessionalReviewDecisionKind
): HumanProfessionalReviewDecisionKind {
  if (!professionalReviewDecisionKinds.has(value)) {
    throw new TypeError("decision must be approve, request-changes, or reject");
  }
  return value;
}

function requireAcknowledgementIds(
  value: readonly string[]
): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new TypeError("acknowledgedFindingIds must be a string array");
  }
  return value;
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
  const decisionKind = requireDecisionKind(input.decision);
  const acknowledgementIds = requireAcknowledgementIds(
    input.acknowledgedFindingIds
  );

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
  const acknowledgements = [...new Set(acknowledgementIds)].sort();
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

  if (decisionKind === "approve" && hasBlockingSevereFinding) {
    throw new TypeError(
      "Human professional review cannot approve with unresolved blocking P0/P1 findings"
    );
  }
  if (decisionKind === "approve" && missingAcknowledgement) {
    throw new TypeError(
      `Human professional review must acknowledge finding ${missingAcknowledgement.id} before approval`
    );
  }

  const approved = decisionKind === "approve";
  return Object.freeze({
    kind: "human-professional-review-decision",
    projectId: candidate.projectId,
    reviewerActorId,
    source: input.source,
    decision: decisionKind,
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
            `human-review-decision-${decisionKind}`
          ]
    )
  });
}


export interface HumanProfessionalReviewDecisionSubmission {
  readonly decision: HumanProfessionalReviewDecisionKind;
  readonly note: string;
  readonly candidateReviewedRevision: string;
  readonly candidateEvidenceDigest: string;
  readonly acknowledgedFindingIds: readonly string[];
}

export class HumanProfessionalReviewApplicationService {
  constructor(
    private readonly repository: HumanProfessionalReviewDecisionRepository,
    private readonly authority: AuthorityService
  ) {}

  async currentDecision(
    actor: AuthenticatedActor | null
  ): Promise<HumanProfessionalReviewDecisionRecord | null> {
    await this.authority.require(
      actor,
      p9019ProfessionalReviewCandidate.projectId,
      "PROJECT_REVIEW"
    );

    return this.repository.findForCandidate(
      p9019ProfessionalReviewCandidate.projectId,
      p9019ProfessionalReviewCandidate.reviewedRevision,
      p9019ProfessionalReviewCandidate.evidenceArtifact.digest
    );
  }

  async record(
    actor: AuthenticatedActor | null,
    input: HumanProfessionalReviewDecisionSubmission,
    decidedAt: string
  ): Promise<RecordedHumanProfessionalReviewDecision> {
    await this.authority.require(
      actor,
      p9019ProfessionalReviewCandidate.projectId,
      "PROJECT_REVIEW"
    );

    const existing = await this.repository.findForCandidate(
      p9019ProfessionalReviewCandidate.projectId,
      input.candidateReviewedRevision,
      input.candidateEvidenceDigest
    );
    if (existing) {
      throw new TypeError(
        "A human professional review decision already exists for this exact candidate."
      );
    }

    const decision = recordHumanProfessionalReviewDecision(
      p9019ProfessionalReviewCandidate,
      {
        reviewerActorId: actor!.principalId,
        source: "authenticated-user-action",
        decision: input.decision,
        decidedAt,
        note: input.note,
        candidateReviewedRevision: input.candidateReviewedRevision,
        candidateEvidenceDigest: input.candidateEvidenceDigest,
        acknowledgedFindingIds: input.acknowledgedFindingIds
      }
    );

    await this.repository.append(decision);
    return decision;
  }
}
