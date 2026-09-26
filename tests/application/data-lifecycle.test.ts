import { describe, expect, it } from "vitest";

import {
  blueprintDataLifecyclePolicyV1,
  planLifecycleAction
} from "../../packages/application/src/data-lifecycle";

const record = {
  id: "audit:one",
  projectId: "project:one",
  recordClass: "audit" as const,
  createdAt: "2018-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

describe("P9-015 Data Lifecycle & Archive", () => {
  it("defines explicit policy for every supported record class", () => {
    expect(blueprintDataLifecyclePolicyV1.rules.map((item) => item.recordClass).sort()).toEqual([
      "audit",
      "canonical-project",
      "derived-projection",
      "quality-evidence",
      "reference",
      "release"
    ]);
    expect(blueprintDataLifecyclePolicyV1.implicitDeletionAllowed).toBe(false);
    expect(blueprintDataLifecyclePolicyV1.destructiveActionsRequireBackup).toBe(true);
  });

  it("blocks deletion until backup/export prerequisites are verified", () => {
    const blocked = planLifecycleAction({
      projectId: "project:one",
      record,
      action: "delete",
      evaluatedAt: "2026-09-26T00:00:00.000Z"
    });
    expect(blocked.state).toBe("blocked");
    expect(blocked.blockers).toEqual([
      "verified-backup-missing",
      "verified-export-missing"
    ]);

    const ready = planLifecycleAction({
      projectId: "project:one",
      record,
      action: "delete",
      evaluatedAt: "2026-09-26T00:00:00.000Z",
      backupEvidenceId: "backup:verified",
      exportEvidenceId: "export:verified"
    });
    expect(ready.state).toBe("ready-for-explicit-execution");
    expect(ready.destructiveExecutionAllowed).toBe(false);
    expect(ready.requiresExplicitConfirmation).toBe(true);
  });

  it("keeps holds and immutable provenance fail-closed", () => {
    const hold = planLifecycleAction({
      projectId: "project:one",
      record: { ...record, legalHold: true },
      action: "delete",
      evaluatedAt: "2026-09-26T00:00:00.000Z",
      backupEvidenceId: "backup:verified",
      exportEvidenceId: "export:verified"
    });
    expect(hold.blockers).toContain("legal-hold");

    const release = planLifecycleAction({
      projectId: "project:one",
      record: {
        ...record,
        id: "release:one",
        recordClass: "release"
      },
      action: "delete",
      evaluatedAt: "2026-09-26T00:00:00.000Z",
      backupEvidenceId: "backup:verified",
      exportEvidenceId: "export:verified"
    });
    expect(release.blockers).toContain("deletion-not-allowed");
    expect(release.blockers).toContain("indefinite-retention");
  });

  it("rejects cross-project records and cross-project migration", () => {
    expect(() =>
      planLifecycleAction({
        projectId: "project:one",
        record: { ...record, projectId: "project:other" },
        action: "retain",
        evaluatedAt: "2026-09-26T00:00:00.000Z"
      })
    ).toThrow(/belongs to project:other/i);

    const migration = planLifecycleAction({
      projectId: "project:one",
      record,
      action: "migrate",
      evaluatedAt: "2026-09-26T00:00:00.000Z",
      targetProjectId: "project:other"
    });
    expect(migration.blockers).toContain("cross-project-migration-forbidden");
  });

  it("enforces archive windows and keeps all plans non-mutating", () => {
    const tooEarly = planLifecycleAction({
      projectId: "project:one",
      record: {
        ...record,
        id: "projection:one",
        recordClass: "derived-projection",
        createdAt: "2026-09-20T00:00:00.000Z"
      },
      action: "archive",
      evaluatedAt: "2026-09-26T00:00:00.000Z"
    });
    expect(tooEarly.blockers).toContain("archive-retention-window-active");
    expect(tooEarly.canonicalMutationAllowed).toBe(false);
  });
});
