import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildConstitutionPropagationProjection,
  type GovernedRepositoryAdoptionSnapshot,
  type GovernedRepositoryDefinition
} from "../../packages/application/src";

describe("CA-005 checked-in ecosystem controls", () => {
  it("projects the governed ecosystem snapshot as current without granting mutation authority", () => {
    const registry = JSON.parse(
      readFileSync("control/constitution-governed-repositories.json", "utf8")
    ) as {
      policyId: string;
      repositories: GovernedRepositoryDefinition[];
    };
    const snapshot = JSON.parse(
      readFileSync("control/constitution-ecosystem-snapshot.json", "utf8")
    ) as {
      activePolicyVersion: string;
      repositories: GovernedRepositoryAdoptionSnapshot[];
    };

    const projection = buildConstitutionPropagationProjection({
      policyId: registry.policyId,
      activePolicyVersion: snapshot.activePolicyVersion,
      governedRepositories: registry.repositories,
      snapshots: snapshot.repositories
    });

    expect(projection.totalRepositories).toBe(15);
    expect(projection.currentRepositories).toBe(0);
    expect(projection.migrationRequiredRepositories).toBe(14);
    expect(projection.blockedRepositories).toBe(1);
    expect(
      projection.repositories.find(
        (item) => item.repository === "BlueDragon33/Software-Blueprint-Hub"
      )
    ).toMatchObject({
      role: "authority-self",
      state: "migration-required",
      externalRepositoryMutationAllowed: false,
      qualityGatePassAllowed: false,
      productionReleaseAuthority: false
    });
    expect(
      projection.repositories.find(
        (item) => item.repository === "BlueDragon33/pc-manager-desktop"
      )
    ).toMatchObject({
      state: "invalid-adoption",
      blockers: ["adoption-manifest-unavailable"],
      productionReleaseAuthority: false
    });
    expect(projection.externalRepositoryMutationAllowed).toBe(false);
    expect(projection.automaticQualityGatePassAllowed).toBe(false);
    expect(projection.productionReleaseAuthority).toBe(false);
  });
});
