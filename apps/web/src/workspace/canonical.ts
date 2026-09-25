import type {
  GateEvidence,
  ProjectProfile,
  PromptProjection,
  QualityGate,
  WorkPackage
} from "@blueprint-os/contracts";
import type { BlueprintServerRuntime } from "@blueprint-os/runtime";

type RuntimeActor = Parameters<BlueprintServerRuntime["profiles"]["create"]>[0];

export interface CanonicalWorkspaceIds {
  readonly projectId: string;
  readonly profileId: string;
  readonly workPackageId: string;
  readonly qualityGateId: string;
}

export interface CanonicalProjectInput {
  readonly projectName: string;
  readonly projectType: string;
  readonly blueprintLevel: ProjectProfile["blueprintLevel"];
}

export interface CanonicalWorkspaceState {
  readonly profile: ProjectProfile;
  readonly blueprint: Awaited<ReturnType<BlueprintServerRuntime["profiles"]["create"]>>["blueprint"];
  readonly templateVersions: Awaited<ReturnType<BlueprintServerRuntime["profiles"]["create"]>>["templateVersions"];
  readonly workPackage?: WorkPackage;
  readonly qualityGate?: QualityGate;
  readonly prompt?: PromptProjection;
}

function profileFromInput(
  input: CanonicalProjectInput,
  ids: CanonicalWorkspaceIds,
  now: string
): ProjectProfile {
  return {
    id: ids.profileId,
    projectId: ids.projectId,
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: now,
      updatedAt: now
    },
    name: input.projectName.trim() || "Untitled project",
    projectType: input.projectType.trim() || "web-application",
    blueprintLevel: input.blueprintLevel,
    primaryUsers: ["software-builder"],
    jobsToBeDone: [
      "Turn software intent into an evidence-backed engineering blueprint."
    ],
    dataSensitivity: "internal",
    persistence: "server",
    authentication: "required",
    authorization: "role-based",
    offlineRequirement: "none",
    externalIntegrations: [],
    aiUse: "assistive",
    extensibilityRequirement:
      input.blueprintLevel === "B4" || input.blueprintLevel === "B5"
        ? "templates"
        : "configuration",
    expectedLifetime: input.blueprintLevel === "B0" ? "months" : "long-lived",
    expectedScale: "project-defined",
    availabilityRequirement: "recoverable web service",
    complianceSecuritySensitivity: "project-defined",
    deploymentTarget: "managed web platform",
    maintenanceModel: "versioned continuous maintenance"
  };
}

export async function createCanonicalProject(
  runtime: Pick<BlueprintServerRuntime, "profiles">,
  actor: RuntimeActor,
  input: CanonicalProjectInput,
  ids: CanonicalWorkspaceIds,
  now: string
): Promise<CanonicalWorkspaceState> {
  const resolution = await runtime.profiles.create(
    actor,
    profileFromInput(input, ids, now)
  );

  return Object.freeze({
    profile: resolution.profile,
    blueprint: resolution.blueprint,
    templateVersions: resolution.templateVersions
  });
}

export async function createCanonicalWorkAndGate(
  runtime: Pick<BlueprintServerRuntime, "workQuality">,
  actor: RuntimeActor,
  state: Pick<CanonicalWorkspaceState, "profile">,
  ids: CanonicalWorkspaceIds,
  workTitle: string,
  now: string
): Promise<Pick<CanonicalWorkspaceState, "workPackage" | "qualityGate">> {
  const gate: QualityGate = {
    id: ids.qualityGateId,
    projectId: state.profile.projectId,
    name: "Human UX acceptance",
    requirements: [
      "Critical journey is understandable and recoverable by a real reviewer."
    ],
    status: "not-ready",
    evidenceIds: [],
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: now,
      updatedAt: now
    }
  };

  const workPackage: WorkPackage = {
    id: ids.workPackageId,
    projectId: state.profile.projectId,
    title: workTitle.trim() || "Untitled work package",
    purpose:
      "Deliver one verified vertical slice before broader feature expansion.",
    dependencies: [],
    acceptanceCriteria: [
      "Critical journey is understandable.",
      "Exact revision passes automated evidence."
    ],
    qualityGateIds: [gate.id],
    status: "ready",
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: now,
      updatedAt: now
    }
  };

  const storedGate = await runtime.workQuality.createQualityGate(actor, gate);
  const storedWork = await runtime.workQuality.createWorkPackage(
    actor,
    workPackage
  );

  return Object.freeze({
    workPackage: storedWork,
    qualityGate: storedGate
  });
}

export async function generateCanonicalPrompt(
  runtime: Pick<BlueprintServerRuntime, "prompts">,
  actor: RuntimeActor,
  projectId: string
): Promise<PromptProjection> {
  return runtime.prompts.generate(actor, projectId);
}

export async function recordCanonicalHumanUxEvidence(
  runtime: Pick<BlueprintServerRuntime, "workQuality">,
  actor: RuntimeActor,
  gate: QualityGate,
  evidence: GateEvidence
): Promise<GateEvidence> {
  if (evidence.gateId !== gate.id) {
    throw new TypeError("Human UX evidence must target the active Quality Gate");
  }
  return runtime.workQuality.addGateEvidence(actor, evidence);
}
