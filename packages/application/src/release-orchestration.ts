import { createHash } from "node:crypto";

import type {
  GateEvidence,
  QualityGate,
  ReleaseRecord
} from "@blueprint-os/contracts";
import {
  validateProviderDescriptor,
  type ProviderBoundaryDescriptor
} from "./provider-boundary";

export type PromotionEnvironment = "preview" | "production";
export type PromotionPlanState = "blocked" | "ready-for-explicit-execution";

export interface ReleasePromotionPlanInput {
  readonly projectId: string;
  readonly release: ReleaseRecord;
  readonly qualityGates: readonly QualityGate[];
  readonly evidence: readonly GateEvidence[];
  readonly targetEnvironment: PromotionEnvironment;
  readonly deploymentProvider?: ProviderBoundaryDescriptor | null;
  readonly deploymentCapabilityId?: string | null;
}

export interface ReleasePromotionPlan {
  readonly kind: "release-promotion-plan";
  readonly id: string;
  readonly projectId: string;
  readonly releaseId: string;
  readonly version: string;
  readonly sourceRevision: string;
  readonly artifactSource: string;
  readonly targetEnvironment: PromotionEnvironment;
  readonly state: PromotionPlanState;
  readonly blockers: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly passedGateIds: readonly string[];
  readonly deploymentProviderId: string | null;
  readonly deploymentCapabilityId: string | null;
  readonly mergeIsDeployment: false;
  readonly deploymentObserved: false;
  readonly canonicalMutationAllowed: false;
  readonly qualityGateMutationAllowed: false;
  readonly productionDeploymentAuthorized: false;
  readonly requiresExplicitExecutionConfirmation: true;
  readonly requiresExternalExecution: true;
  readonly auditFingerprint: string;
  readonly boundaryNote: string;
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

function required(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} is required`);
  return normalized;
}

export function buildReleasePromotionPlan(
  input: ReleasePromotionPlanInput
): ReleasePromotionPlan {
  const projectId = required(input.projectId, "Project id");
  const release = input.release;

  if (release.projectId !== projectId) {
    throw new TypeError(
      `ReleaseRecord ${release.id} belongs to another project`
    );
  }
  if (release.status !== "candidate") {
    throw new TypeError(
      `ReleaseRecord ${release.id} must be candidate before promotion planning; received ${release.status}`
    );
  }

  const sourceRevision = required(release.revision, "Release revision");
  const artifactSource = required(release.artifactSource, "Artifact source");
  if (!release.gateEvidenceIds.length) {
    throw new TypeError(
      "Release promotion requires revision-specific gate evidence"
    );
  }

  const gateById = new Map<string, QualityGate>();
  for (const gate of input.qualityGates) {
    if (gate.projectId !== projectId) {
      throw new TypeError(`QualityGate ${gate.id} belongs to another project`);
    }
    if (gateById.has(gate.id)) {
      throw new TypeError(`Duplicate QualityGate ${gate.id}`);
    }
    gateById.set(gate.id, gate);
  }

  const evidenceById = new Map<string, GateEvidence>();
  for (const record of input.evidence) {
    if (evidenceById.has(record.id)) {
      throw new TypeError(`Duplicate GateEvidence ${record.id}`);
    }
    evidenceById.set(record.id, record);
  }

  const passedGateIds = new Set<string>();
  const evidenceIds = [...new Set(release.gateEvidenceIds)].sort();

  for (const evidenceId of evidenceIds) {
    const record = evidenceById.get(evidenceId);
    if (!record) {
      throw new TypeError(
        `ReleaseRecord ${release.id} references unknown GateEvidence ${evidenceId}`
      );
    }
    const gate = gateById.get(record.gateId);
    if (!gate) {
      throw new TypeError(
        `GateEvidence ${evidenceId} references unknown QualityGate ${record.gateId}`
      );
    }
    if (gate.status !== "pass") {
      throw new TypeError(
        `QualityGate ${gate.id} is ${gate.status}, not PASS`
      );
    }
    if (!gate.evidenceIds.includes(evidenceId)) {
      throw new TypeError(
        `QualityGate ${gate.id} does not canonically link GateEvidence ${evidenceId}`
      );
    }
    if (record.revision !== sourceRevision) {
      throw new TypeError(
        `GateEvidence ${evidenceId} targets revision ${record.revision}, not release revision ${sourceRevision}`
      );
    }
    passedGateIds.add(gate.id);
  }

  const blockers: string[] = [];
  let deploymentProviderId: string | null = null;
  let deploymentCapabilityId: string | null = null;

  if (!input.deploymentProvider) {
    blockers.push("deployment-provider-missing");
  } else {
    validateProviderDescriptor(input.deploymentProvider);
    const provider = input.deploymentProvider;
    deploymentProviderId = provider.id;

    if (provider.kind !== "deployment") {
      throw new TypeError(
        `Provider ${provider.id} is ${provider.kind}, not deployment`
      );
    }
    if (!provider.allowedProjectIds.includes(projectId)) {
      throw new TypeError(
        `Deployment provider ${provider.id} is not scoped to project ${projectId}`
      );
    }

    const capabilityId = input.deploymentCapabilityId?.trim() || "";
    if (!capabilityId) {
      blockers.push("deployment-capability-missing");
    } else {
      const capability = provider.capabilities.find(
        (item) => item.id === capabilityId
      );
      if (!capability) {
        throw new TypeError(
          `Deployment provider ${provider.id} does not expose capability ${capabilityId}`
        );
      }
      if (capability.mode !== "mutate-external") {
        throw new TypeError(
          `Deployment capability ${capabilityId} must be mutate-external`
        );
      }
      deploymentCapabilityId = capability.id;
    }
  }

  const identity = {
    projectId,
    releaseId: release.id,
    version: release.version,
    sourceRevision,
    artifactSource,
    targetEnvironment: input.targetEnvironment,
    evidenceIds,
    passedGateIds: [...passedGateIds].sort(),
    deploymentProviderId,
    deploymentCapabilityId
  };
  const auditFingerprint = `sha256:${hash(identity)}`;

  return Object.freeze({
    kind: "release-promotion-plan",
    id: `release-promotion:${hash(identity).slice(0, 32)}`,
    projectId,
    releaseId: release.id,
    version: release.version,
    sourceRevision,
    artifactSource,
    targetEnvironment: input.targetEnvironment,
    state: blockers.length ? "blocked" : "ready-for-explicit-execution",
    blockers: Object.freeze([...blockers].sort()),
    evidenceIds: Object.freeze(evidenceIds),
    passedGateIds: Object.freeze([...passedGateIds].sort()),
    deploymentProviderId,
    deploymentCapabilityId,
    mergeIsDeployment: false,
    deploymentObserved: false,
    canonicalMutationAllowed: false,
    qualityGateMutationAllowed: false,
    productionDeploymentAuthorized: false,
    requiresExplicitExecutionConfirmation: true,
    requiresExternalExecution: true,
    auditFingerprint,
    boundaryNote:
      "This plan proves promotion preconditions only. Merge, CI and release evidence are not deployment. A real external deployment provider plus an explicit execution action are still required."
  });
}
