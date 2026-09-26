import { describe, expect, it } from "vitest";
import {
  getBlueprintCompassProjection,
  getCompassStorey,
  resolveCompassArchitecture
} from "../../packages/application/src";

describe("P9-003 20-storey architecture projection", () => {
  it("defines exactly twenty dependency-linked layers", () => {
    const storeys = resolveCompassArchitecture();

    expect(storeys).toHaveLength(20);
    expect(storeys.map((item) => item.number)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1)
    );
    for (const storey of storeys.slice(1)) {
      expect(storey.dependsOn.length).toBeGreaterThan(0);
      expect(storey.dependsOn.every((dependency) => dependency < storey.number)).toBe(true);
    }
  });

  it("derives state from the Compass instead of storing decorative completion flags", () => {
    const compass = getBlueprintCompassProjection();
    const storeys = resolveCompassArchitecture(compass);

    expect(compass.currentStorey.number).toBe(12);
    expect(storeys.filter((item) => item.state === "accepted-baseline")).toHaveLength(11);
    expect(storeys.filter((item) => item.state === "active").map((item) => item.number)).toEqual([12]);
    expect(storeys.filter((item) => item.state === "planned").map((item) => item.number)).toEqual([13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it("keeps future storeys dependency-gated", () => {
    expect(getCompassStorey(20)).toMatchObject({
      code: "S20",
      state: "planned",
      dependsOn: [19]
    });
    expect(getCompassStorey(99)).toBeNull();
  });
});
