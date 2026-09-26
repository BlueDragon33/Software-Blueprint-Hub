import { describe, expect, it } from "vitest";
import { getBlueprintCompassProjection } from "../../packages/application/src";

function collectObjectKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectObjectKeys);
  }
  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value as Readonly<Record<string, unknown>>).flatMap(
    ([key, child]) => [key, ...collectObjectKeys(child)]
  );
}

describe("P9-002 Blueprint Compass projection", () => {
  it("orients work without manufacturing a progress percentage", () => {
    const compass = getBlueprintCompassProjection();

    expect(compass.phase).toBe("Phase 9 — Compass Construction");
    expect(compass.currentStorey.total).toBe(20);
    expect(compass.currentStorey.number).toBe(compass.activeWork.storey);
    expect(compass.activeWork.status).toBe("active");
    expect(collectObjectKeys(compass)).not.toEqual(
      expect.arrayContaining([
        "progressPercent",
        "percentage",
        "percentComplete"
      ])
    );
  });

  it("makes the dependency-valid sequence explicit around current work", () => {
    const compass = getBlueprintCompassProjection();
    const sequence = compass.workSequence;

    expect(sequence).toHaveLength(3);
    expect(sequence.map((item) => item.status)).toEqual([
      "complete",
      "active",
      "next"
    ]);
    expect(sequence[1]?.id).toBe(compass.activeWork.id);
    expect(sequence[1]?.storey).toBe(compass.currentStorey.number);
    expect(sequence[0]?.storey).toBeLessThanOrEqual(compass.currentStorey.number);
    expect(sequence[2]?.storey).toBeGreaterThanOrEqual(compass.currentStorey.number);
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
