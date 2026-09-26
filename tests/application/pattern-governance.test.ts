import { describe, expect, it } from "vitest";

import {
  createPatternPromotionProposal,
  reviewPatternPromotion
} from "../../packages/application/src/pattern-governance";

const evidenceA = {
  projectId: "project:alpha",
  source: "release:alpha-v1",
  revision: "aaaaaaaa",
  observation: "A provenance-first registry prevented stale runtime state."
};

const evidenceB = {
  projectId: "project:beta",
  source: "release:beta-v2",
  revision: "bbbbbbbb",
  observation: "The same provenance-first registry prevented stale runtime state."
};

describe("P9-006 Pattern Promotion Governance", () => {
  it("fails closed when evidence comes from only one project", () => {
    const proposal = createPatternPromotionProposal({
      kind: "pattern",
      title: "Provenance-aware registry",
      summary: "Keep source revision and authority explicit.",
      evidence: [evidenceA]
    });

    expect(proposal.state).toBe("insufficient-evidence");
    expect(proposal.canonicalPublicationAllowed).toBe(false);
    expect(proposal.projectIds).toEqual(["project:alpha"]);
  });

  it("creates a review candidate only from distinct multi-project evidence", () => {
    const proposal = createPatternPromotionProposal({
      kind: "pattern",
      title: "Provenance-aware registry",
      summary: "Keep source revision and authority explicit.",
      evidence: [evidenceB, evidenceA, evidenceA]
    });

    expect(proposal.state).toBe("review-candidate");
    expect(proposal.projectIds).toEqual(["project:alpha", "project:beta"]);
    expect(proposal.evidence).toHaveLength(2);
    expect(proposal.requiresExplicitReview).toBe(true);
  });

  it("requires explicit approval before producing a publishable record", () => {
    const proposal = createPatternPromotionProposal({
      kind: "anti-pattern",
      title: "Green CI equals release readiness",
      summary: "Do not equate passing CI with Production authorization.",
      evidence: [evidenceA, evidenceB]
    });

    const rejected = reviewPatternPromotion(proposal, {
      reviewerId: "principal:reviewer",
      reviewedAt: "2026-09-26T18:20:00+07:00",
      source: "review:p9-006",
      decision: "reject",
      note: "Needs stronger evidence."
    });
    expect(rejected).toBeNull();

    const approved = reviewPatternPromotion(proposal, {
      reviewerId: "principal:reviewer",
      reviewedAt: "2026-09-26T18:21:00+07:00",
      source: "review:p9-006",
      decision: "approve",
      note: "Cross-project evidence is sufficient."
    });

    expect(approved).toMatchObject({
      kind: "anti-pattern",
      state: "approved-for-publication",
      projectIds: ["project:alpha", "project:beta"]
    });
    expect(approved?.provenanceHash).toMatch(/^sha256:/);
  });

  it("does not allow one-project evidence to bypass review governance", () => {
    const proposal = createPatternPromotionProposal({
      kind: "pattern",
      title: "Single-project shortcut",
      summary: "This must not publish.",
      evidence: [evidenceA]
    });

    expect(() =>
      reviewPatternPromotion(proposal, {
        reviewerId: "principal:reviewer",
        reviewedAt: "2026-09-26T18:22:00+07:00",
        source: "review:p9-006",
        decision: "approve",
        note: "Attempted approval."
      })
    ).toThrow(/multi-project evidence/i);
  });
});
