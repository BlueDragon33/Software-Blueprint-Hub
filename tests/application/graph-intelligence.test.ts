import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildGraphIntelligence, graphDomains, traceGraphImpact, GRAPH_LIMITS } from "../../packages/application/src/graph-intelligence";
import type { WorkflowManifest } from "../../packages/application/src/prompt-workflow-core.mjs";
import { graphFixture } from "../fixtures/graph-intelligence";

const byRecord = (graph: ReturnType<typeof buildGraphIntelligence>, id: string) => graph.nodes.find(n => n.recordId === id)!;

describe("Federated graph projection and independent constraints", () => {
  it("reuses canonical contracts, separates states and preserves all authority boundaries", () => {
    const input = graphFixture(), before = structuredClone(input);
    const g = buildGraphIntelligence(input);
    expect(g.nodes.filter(n => n.kind === "mechanism").map(n => n.domain).sort()).toEqual([...graphDomains].sort());
    expect(g).toMatchObject({ intelligence: "deterministic-rules-not-llm", canonicalMutationAllowed: false,
      qualityGateMutationAllowed: false, releaseAuthority: false, agentDispatchAllowed: false });
    expect(byRecord(g, "gate:graph")).toMatchObject({ execution: "not-observed", verification: "unverified", approval: "not-conferred" });
    expect(byRecord(g, "evidence:graph").source).toMatchObject({ reference: "artifact:test-fixture", revision: "b".repeat(40) });
    expect(g.nodes.every(n => n.source.digest.startsWith("sha256:") && n.contract && n.owner)).toBe(true);
    expect(Object.isFrozen(g.nodes[0]!.source)).toBe(true);
    expect(input).toEqual(before);
    expect(Object.isFrozen(input.profile)).toBe(false);
  });

  it("is deterministic and changes revision for semantic or evidence changes", () => {
    const input = graphFixture();
    const initial = buildGraphIntelligence(input);
    expect(buildGraphIntelligence(structuredClone(input))).toEqual(initial);
    expect(buildGraphIntelligence({ ...input, workPackages: [...input.workPackages].reverse() })).toEqual(initial);
    const changed = structuredClone(input);
    changed.evidence[0]!.source = "artifact:different";
    expect(buildGraphIntelligence(changed).fingerprint).not.toBe(initial.fingerprint);
    expect(buildGraphIntelligence({ ...input, sourceCodeRevision: null }).sourceCodeRevision).toBeNull();
  });

  it.each(["profile", "blueprint", "workPackages", "qualityGates", "releases"] as const)("rejects cross-project %s", part => {
    const input = structuredClone(graphFixture());
    if (part === "profile" || part === "blueprint") input[part].projectId = "project:other";
    else input[part][0]!.projectId = "project:other";
    expect(() => buildGraphIntelligence(input)).toThrow(/another project/);
  });

  it("rejects forged schema fields, duplicate IDs, broken and asymmetric evidence references", () => {
    const input = graphFixture();
    expect(() => buildGraphIntelligence({ ...input, profile: { ...input.profile, releaseAuthority: true } } as never)).toThrow(/contract/);
    expect(() => buildGraphIntelligence({ ...input, qualityGates: [...input.qualityGates, input.qualityGates[0]!] })).toThrow(/duplicate/i);
    expect(() => buildGraphIntelligence({ ...input, evidence: [{ ...input.evidence[0]!, gateId: "gate:missing" }] })).toThrow(/unknown QualityGate/);
    expect(() => buildGraphIntelligence({ ...input, blueprint: { ...input.blueprint,
      dependencyEdges: [{ from: "module:graph:core", to: "module:missing" }] } })).toThrow(/Broken graph reference/);
    expect(() => buildGraphIntelligence({ ...input, sourceCodeRevision: "main" })).toThrow(/revision/);
  });

  it("detects cycles without confusing control feedback with dependency cycles", () => {
    const input = graphFixture();
    expect(buildGraphIntelligence(input).findings.some(f => f.code === "DEPENDENCY_CYCLE")).toBe(false);
    const work = structuredClone(input.workPackages);
    work[0]!.dependencies = [work[1]!.id];
    const g = buildGraphIntelligence({ ...input, workPackages: work });
    const cycle = g.findings.find(f => f.code === "DEPENDENCY_CYCLE")!;
    expect(cycle.nodeIds).toHaveLength(2);
    expect(cycle.severity).toBe("error");
    expect(cycle.recommendation).toContain("source dependency");
  });

  it("detects completion, resolution, missing-gate and stale-release conflicts without mutating statuses", () => {
    const input = graphFixture();
    const g = buildGraphIntelligence({ ...input,
      blueprint: { ...input.blueprint, profileRecordVersion: 9, requiredGates: ["gate:graph", "gate:missing"] },
      workPackages: input.workPackages.map(w => ({ ...w, status: "completed" })),
      releases: [{ ...input.releases[0]!, revision: "d".repeat(40) }] });
    expect(g.findings.map(f => f.code)).toEqual(expect.arrayContaining([
      "STALE_RESOLUTION", "MISSING_REQUIRED_GATE", "COMPLETION_CONFLICT", "RELEASE_REVISION_GAP"
    ]));
    expect(byRecord(g, "work:producer").execution).toBe("recorded:completed");
    expect(byRecord(g, "gate:graph").verification).toBe("unverified");
  });

  it("reports a recorded PASS as recorded only, and checks the existing evidence contract", () => {
    const input = graphFixture();
    const pass = { ...input.qualityGates[0]!, status: "pass" as const };
    const g = buildGraphIntelligence({ ...input, qualityGates: [pass] });
    expect(byRecord(g, "gate:graph").verification).toBe("recorded-pass");
    expect(byRecord(g, "evidence:graph").verification).toBe("unverified");
    const bad = buildGraphIntelligence({ ...input, qualityGates: [{ ...pass, evidenceIds: [] }] });
    expect(bad.findings.some(f => f.code === "PASS_WITHOUT_PROVENANCE")).toBe(true);
    expect(bad.qualityGateMutationAllowed).toBe(false);
  });

  it("explains directional, transitive, cross-domain evidence impact and honors relationship filters", () => {
    const g = buildGraphIntelligence(graphFixture());
    const evidence = byRecord(g, "evidence:graph"), gate = byRecord(g, "gate:graph");
    const trace = traceGraphImpact(g, evidence.id);
    expect(trace.map(t => t.nodeId)).toEqual(expect.arrayContaining([
      gate.id, byRecord(g, "work:consumer").id, byRecord(g, "release:graph").id
    ]));
    expect(trace.find(t => t.nodeId === byRecord(g, "work:consumer").id)!.path.length).toBeGreaterThan(1);
    expect(traceGraphImpact(g, byRecord(g, "work:consumer").id)).toEqual([]);
    expect(traceGraphImpact(g, evidence.id, ["dependency"])).toEqual([]);
    expect(() => traceGraphImpact(g, "unknown")).toThrow(/Unknown/);
    const cycled = graphFixture();
    cycled.workPackages[0]!.dependencies = [cycled.workPackages[1]!.id];
    const cyclicGraph = buildGraphIntelligence(cycled);
    expect(traceGraphImpact(cyclicGraph, byRecord(cyclicGraph, "work:producer").id)).toHaveLength(1);
  });

  it("keeps workflow budgets and human gates as contracts, rejects forged manifest approval/execution", () => {
    const manifest = JSON.parse(readFileSync(new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url), "utf8")) as WorkflowManifest;
    const input = graphFixture();
    const projectId = manifest.project.id;
    const scoped = { ...input, projectId, profile: { ...input.profile, projectId }, blueprint: { ...input.blueprint, projectId },
      workPackages: [], qualityGates: [], evidence: [], releases: [], workflows: [manifest] };
    const g = buildGraphIntelligence(scoped);
    const node = g.nodes.find(n => n.kind === "workflow-node")!;
    expect(node).toMatchObject({ execution: "manifest-only", verification: "unverified" });
    expect(node.details.join(" ")).toContain("Budget:");
    expect(g.nodes.some(n => n.kind === "workflow-node" && n.approval === "separate-human-authority")).toBe(true);
    expect(() => buildGraphIntelligence({ ...scoped, workflows: [manifest, manifest] })).toThrow(/duplicate/);
    expect(() => buildGraphIntelligence({ ...input, workflows: [manifest] })).toThrow(/another project/);
  });

  it("bounds hostile graph sizes before expensive work", () => {
    const input = graphFixture();
    expect(() => buildGraphIntelligence({ ...input, workPackages: Array(GRAPH_LIMITS.nodes + 1).fill(input.workPackages[0]) })).toThrow(/capacity/);
    expect(() => buildGraphIntelligence({ ...input, blueprint: { ...input.blueprint,
      dependencyEdges: Array(GRAPH_LIMITS.edges + 1).fill({ from: "x", to: "y" }) } })).toThrow(/capacity/);
  });

  it("analyses a realistic 500-work graph within a bounded local budget", () => {
    const input = graphFixture();
    const workPackages = Array.from({ length: 500 }, (_, i) => ({ ...input.workPackages[0]!,
      id: "work:performance-" + i, dependencies: i ? ["work:performance-" + (i - 1)] : [] }));
    const start = performance.now();
    const graph = buildGraphIntelligence({ ...input, workPackages });
    const impacts = traceGraphImpact(graph, byRecord(graph, "work:performance-0").id);
    const elapsed = performance.now() - start;
    expect(impacts).toHaveLength(499);
    expect(elapsed).toBeLessThan(3000);
    console.info("Graph 500-work build + impact:", Math.round(elapsed), "ms");
  });
});
