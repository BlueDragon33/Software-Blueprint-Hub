import { createHash } from "node:crypto";

export type LifecycleRecordClass =
  | "canonical-project"
  | "quality-evidence"
  | "release"
  | "audit"
  | "reference"
  | "derived-projection";

export type LifecycleAction =
  | "retain"
  | "archive"
  | "delete"
  | "export"
  | "migrate";

export interface LifecyclePolicyRule {
  readonly recordClass: LifecycleRecordClass;
  readonly retentionDays: number | null;
  readonly archiveAfterDays: number | null;
  readonly deletionAllowed: boolean;
  readonly exportRequiredBeforeDelete: boolean;
  readonly rationale: string;
}

export interface LifecycleRecordDescriptor {
  readonly id: string;
  readonly projectId: string;
  readonly recordClass: LifecycleRecordClass;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly legalHold?: boolean;
  readonly operationalHold?: boolean;
}

export interface LifecycleActionPlan {
  readonly kind: "data-lifecycle-action-plan";
  readonly id: string;
  readonly projectId: string;
  readonly recordId: string;
  readonly recordClass: LifecycleRecordClass;
  readonly action: LifecycleAction;
  readonly state: "blocked" | "ready-for-explicit-execution";
  readonly blockers: readonly string[];
  readonly prerequisites: readonly string[];
  readonly canonicalMutationAllowed: false;
  readonly destructiveExecutionAllowed: false;
  readonly requiresExplicitConfirmation: true;
  readonly auditFingerprint: string;
  readonly boundaryNote: string;
}

export interface DataLifecyclePolicy {
  readonly version: "1.0.0";
  readonly rules: readonly LifecyclePolicyRule[];
  readonly destructiveActionsRequireBackup: true;
  readonly projectIsolationRequired: true;
  readonly implicitDeletionAllowed: false;
}

export const blueprintDataLifecyclePolicyV1: DataLifecyclePolicy = Object.freeze({
  version: "1.0.0",
  destructiveActionsRequireBackup: true,
  projectIsolationRequired: true,
  implicitDeletionAllowed: false,
  rules: Object.freeze([
    Object.freeze({
      recordClass: "canonical-project",
      retentionDays: null,
      archiveAfterDays: null,
      deletionAllowed: true,
      exportRequiredBeforeDelete: true,
      rationale: "Canonical engineering state is retained until an explicit project deletion decision."
    }),
    Object.freeze({
      recordClass: "quality-evidence",
      retentionDays: null,
      archiveAfterDays: 365,
      deletionAllowed: false,
      exportRequiredBeforeDelete: true,
      rationale: "Gate evidence preserves audit provenance and cannot be independently deleted."
    }),
    Object.freeze({
      recordClass: "release",
      retentionDays: null,
      archiveAfterDays: 730,
      deletionAllowed: false,
      exportRequiredBeforeDelete: true,
      rationale: "Release provenance is long-lived and remains traceable."
    }),
    Object.freeze({
      recordClass: "audit",
      retentionDays: 2555,
      archiveAfterDays: 365,
      deletionAllowed: true,
      exportRequiredBeforeDelete: true,
      rationale: "Audit history is retained for seven years by default before explicit deletion is eligible."
    }),
    Object.freeze({
      recordClass: "reference",
      retentionDays: null,
      archiveAfterDays: 730,
      deletionAllowed: true,
      exportRequiredBeforeDelete: true,
      rationale: "Reference snapshots may be retired, but provenance must be exported first."
    }),
    Object.freeze({
      recordClass: "derived-projection",
      retentionDays: 90,
      archiveAfterDays: 30,
      deletionAllowed: true,
      exportRequiredBeforeDelete: false,
      rationale: "Derived projections are reproducible and may expire without changing canonical state."
    })
  ])
});

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableValue(child)])
    );
  }
  return value;
}

