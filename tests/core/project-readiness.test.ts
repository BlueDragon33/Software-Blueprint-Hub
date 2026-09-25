import type {
  GateEvidence,
  QualityGate,
  WorkPackage
} from "../../packages/contracts/src";
import { summarizeProjectReadiness } from "../../packages/core/src";
import { describe, expect, it } from "vitest";

const projectId = "project:p6-readiness";

const meta = {
  schemaVersion: "1.0.0" as const,
  recordVersion: 1,
  createdAt: "2026-09-25T15:00:00Z",
  updatedAt: "2026-09-25T15:00:00Z"
};

function gate(
  id: string,
  status: QualityGate["status"],
  evidenceIds: readonly string[] = []
): QualityGate {
  return {
    id,
    projectId,
    name: id.split(":").slice(1).join(" "),
    requirements: ["Evidence-backed acceptance."],
    status,
    evidenceIds: [...evidenceIds],
    meta
  };
}

function work(
  id: string,
  status: WorkPackage["status"],
  dependencies: readonly string[] = []
): WorkPackage {
  return {
    id,
    projectId,
    title: id.split(":").at(-1) ?? id,
    purpose: "Readiness aggregation test.",
    dependencies: [...dependencies],
    acceptanceCriteria: ["Readiness is truthful."],
    qualityGateIds: ["gate:quality:evidence"],
    status,
    meta
  };
}

const evidence: GateEvidence = {
  id: "evidence:p6-readiness",
  gateId: "gate:quality:evidence",
  kind: "test",
  source: "github-actions:readiness",
  revision: "revision-p6-readiness",
  createdAt: "2026-09-25T15:01:00Z"
};

describe("Project readiness aggregation", () => {
  it("fails closed when a resolved required gate has no canonical record", () => {
    const snapshot = summarizeProjectReadiness({
      projectId,
      requiredGateIds: [
        "gate:quality:evidence",
        "gate:platform:compatibility"
      ],
      workPackages: [],
      qualityGates: [
        gate("gate:quality:evidence", "pass", [evidence.id])
      ],
      evidenceByGate: new Map([
        ["gate:quality:evidence", [evidence]]
      ])
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.gateSummary.missingRequired).toBe(1);
    expect(snapshot.nextAction.kind).toBe("define-gate");
  });

  it("surfaces blocked dependency work before cosmetic progress", () => {
    const base = work("work-package:base", "testing");
    const child = work(
      "work-package:child",
      "blocked",
      [base.id]
    );

    const snapshot = summarizeProjectReadiness({
      projectId,
      requiredGateIds: ["gate:quality:evidence"],
      workPackages: [base, child],
      qualityGates: [
        gate("gate:quality:evidence", "pass", [evidence.id])
      ],
      evidenceByGate: new Map([
        ["gate:quality:evidence", [evidence]]
      ])
    });

    expect(snapshot.state).toBe("blocked");
    expect(snapshot.workSummary.blocked).toBe(1);
    expect(snapshot.blockedWork[0]?.blockers[0]?.dependencyId).toBe(base.id);
    expect(snapshot.nextAction.kind).toBe("unblock-work");
  });

  it("does not claim evidence freshness without current revision authority", () => {
    const snapshot = summarizeProjectReadiness({
      projectId,
      requiredGateIds: ["gate:quality:evidence"],
      workPackages: [],
      qualityGates: [
        gate("gate:quality:evidence", "candidate", [evidence.id])
      ],
      evidenceByGate: new Map([
        ["gate:quality:evidence", [evidence]]
      ])
    });

    expect(snapshot.evidenceSummary.freshness).toBe(
      "recorded-unverified"
    );
    expect(snapshot.activeGates[0]?.latestEvidenceRevision).toBe(
      "revision-p6-readiness"
    );
    expect(snapshot.nextAction.kind).toBe("review-candidate");
  });

  it("uses gate-ready only when every required gate passes and work is done", () => {
    const secondEvidence: GateEvidence = {
      ...evidence,
      id: "evidence:p6-security",
      gateId: "gate:security:authority"
    };

    const snapshot = summarizeProjectReadiness({
      projectId,
      requiredGateIds: [
        "gate:quality:evidence",
        "gate:security:authority"
      ],
      workPackages: [work("work-package:done", "completed")],
      qualityGates: [
        gate("gate:quality:evidence", "pass", [evidence.id]),
        gate("gate:security:authority", "pass", [secondEvidence.id])
      ],
      evidenceByGate: new Map([
        ["gate:quality:evidence", [evidence]],
        ["gate:security:authority", [secondEvidence]]
      ])
    });

    expect(snapshot.state).toBe("gate-ready");
    expect(snapshot.gateSummary.passRequired).toBe(2);
    expect(snapshot.nextAction.kind).toBe("verify-release");
  });
});
