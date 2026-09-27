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
    expect(compass.dependencyBlockers).toEqual([
      "P9-019 human professional sign-off has not been recorded for the exact current review candidate."
    ]);
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

  it("advances to P9-020 only from an explicit approval and keeps Production unauthorized", () => {
    const compass = getBlueprintCompassProjection({
      decision: "approve",
      candidateReviewedRevision:
        "c2190d1540edaf2946d866e3719cd8fa78172719",
      candidateEvidenceDigest:
        "sha256:603a9fc0b91bfa29d99fc8c1aa2b65c72ade18c87d657050f1343b4ff8fcc9e4",
      humanSignoff: true,
      p9020TransitionAllowed: true,
      productionReleaseAuthority: false,
      blockers: []
    });

    expect(compass.activeWork.id).toBe("P9-020");
    expect(compass.workSequence.map((item) => [item.id, item.status])).toEqual([
      ["P9-018", "complete"],
      ["P9-019", "complete"],
      ["P9-020", "active"]
    ]);
    expect(compass.dependencyBlockers).toEqual([]);
    expect(compass.releaseAuthority).toBe("not-authorized");
    expect(compass.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "P9-019 Human Professional Review",
          revision: "c2190d1540edaf2946d866e3719cd8fa78172719",
          result: "pass"
        })
      ])
    );
  });

  it("keeps P9-020 blocked after request-changes or reject decisions", () => {
    for (const decision of ["request-changes", "reject"] as const) {
      const compass = getBlueprintCompassProjection({
        decision,
        candidateReviewedRevision:
          "c2190d1540edaf2946d866e3719cd8fa78172719",
        candidateEvidenceDigest:
          "sha256:603a9fc0b91bfa29d99fc8c1aa2b65c72ade18c87d657050f1343b4ff8fcc9e4",
        humanSignoff: false,
        p9020TransitionAllowed: false,
        productionReleaseAuthority: false,
        blockers: [
          "human-professional-signoff-required",
          `human-review-decision-${decision}`
        ]
      });

      expect(compass.activeWork.id).toBe("P9-019");
      expect(compass.workSequence[2]).toMatchObject({
        id: "P9-020",
        status: "next"
      });
      expect(compass.dependencyBlockers.join(" ")).toContain(decision);
      expect(compass.releaseAuthority).toBe("not-authorized");
    }
  });
});