function hash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function daysBetween(earlier: string, later: string): number {
  const start = Date.parse(earlier);
  const end = Date.parse(later);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    throw new TypeError("Lifecycle timestamps must be valid ISO dates");
  }
  if (end < start) throw new TypeError("Lifecycle evaluation time cannot precede record creation");
  return Math.floor((end - start) / 86_400_000);
}

export function planLifecycleAction(input: {
  readonly policy?: DataLifecyclePolicy;
  readonly projectId: string;
  readonly record: LifecycleRecordDescriptor;
  readonly action: LifecycleAction;
  readonly evaluatedAt: string;
  readonly backupEvidenceId?: string | null;
  readonly exportEvidenceId?: string | null;
  readonly targetProjectId?: string | null;
}): LifecycleActionPlan {
  const policy = input.policy ?? blueprintDataLifecyclePolicyV1;
  const projectId = required(input.projectId, "Project id");
  const record = input.record;

  if (record.projectId !== projectId) {
    throw new TypeError(
      `Lifecycle record ${record.id} belongs to ${record.projectId}, not ${projectId}`
    );
  }

  const rule = policy.rules.find((item) => item.recordClass === record.recordClass);
  if (!rule) throw new TypeError(`No lifecycle rule for ${record.recordClass}`);

  const ageDays = daysBetween(record.createdAt, input.evaluatedAt);
  const blockers: string[] = [];
  const prerequisites: string[] = [];

  if (record.legalHold) blockers.push("legal-hold");
  if (record.operationalHold) blockers.push("operational-hold");

  if (input.action === "archive") {
    if (rule.archiveAfterDays === null) blockers.push("archive-not-applicable");
    else if (ageDays < rule.archiveAfterDays) blockers.push("archive-retention-window-active");
  }

  if (input.action === "delete") {
    if (!rule.deletionAllowed) blockers.push("deletion-not-allowed");
    if (rule.retentionDays === null && record.recordClass !== "canonical-project") {
      blockers.push("indefinite-retention");
    } else if (rule.retentionDays !== null && ageDays < rule.retentionDays) {
      blockers.push("retention-window-active");
    }
    prerequisites.push("explicit-delete-confirmation");
    if (policy.destructiveActionsRequireBackup) {
      prerequisites.push("verified-backup");
      if (!input.backupEvidenceId?.trim()) blockers.push("verified-backup-missing");
    }
    if (rule.exportRequiredBeforeDelete) {
      prerequisites.push("verified-export");
      if (!input.exportEvidenceId?.trim()) blockers.push("verified-export-missing");
    }
  }

  if (input.action === "migrate") {
    const target = input.targetProjectId?.trim() || "";
    if (!target) blockers.push("migration-target-missing");
    else if (target !== projectId) blockers.push("cross-project-migration-forbidden");
    prerequisites.push("migration-compatibility-check");
  }

  if (input.action === "export") prerequisites.push("integrity-verified-export");

  const identity = {
    projectId,
    recordId: record.id,
    recordClass: record.recordClass,
    action: input.action,
    evaluatedAt: input.evaluatedAt,
    blockers: [...new Set(blockers)].sort(),
    prerequisites: [...new Set(prerequisites)].sort()
  };

  return Object.freeze({
    kind: "data-lifecycle-action-plan",
    id: `lifecycle-plan:${hash(identity).slice(0, 32)}`,
    projectId,
    recordId: record.id,
    recordClass: record.recordClass,
    action: input.action,
    state: blockers.length ? "blocked" : "ready-for-explicit-execution",
    blockers: Object.freeze([...new Set(blockers)].sort()),
    prerequisites: Object.freeze([...new Set(prerequisites)].sort()),
    canonicalMutationAllowed: false,
    destructiveExecutionAllowed: false,
    requiresExplicitConfirmation: true,
    auditFingerprint: `sha256:${hash(identity)}`,
    boundaryNote:
      "Lifecycle planning never deletes, archives or migrates records by itself. Destructive execution requires explicit authority, verified prerequisites and a separately audited mutation path."
  });
}
