import { describe, expect, it } from "vitest";

import {
  buildCompassAcceptancePreflight,
  compassAcceptanceGateId,
  compassAcceptanceReceipt,
  p9019ProfessionalReviewCandidate,
  verifyFinalReleaseGateMetadata,
  type ConstitutionalComplianceAudit
} from "../../packages/application/src";


function compliantConstitutionAudit(): ConstitutionalComplianceAudit {
  return {
    kind: "constitutional-compliance-audit",
    projectId: p9019ProfessionalReviewCandidate.projectId,
    policyId: "blueprint-os:universal-century-grade",
    policyVersion: "1.1.0",
    state: "compliant",
    pillars: [],
    gates: [],
    blockers: [],
    productionReleaseAuthority: false,
    exactReleaseRevisionCertified: false,
    boundaryNote: "Test fixture."
  };
}

describe("P9-020 Compass Acceptance preflight", () => {
  it("stays locked before human professional sign-off", () => {
    const preflight = buildCompassAcceptancePreflight();

    expect(preflight.state).toBe("locked");
    expect(preflight.acceptanceRecorded).toBe(false);
    expect(preflight.productionReleaseAuthority).toBe(false);
    expect(preflight.blockers).toContain("p9-019-human-signoff-required");
    expect(preflight.blockers).toContain("universal-constitution-non-compliant");
    expect(
      preflight.criteria.find((item) => item.id === "lower-dependencies")
    ).toMatchObject({ state: "blocked" });
    expect(
      preflight.criteria.find((item) => item.id === "final-release-gate")
    ).toMatchObject({ state: "blocked" });
  });

  it("unlocks final evidence collection only for an exact approved review decision", () => {
    const preflight = buildCompassAcceptancePreflight({
      constitutionAudit: compliantConstitutionAudit(),
      reviewDecision: {
        projectId: p9019ProfessionalReviewCandidate.projectId,
        reviewerActorId: "principal:human-reviewer",
        source: "authenticated-user-action",
        decision: "approve",
        decidedAt: "2026-09-27T12:30:00.000Z",
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

    expect(preflight.state).toBe("ready-for-final-evidence");
    expect(preflight.blockers).toEqual([]);
    expect(preflight.acceptanceRecorded).toBe(false);
    expect(preflight.productionReleaseAuthority).toBe(false);
    expect(
      preflight.criteria.find((item) => item.id === "source-of-truth")
    ).toMatchObject({ state: "pending-final-evidence" });
    expect(
      preflight.criteria.find((item) => item.id === "final-release-gate")
    ).toMatchObject({ state: "pending-final-evidence" });
  });

  it("fails closed when a decision is stale or non-approving", () => {
    const stale = buildCompassAcceptancePreflight({
      reviewDecision: {
        projectId: p9019ProfessionalReviewCandidate.projectId,
        reviewerActorId: "principal:human-reviewer",
        source: "authenticated-user-action",
        decision: "approve",
        decidedAt: "2026-09-27T12:30:00.000Z",
        note: "Stale decision.",
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

    expect(stale.state).toBe("locked");
    expect(
      stale.criteria.find((item) => item.id === "exact-review-evidence")
    ).toMatchObject({ state: "blocked" });

    const rejected = buildCompassAcceptancePreflight({
      reviewDecision: {
        projectId: p9019ProfessionalReviewCandidate.projectId,
        reviewerActorId: "principal:human-reviewer",
        source: "authenticated-user-action",
        decision: "reject",
        decidedAt: "2026-09-27T12:31:00.000Z",
        note: "Rejected.",
        candidateReviewedRevision:
          p9019ProfessionalReviewCandidate.reviewedRevision,
        candidateEvidenceDigest:
          p9019ProfessionalReviewCandidate.evidenceArtifact.digest,
        acknowledgedFindingIds: [],
        humanSignoff: false,
        p9020TransitionAllowed: false,
        productionReleaseAuthority: false,
        blockers: ["human-professional-signoff-required"]
      }
    });

    expect(rejected.state).toBe("locked");
    expect(rejected.blockers).toContain("p9-019-human-signoff-required");
  });
  it("does not unlock P9-020 from human approval alone when the Constitution is non-compliant", () => {
    const preflight = buildCompassAcceptancePreflight({
      reviewDecision: {
        projectId: p9019ProfessionalReviewCandidate.projectId,
        reviewerActorId: "principal:human-reviewer",
        source: "authenticated-user-action",
        decision: "approve",
        decidedAt: "2026-09-27T12:30:00.000Z",
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

    expect(preflight.state).toBe("locked");
    expect(preflight.blockers).toContain(
      "universal-constitution-non-compliant"
    );
    expect(
      preflight.criteria.find(
        (item) => item.id === "universal-constitution"
      )
    ).toMatchObject({ state: "blocked" });
  });


});

describe("P9-020 exact-revision receipt", () => {
  const revision = "a".repeat(40);
  const run = {
    id: 123,
    head_sha: revision,
    status: "completed",
    conclusion: "success",
    event: "workflow_dispatch",
    path: "BlueDragon33/Software-Blueprint-Hub/.github/workflows/release-gate.yml",
    html_url: "https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/123"
  };
  const steps = [
    "Universal Constitution compliance",
    "Constitution authority-set atomicity",
    "Source-of-truth contradiction gate",
    "Unit, contract, authority, and PostgreSQL integration tests",
    "Production build",
    "App Shell E2E + screenshots",
    "Generate Release Gate evidence manifest"
  ].map((name) => ({ name, conclusion: "success" }));
  const metadata = {
    revision,
    run,
    jobs: [{ name: "release-gate", conclusion: "success", steps }],
    artifacts: [{ id: 45, name: `release-gate-evidence-${revision}`,
      digest: `sha256:${"b".repeat(64)}`, expired: false }]
  };

  it("accepts only a successful manual gate, required audits, and an exact artifact", () => {
    expect(verifyFinalReleaseGateMetadata(metadata)).toMatchObject({ revision, runId: 123, artifactId: 45 });
    expect(() => verifyFinalReleaseGateMetadata({ ...metadata, run: { ...run, head_sha: "c".repeat(40) } })).toThrow(/exact/);
    expect(() => verifyFinalReleaseGateMetadata({ ...metadata, jobs: [{ ...metadata.jobs[0], steps: steps.slice(1) }] })).toThrow(/audit step/);
    expect(() => verifyFinalReleaseGateMetadata({ ...metadata, artifacts: [] })).toThrow(/artifact/);
  });

  it("does not treat a bare PASS gate or a mismatched revision as acceptance", () => {
    const id = compassAcceptanceGateId(revision);
    const gate = { id, projectId: "project:blueprint-os", name: "P9-020 acceptance",
      requirements: ["Final gate"], status: "pass" as const, evidenceIds: ["evidence:acceptance"],
      meta: { schemaVersion: "1.0.0" as const, recordVersion: 2,
        createdAt: "2026-09-29T00:00:00.000Z", updatedAt: "2026-09-29T00:01:00.000Z" } };
    const evidence = { id: "evidence:acceptance", gateId: id, kind: "artifact" as const,
      source: `https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/123/artifacts/45#sha256:${"b".repeat(64)}`,
      revision, createdAt: "2026-09-29T00:01:00.000Z" };
    expect(compassAcceptanceReceipt({ revision, gateBundles: [{ gate, evidence: [] }] }).accepted).toBe(false);
    expect(compassAcceptanceReceipt({ revision, gateBundles: [{ gate, evidence: [{ ...evidence, revision: "c".repeat(40) }] }] }).accepted).toBe(false);
    expect(compassAcceptanceReceipt({ revision, gateBundles: [{ gate, evidence: [evidence] }] }).accepted).toBe(true);
  });
});
