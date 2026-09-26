import { describe, expect, it } from "vitest";

import {
  createProjectBootstrapPlan,
  recommendBlueprintLevel,
  type ProjectBootstrapIntent
} from "../../packages/application/src/project-bootstrap";

function intent(
  overrides: Partial<ProjectBootstrapIntent> = {}
): ProjectBootstrapIntent {
  return {
    name: "Inventory Pilot",
    projectType: "web-application",
    primaryUsers: ["operator"],
    jobsToBeDone: ["Track inventory accurately."],
    dataSensitivity: "internal",
    persistence: "server",
    authentication: "required",
    authorization: "role-based",
    offlineRequirement: "none",
    externalIntegrations: [],
    aiUse: "assistive",
    extensibilityRequirement: "configuration",
    expectedLifetime: "years",
    deploymentTarget: "managed web platform",
    criticality: "standard",
    ...overrides
  };
}

describe("P9-005 Project Bootstrap Factory", () => {
  it("recommends engineering depth from explicit risk signals", () => {
    expect(recommendBlueprintLevel(intent()).level).toBe("B2");
    expect(
      recommendBlueprintLevel(
        intent({
          externalIntegrations: ["erp"],
          aiUse: "core-feature"
        })
      ).level
    ).toBe("B3");
    expect(
      recommendBlueprintLevel(
        intent({
          extensibilityRequirement: "plugins",
          externalIntegrations: ["erp", "crm", "billing"]
        })
      ).level
    ).toBe("B4");
    expect(
      recommendBlueprintLevel(
        intent({
          dataSensitivity: "restricted",
          authorization: "policy-based",
          criticality: "critical"
        })
      ).level
    ).toBe("B5");
  });

  it("allows a requested minimum only to raise, never weaken, derived depth", () => {
    expect(
      recommendBlueprintLevel(
        intent({
          criticality: "critical",
          minimumBlueprintLevel: "B1"
        })
      ).level
    ).toBe("B5");

    expect(
      recommendBlueprintLevel(
        intent({
          persistence: "none",
          authentication: "none",
          authorization: "none",
          expectedLifetime: "temporary",
          minimumBlueprintLevel: "B3"
        })
      ).level
    ).toBe("B3");
  });

  it("creates a deterministic validated preview without canonical mutation authority", () => {
    const first = createProjectBootstrapPlan(intent());
    const second = createProjectBootstrapPlan(intent());

    expect(second).toEqual(first);
    expect(first.canonicalMutationAllowed).toBe(false);
    expect(first.requiresExplicitCreateConfirmation).toBe(true);
    expect(first.profile.blueprintLevel).toBe(first.recommendation.level);
    expect(first.blueprint.projectId).toBe(first.profile.projectId);
    expect(first.summary.modules).toBeGreaterThan(0);
    expect(first.summary.gates).toBeGreaterThan(0);
  });

  it("creates a dependency-aware roadmap from resolved requirements", () => {
    const plan = createProjectBootstrapPlan(
      intent({
        externalIntegrations: ["erp"],
        aiUse: "core-feature"
      })
    );

    const purpose = plan.roadmap.find(
      (item) => item.sourceRequirementId === "module:product:purpose"
    );
    const boundaries = plan.roadmap.find(
      (item) => item.sourceRequirementId === "module:architecture:boundaries"
    );

    expect(purpose?.status).toBe("ready");
    expect(boundaries?.dependsOn).toContain(
      "bootstrap-work:module:product:purpose"
    );
    expect(boundaries?.status).toBe("planned");
    expect(plan.roadmap.some((item) => item.kind === "gate")).toBe(true);
  });

  it("fails closed on incomplete intent instead of inventing users or purpose", () => {
    expect(() =>
      createProjectBootstrapPlan(intent({ primaryUsers: [] }))
    ).toThrow(/primary user/i);
    expect(() =>
      createProjectBootstrapPlan(intent({ jobsToBeDone: [] }))
    ).toThrow(/job-to-be-done/i);
  });
});
