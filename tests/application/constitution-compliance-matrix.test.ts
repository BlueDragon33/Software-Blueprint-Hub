import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildConstitutionComplianceMatrix,
  buildConstitutionPropagationProjection,
  centuryGradePillarDefinitions,
  constitutionalGateIds,
  type ConstitutionComplianceAttestation,
  type ConstitutionComplianceObservation,
  type GovernedRepositoryAdoptionSnapshot,
  type GovernedRepositoryDefinition
} from "../../packages/application/src";

const definition: GovernedRepositoryDefinition = {
  repository: "Example/Project",
  branch: "main",
  projectId: "project:example",
  blueprintLevel: "B3",
  role: "governed"
};

const sourceRevision = "a".repeat(40);

function adoption(policyVersion = "1.1.0"): GovernedRepositoryAdoptionSnapshot {
  return {
    repository: definition.repository,
    branch: definition.branch,
    sourceRevision,
    manifest: {
      schemaVersion: "1.0.0",
      policyId: "blueprint-os:universal-century-grade",
      policyVersion,
      projectId: definition.projectId,
      blueprintLevel: definition.blueprintLevel,
      enforcementMode: "enforced",
      inheritedPillars: centuryGradePillarDefinitions.map((pillar) => pillar.id),
      disabledPillars: [],
      constitutionalWaivers: [],
      evidenceAuthority: "canonical-quality-gates",
      productionAuthority: "separate-explicit-release-gate"
    }
  };
}

function propagation(policyVersion = "1.1.0") {
  return buildConstitutionPropagationProjection({
    policyId: "blueprint-os:universal-century-grade",
    activePolicyVersion: policyVersion,
    governedRepositories: [definition],
    snapshots: [adoption()]
  });
}

function attestation(): ConstitutionComplianceAttestation {
  const gates = constitutionalGateIds.map((id) => ({
    id,
    state: "pass" as const,
    status: "pass" as const,
    evidenceIds: [`evidence:${id}`],
    evidenceRevisions: [sourceRevision]
  }));

  return {
    schemaVersion: "1.0.0",
    kind: "constitutional-compliance-attestation",
    source: "trusted-project-compliance-attestation",
    policyId: "blueprint-os:universal-century-grade",
    policyVersion: "1.1.0",
    repository: definition.repository,
    branch: definition.branch,
    projectId: definition.projectId,
    blueprintLevel: definition.blueprintLevel,
    sourceRevision,
    workflowRunId: "36380000001",
    verifiedAt: "2026-09-28T03:00:00.000Z",
    state: "compliant",
    pillars: centuryGradePillarDefinitions.map((pillar) => ({
      id: pillar.id,
      state: "compliant" as const,
      missingRequirementIds: [],
      blockingGateIds: []
    })),
    gates,
    blockers: [],
    exactReleaseRevisionCertified: false,
    productionReleaseAuthority: false
  };
}

function observation(
  value: ConstitutionComplianceAttestation | null
): ConstitutionComplianceObservation {
  return {
    repository: definition.repository,
    branch: definition.branch,
    sourceRevision,
    observedAt: "2026-09-28T03:01:00.000Z",
    discovery: value
      ? "standard-attestation-found"
      : "standard-attestation-not-found",
    attestation: value
  };
}

