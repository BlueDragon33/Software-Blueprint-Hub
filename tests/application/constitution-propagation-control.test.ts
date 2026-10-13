import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildConstitutionPropagationProjection,
  CONSTITUTION_POLICY_VERSION,
  type GovernedRepositoryAdoptionSnapshot,
  type GovernedRepositoryDefinition
} from "../../packages/application/src";

describe("CA-005 checked-in ecosystem controls", () => {
  it.each([
    { activePolicyVersion: "1.2.0", current: 15, migrating: 0, state: "current", complianceState: "unverified" },
    { activePolicyVersion: "1.3.0", current: 0, migrating: 15, state: "migration-required", complianceState: "migration-required" }
  ] as const)(
    "preserves historical 1.2 observations under authority $activePolicyVersion without granting mutation or PASS",
    ({ activePolicyVersion, current, migrating, state }) => {
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

      expect(snapshot.activePolicyVersion).toBe(CONSTITUTION_POLICY_VERSION);
      expect(snapshot.repositories).toHaveLength(15);
      expect([...new Set(snapshot.repositories.map((item) => item.manifest?.policyVersion))]).toEqual(["1.2.0"]);

      const projection = buildConstitutionPropagationProjection({
        policyId: registry.policyId,
        activePolicyVersion,
        governedRepositories: registry.repositories,
        snapshots: snapshot.repositories
      });

      expect(projection.totalRepositories).toBe(15);
      expect(projection.currentRepositories).toBe(current);
      expect(projection.migrationRequiredRepositories).toBe(migrating);
      expect(projection.blockedRepositories).toBe(0);
      expect(
        projection.repositories.find(
          (item) => item.repository === "BlueDragon33/Software-Blueprint-Hub"
        )
      ).toMatchObject({
        role: "authority-self",
        state,
        observedPolicyVersion: "1.2.0",
        externalRepositoryMutationAllowed: false,
        qualityGatePassAllowed: false,
        productionReleaseAuthority: false
      });
      expect(
        projection.repositories.find(
          (item) => item.repository === "BlueDragon33/pc-manager-desktop"
        )
      ).toMatchObject({
        state,
        observedPolicyVersion: "1.2.0",
        blockers: [],
        productionReleaseAuthority: false
      });
      expect(projection.externalRepositoryMutationAllowed).toBe(false);
      expect(projection.automaticQualityGatePassAllowed).toBe(false);
      expect(projection.productionReleaseAuthority).toBe(false);
    }
  );
});
