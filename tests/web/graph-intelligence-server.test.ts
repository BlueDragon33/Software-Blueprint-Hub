import { beforeEach, describe, expect, it, vi } from "vitest";
import { graphFixture } from "../fixtures/graph-intelligence";

const ports = vi.hoisted(() => ({ workspace: vi.fn(), manifests: vi.fn(), work: vi.fn(), gates: vi.fn(), releases: vi.fn() }));
vi.mock("../../apps/web/src/server/project-workspace", () => ({ loadProjectWorkspace: ports.workspace }));
vi.mock("../../apps/web/src/server/prompt-workflow", () => ({ registeredWorkflowManifests: ports.manifests }));
import { loadGraphIntelligence } from "../../apps/web/src/server/graph-intelligence";

beforeEach(() => {
  vi.resetAllMocks();
  const f = graphFixture();
  ports.manifests.mockReturnValue([]);
  ports.work.mockResolvedValue(f.workPackages);
  ports.gates.mockResolvedValue(f.qualityGates.map(gate => ({ gate, evidence: f.evidence })));
  ports.releases.mockResolvedValue(f.releases);
  ports.workspace.mockResolvedValue({ state: "ready", projectId: f.projectId, actor: { principalId: "principal:reader" },
    project: { profile: f.profile, blueprint: f.blueprint },
    runtime: { workQuality: { listWorkPackages: ports.work, listQualityGates: ports.gates }, releases: { listReleases: ports.releases } } });
});

describe("Graph source loader authorization and failure isolation", () => {
  it.each(["signed-out", "forbidden", "not-found", "unavailable"])("reads no sources for %s workspace", async state => {
    ports.workspace.mockResolvedValue({ state });
    expect(await loadGraphIntelligence("project:private")).toEqual({ state });
    expect(ports.manifests).not.toHaveBeenCalled(); expect(ports.work).not.toHaveBeenCalled();
    expect(ports.gates).not.toHaveBeenCalled(); expect(ports.releases).not.toHaveBeenCalled();
  });
  it("reuses project-authorized services and reads only that project's contracts", async () => {
    const result = await loadGraphIntelligence("project:graph");
    expect(result.state).toBe("ready");
    expect(ports.manifests).toHaveBeenCalledWith("project:graph");
    for (const read of [ports.work, ports.gates, ports.releases]) expect(read).toHaveBeenCalledWith({ principalId: "principal:reader" }, "project:graph");
    if (result.state === "ready") {
      expect(result.graph.projectId).toBe("project:graph");
      expect(result.graph.nodes.find(n => n.domain === "security")!.details.join(" ")).not.toContain("phase9");
    }
  });
  it("returns no partial graph or backend detail when one independent source fails", async () => {
    ports.gates.mockRejectedValue(new Error("private database credential must not be returned"));
    expect(await loadGraphIntelligence("project:graph")).toEqual({ state: "unavailable" });
    expect(ports.manifests).not.toHaveBeenCalled();
  });
  it("propagates revocation as forbidden and rejects cross-project source leakage", async () => {
    ports.work.mockRejectedValue({ code: "AUTHORIZATION_DENIED" });
    expect(await loadGraphIntelligence("project:graph")).toEqual({ state: "forbidden" });
    ports.work.mockResolvedValue([{ ...graphFixture().workPackages[0]!, projectId: "project:other" }]);
    expect(await loadGraphIntelligence("project:graph")).toEqual({ state: "unavailable" });
  });
});
