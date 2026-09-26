import { describe, expect, it } from "vitest";

import type {
  GateEvidence,
  QualityGate,
  ReleaseRecord,
  WorkPackage
} from "@blueprint-os/contracts";
import { buildQualityEvidenceGraph } from "../../packages/application/src";

const meta = {
  schemaVersion: "1.0.0",
  recordVersion: 1,
  createdAt: "2026-09-26T12:50:00.000Z",
  updatedAt: "2026-09-26T12:50:00.000Z"
} as const;

const work: WorkPackage = {
  id: "work-package:graph",
  projectId: "project:graph",
  title: "Evidence graph",
  purpose: "Trace quality evidence.",
  dependencies: [],
  acceptanceCriteria: ["Graph is explainable."],
  qualityGateIds: ["gate:graph"],
  status: "review",
  meta
};

const gate: QualityGate = {
  id: "gate:graph",
  projectId: "project:graph",
  name: "Evidence Gate",
  requirements: ["Evidence must target the exact revision."],
  status: "candidate",
  evidenceIds: ["evidence:graph"],
  meta
};

const evidence: GateEvidence = {
  id: "evidence:graph",
  gateId: "gate:graph",
  kind: "test",
  source: "vitest:p9-012",
  revision: "revision:graph",
  createdAt: "2026-09-26T12:51:00.000Z"
};

const release: ReleaseRecord = {
  id: "release:graph",
  projectId: "project:graph",
  version: "0.1.0",
  revision: "revision:graph",
  environment: "preview",
  artifactSource: "artifact:preview",
  status: "candidate",
  gateEvidenceIds: ["evidence:graph"],
  rollbackPlan: "Return to prior candidate.",
  meta
};

describe("P9-012 Quality Evidence Graph", () => {
  it("builds deterministic explainable provenance links", () => {
    const first = buildQualityEvidenceGraph({
      projectId: "project:graph",
      workPackages: [work],
      qualityGates: [gate],
      evidence: [evidence],
      releases: [release]
    });
    const second = buildQualityEvidenceGraph({
      projectId: "project:graph",
      workPackages: [work],
      qualityGates: [gate],
      evidence: [evidence],
      releases: [release]
    });

    expect(second).toEqual(first);
    expect(first.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: "work-package:graph",
          to: "gate:graph",
          kind: "requires-gate"
        }),
        expect.objectContaining({
          from: "gate:graph",
          to: "evidence:graph",
          kind: "supported-by"
        }),
        expect.objectContaining({
          from: "release:graph",
          to: "evidence:graph",
          kind: "release-evidence"
        })
      ])
    );
  });

  it("keeps the graph projection read-only and evidence-honest", () => {
    const graph = buildQualityEvidenceGraph({
      projectId: "project:graph",
      workPackages: [work],
      qualityGates: [gate],
      evidence: [evidence],
      releases: [release]
    });

    expect(graph).toMatchObject({
      canonicalMutationAllowed: false,
      qualityGateMutationAllowed: false,
      releaseAuthority: false,
      syntheticReadinessAllowed: false
    });
    expect(graph.nodes.find((node) => node.id === evidence.id)).toMatchObject({
      revision: "revision:graph",
      source: "vitest:p9-012"
    });
  });

  it("fails closed on cross-project records and orphan links", () => {
    expect(() =>
      buildQualityEvidenceGraph({
        projectId: "project:graph",
        workPackages: [{ ...work, projectId: "project:other" }],
        qualityGates: [gate],
        evidence: [evidence],
        releases: [release]
      })
    ).toThrow(/another project/i);

    expect(() =>
      buildQualityEvidenceGraph({
        projectId: "project:graph",
        workPackages: [work],
        qualityGates: [gate],
        evidence: [{ ...evidence, gateId: "gate:missing" }],
        releases: [release]
      })
    ).toThrow(/unknown QualityGate/i);
  });

  it("fails closed when canonical links point to missing graph records", () => {
    expect(() =>
      buildQualityEvidenceGraph({
        projectId: "project:graph",
        workPackages: [{ ...work, qualityGateIds: ["gate:missing"] }],
        qualityGates: [gate],
        evidence: [evidence],
        releases: [release]
      })
    ).toThrow(/unknown QualityGate/i);

    expect(() =>
      buildQualityEvidenceGraph({
        projectId: "project:graph",
        workPackages: [work],
        qualityGates: [{ ...gate, evidenceIds: ["evidence:missing"] }],
        evidence: [evidence],
        releases: [release]
      })
    ).toThrow(/unknown GateEvidence/i);
  });
});
