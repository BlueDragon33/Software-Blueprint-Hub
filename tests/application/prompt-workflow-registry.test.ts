import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CentralPromptWorkflowRegistry } from "../../packages/application/src";

const governed = JSON.parse(readFileSync(
  new URL("../../control/constitution-governed-repositories.json", import.meta.url), "utf8"
)) as { repositories: { projectId: string; repository: string; branch: string; blueprintLevel: string }[] };
const manifest = JSON.parse(readFileSync(
  new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url), "utf8"
)) as {
  workflowId: string; workflowVersion: string; status: string;
  project: { id: string; repo: string; area: string };
  nodes: { id: string; dependsOn: string[]; goal: string }[];
};

function build(
  manifests: readonly unknown[] = [manifest],
  records: readonly (typeof governed.repositories)[number][] = governed.repositories
) {
  return new CentralPromptWorkflowRegistry(records, manifests);
}

describe("Central Workflow Registry — governed multi-project contract", () => {
  it("covers the real fifteen governed repos while retaining one authored candidate only", () => {
    const registry = build();
    expect(registry.governedProjectCount()).toBe(15);
    expect(registry.registeredWorkflowCount()).toBe(1);
    expect(registry.workflowsForProject("project:application-management")).toHaveLength(1);
    const workflow = registry.workflowsForProject("project:application-management")[0]!;
    expect(workflow.workflowId).toBe("app-management-visa-form-recovery");
    expect(workflow.nodeCount).toBe(7);
    expect(workflow.rootNodeIds).toEqual(["inventory"]);
    expect(workflow.status).toBe("candidate");
    expect(workflow.branch).toBe("main");
    expect(registry.workflowsForProject("project:bauman-master-ai-system")).toEqual([]);
    expect(registry.workflowsForProject("project:unknown")).toEqual([]);
    expect(registry.isGovernedProject("project:bauman-master-ai-system")).toBe(true);
    expect(registry.isGovernedProject("project:unknown")).toBe(false);
  });

  it("preserves canonical non-main branches, with no arbitrary main assumption", () => {
    const registry = build();
    expect(registry.repositoryForProject("project:ros-1-2")?.branch).toBe("ros2");
    expect(registry.repositoryByName("BlueDragon33/ROS-1-2")?.branch).toBe("ros2");
  });

  it("supports several independent workflows per project in deterministic order", () => {
    const second = structuredClone(manifest);
    second.workflowId = "aaa-another-workflow";
    second.nodes[0]!.goal = "Inspect the scoped incident.";
    const registry = build([manifest, second]);
    expect(registry.workflowsForProject("project:application-management").map((item) => item.workflowId))
      .toEqual(["aaa-another-workflow", "app-management-visa-form-recovery"]);
    expect(registry.workflowForProject("project:application-management", second.workflowId)?.workflowId)
      .toBe(second.workflowId);
    expect(registry.workflowForProject("project:bauman-master-ai-system", second.workflowId)).toBeNull();
  });

  it("rejects globally ambiguous workflow IDs and mismatched repository ownership", () => {
    expect(() => build([manifest, structuredClone(manifest)])).toThrow("Ambiguous workflow ID");
    const forged = structuredClone(manifest);
    forged.project.id = "project:bauman-master-ai-system";
    expect(() => build([forged])).toThrow("does not match the governed project/repository");
    forged.project.repo = "BlueDragon33/Bauman-master-ai-system";
    const bounded = build([forged]);
    expect(bounded.workflowsForProject("project:bauman-master-ai-system")).toHaveLength(1);
  });

  it("rejects an invented repository, corrupted graph and duplicate governed IDs", () => {
    const forged = structuredClone(manifest);
    forged.project.repo = "BlueDragon33/invented";
    expect(() => build([forged])).toThrow("does not match the governed project/repository");
    const graph = structuredClone(manifest);
    graph.nodes[1]!.dependsOn = ["phantom"];
    expect(() => build([graph])).toThrow("Invalid central workflow");
    expect(() => build([manifest], [...governed.repositories, governed.repositories[0]!])).toThrow("Duplicate governed project");
  });

  it("returns defensive manifest copies rather than writable source registry references", () => {
    const registry = build();
    const first = registry.workflowForProject("project:application-management", manifest.workflowId)!;
    first.nodes[0]!.goal = "overwritten by caller";
    const second = registry.workflowForProject("project:application-management", manifest.workflowId)!;
    expect(second.nodes[0]!.goal).not.toBe("overwritten by caller");
    expect(registry.workflowNode("project:application-management", manifest.workflowId, "inventory")?.id).toBe("inventory");
    expect(registry.workflowNode("project:application-management", manifest.workflowId, "not-present")).toBeNull();
  });
});
