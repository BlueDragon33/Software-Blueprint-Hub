import type {
  GateEvidence,
  QualityGate,
  WorkPackage
} from "../../packages/contracts/src";
import {
  assertQualityGateCanPass,
  explainWorkPackageReadiness,
  QualityGateEvidenceError,
  validateWorkPackageDependencies,
  WorkPackageDependencyError
} from "../../packages/core/src";
import { describe, expect, it } from "vitest";

const meta = {
  schemaVersion: "1.0.0" as const,
  recordVersion: 1,
  createdAt: "2026-09-25T18:30:00+07:00",
  updatedAt: "2026-09-25T18:30:00+07:00"
};

function work(
  id: string,
  status: WorkPackage["status"],
  dependencies: readonly string[] = []
): WorkPackage {
  return {
    id,
    projectId: "project:fnd007-unit",
    title: id,
    purpose: "Prove dependency semantics.",
    dependencies: [...dependencies],
    acceptanceCriteria: ["Evidence exists."],
    qualityGateIds: ["gate:fnd007-unit"],
    status,
    meta
  };
}

const gate: QualityGate = {
  id: "gate:fnd007-unit",
  projectId: "project:fnd007-unit",
  name: "FND-007 Gate",
  requirements: ["Required evidence must be provenance-backed."],
  status: "pass",
  evidenceIds: ["evidence:fnd007-unit"],
  meta
};

const evidence: GateEvidence = {
  id: "evidence:fnd007-unit",
  gateId: gate.id,
  kind: "test",
  source: "ci:36130000000",
  revision: "abcdef1234567890",
  createdAt: "2026-09-25T18:31:00+07:00"
};

describe("Work Package dependency rules", () => {
  it("fails closed for a missing dependency", () => {
    const candidate = work(
      "work-package:child",
      "blocked",
      ["work-package:missing"]
    );

    expect(() =>
      validateWorkPackageDependencies(candidate, [candidate])
    ).toThrow(WorkPackageDependencyError);
  });

  it("fails closed for a dependency cycle", () => {
    const a = work(
      "work-package:a",
      "blocked",
      ["work-package:b"]
    );
    const b = work(
      "work-package:b",
      "blocked",
      ["work-package:a"]
    );

    expect(() =>
      validateWorkPackageDependencies(a, [a, b])
    ).toThrow(WorkPackageDependencyError);
  });

  it("explains blockers with dependency id and status", () => {
    const dependency = work("work-package:base", "testing");
    const candidate = work(
      "work-package:child",
      "blocked",
      [dependency.id]
    );

    const readiness = explainWorkPackageReadiness(candidate, [
      dependency,
      candidate
    ]);

    expect(readiness.state).toBe("blocked");
    expect(readiness.blockers).toEqual([
      {
        dependencyId: dependency.id,
        status: "testing",
        reason:
          "Dependency work-package:base is testing, not completed"
      }
    ]);
  });

  it("becomes ready only when every dependency is completed", () => {
    const dependency = work("work-package:base", "completed");
    const candidate = work(
      "work-package:child",
      "blocked",
      [dependency.id]
    );

    expect(
      explainWorkPackageReadiness(candidate, [dependency, candidate])
    ).toEqual({ state: "ready", blockers: [] });
  });
});

describe("Quality Gate evidence rules", () => {
  it("rejects PASS when required evidence is absent", () => {
    expect(() => assertQualityGateCanPass(gate, [])).toThrow(
      QualityGateEvidenceError
    );
  });

  it("rejects evidence from a different gate", () => {
    expect(() =>
      assertQualityGateCanPass(gate, [
        { ...evidence, gateId: "gate:other" }
      ])
    ).toThrow(QualityGateEvidenceError);
  });

  it("accepts PASS only when required provenance-backed evidence exists", () => {
    expect(() =>
      assertQualityGateCanPass(gate, [evidence])
    ).not.toThrow();
  });
});
