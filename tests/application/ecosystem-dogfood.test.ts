import { describe, expect, it } from "vitest";

import {
  blueprintOsDogfoodCasesV1,
  runEcosystemDogfoodRegression
} from "../../packages/application/src/ecosystem-dogfood";

describe("P9-018 Ecosystem Dogfood Regression", () => {
  it("blueprints itself plus heterogeneous projects without semantic leakage", () => {
    const result = runEcosystemDogfoodRegression("p9-018:test");

    expect(result.blockers).toEqual([]);
    expect(result.cases).toHaveLength(4);
    expect(new Set(result.cases.map((item) => item.projectId)).size).toBe(4);
    expect(result.cases.map((item) => item.blueprintLevel)).toEqual([
      "B4",
      "B3",
      "B2",
      "B5"
    ]);
    expect(result.universalCoreMutationAllowed).toBe(false);
    expect(result.crossProjectStateMergeAllowed).toBe(false);
    expect(result.productionReleaseAuthority).toBe(false);
  });

  it("fails closed when dogfood identities are duplicated", () => {
    expect(() =>
      runEcosystemDogfoodRegression("p9-018:duplicate", [
        blueprintOsDogfoodCasesV1[0]!,
        blueprintOsDogfoodCasesV1[0]!,
        blueprintOsDogfoodCasesV1[1]!
      ])
    ).toThrow(/Duplicate dogfood case/);
  });

  it("detects cross-project semantic contamination", () => {
    const first = blueprintOsDogfoodCasesV1[0]!;
    const second = blueprintOsDogfoodCasesV1[1]!;
    const third = blueprintOsDogfoodCasesV1[2]!;

    const contaminated = {
      ...second,
      intent: {
        ...second.intent,
        jobsToBeDone: [
          ...second.intent.jobsToBeDone,
          `Contaminated with ${first.sentinel}`
        ]
      }
    };

    const result = runEcosystemDogfoodRegression("p9-018:contaminated", [
      first,
      contaminated,
      third
    ]);

    expect(result.blockers).toContain(
      `cross-project-semantic-leak:${first.id}->${second.id}`
    );
  });
});
