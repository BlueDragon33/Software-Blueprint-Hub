import { describe, expect, it } from "vitest";

import type {
  CanonicalProjectState
} from "../../packages/application/src/canonical-portability";
import {
  createCanonicalBackup,
  createRestorePreview,
  verifyCanonicalBackup
} from "../../packages/application/src/canonical-portability";

const profile = {
  id: "profile:portable",
  projectId: "project:portable",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-26T18:30:00+07:00",
    updatedAt: "2026-09-26T18:30:00+07:00"
  },
  name: "Portable Project",
  projectType: "web-application",
  blueprintLevel: "B2",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Restore canonical engineering state."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "long-lived"
} as const;

const state: CanonicalProjectState = {
  profile,
  blueprint: {
    resolutionId: "resolution:portable",
    resolverVersion: "1.0.0",
    inputFingerprint: "1234567890abcdef1234567890abcdef",
    projectId: profile.projectId,
    profileRecordVersion: 1,
    activatedTemplates: [],
    requiredModules: [],
    requiredGates: ["gate:portable"],
    dependencyEdges: [],
    rationale: []
  },
  workPackages: [{
    id: "work-package:portable",
    projectId: profile.projectId,
    title: "Portable work",
    purpose: "Exercise backup.",
    dependencies: [],
    acceptanceCriteria: ["Backup round-trips."],
    qualityGateIds: ["gate:portable"],
    status: "testing",
    meta: profile.meta
  }],
  qualityGates: [{
    id: "gate:portable",
    projectId: profile.projectId,
    name: "Portable Gate",
    requirements: ["Exact evidence exists."],
    status: "candidate",
    evidenceIds: ["evidence:portable"],
    meta: profile.meta
  }],
  gateEvidence: [{
    id: "evidence:portable",
    gateId: "gate:portable",
    kind: "test",
    source: "vitest:p9-007",
    revision: "portable-revision",
    createdAt: "2026-09-26T18:31:00+07:00"
  }],
  architectureDecisions: [],
  risks: [],
  technicalDebt: [],
  releases: [],
  lessons: []
};

describe("P9-007 canonical export / backup / restore", () => {
  it("creates deterministic payload integrity independent of record ordering", () => {
    const first = createCanonicalBackup(
      state,
      "2026-09-26T18:32:00+07:00",
      "revision:one"
    );
    const second = createCanonicalBackup(
      { ...state, workPackages: [...state.workPackages].reverse() },
      "2026-09-26T18:33:00+07:00",
      "revision:two"
    );

    expect(second.payloadHash).toBe(first.payloadHash);
    expect(second.projectId).toBe(first.projectId);
  });

  it("fails closed when a backup is tampered with", () => {
    const backup = createCanonicalBackup(
      state,
      "2026-09-26T18:32:00+07:00",
      "revision:one"
    );
    const tampered = {
      ...backup,
      payload: {
        ...backup.payload,
        profile: { ...backup.payload.profile, name: "Tampered" }
      }
    };

    expect(() => verifyCanonicalBackup(tampered)).toThrow(/integrity/i);
  });

  it("rejects cross-project contamination before export", () => {
    expect(() =>
      createCanonicalBackup(
        {
          ...state,
          workPackages: [
            { ...state.workPackages[0], projectId: "project:other" }
          ]
        },
        "2026-09-26T18:32:00+07:00",
        "revision:one"
      )
    ).toThrow(/belongs to project:other/i);
  });

  it("produces a restore preview without silent canonical mutation authority", () => {
    const backup = createCanonicalBackup(
      state,
      "2026-09-26T18:32:00+07:00",
      "revision:one"
    );
    const preview = createRestorePreview(backup);

    expect(preview.canonicalMutationAllowed).toBe(false);
    expect(preview.requiresExplicitRestoreConfirmation).toBe(true);
    expect(preview.projectId).toBe(profile.projectId);
    expect(preview.recordCounts.workPackages).toBe(1);
    expect(preview.state).toEqual(backup.payload);
  });
});
