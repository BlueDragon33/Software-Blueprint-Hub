import { describe, expect, it } from "vitest";

import {
  blueprintOsDataLifecyclePolicyV1,
  buildDataLifecyclePolicy,
  previewLifecycleAction
} from "../../packages/application/src/data-lifecycle";

function record(overrides = {}) {
  return {
    id: "work-package:old",
    projectId: "project:blueprint-os",
    recordKind: "work-package",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    legalHold: false,
    releaseEvidenceDependency: false,
    schemaVersion: "1.0.0",
    ...overrides
  } as const;
}

describe("P9-015 Data Lifecycle & Archive", () => {
  it("keeps policy projections non-mutating and non-release-authoritative", () => {
    expect(blueprintOsDataLifecyclePolicyV1.canonicalMutationAllowed).toBe(false);
    expect(blueprintOsDataLifecyclePolicyV1.destructiveMutationAllowed).toBe(false);
    expect(blueprintOsDataLifecyclePolicyV1.productionReleaseAuthority).toBe(false);
    expect(blueprintOsDataLifecyclePolicyV1.fingerprint).toMatch(/^sha256:/);
  });

  it("fails closed on unsafe deletion policy", () => {
    expect(() =>
      buildDataLifecyclePolicy({
        projectId: "project:test",
        sourceRevision: "rev:test",
        policyVersion: "1.0.0",
        rules: [{
          recordKind: "risk",
          minimumRetentionDays: 30,
          archiveAfterDays: 30,
          deletionAllowed: true,
          exportRequiredBeforeDelete: false,
          migrationRequiredBeforeSchemaRetirement: true,
          rationale: "Unsafe on purpose."
        }]
      })
    ).toThrow(/export before delete/i);
  });

  it("blocks delete until retention and verified export preconditions are met", () => {
    const preview = previewLifecycleAction({
      policy: blueprintOsDataLifecyclePolicyV1,
      record: record(),
      action: "delete",
      now: "2024-03-01T00:00:00.000Z"
    });

    expect(preview.allowed).toBe(false);
    expect(preview.blockers).toContain("minimum-retention-not-met:730");
    expect(preview.blockers).toContain("verified-export-required");
  });

  it("allows eligible deletion only as an explicit-confirmation preview", () => {
    const preview = previewLifecycleAction({
      policy: blueprintOsDataLifecyclePolicyV1,
      record: record({
        exportedBackupHash: "sha256:verified"
      }),
      action: "delete",
      now: "2026-09-26T00:00:00.000Z"
    });

    expect(preview.allowed).toBe(true);
    expect(preview.canonicalMutationAllowed).toBe(false);
    expect(preview.destructiveMutationAllowed).toBe(false);
    expect(preview.requiresExplicitConfirmation).toBe(true);
  });

  it("blocks destructive lifecycle changes under legal hold or release evidence dependency", () => {
    const held = previewLifecycleAction({
      policy: blueprintOsDataLifecyclePolicyV1,
      record: record({
        legalHold: true,
        exportedBackupHash: "sha256:verified"
      }),
      action: "delete",
      now: "2026-09-26T00:00:00.000Z"
    });
    expect(held.blockers).toContain("legal-hold");

    const evidenceBound = previewLifecycleAction({
      policy: blueprintOsDataLifecyclePolicyV1,
      record: record({
        releaseEvidenceDependency: true,
        exportedBackupHash: "sha256:verified"
      }),
      action: "delete",
      now: "2026-09-26T00:00:00.000Z"
    });
    expect(evidenceBound.blockers).toContain("release-evidence-dependency");
  });

  it("rejects cross-project lifecycle evaluation", () => {
    expect(() =>
      previewLifecycleAction({
        policy: blueprintOsDataLifecyclePolicyV1,
        record: record({ projectId: "project:other" }),
        action: "archive",
        now: "2026-09-26T00:00:00.000Z"
      })
    ).toThrow(/belongs to project:other/i);
  });
});
