import { describe, expect, it } from "vitest";
import type { HumanProfessionalReviewDecisionRecord, QualityGateEvidenceBundle } from "@blueprint-os/core";
import { getBlueprintCompassProjection, p9019ProfessionalReviewCandidate, resolveCompassArchitecture, type ConstitutionalComplianceAudit } from "../../packages/application/src";

const revision = "a".repeat(40);
const source = `https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/123/artifacts/45#sha256:${"b".repeat(64)}`;
const review: HumanProfessionalReviewDecisionRecord = {
  projectId: "project:blueprint-os", reviewerActorId: "principal:test-reviewer",
  source: "authenticated-user-action", decision: "approve", decidedAt: "2026-09-29T00:00:00.000Z",
  note: "Isolated test fixture, not a real human sign-off.",
  candidateReviewedRevision: p9019ProfessionalReviewCandidate.reviewedRevision,
  candidateEvidenceDigest: p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
  acknowledgedFindingIds: [], humanSignoff: true, p9020TransitionAllowed: true,
  productionReleaseAuthority: false, blockers: []
};
const constitutionAudit: ConstitutionalComplianceAudit = {
  kind: "constitutional-compliance-audit", projectId: "project:blueprint-os",
  policyId: "blueprint-os:universal-century-grade", policyVersion: "1.2.0", state: "compliant",
  pillars: [], gates: [], blockers: [], productionReleaseAuthority: false,
  exactReleaseRevisionCertified: false, boundaryNote: "Isolated test audit."
};
const bundle: QualityGateEvidenceBundle = {
  gate: { id: `gate:compass:p9-020:${revision}`, projectId: "project:blueprint-os",
    name: "P9-020 acceptance", requirements: ["Final gate"], status: "pass", evidenceIds: ["evidence:acceptance"],
    meta: { schemaVersion: "1.0.0", recordVersion: 2, createdAt: "2026-09-29T00:00:00.000Z", updatedAt: "2026-09-29T00:01:00.000Z" } },
  evidence: [{ id: "evidence:acceptance", gateId: `gate:compass:p9-020:${revision}`, kind: "artifact", source, revision, createdAt: "2026-09-29T00:01:00.000Z" }]
};

describe("canonical Compass recovery", () => {
  it("shows canonical constitutional blockers before human approval exists", () => {
    for (const decision of [null, { ...review, decision: "reject" as const, humanSignoff: false, p9020TransitionAllowed: false }]) {
      const projection = getBlueprintCompassProjection(decision, {
        revision, gateBundles: [],
        constitutionAudit: { ...constitutionAudit, state: "non-compliant" }
      });
      expect(projection.dependencyBlockers).toContain("universal-constitution-non-compliant");
      expect(projection.dependencyBlockers).toContain("p9-019-human-signoff-required");
      expect(projection.activeWork.id).toBe("P9-019");
      expect(projection.truthNote).toContain("canonical");
      expect(projection.releaseAuthority).toBe("not-authorized");
    }
  });

  it("does not mark P9-019 complete from a stale canonical approval", () => {
    const projection = getBlueprintCompassProjection({ ...review, candidateReviewedRevision: "d".repeat(40) }, {
      revision, gateBundles: [bundle], constitutionAudit
    });
    expect(projection.activeWork.id).toBe("P9-019");
    expect(projection.workSequence.find(item => item.id === "P9-019")?.status).toBe("active");
    expect(projection.dependencyBlockers).toContain("p9-019-human-signoff-required");
    expect(projection.evidence.some(item => item.label === "P9-019 Human Professional Review")).toBe(false);
  });

  it("shows P9-020 complete only from the current revision's linked receipt", () => {
    const projection = getBlueprintCompassProjection(review, { revision, gateBundles: [bundle], constitutionAudit });
    expect(projection.activeWork).toMatchObject({ id: "P9-020", status: "complete" });
    expect(projection.workSequence.every(item => item.status === "complete")).toBe(true);
    expect(projection.evidence).toContainEqual({ label: "P9-020 Compass Acceptance", revision, source, result: "pass" });
    expect(projection.releaseAuthority).toBe("not-authorized");
    expect(resolveCompassArchitecture(projection).every(item => item.state === "accepted-baseline")).toBe(true);
  });

  it("does not reuse an old receipt or a bare PASS for a changed deployment", () => {
    for (const input of [
      { revision: "c".repeat(40), gateBundles: [bundle], constitutionAudit },
      { revision, gateBundles: [{ ...bundle, evidence: [] }], constitutionAudit },
      { revision: null, gateBundles: [bundle], constitutionAudit }
    ]) {
      expect(getBlueprintCompassProjection(review, input).activeWork.status).toBe("active");
    }
  });

  it("retains dependency locks even when a receipt exists", () => {
    const input = { revision, gateBundles: [bundle], constitutionAudit };
    expect(getBlueprintCompassProjection(null, input).activeWork.id).toBe("P9-019");
    expect(getBlueprintCompassProjection({ ...review, decision: "reject", humanSignoff: false, p9020TransitionAllowed: false }, input).activeWork.id).toBe("P9-019");
    expect(getBlueprintCompassProjection(review, { ...input, constitutionAudit: null }).activeWork.status).toBe("active");
    expect(getBlueprintCompassProjection({ ...review, candidateReviewedRevision: "d".repeat(40) }, input).activeWork.status).not.toBe("complete");
  });

  it("exposes constitutional locks independently of receipt presence", () => {
    for (const audit of [null, { ...constitutionAudit, state: "non-compliant" as const }]) {
      for (const gateBundles of [[], [bundle]]) {
        const projection = getBlueprintCompassProjection(review, { revision, gateBundles, constitutionAudit: audit });
        expect(projection.dependencyBlockers).toContain("universal-constitution-non-compliant");
        expect(projection.activeWork.reason).toContain("locked");
        expect(projection.activeWork.status).toBe("active");
      }
    }
  });
});
