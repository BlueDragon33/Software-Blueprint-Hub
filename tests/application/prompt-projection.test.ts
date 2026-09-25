import type {
  GateEvidence,
  ProjectProfile,
  QualityGate,
  ResolvedBlueprint,
  WorkPackage
} from "../../packages/contracts/src";
import {
  createPromptProjection,
  isPromptProjectionStale,
  promptSourceRevision,
  type PromptProjectionSource
} from "../../packages/application/src";
import { describe, expect, it } from "vitest";

const profile: ProjectProfile = {
  id: "profile:fnd008-unit",
  projectId: "project:fnd008-unit",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 3,
    createdAt: "2026-09-25T18:40:00+07:00",
    updatedAt: "2026-09-25T18:43:00+07:00"
  },
  name: "FND-008 Unit",
  projectType: "web-application",
  blueprintLevel: "B3",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Generate a deterministic execution prompt."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "long-lived"
};

const blueprint: ResolvedBlueprint = {
  resolutionId: "resolution:fnd008-unit",
  resolverVersion: "1.0.0",
  inputFingerprint: "1234567890abcdef1234567890abcdef",
  projectId: profile.projectId,
  profileRecordVersion: 3,
  activatedTemplates: [
    {
      id: "template:level:b3",
      version: "3.0.0",
      authorityLayer: "blueprint-level"
    }
  ],
  requiredModules: ["module:architecture:context"],
  requiredGates: ["gate:fnd008-unit"],
  dependencyEdges: [],
  rationale: [
    {
      targetId: "module:architecture:context",
      sourceId: "template:level:b3",
      reason: "B3 requires architecture context."
    }
  ]
};

const workA: WorkPackage = {
  id: "work-package:a",
  projectId: profile.projectId,
  title: "A",
  purpose: "First work item",
  dependencies: [],
  acceptanceCriteria: ["A passes."],
  qualityGateIds: ["gate:fnd008-unit"],
  status: "completed",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 2,
    createdAt: "2026-09-25T18:41:00+07:00",
    updatedAt: "2026-09-25T18:44:00+07:00"
  }
};

const workB: WorkPackage = {
  id: "work-package:b",
  projectId: profile.projectId,
  title: "B",
  purpose: "Second work item",
  dependencies: [workA.id],
  acceptanceCriteria: ["B passes."],
  qualityGateIds: ["gate:fnd008-unit"],
  status: "testing",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T18:42:00+07:00",
    updatedAt: "2026-09-25T18:42:00+07:00"
  }
};

const gate: QualityGate = {
  id: "gate:fnd008-unit",
  projectId: profile.projectId,
  name: "FND-008 Gate",
  requirements: ["Exact CI evidence exists."],
  status: "pass",
  evidenceIds: ["evidence:fnd008-unit"],
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 2,
    createdAt: "2026-09-25T18:41:00+07:00",
    updatedAt: "2026-09-25T18:45:00+07:00"
  }
};

const evidence: GateEvidence = {
  id: "evidence:fnd008-unit",
  gateId: gate.id,
  kind: "test",
  source: "github-actions:unit",
  revision: "abcdef1234567890",
  createdAt: "2026-09-25T18:45:00+07:00"
};

function source(
  workPackages: readonly WorkPackage[] = [workB, workA]
): PromptProjectionSource {
  return {
    profile,
    blueprint,
    templateVersions: [
      { id: "template:level:b3", version: "3.0.0" },
      { id: "template:constitution:base", version: "1.0.0" }
    ],
    workPackages,
    qualityGates: [gate],
    evidence: [evidence]
  };
}

describe("Prompt Projection", () => {
  it("is deterministic for the same normalized source even when input order differs", () => {
    const first = createPromptProjection(
      source([workB, workA]),
      "2026-09-25T18:46:00+07:00"
    );
    const second = createPromptProjection(
      source([workA, workB]),
      "2026-09-25T18:47:00+07:00"
    );

    expect(second.sourceRevision).toBe(first.sourceRevision);
    expect(second.contentHash).toBe(first.contentHash);
    expect(second.content).toBe(first.content);
  });

  it("does not mutate canonical source objects", () => {
    const canonical = source();
    const before = JSON.stringify(canonical);

    createPromptProjection(canonical, "2026-09-25T18:46:00+07:00");

    expect(JSON.stringify(canonical)).toBe(before);
  });

  it("detects staleness when canonical Work state changes", () => {
    const firstSource = source();
    const projection = createPromptProjection(
      firstSource,
      "2026-09-25T18:46:00+07:00"
    );
    const changedWork: WorkPackage = {
      ...workB,
      status: "completed",
      meta: {
        ...workB.meta,
        recordVersion: 2,
        updatedAt: "2026-09-25T18:48:00+07:00"
      }
    };
    const currentRevision = promptSourceRevision(
      source([changedWork, workA])
    );

    expect(currentRevision).not.toBe(projection.sourceRevision);
    expect(
      isPromptProjectionStale(projection, currentRevision)
    ).toBe(true);
  });

  it("renders evidence provenance into the execution prompt", () => {
    const projection = createPromptProjection(
      source(),
      "2026-09-25T18:46:00+07:00"
    );

    expect(projection.content).toContain(evidence.source);
    expect(projection.content).toContain(evidence.revision);
    expect(projection.templateVersion).toBe("execution-prompt:v1");
  });
});
