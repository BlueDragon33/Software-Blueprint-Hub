import { createHash } from "node:crypto";

import type {
  ArchitectureDecision,
  GateEvidence,
  LessonLearned,
  ProjectProfile,
  QualityGate,
  ReleaseRecord,
  ResolvedBlueprint,
  Risk,
  TechnicalDebt,
  WorkPackage
} from "@blueprint-os/contracts";

export const CANONICAL_BACKUP_SCHEMA_VERSION = "1.0.0";

export interface CanonicalProjectState {
  readonly profile: ProjectProfile;
  readonly blueprint: ResolvedBlueprint;
  readonly workPackages: readonly WorkPackage[];
  readonly qualityGates: readonly QualityGate[];
  readonly gateEvidence: readonly GateEvidence[];
  readonly architectureDecisions: readonly ArchitectureDecision[];
  readonly risks: readonly Risk[];
  readonly technicalDebt: readonly TechnicalDebt[];
  readonly releases: readonly ReleaseRecord[];
  readonly lessons: readonly LessonLearned[];
}

export interface CanonicalBackupEnvelope {
  readonly kind: "blueprint-os-canonical-backup";
  readonly schemaVersion: typeof CANONICAL_BACKUP_SCHEMA_VERSION;
  readonly projectId: string;
  readonly exportedAt: string;
  readonly sourceRevision: string;
  readonly payloadHash: string;
  readonly payload: CanonicalProjectState;
}

export interface RestorePreview {
  readonly kind: "canonical-restore-preview";
  readonly projectId: string;
  readonly sourceRevision: string;
  readonly payloadHash: string;
  readonly canonicalMutationAllowed: false;
  readonly requiresExplicitRestoreConfirmation: true;
  readonly recordCounts: Readonly<Record<string, number>>;
  readonly state: CanonicalProjectState;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableValue(child)])
    );
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function assertProjectIdentity(state: CanonicalProjectState): void {
  const projectId = state.profile.projectId;
  if (state.blueprint.projectId !== projectId) {
    throw new TypeError(
      `Backup Blueprint belongs to ${state.blueprint.projectId}, not ${projectId}`
    );
  }

  const projectRecords: readonly { readonly label: string; readonly projectId: string }[] = [
    ...state.workPackages.map((item) => ({ label: item.id, projectId: item.projectId })),
    ...state.qualityGates.map((item) => ({ label: item.id, projectId: item.projectId })),
    ...state.architectureDecisions.map((item) => ({ label: item.id, projectId: item.projectId })),
    ...state.risks.map((item) => ({ label: item.id, projectId: item.projectId })),
    ...state.technicalDebt.map((item) => ({ label: item.id, projectId: item.projectId })),
    ...state.releases.map((item) => ({ label: item.id, projectId: item.projectId })),
    ...state.lessons.map((item) => ({ label: item.id, projectId: item.projectId }))
  ];

  for (const record of projectRecords) {
    if (record.projectId !== projectId) {
      throw new TypeError(
        `Backup record ${record.label} belongs to ${record.projectId}, not ${projectId}`
      );
    }
  }

  const gateIds = new Set(state.qualityGates.map((item) => item.id));
  for (const evidence of state.gateEvidence) {
    if (!gateIds.has(evidence.gateId)) {
      throw new TypeError(
        `Backup evidence ${evidence.id} references unknown gate ${evidence.gateId}`
      );
    }
  }
}

function normalizedState(state: CanonicalProjectState): CanonicalProjectState {
  assertProjectIdentity(state);

  const sortById = <T extends { readonly id: string }>(items: readonly T[]) =>
    Object.freeze([...items].map((item) => structuredClone(item)).sort((a, b) => a.id.localeCompare(b.id)));

  return Object.freeze({
    profile: structuredClone(state.profile),
    blueprint: structuredClone(state.blueprint),
    workPackages: sortById(state.workPackages),
    qualityGates: sortById(state.qualityGates),
    gateEvidence: sortById(state.gateEvidence),
    architectureDecisions: sortById(state.architectureDecisions),
    risks: sortById(state.risks),
    technicalDebt: sortById(state.technicalDebt),
    releases: sortById(state.releases),
    lessons: sortById(state.lessons)
  });
}

export function createCanonicalBackup(
  state: CanonicalProjectState,
  exportedAt: string,
  sourceRevision: string
): CanonicalBackupEnvelope {
  if (!exportedAt.trim()) throw new TypeError("Backup exportedAt is required");
  if (!sourceRevision.trim()) throw new TypeError("Backup sourceRevision is required");

  const payload = normalizedState(state);
  const payloadHash = `sha256:${digest(payload)}`;

  return Object.freeze({
    kind: "blueprint-os-canonical-backup",
    schemaVersion: CANONICAL_BACKUP_SCHEMA_VERSION,
    projectId: payload.profile.projectId,
    exportedAt: exportedAt.trim(),
    sourceRevision: sourceRevision.trim(),
    payloadHash,
    payload
  });
}

export function verifyCanonicalBackup(envelope: CanonicalBackupEnvelope): void {
  if (envelope.kind !== "blueprint-os-canonical-backup") {
    throw new TypeError("Unsupported backup kind");
  }
  if (envelope.schemaVersion !== CANONICAL_BACKUP_SCHEMA_VERSION) {
    throw new TypeError(
      `Unsupported backup schema version ${envelope.schemaVersion}`
    );
  }
  if (envelope.projectId !== envelope.payload.profile.projectId) {
    throw new TypeError("Backup envelope projectId contradicts payload profile");
  }

  assertProjectIdentity(envelope.payload);
  const expected = `sha256:${digest(normalizedState(envelope.payload))}`;
  if (envelope.payloadHash !== expected) {
    throw new TypeError("Backup integrity check failed");
  }
}

export function createRestorePreview(
  envelope: CanonicalBackupEnvelope
): RestorePreview {
  verifyCanonicalBackup(envelope);
  const state = normalizedState(envelope.payload);

  return Object.freeze({
    kind: "canonical-restore-preview",
    projectId: envelope.projectId,
    sourceRevision: envelope.sourceRevision,
    payloadHash: envelope.payloadHash,
    canonicalMutationAllowed: false,
    requiresExplicitRestoreConfirmation: true,
    recordCounts: Object.freeze({
      profile: 1,
      blueprint: 1,
      workPackages: state.workPackages.length,
      qualityGates: state.qualityGates.length,
      gateEvidence: state.gateEvidence.length,
      architectureDecisions: state.architectureDecisions.length,
      risks: state.risks.length,
      technicalDebt: state.technicalDebt.length,
      releases: state.releases.length,
      lessons: state.lessons.length
    }),
    state
  });
}
