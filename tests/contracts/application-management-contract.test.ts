import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface ApplicationManagementContract {
  readonly schema: string;
  readonly application: Readonly<Record<string, unknown>>;
  readonly policy: Readonly<Record<string, boolean>>;
  readonly boundary: Readonly<Record<string, boolean>>;
  readonly readiness: Readonly<Record<string, string>>;
  readonly capabilities: Readonly<Record<string, boolean>>;
}

const repoRoot = process.cwd();
const contract = JSON.parse(
  readFileSync(join(repoRoot, "control/application-management.contract.json"), "utf8")
) as ApplicationManagementContract;

describe("P9-001 Application Management contract", () => {
  it("publishes deterministic Blueprint OS metadata identity", () => {
    expect(contract.schema).toBe("application-management.contract/v1");
    expect(contract.application).toMatchObject({
      id: "software-blueprint-hub",
      name: "Software Blueprint Hub",
      shortName: "Blueprint OS",
      category: "Kỹ thuật",
      repository: "BlueDragon33/Software-Blueprint-Hub"
    });
  });

  it("does not grant App Manage canonical engineering authority", () => {
    expect(contract.policy).toMatchObject({
      remoteAdminReady: false,
      productionRuntimeReady: false,
      metadataOnly: true,
      applicationManagementMayInventOperations: false,
      applicationManagementMayMutateCanonicalBlueprintState: false,
      applicationManagementMayPassQualityGates: false,
      applicationManagementMayAuthorizeProductionRelease: false
    });
    expect(contract.boundary).toMatchObject({
      canonicalBlueprintStateInControlPlane: false,
      constitutionAuthorityInControlPlane: false,
      qualityGateAuthorityInControlPlane: false,
      promptMutationAuthorityInControlPlane: false,
      releaseAuthorityInControlPlane: false
    });
  });

  it("reports Phase 8 as development evidence without pretending Production exists", () => {
    expect(contract.readiness.referenceImport).toBe("pass-development-baseline");
    expect(contract.readiness.productionDeployment).toBe("not-authorized");
    expect(contract.capabilities.webLaunch).toBe(false);
  });
});
