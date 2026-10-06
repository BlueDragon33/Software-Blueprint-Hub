import { describe, expect, it } from "vitest";

import {
  buildConstitutionPropagationProjection,
  type GovernedRepositoryAdoptionSnapshot,
  type GovernedRepositoryDefinition
} from "../../packages/application/src";

const pillars = [
  "structural-capacity",
  "architectural-longevity",
  "product-elegance",
  "premium-usability",
  "long-term-durability",
  "fortress-security-disaster-resilience",
  "operational-sovereignty-dependency-minimization"
] as const;

const definition: GovernedRepositoryDefinition = {
  repository: "Example/Project",
  branch: "main",
  projectId: "project:example",
  blueprintLevel: "B3",
  role: "governed"
};

function snapshot(policyVersion = "1.1.0"): GovernedRepositoryAdoptionSnapshot {
  return {
    repository: definition.repository,
    branch: definition.branch,
    sourceRevision: "a".repeat(40),
    manifest: {
      schemaVersion: "1.0.0",
      policyId: "blueprint-os:universal-century-grade",
      policyVersion,
      projectId: definition.projectId,
      blueprintLevel: definition.blueprintLevel,
      enforcementMode: "enforced",
      inheritedPillars: pillars,
      disabledPillars: [],
      constitutionalWaivers: [],
      evidenceAuthority: "canonical-quality-gates",
      productionAuthority: "separate-explicit-release-gate"
    }
  };
}

describe("CA-005 Constitution ecosystem propagation", () => {
  it("reports a repository current only for an exact valid adoption snapshot", () => {
    const projection = buildConstitutionPropagationProjection({
      policyId: "blueprint-os:universal-century-grade",
      activePolicyVersion: "1.1.0",
      governedRepositories: [definition],
      snapshots: [snapshot()]
    });

    expect(projection.currentRepositories).toBe(1);
    expect(projection.migrationRequiredRepositories).toBe(0);
    expect(projection.blockedRepositories).toBe(0);
    expect(projection.repositories[0]).toMatchObject({
      state: "current",
      observedPolicyVersion: "1.1.0",
      sourceRevision: "a".repeat(40),
      externalRepositoryMutationAllowed: false,
      qualityGatePassAllowed: false,
      productionReleaseAuthority: false
    });
  });

  it("generates a non-authoritative migration plan when policy is stale", () => {
    const projection = buildConstitutionPropagationProjection({
      policyId: "blueprint-os:universal-century-grade",
      activePolicyVersion: "1.2.0",
      governedRepositories: [definition],
      snapshots: [snapshot("1.1.0")]
    });

    expect(projection.currentRepositories).toBe(0);
    expect(projection.migrationRequiredRepositories).toBe(1);
    expect(projection.repositories[0]?.state).toBe("migration-required");
    expect(projection.repositories[0]?.migrationPlan).toMatchObject({
      fromPolicyVersion: "1.1.0",
      toPolicyVersion: "1.2.0",
      externalRepositoryMutationAllowed: false,
      canonicalProjectMutationAllowed: false,
      qualityGatePassAllowed: false,
      productionReleaseAuthority: false
    });
  });

  it("fails closed for invalid adoption instead of inventing migration success", () => {
    const broken = snapshot();
    const projection = buildConstitutionPropagationProjection({
      policyId: "blueprint-os:universal-century-grade",
      activePolicyVersion: "1.1.0",
      governedRepositories: [definition],
      snapshots: [
        {
          ...broken,
          manifest: broken.manifest
            ? {
                ...broken.manifest,
                disabledPillars: ["long-term-durability"]
              }
            : null
        }
      ]
    });

    expect(projection.blockedRepositories).toBe(1);
    expect(projection.repositories[0]?.state).toBe("invalid-adoption");
    expect(projection.repositories[0]?.blockers).toContain(
      "constitutional-pillar-disabled"
    );
    expect(projection.repositories[0]?.migrationPlan).toBeNull();
  });

  it("treats missing snapshots and policy-ahead repositories as blockers", () => {
    const missing = buildConstitutionPropagationProjection({
      policyId: "blueprint-os:universal-century-grade",
      activePolicyVersion: "1.1.0",
      governedRepositories: [definition],
      snapshots: []
    });
    expect(missing.repositories[0]?.state).toBe("unverified");

    const ahead = buildConstitutionPropagationProjection({
      policyId: "blueprint-os:universal-century-grade",
      activePolicyVersion: "1.1.0",
      governedRepositories: [definition],
      snapshots: [snapshot("2.0.0")]
    });
    expect(ahead.repositories[0]?.state).toBe("policy-ahead");
    expect(ahead.repositories[0]?.blockers).toContain(
      "repository-policy-version-ahead-of-authority"
    );
  });
});
