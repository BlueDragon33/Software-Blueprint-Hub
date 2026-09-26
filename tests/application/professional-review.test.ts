import { describe, expect, it } from "vitest";

import { p9019ProfessionalReviewCandidate } from "../../packages/application/src/professional-review";

describe("P9-019 Human Professional Review boundary", () => {
  it("records exact revision and screenshot artifact provenance", () => {
    expect(p9019ProfessionalReviewCandidate.reviewedRevision).toBe(
      "6da60278e4ef03a95f137eae1902a4054de66120"
    );
    expect(p9019ProfessionalReviewCandidate.evidenceArtifact).toMatchObject({
      workflowRunId: 36252022005,
      artifactId: 10908943707
    });
    expect(p9019ProfessionalReviewCandidate.evidenceArtifact.digest).toMatch(
      /^sha256:[0-9a-f]{64}$/
    );
  });

  it("does not manufacture human sign-off or Production authority", () => {
    expect(p9019ProfessionalReviewCandidate.automatedGatePass).toBe(true);
    expect(
      p9019ProfessionalReviewCandidate.aiAssistedProfessionalReviewComplete
    ).toBe(true);
    expect(p9019ProfessionalReviewCandidate.humanSignoff).toBe(false);
    expect(p9019ProfessionalReviewCandidate.productionReleaseAuthority).toBe(false);
    expect(p9019ProfessionalReviewCandidate.blockers).toContain(
      "human-professional-signoff-required"
    );
  });

  it("contains no untracked P0/P1 blocker while preserving P2 follow-ups", () => {
    const severe = p9019ProfessionalReviewCandidate.findings.filter(
      (item) => item.severity === "P0" || item.severity === "P1"
    );
    expect(severe).toEqual([]);
    expect(
      p9019ProfessionalReviewCandidate.findings.every(
        (item) => item.followUp.trim().length > 0
      )
    ).toBe(true);
  });
});
