import { describe, expect, it } from "vitest";
import { buildGraphIntelligence } from "../../packages/application/src/graph-intelligence";
import { graphFixture } from "../fixtures/graph-intelligence";
import { createIntelligenceManifest, encodeIntelligenceManifest, TECH_PRODUCER, HUB_REPOSITORY } from "../../packages/contracts/src/intelligence-exchange.mjs";
import { projectExternalIntelligenceReferences } from "../../packages/application/src/graph-external-intelligence.candidate.mjs";

/** This is a real Graph engine integration test, not a synthetic hand-made graph
 * and not an authenticated/private GitHub runtime or final trust admission. */
const observedAt = Date.parse("2026-11-19T12:00:00.000Z");
const manifest = () => createIntelligenceManifest({
  producer: TECH_PRODUCER,
  evidenceId: "b6b535a3-6aa3-4ea4-921c-a5692c6adc0b",
  contentRevision: 2,
  sourceRevision: "a".repeat(40),
  timestamp: "2026-11-19T00:00:00.000Z",
  outcome: "RESEARCH_HYPOTHESIS_FALSIFIED"
});

const trusted = (packet, projectId, overrides = {}) => ({
  projectId, id: packet.id, producer: packet.producer, consumer: HUB_REPOSITORY,
  readAllowed: true,
  currentSource: {
    sourceRevision: packet.sourceRevision,
    integrityDigest: packet.integrityDigest,
    expiresAt: observedAt + 30_000,
    revoked: false
  },
  previousReference: null, ...overrides
});

describe("Dual P3-02 read-only adapter against the actual Graph engine", () => {
  it("accepts a separately scoped synthetic source pin without altering the real Graph", async () => {
    const graph = buildGraphIntelligence(graphFixture());
    const before = graph.fingerprint;
    const packet = manifest();
    const result = await projectExternalIntelligenceReferences(graph, [encodeIntelligenceManifest(packet)], {
      observedAt,
      readTrust: async identity => {
        expect(identity.projectId).toBe(graph.projectId);
        expect(identity.consumer).toBe(HUB_REPOSITORY);
        return trusted(packet, graph.projectId);
      }
    });

    expect(graph.nodes.some(node => node.kind === "project" && node.domain === "projects")).toBe(true);
    expect(result.status).toBe("READ_ONLY_ADVISORY");
    expect(result.projectId).toBe(graph.projectId);
    expect(result.references).toHaveLength(1);
    expect(result.references[0]).toMatchObject({
      id: packet.id, relation: "references-external-evidence",
      verified: "admitted-by-caller-trust-only",
      gatePass: false, reviewerApproved: false, agentDispatch: false
    });
    expect(result.runtimeVerified).toBe(false);
    expect(result.releaseAuthority).toBe(false);
    expect(graph.fingerprint).toBe(before);
    expect(graph.canonicalMutationAllowed).toBe(false);
    expect(graph.qualityGateMutationAllowed).toBe(false);
    expect(graph.nodes.some(n => n.recordId === packet.id)).toBe(false);
  });

  it("rejects foreign-project trust when given a valid canonical Graph projection", async () => {
    const graph = buildGraphIntelligence(graphFixture());
    const packet = manifest();
    await expect(projectExternalIntelligenceReferences(graph, [encodeIntelligenceManifest(packet)], {
      observedAt, readTrust: async () => trusted(packet, "project:foreign")
    })).rejects.toMatchObject({ code: "TRUST_UNAVAILABLE" });
    expect(graph.nodes.some(n => n.recordId === packet.id)).toBe(false);
  });

  it("refuses a Graph with forged approval/mutation authority", async () => {
    const graph = buildGraphIntelligence(graphFixture());
    const packet = manifest();
    const forged = { ...graph, releaseAuthority: true };
    await expect(projectExternalIntelligenceReferences(forged, [encodeIntelligenceManifest(packet)], {
      observedAt, readTrust: async () => trusted(packet, graph.projectId)
    })).rejects.toMatchObject({ code: "GRAPH_PROJECT_AUTHORITY_REQUIRED" });
  });
});
