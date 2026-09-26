import { createHash } from "node:crypto";

export type DataLifecycleRecordKind =
  | "project-profile"
  | "work-package"
  | "quality-gate"
  | "gate-evidence"
  | "architecture-decision"
  | "risk"
  | "technical-debt"
  | "release-record"
  | "lesson-learned"
  | "prompt-projection"
  | "backup";

export type LifecycleAction =
  | "retain"
  | "archive"
  | "export"
  | "migrate"
  | "delete";

export interface DataLifecycleRule {
  readonly recordKind: DataLifecycleRecordKind;
  readonly minimumRetentionDays: number;
  readonly archiveAfterDays: number | null;
  readonly deletionAllowed: boolean;
  readonly exportRequiredBeforeDelete: boolean;
  readonly migrationRequiredBeforeSchemaRetirement: boolean;
  readonly rationale: string;
}

export interface DataLifecyclePolicyInput {
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly policyVersion: string;
  readonly rules: readonly DataLifecycleRule[];
}

export interface DataLifecyclePolicy {
  readonly kind: "data-lifecycle-policy";
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly policyVersion: string;
  readonly rules: readonly DataLifecycleRule[];
  readonly canonicalMutationAllowed: false;
  readonly destructiveMutationAllowed: false;
  readonly productionReleaseAuthority: false;
  readonly fingerprint: string;
  readonly boundaryNote: string;
}

export interface LifecycleRecordState {
  readonly id: string;
  readonly projectId: string;
  readonly recordKind: DataLifecycleRecordKind;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt?: string;
  readonly legalHold: boolean;
  readonly releaseEvidenceDependency: boolean;
  readonly exportedBackupHash?: string;
  readonly schemaVersion: string;
}

export interface LifecycleActionPreview {
  readonly kind: "data-lifecycle-action-preview";
  readonly projectId: string;
  readonly recordId: string;
  readonly recordKind: DataLifecycleRecordKind;
  readonly action: LifecycleAction;
  readonly allowed: boolean;
  readonly blockers: readonly string[];
  readonly requirements: readonly string[];
  readonly canonicalMutationAllowed: false;
  readonly destructiveMutationAllowed: false;
  readonly requiresExplicitConfirmation: true;
  readonly policyFingerprint: string;
}

const forbiddenKey = /(password|secret|token|api[-_]?key|authorization|cookie|session)$/i;
const suspiciousSecretValue =
  /(?:bearer\s+[a-z0-9._-]{8,}|basic\s+[a-z0-9+/=]{8,}|gh[pousr]_[a-z0-9]{12,}|sk-[a-z0-9_-]{12,}|eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,})/i;

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  if (suspiciousSecretValue.test(normalized)) {
    throw new TypeError(`${label} contains a raw secret-like value`);
  }
  return normalized;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => {
          if (forbiddenKey.test(key)) {
            throw new TypeError(`Lifecycle state contains forbidden secret-bearing key ${key}`);
          }
          return [key, stableValue(child)];
        })
    );
  }
  if (typeof value === "string" && suspiciousSecretValue.test(value)) {
    throw new TypeError("Lifecycle state contains a raw secret-like value");
  }
  return value;
}

function hash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function parseTime(value: string, label: string): number {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) throw new TypeError(`${label} must be ISO-compatible`);
  return time;
}

function ageDays(now: string, since: string): number {
  return Math.floor((parseTime(now, "Now") - parseTime(since, "Record timestamp")) / 86_400_000);
}

export function buildDataLifecyclePolicy(
  input: DataLifecyclePolicyInput
): DataLifecyclePolicy {
  const projectId = required(input.projectId, "Project id");
  const sourceRevision = required(input.sourceRevision, "Source revision");
  const policyVersion = required(input.policyVersion, "Policy version");

  const seen = new Set<DataLifecycleRecordKind>();
  const rules = Object.freeze(
    input.rules
      .map((rule) => {
        if (seen.has(rule.recordKind)) {
          throw new TypeError(`Duplicate lifecycle rule for ${rule.recordKind}`);
        }
        seen.add(rule.recordKind);
        if (!Number.isInteger(rule.minimumRetentionDays) || rule.minimumRetentionDays < 0) {
          throw new TypeError(`Invalid minimum retention for ${rule.recordKind}`);
        }
        if (
          rule.archiveAfterDays !== null &&
          (!Number.isInteger(rule.archiveAfterDays) ||
            rule.archiveAfterDays < 0 ||
            rule.archiveAfterDays < rule.minimumRetentionDays)
        ) {
          throw new TypeError(`Archive threshold for ${rule.recordKind} must not precede minimum retention`);
        }
        if (rule.deletionAllowed && !rule.exportRequiredBeforeDelete) {
          throw new TypeError(
            `Deletion rule for ${rule.recordKind} must require export before delete`
          );
        }
        return Object.freeze({
          ...rule,
          rationale: required(rule.rationale, "Lifecycle rationale")
        });
      })
      .sort((a, b) => a.recordKind.localeCompare(b.recordKind))
  );

  const identity = { projectId, sourceRevision, policyVersion, rules };
  return Object.freeze({
    kind: "data-lifecycle-policy",
    projectId,
    sourceRevision,
    policyVersion,
    rules,
    canonicalMutationAllowed: false,
    destructiveMutationAllowed: false,
    productionReleaseAuthority: false,
    fingerprint: `sha256:${hash(identity)}`,
    boundaryNote:
      "Lifecycle policy may block archive/migration/deletion, but preview evaluation cannot mutate canonical state or authorize Production."
  });
}

