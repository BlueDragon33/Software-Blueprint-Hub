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
    reviewedViewports: Object.freeze(["desktop", "tablet", "mobile"]),
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
