import { describe, expect, it } from "vitest";
import { layoutWorkflowGraph } from "../../packages/application/src/prompt-workflow-graph";

const branching = [
  { id: "discover", dependsOn: [] },
  { id: "ux", dependsOn: ["discover"] },
  { id: "architecture", dependsOn: ["discover"] },
  { id: "implement", dependsOn: ["ux", "architecture"] },
  { id: "qa", dependsOn: ["implement"] }
];

describe("Visual Workflow Studio directed graph layout", () => {
  it("keeps branching and convergence edges accurate, with increasing depth", () => {
    const graph = layoutWorkflowGraph(branching);
    expect(graph.positions).toHaveLength(branching.length);
    expect(graph.edges).toHaveLength(5);
    const byId = new Map(graph.positions.map((node) => [node.id, node]));
    expect(byId.get("discover")?.depth).toBe(0);
    expect(byId.get("ux")?.depth).toBe(1);
    expect(byId.get("architecture")?.depth).toBe(1);
    expect(byId.get("implement")?.depth).toBe(2);
    expect(byId.get("qa")?.depth).toBe(3);
    expect(byId.get("ux")?.y).not.toBe(byId.get("architecture")?.y);
    for (const edge of graph.edges) {
      expect(byId.get(edge.from)!.x).toBeLessThan(byId.get(edge.to)!.x);
      expect(edge.path).toMatch(/^M \d+ /);
    }
    expect(graph.width).toBeGreaterThan(900);
    expect(graph.height).toBeGreaterThan(200);
  });

  it("is deterministic and preserves source inputs", () => {
    const before = JSON.stringify(branching);
    expect(layoutWorkflowGraph(branching)).toEqual(layoutWorkflowGraph(branching));
    expect(JSON.stringify(branching)).toBe(before);
  });

  it("uses original author order to break ties for independent root nodes", () => {
    const graph = layoutWorkflowGraph([
      { id: "zeta", dependsOn: [] },
      { id: "alpha", dependsOn: [] },
      { id: "merge", dependsOn: ["zeta", "alpha"] }
    ]);
    const positions = new Map(graph.positions.map((position) => [position.id, position]));
    expect(positions.get("zeta")!.y).toBeLessThan(positions.get("alpha")!.y);
    expect(graph.edges.map((edge) => edge.key)).toEqual(["zeta->merge", "alpha->merge"]);
  });

  it("fails closed on cycles, unknown parents, duplicate IDs and oversized graphs", () => {
    expect(() => layoutWorkflowGraph([])).toThrow("1 to 60");
    expect(() => layoutWorkflowGraph(Array.from({ length: 61 }, (_, index) => ({
      id: "step" + index, dependsOn: []
    })))).toThrow("1 to 60");
    expect(() => layoutWorkflowGraph([{ id: "a", dependsOn: ["b"] }]))
      .toThrow("Unknown workflow dependency");
    expect(() => layoutWorkflowGraph([
      { id: "a", dependsOn: ["b"] }, { id: "b", dependsOn: ["a"] }
    ])).toThrow("cycle");
    expect(() => layoutWorkflowGraph([
      { id: "a", dependsOn: [] }, { id: "a", dependsOn: [] }
    ])).toThrow("Duplicate/invalid");
  });
});
