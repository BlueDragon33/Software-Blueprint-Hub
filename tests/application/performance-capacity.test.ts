import { describe, expect, it } from "vitest";

import {
  blueprintOsCapacityBudgetsV1,
  evaluateCapacityProof
} from "../../packages/application/src/performance-capacity";
import type { ProjectRegistryItem } from "../../packages/application/src/project-registry";
import type {
  GateEvidence,
  QualityGate,
  WorkPackage
} from "../../packages/contracts/src";

function registryItem(index: number): ProjectRegistryItem {
  return {
    projectId: `project:capacity-${String(index).padStart(4, "0")}`,
    profileId: `profile:capacity-${index}`,
    name: `Capacity Project ${index}`,
    projectType: index % 2 ? "web-application" : "service",
    blueprintLevel: index % 3 ? "B2" : "B3",
    access: "owner",
    recordVersion: 1,
    updatedAt: "2026-09-26T00:00:00.000Z"
  };
}

function graphInput(size: number) {
  const projectId = "project:capacity-graph";
  const meta = {
    schemaVersion: "1.0.0" as const,
    recordVersion: 1,
    createdAt: "2026-09-26T00:00:00.000Z",
    updatedAt: "2026-09-26T00:00:00.000Z"
  };
  const workPackages: WorkPackage[] = [];
  const qualityGates: QualityGate[] = [];
  const evidence: GateEvidence[] = [];

  for (let index = 0; index < size; index += 1) {
    const gateId = `gate:capacity-${index}`;
    const evidenceId = `evidence:capacity-${index}`;
    workPackages.push({
      id: `work-package:capacity-${index}`,
      projectId,
      title: `Capacity work ${index}`,
      purpose: "Synthetic capacity proof.",
      dependencies: index === 0 ? [] : [`work-package:capacity-${index - 1}`],
      acceptanceCriteria: ["Capacity remains bounded."],
      qualityGateIds: [gateId],
      status: "completed",
      meta
    });
    qualityGates.push({
      id: gateId,
      projectId,
      name: `Capacity gate ${index}`,
      requirements: ["Evidence exists."],
      status: "pass",
      evidenceIds: [evidenceId],
      meta
    });
    evidence.push({
      id: evidenceId,
      gateId,
      kind: "test",
      source: "vitest:p9-017",
      revision: "capacity-proof",
      createdAt: "2026-09-26T00:00:00.000Z"
    });
  }

  return {
    projectId,
    workPackages,
    qualityGates,
    evidence,
    releases: []
  } as const;
}

describe("P9-017 Performance & Capacity Proof", () => {
  it("defines explicit non-Production budgets", () => {
    expect(blueprintOsCapacityBudgetsV1.length).toBeGreaterThanOrEqual(5);
    expect(new Set(blueprintOsCapacityBudgetsV1.map((item) => item.id)).size)
      .toBe(blueprintOsCapacityBudgetsV1.length);
  });

  it("passes the documented Phase 9 synthetic capacity targets", () => {
    const proof = evaluateCapacityProof({
      sourceRevision: "p9-017:test",
      portfolioItems: Array.from({ length: 500 }, (_, index) => registryItem(index)),
      evidenceGraph: graphInput(1000)
    });

    expect(proof.blockers).toEqual([]);
    expect(proof.productionReleaseAuthority).toBe(false);
    expect(proof.canonicalMutationAllowed).toBe(false);
    expect(proof.measurements.every((item) => item.pass)).toBe(true);
  });

  it("fails closed when record capacity exceeds the documented budget", () => {
    const proof = evaluateCapacityProof({
      sourceRevision: "p9-017:over-budget",
      portfolioItems: Array.from({ length: 501 }, (_, index) => registryItem(index)),
      evidenceGraph: graphInput(2)
    });

    expect(proof.blockers.some((item) =>
      item.startsWith("capacity-budget-exceeded:portfolio-project-count")
    )).toBe(true);
  });
});
