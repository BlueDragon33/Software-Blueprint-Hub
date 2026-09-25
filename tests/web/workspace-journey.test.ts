import { describe, expect, it } from "vitest";

import {
  nextWorkspaceStage,
  previousWorkspaceStage,
  workspaceStageState
} from "../../apps/web/src/workspace/journey";

describe("workspace journey", () => {
  it("marks completed/current/upcoming stages deterministically", () => {
    expect(workspaceStageState("work").map((item) => item.status)).toEqual([
      "complete",
      "complete",
      "current",
      "upcoming",
      "upcoming"
    ]);
  });

  it("does not move past the final stage", () => {
    expect(nextWorkspaceStage("prompt")).toBe("prompt");
  });

  it("does not move before the first stage", () => {
    expect(previousWorkspaceStage("project")).toBe("project");
  });
});
