import { describe, expect, it } from "vitest";

import {
  p9019ProfessionalReviewCandidate,
  recordHumanProfessionalReviewDecision
} from "../../packages/application/src/professional-review";

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
  it("fails closed on stale revision or evidence digest", () => {
    const base = {
      reviewerActorId: "user:reviewer",
      source: "authenticated-user-action" as const,
      decision: "approve" as const,
      decidedAt: "2026-09-27T02:00:00.000Z",
      note: "Reviewed the exact candidate.",
      candidateReviewedRevision: p9019ProfessionalReviewCandidate.reviewedRevision,
      candidateEvidenceDigest:
        p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
      acknowledgedFindingIds: p9019ProfessionalReviewCandidate.findings.map(
        (finding) => finding.id
      )
    };

    expect(() =>
      recordHumanProfessionalReviewDecision(p9019ProfessionalReviewCandidate, {
        ...base,
        candidateReviewedRevision: "stale-revision"
      })
    ).toThrow(/stale/);

    expect(() =>
      recordHumanProfessionalReviewDecision(p9019ProfessionalReviewCandidate, {
        ...base,
        candidateEvidenceDigest: "sha256:stale"
      })
    ).toThrow(/stale/);
  });

  it("requires every tracked finding to be acknowledged before approval", () => {
    expect(() =>
      recordHumanProfessionalReviewDecision(p9019ProfessionalReviewCandidate, {
        reviewerActorId: "user:reviewer",
        source: "authenticated-user-action",
        decision: "approve",
        decidedAt: "2026-09-27T02:00:00.000Z",
        note: "Reviewed the candidate.",
        candidateReviewedRevision:
          p9019ProfessionalReviewCandidate.reviewedRevision,
        candidateEvidenceDigest:
          p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
        acknowledgedFindingIds: []
      })
    ).toThrow(/acknowledge finding/);
  });

  it("records an explicit approval without granting Production authority", () => {
    const decision = recordHumanProfessionalReviewDecision(
      p9019ProfessionalReviewCandidate,
      {
        reviewerActorId: "user:reviewer",
        source: "authenticated-user-action",
        decision: "approve",
        decidedAt: "2026-09-27T02:00:00.000Z",
        note: "Reviewed exact evidence and accept the tracked P2 follow-ups.",
        candidateReviewedRevision:
          p9019ProfessionalReviewCandidate.reviewedRevision,
        candidateEvidenceDigest:
          p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
        acknowledgedFindingIds: p9019ProfessionalReviewCandidate.findings.map(
          (finding) => finding.id
        )
      }
    );

    expect(decision.humanSignoff).toBe(true);
    expect(decision.p9020TransitionAllowed).toBe(true);
    expect(decision.productionReleaseAuthority).toBe(false);
    expect(decision.blockers).toEqual([]);
  });

  it("keeps request-changes blocked and does not manufacture sign-off", () => {
    const decision = recordHumanProfessionalReviewDecision(
      p9019ProfessionalReviewCandidate,
      {
        reviewerActorId: "user:reviewer",
        source: "authenticated-user-action",
        decision: "request-changes",
        decidedAt: "2026-09-27T02:00:00.000Z",
        note: "Additional UX changes requested.",
        candidateReviewedRevision:
          p9019ProfessionalReviewCandidate.reviewedRevision,
        candidateEvidenceDigest:
          p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
        acknowledgedFindingIds: []
      }
    );

    expect(decision.humanSignoff).toBe(false);
    expect(decision.p9020TransitionAllowed).toBe(false);
    expect(decision.productionReleaseAuthority).toBe(false);
    expect(decision.blockers).toContain("human-professional-signoff-required");
  });
});
