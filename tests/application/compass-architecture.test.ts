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
      expect(
        storey.dependsOn.every((dependency) => dependency < storey.number)
      ).toBe(true);
    }
  });

  it("derives state from the current Compass instead of storing decorative completion flags", () => {
    const compass = getBlueprintCompassProjection();
    const storeys = resolveCompassArchitecture(compass);
    const current = compass.currentStorey.number;

    expect(storeys.filter((item) => item.state === "accepted-baseline")).toHaveLength(
      current - 1
    );
    expect(
      storeys.filter((item) => item.state === "active").map((item) => item.number)
    ).toEqual([current]);
    expect(
      storeys.filter((item) => item.state === "planned").map((item) => item.number)
    ).toEqual(
      Array.from({ length: 20 - current }, (_, index) => current + index + 1)
    );
  });

  it("keeps future storeys dependency-gated without hard-coding the current phase", () => {
    const compass = getBlueprintCompassProjection();
    const storey20 = getCompassStorey(20, compass);

    expect(storey20).toMatchObject({
      code: "S20",
      dependsOn: [19]
    });
    expect(storey20?.state).toBe(
      compass.currentStorey.number < 20 ? "planned" : "active"
    );
    expect(getCompassStorey(99, compass)).toBeNull();
  });
});
