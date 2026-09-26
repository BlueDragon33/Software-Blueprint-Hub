import { describe, expect, it } from "vitest";
import { getBlueprintCompassProjection } from "../../packages/application/src";

describe("P9-002 Blueprint Compass projection", () => {
  it("orients work without manufacturing a progress percentage", () => {
    const compass = getBlueprintCompassProjection();

    expect(compass.phase).toBe("Phase 9 — Compass Construction");
    expect(compass.currentStorey).toEqual({
      number: 12,
      total: 20,
      name: "Compass dashboard"
    });
    expect(compass.activeWork).toMatchObject({
      id: "P9-002",
      status: "active"
    });
    expect(JSON.stringify(compass)).not.toMatch(/progressPercent|percentage|percentComplete/);
  });

  it("makes the dependency-valid sequence explicit", () => {
    const compass = getBlueprintCompassProjection();

    expect(compass.workSequence.map((item) => [item.id, item.status])).toEqual([
      ["P9-001", "complete"],
      ["P9-002", "active"],
      ["P9-003", "next"]
    ]);
    expect(compass.dependencyBlockers).toEqual([]);
  });

  it("retains exact evidence and never claims Production authority", () => {
    const compass = getBlueprintCompassProjection();

    expect(compass.releaseAuthority).toBe("not-authorized");
    expect(compass.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          revision: "c12c5517b4e80a59bb8636b98394682b1ae71ce4",
          result: "pass"
        }),
        expect.objectContaining({
          revision: "0c482e4f88478d55bd6198938934af708f907dc7",
          result: "pass"
        })
      ])
    );
  });
});