export function previewLifecycleAction(input: {
  readonly policy: DataLifecyclePolicy;
  readonly record: LifecycleRecordState;
  readonly action: LifecycleAction;
  readonly now: string;
}): LifecycleActionPreview {
  const { policy, record, action, now } = input;
  if (record.projectId !== policy.projectId) {
    throw new TypeError(
      `Lifecycle record ${record.id} belongs to ${record.projectId}, not ${policy.projectId}`
    );
  }

  const rule = policy.rules.find((item) => item.recordKind === record.recordKind);
  if (!rule) {
    throw new TypeError(`No lifecycle rule for ${record.recordKind}`);
  }

  const age = ageDays(now, record.updatedAt);
  if (age < 0) throw new TypeError("Lifecycle clock precedes record timestamp");

  const blockers: string[] = [];
  const requirements: string[] = [];

  if (record.legalHold && (action === "archive" || action === "migrate" || action === "delete")) {
    blockers.push("legal-hold");
  }

  if (action === "archive") {
    if (rule.archiveAfterDays === null) blockers.push("archive-not-configured");
    else if (age < rule.archiveAfterDays) {
      blockers.push(`minimum-archive-age-not-met:${rule.archiveAfterDays}`);
    }
  }

  if (action === "delete") {
    if (!rule.deletionAllowed) blockers.push("deletion-forbidden");
    if (age < rule.minimumRetentionDays) {
      blockers.push(`minimum-retention-not-met:${rule.minimumRetentionDays}`);
    }
    if (record.releaseEvidenceDependency) {
      blockers.push("release-evidence-dependency");
    }
    if (rule.exportRequiredBeforeDelete && !record.exportedBackupHash) {
      blockers.push("verified-export-required");
      requirements.push("Create and verify an integrity-protected export before deletion.");
    }
  }

  if (action === "migrate" && rule.migrationRequiredBeforeSchemaRetirement) {
    requirements.push("Migration must preserve identity, source provenance and schema-version traceability.");
  }

  if (action === "export") {
    requirements.push("Export must carry exact source revision and integrity hash.");
  }

  if (action === "retain") {
    requirements.push("Retained records stay under current authority and schema compatibility rules.");
  }

  return Object.freeze({
    kind: "data-lifecycle-action-preview",
    projectId: record.projectId,
    recordId: record.id,
    recordKind: record.recordKind,
    action,
    allowed: blockers.length === 0,
    blockers: Object.freeze(blockers.sort()),
    requirements: Object.freeze([...new Set(requirements)].sort()),
    canonicalMutationAllowed: false,
    destructiveMutationAllowed: false,
    requiresExplicitConfirmation: true,
    policyFingerprint: policy.fingerprint
  });
}

export const blueprintOsDataLifecyclePolicyV1 = buildDataLifecyclePolicy({
  projectId: "project:blueprint-os",
  sourceRevision: "phase9:p9-015",
  policyVersion: "1.0.0",
  rules: [
    {
      recordKind: "project-profile",
      minimumRetentionDays: 3650,
      archiveAfterDays: null,
      deletionAllowed: false,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Project identity and canonical profile remain long-lived engineering authority."
    },
    {
      recordKind: "work-package",
      minimumRetentionDays: 730,
      archiveAfterDays: 730,
      deletionAllowed: true,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Planning history remains auditable after work completion."
    },
    {
      recordKind: "quality-gate",
      minimumRetentionDays: 1825,
      archiveAfterDays: 1825,
      deletionAllowed: false,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Gate decisions remain part of release provenance."
    },
    {
      recordKind: "gate-evidence",
      minimumRetentionDays: 1825,
      archiveAfterDays: 1825,
      deletionAllowed: false,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Exact revision evidence must remain inspectable for release and audit history."
    },
    {
      recordKind: "architecture-decision",
      minimumRetentionDays: 3650,
      archiveAfterDays: 3650,
      deletionAllowed: false,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Superseded decisions still explain architecture evolution."
    },
    {
      recordKind: "risk",
      minimumRetentionDays: 730,
      archiveAfterDays: 730,
      deletionAllowed: true,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Closed risk history supports governance without remaining operational forever."
    },
    {
      recordKind: "technical-debt",
      minimumRetentionDays: 730,
      archiveAfterDays: 730,
      deletionAllowed: true,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Resolved debt history may archive but remains export-protected before deletion."
    },
    {
      recordKind: "release-record",
      minimumRetentionDays: 3650,
      archiveAfterDays: 3650,
      deletionAllowed: false,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Release provenance is durable operational evidence."
    },
    {
      recordKind: "lesson-learned",
      minimumRetentionDays: 3650,
      archiveAfterDays: 3650,
      deletionAllowed: false,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: true,
      rationale: "Lessons feed reusable governance and must retain provenance."
    },
    {
      recordKind: "prompt-projection",
      minimumRetentionDays: 180,
      archiveAfterDays: 365,
      deletionAllowed: true,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: false,
      rationale: "Prompt projections are derived artifacts; history is useful but not canonical authority."
    },
    {
      recordKind: "backup",
      minimumRetentionDays: 90,
      archiveAfterDays: 180,
      deletionAllowed: true,
      exportRequiredBeforeDelete: true,
      migrationRequiredBeforeSchemaRetirement: false,
      rationale: "Backup rotation is allowed only after verified replacement/export exists."
    }
  ]
});
