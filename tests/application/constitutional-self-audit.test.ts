import { describe, expect, it } from "vitest";

import {
  buildBlueprintOsConstitutionAudit,
  p9019ProfessionalReviewCandidate
} from "../../packages/application/src";

describe("Blueprint OS Constitutional self-audit", () => {
  it("fails closed before exact human professional approval", () => {
    const audit = buildBlueprintOsConstitutionAudit();

    expect(audit.state).toBe("blocked");
    expect(audit.projectId).toBe("project:blueprint-os");
    expect(audit.policyVersion).toBe("1.1.0");
    expect(audit.blueprintLevel).toBe("B4");
    expect(audit.pillars).toHaveLength(6);
    expect(audit.blockers).toContain(
      "p9-019-human-professional-review-required"
    );
    expect(audit.exactHumanReviewBound).toBe(false);
    expect(audit.canonicalGatePassRecorded).toBe(false);
    expect(audit.acceptanceAuthority).toBe(false);
    expect(audit.productionReleaseAuthority).toBe(false);

    expect(
      audit.pillars.find((pillar) => pillar.id === "product-elegance")
    ).toMatchObject({ state: "human-review-required" });
    expect(
      audit.pillars.find((pillar) => pillar.id === "premium-usability")
    ).toMatchObject({ state: "human-review-required" });
  });

  it("moves only to final-evidence collection after exact human approval", () => {
    const audit = buildBlueprintOsConstitutionAudit({
      reviewDecision: {
        projectId: p9019ProfessionalReviewCandidate.projectId,
        reviewerActorId: "principal:human-reviewer",
        source: "authenticated-user-action",
        decision: "approve",
        decidedAt: "2026-09-27T14:30:00.000Z",
        note: "Reviewed the exact candidate.",
        candidateReviewedRevision:
          p9019ProfessionalReviewCandidate.reviewedRevision,
        candidateEvidenceDigest:
          p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
        acknowledgedFindingIds: [],
        humanSignoff: true,
        p9020TransitionAllowed: true,
        productionReleaseAuthority: false,
        blockers: []
      }
    });

    expect(audit.state).toBe("ready-for-final-evidence");
    expect(audit.blockers).toEqual([]);
    expect(audit.exactHumanReviewBound).toBe(true);
    expect(audit.canonicalGatePassRecorded).toBe(false);
    expect(audit.acceptanceAuthority).toBe(false);
    expect(audit.productionReleaseAuthority).toBe(false);
    expect(
      audit.pillars.every(
        (pillar) => pillar.state === "final-evidence-required"
      )
    ).toBe(true);
  });

  it("rejects stale or authority-leaking decisions as Constitutional approval", () => {
    const stale = buildBlueprintOsConstitutionAudit({
      reviewDecision: {
        projectId: p9019ProfessionalReviewCandidate.projectId,
        reviewerActorId: "principal:human-reviewer",
        source: "authenticated-user-action",
        decision: "approve",
        decidedAt: "2026-09-27T14:31:00.000Z",
        note: "Stale approval.",
        candidateReviewedRevision: "stale-revision",
        candidateEvidenceDigest:
          p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
        acknowledgedFindingIds: [],
        humanSignoff: true,
        p9020TransitionAllowed: true,
        productionReleaseAuthority: false,
        blockers: []
      }
    });

    expect(stale.state).toBe("blocked");
    expect(stale.exactHumanReviewBound).toBe(false);

    const authorityLeak = buildBlueprintOsConstitutionAudit({
      reviewDecision: {
        projectId: p9019ProfessionalReviewCandidate.projectId,
        reviewerActorId: "principal:human-reviewer",
        source: "authenticated-user-action",
        decision: "approve",
        decidedAt: "2026-09-27T14:32:00.000Z",
        note: "Invalid authority expansion.",
        candidateReviewedRevision:
          p9019ProfessionalReviewCandidate.reviewedRevision,
        candidateEvidenceDigest:
          p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
        acknowledgedFindingIds: [],
        humanSignoff: true,
        p9020TransitionAllowed: true,
        productionReleaseAuthority: true,
        blockers: []
      }
    });

    expect(authorityLeak.state).toBe("blocked");
    expect(authorityLeak.productionReleaseAuthority).toBe(false);
  });
});