describe("CA-006 Constitutional Compliance Matrix", () => {
  it("keeps current adoption UNVERIFIED without a standard compliance attestation", () => {
    const matrix = buildConstitutionComplianceMatrix({
      propagation: propagation(),
      observations: [observation(null)]
    });

    expect(matrix.totalRepositories).toBe(1);
    expect(matrix.compliantRepositories).toBe(0);
    expect(matrix.unverifiedRepositories).toBe(1);
    expect(matrix.repositories[0]).toMatchObject({
      complianceState: "unverified",
      adoptedPolicyVersion: "1.1.0",
      migrationState: "current",
      sourceRevision,
      exactEvidenceRevisions: [],
      productionReleaseAuthority: false
    });
    expect(matrix.repositories[0]?.pillarStates).toHaveLength(7);
    expect(
      matrix.repositories[0]?.pillarStates.every(
        (pillar) => pillar.state === "unverified"
      )
    ).toBe(true);
  });

  it("accepts COMPLIANT only when the exact current revision carries all pillar and gate evidence", () => {
    const matrix = buildConstitutionComplianceMatrix({
      propagation: propagation(),
      observations: [observation(attestation())]
    });

    expect(matrix.compliantRepositories).toBe(1);
    expect(matrix.repositories[0]).toMatchObject({
      complianceState: "compliant",
      blockingGateIds: [],
      productionReleaseAuthority: false
    });
    expect(matrix.repositories[0]?.exactEvidenceRevisions).toEqual([
      sourceRevision
    ]);
    expect(
      matrix.repositories[0]?.pillarStates.every(
        (pillar) => pillar.state === "compliant"
      )
    ).toBe(true);
  });

  it("blocks a self-declared compliant attestation that omits gate evidence", () => {
    const invalid = attestation();
    const firstGate = invalid.gates[0]!;
    const corrupted: ConstitutionComplianceAttestation = {
      ...invalid,
      gates: [
        {
          ...firstGate,
          evidenceIds: [],
          evidenceRevisions: []
        },
        ...invalid.gates.slice(1)
      ]
    };

    const matrix = buildConstitutionComplianceMatrix({
      propagation: propagation(),
      observations: [observation(corrupted)]
    });

    expect(matrix.blockedRepositories).toBe(1);
    expect(matrix.repositories[0]?.complianceState).toBe("blocked");
    expect(
      matrix.repositories[0]?.blockers.some((blocker) =>
        blocker.startsWith("compliance-gate-pass-without-evidence:")
      )
    ).toBe(true);
  });

  it("does not evaluate compliance against a stale Constitution adoption", () => {
    const matrix = buildConstitutionComplianceMatrix({
      propagation: propagation("1.2.0"),
      observations: [observation(attestation())]
    });

    expect(matrix.migrationRequiredRepositories).toBe(1);
    expect(matrix.repositories[0]).toMatchObject({
      complianceState: "migration-required",
      migrationState: "migration-required",
      productionReleaseAuthority: false
    });
  });

  it("projects the checked-in ecosystem truth as 14 adopted-current plus one governed-unadopted repository", () => {
    const registry = JSON.parse(
      readFileSync("control/constitution-governed-repositories.json", "utf8")
    ) as {
      policyId: string;
      repositories: GovernedRepositoryDefinition[];
    };
    const adoptionSnapshot = JSON.parse(
      readFileSync("control/constitution-ecosystem-snapshot.json", "utf8")
    ) as {
      activePolicyVersion: string;
      repositories: GovernedRepositoryAdoptionSnapshot[];
    };
    const complianceSnapshot = JSON.parse(
      readFileSync("control/constitution-compliance-snapshot.json", "utf8")
    ) as {
      observations: ConstitutionComplianceObservation[];
    };

    const ecosystemPropagation = buildConstitutionPropagationProjection({
      policyId: registry.policyId,
      activePolicyVersion: adoptionSnapshot.activePolicyVersion,
      governedRepositories: registry.repositories,
      snapshots: adoptionSnapshot.repositories
    });
    const matrix = buildConstitutionComplianceMatrix({
      propagation: ecosystemPropagation,
      observations: complianceSnapshot.observations
    });

    expect(ecosystemPropagation.currentRepositories).toBe(14);
    expect(matrix.totalRepositories).toBe(15);
    expect(matrix.compliantRepositories).toBe(0);
    expect(matrix.nonCompliantRepositories).toBe(0);
    expect(matrix.unverifiedRepositories).toBe(14);
    expect(matrix.blockedRepositories).toBe(1);
    expect(
      matrix.repositories.find(
        (item) => item.repository === "BlueDragon33/pc-manager-desktop"
      )
    ).toMatchObject({
      complianceState: "blocked",
      migrationState: "invalid-adoption",
      productionReleaseAuthority: false
    });
    expect(matrix.productionReleaseAuthority).toBe(false);
    expect(matrix.automaticPassAllowed).toBe(false);
  });
});
