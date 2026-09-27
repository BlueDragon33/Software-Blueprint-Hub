import { readFileSync } from "node:fs";

import type { ProjectProfile } from "../../packages/contracts/src";
import {
  foundationBlueprintTemplatesV1,
  resolveFoundationBlueprintPreview
} from "../../packages/application/src";
import { describe, expect, it } from "vitest";

const baseProfile = JSON.parse(
  readFileSync(
    new URL("../contracts/fixtures/v1/project-profile.valid.json", import.meta.url),
    "utf8"
  )
) as ProjectProfile;

describe("Foundation Blueprint template catalog", () => {
  it("contains only versioned generic template IDs", () => {
    expect(foundationBlueprintTemplatesV1.length).toBeGreaterThan(1);
    for (const template of foundationBlueprintTemplatesV1) {
      expect(template.id).toMatch(/^template:/);
      expect(template.version).toMatch(/^\d+\.\d+\.\d+/);
      expect(template.id.toLowerCase()).not.toContain("bauman");
    }
  });

  it("resolves B4 to universal + platform requirements", () => {
    const result = resolveFoundationBlueprintPreview({
      ...baseProfile,
      blueprintLevel: "B4"
    });

    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(result.blueprint.requiredModules).toContain(
      "module:architecture:boundaries"
    );
    expect(result.blueprint.requiredModules).toContain(
      "module:platform:extension-contract"
    );
    expect(result.blueprint.requiredGates).toContain(
      "gate:ux:human-acceptance"
    );
    expect(result.blueprint.requiredGates).toContain(
      "gate:platform:compatibility"
    );
  });

  it("does not leak B4 platform requirements into B0", () => {
    const result = resolveFoundationBlueprintPreview({
      ...baseProfile,
      blueprintLevel: "B0"
    });

    expect(result.status).toBe("success");
    if (result.status !== "success") return;

    expect(result.blueprint.requiredModules).toContain(
      "module:micro:release-definition"
    );
    expect(result.blueprint.requiredModules).not.toContain(
      "module:platform:extension-contract"
    );
  });
  it("inherits all century-grade construction pillars at every Blueprint Level", () => {
    const universalModules = [
      "module:architecture:structural-capacity",
      "module:governance:architectural-longevity",
      "module:ux:product-elegance",
      "module:ux:premium-usability",
      "module:maintenance:long-term-durability",
      "module:security:fortress-resilience"
    ] as const;
    const universalGates = [
      "gate:architecture:future-scale",
      "gate:ux:commercial-quality",
      "gate:durability:ageing-regression",
      "gate:security:resilience-containment"
    ] as const;

    for (const blueprintLevel of ["B0", "B1", "B2", "B3", "B4", "B5"] as const) {
      const result = resolveFoundationBlueprintPreview({
        ...baseProfile,
        blueprintLevel
      });

      expect(result.status).toBe("success");
      if (result.status !== "success") continue;

      for (const moduleId of universalModules) {
        expect(result.blueprint.requiredModules).toContain(moduleId);
      }
      for (const gateId of universalGates) {
        expect(result.blueprint.requiredGates).toContain(gateId);
      }
    }
  });

});
