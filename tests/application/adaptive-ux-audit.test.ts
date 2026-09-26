import { describe, expect, it } from "vitest";

import {
  blueprintOsAdaptiveUxAuditV1,
  buildAdaptiveUxAuditPlan
} from "../../packages/application/src/adaptive-ux-audit";

describe("P9-016 Accessibility & Adaptive UX Audit", () => {
  it("covers desktop, tablet and mobile without gaining release authority", () => {
    expect(blueprintOsAdaptiveUxAuditV1.blockers).toEqual([]);
    expect(Object.keys(blueprintOsAdaptiveUxAuditV1.targetViewports).sort()).toEqual([
      "desktop",
      "mobile",
      "tablet"
    ]);
    expect(blueprintOsAdaptiveUxAuditV1.productionReleaseAuthority).toBe(false);
    expect(blueprintOsAdaptiveUxAuditV1.canonicalMutationAllowed).toBe(false);
  });

  it("fails closed when a required accessibility dimension is missing", () => {
    const plan = buildAdaptiveUxAuditPlan({
      sourceRevision: "test",
      surfaces: [{
        id: "only",
        path: "/",
        viewports: ["desktop"],
        requirements: ["keyboard"]
      }]
    });

    expect(plan.blockers).toContain("missing-viewport:tablet");
    expect(plan.blockers).toContain("missing-viewport:mobile");
    expect(plan.blockers).toContain("missing-audit-requirement:reduced-motion");
    expect(plan.blockers).toContain("missing-audit-requirement:no-horizontal-overflow");
  });

  it("rejects duplicate audit surface identities", () => {
    expect(() =>
      buildAdaptiveUxAuditPlan({
        sourceRevision: "test",
        surfaces: [
          { id: "dup", path: "/a", viewports: ["desktop"], requirements: ["keyboard"] },
          { id: "dup", path: "/b", viewports: ["mobile"], requirements: ["focus-visible"] }
        ]
      })
    ).toThrow(/Duplicate audit surface/);
  });
});
