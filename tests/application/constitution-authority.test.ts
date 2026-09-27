import { describe, expect, it } from "vitest";

import {
  createConstitutionAuthorityPrompt,
  transitionConstitutionAmendment,
  type ConstitutionAmendmentRecord
} from "../../packages/application/src";

const proposal = {
  id: "amendment:test-001",
  basePolicyVersion: "1.1.0",
  targetPolicyVersion: "1.2.0",
  title: "Strengthen constitutional durability evidence",
  problem: "Long-term upgrade evidence needs a stronger universal definition.",
  rationale: "Prevent projects from claiming durability from build success alone.",
  affectedPillarIds: ["long-term-durability"],
  affectedRequirementIds: ["gate:durability:ageing-regression"],
  compatibilityRisk: "medium" as const,
  migrationRequired: true,
  proposedAt: "2026-09-27T15:30:00.000Z"
};

function draft(): ConstitutionAmendmentRecord {
  return {
    proposal,
    state: "draft",
    impactEvidenceIds: [],
    migrationEvidenceIds: [],
    ratificationDecisionId: null,
    publicationEvidenceId: null,
    propagationEvidenceIds: [],
    verificationEvidenceIds: [],
    productionReleaseAuthority: false
  };
}

describe("Constitution Authority protocol", () => {
  it("fails closed on stage skipping and AI-like publication shortcuts", () => {
    expect(() =>
      transitionConstitutionAmendment(draft(), {
        action: "publish",
        evidenceIds: ["evidence:fake"]
      })
    ).toThrow(/ratified/i);

    expect(() =>
      transitionConstitutionAmendment(draft(), {
        action: "complete-impact-review"
      })
    ).toThrow(/canonical evidence/i);
  });

  it("requires an authenticated human decision for ratification", () => {
    const impact = transitionConstitutionAmendment(draft(), {
      action: "complete-impact-review",
      evidenceIds: ["evidence:impact"]
    });
    const migration = transitionConstitutionAmendment(impact, {
      action: "complete-migration-plan",
      evidenceIds: ["evidence:migration"]
    });
    const ready = transitionConstitutionAmendment(migration, {
      action: "open-ratification"
    });

    expect(() =>
      transitionConstitutionAmendment(ready, { action: "ratify" })
    ).toThrow(/authenticated human constitutional decision/i);

    const ratified = transitionConstitutionAmendment(ready, {
      action: "ratify",
      humanRatificationDecisionId: "constitution-decision:human-001"
    });
    expect(ratified.state).toBe("ratified");
    expect(ratified.productionReleaseAuthority).toBe(false);
  });

  it("keeps prompt projections deterministic and non-authoritative", () => {
    const first = createConstitutionAuthorityPrompt("impact", proposal);
    const second = createConstitutionAuthorityPrompt("impact", {
      ...proposal,
      affectedPillarIds: [...proposal.affectedPillarIds]
    });

    expect(first.sourceDigest).toBe(second.sourceDigest);
    expect(first.content).toBe(second.content);
    expect(first.mayRatify).toBe(false);
    expect(first.mayMutateCanonicalConstitution).toBe(false);
    expect(first.productionReleaseAuthority).toBe(false);
    expect(first.content).toContain(
      "AI may analyze, draft, compare and propose; AI cannot ratify or publish the Constitution."
    );
  });

  it("preserves publication and verification order", () => {
    let record = draft();
    record = transitionConstitutionAmendment(record, {
      action: "complete-impact-review",
      evidenceIds: ["evidence:impact"]
    });
    record = transitionConstitutionAmendment(record, {
      action: "complete-migration-plan",
      evidenceIds: ["evidence:migration"]
    });
    record = transitionConstitutionAmendment(record, {
      action: "open-ratification"
    });
    record = transitionConstitutionAmendment(record, {
      action: "ratify",
      humanRatificationDecisionId: "constitution-decision:human-001"
    });
    record = transitionConstitutionAmendment(record, {
      action: "publish",
      evidenceIds: ["evidence:publication"]
    });
    expect(record.state).toBe("published");

    record = transitionConstitutionAmendment(record, {
      action: "begin-propagation",
      evidenceIds: ["evidence:repo-a"]
    });
    record = transitionConstitutionAmendment(record, {
      action: "verify",
      evidenceIds: ["evidence:verification"]
    });
    expect(record.state).toBe("verified");
    expect(record.productionReleaseAuthority).toBe(false);

    expect(() =>
      transitionConstitutionAmendment(record, {
        action: "complete-impact-review",
        evidenceIds: ["evidence:late"]
      })
    ).toThrow(/immutable/i);
  });
});
