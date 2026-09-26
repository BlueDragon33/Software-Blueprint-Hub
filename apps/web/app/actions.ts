"use server";

import {
  createProjectBootstrapPlan,
  createPromptProjection,
  foundationBlueprintTemplatesV1,
  resolveFoundationBlueprintPreview,
  type ProjectBootstrapIntent,
  type ProjectBootstrapPlan
} from "@blueprint-os/application";
import type {
  GateEvidence,
  ProjectProfile,
  PromptProjection,
  QualityGate,
  ResolvedBlueprint,
  WorkPackage
} from "@blueprint-os/contracts";
import { validateContract, validateProjectProfile } from "@blueprint-os/contracts";

const PREVIEW_TIME = "2026-01-01T00:00:00.000Z";

export interface BlueprintPreviewInput {
  readonly projectName: string;
  readonly projectType: string;
  readonly blueprintLevel: ProjectProfile["blueprintLevel"];
}

export type BlueprintPreviewResult =
  | {
      readonly ok: true;
      readonly profile: ProjectProfile;
      readonly blueprint: ResolvedBlueprint;
      readonly templateVersions: readonly {
        readonly id: string;
        readonly version: string;
      }[];
    }
  | {
      readonly ok: false;
      readonly kind: "validation" | "conflict";
      readonly message: string;
      readonly details: readonly string[];
    };

function previewProfile(input: BlueprintPreviewInput): ProjectProfile {
  return {
    id: "profile:preview",
    projectId: "project:preview",
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: PREVIEW_TIME,
      updatedAt: PREVIEW_TIME
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
    expectedLifetime:
      input.blueprintLevel === "B0" ? "months" : "long-lived",
    expectedScale: "project-defined",
    availabilityRequirement: "recoverable web service",
    complianceSecuritySensitivity: "project-defined",
    deploymentTarget: "managed web platform",
    maintenanceModel: "versioned continuous maintenance"
  };
}

export async function resolveBlueprintPreviewAction(
  input: BlueprintPreviewInput
): Promise<BlueprintPreviewResult> {
  const profile = previewProfile(input);
  const validation = validateProjectProfile(profile);

  if (!validation.valid) {
    return {
      ok: false,
      kind: "validation",
      message: "Project Profile is not valid.",
      details: validation.errors.map(
        (error) => (error.instancePath || "/") + ": " + error.message
      )
    };
  }

  const result = resolveFoundationBlueprintPreview(profile);
  if (result.status === "conflict") {
    return {
      ok: false,
      kind: "conflict",
      message: "Blueprint resolution produced a structural conflict.",
      details: result.conflicts.map(
        (conflict) =>
          conflict.targetId + " · " + conflict.kind + " · " + conflict.field
      )
    };
  }

  return {
    ok: true,
    profile,
    blueprint: result.blueprint,
    templateVersions: foundationBlueprintTemplatesV1
      .filter((template) => {
        if (!template.activation) return true;
        return template.activation.all.every((condition) => {
          const actual = profile[condition.field];
          return condition.operator === "equals"
            ? actual === condition.value
            : Array.isArray(actual) && actual.includes(condition.value);
        });
      })
      .map((template) => ({ id: template.id, version: template.version }))
      .sort(
        (a, b) =>
          a.id.localeCompare(b.id) || a.version.localeCompare(b.version)
      )
  };
}


export type ProjectBootstrapPreviewResult =
  | { readonly ok: true; readonly plan: ProjectBootstrapPlan }
  | {
      readonly ok: false;
      readonly kind: "validation" | "conflict";
      readonly message: string;
    };

export async function createProjectBootstrapPreviewAction(
  input: ProjectBootstrapIntent
): Promise<ProjectBootstrapPreviewResult> {
  try {
    return {
      ok: true,
      plan: createProjectBootstrapPlan(input)
    };
  } catch (error) {
    return {
      ok: false,
      kind: error instanceof TypeError ? "validation" : "conflict",
      message:
        error instanceof Error
          ? error.message
          : "The bootstrap factory could not resolve this project intent."
    };
  }
}

export interface PromptPreviewInput {
  readonly profile: ProjectProfile;
  readonly blueprint: ResolvedBlueprint;
  readonly templateVersions: readonly {
    readonly id: string;
    readonly version: string;
  }[];
  readonly workTitle: string;
  readonly gateReady: boolean;
}

export type PromptPreviewResult =
  | { readonly ok: true; readonly projection: PromptProjection }
  | {
      readonly ok: false;
      readonly message: string;
      readonly details: readonly string[];
    };

function assertServerConstructedContract(
  name: "WorkPackage" | "QualityGate" | "GateEvidence",
  value: unknown
): readonly string[] {
  const result = validateContract(name, value);
  return result.valid
    ? []
    : result.errors.map(
        (error) => (error.instancePath || "/") + ": " + error.message
      );
}

export async function generatePromptPreviewAction(
  input: PromptPreviewInput
): Promise<PromptPreviewResult> {
  const work: WorkPackage = {
    id: "work-package:preview",
    projectId: input.profile.projectId,
    title: input.workTitle.trim() || "Untitled work package",
    purpose:
      "Deliver one verified vertical slice before broader feature expansion.",
    dependencies: [],
    acceptanceCriteria: [
      "Critical journey is understandable.",
      "Exact revision passes automated evidence."
    ],
    qualityGateIds: ["gate:preview:human-ux"],
    status: "ready",
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: PREVIEW_TIME,
      updatedAt: PREVIEW_TIME
    }
  };

  const gate: QualityGate = {
    id: "gate:preview:human-ux",
    projectId: input.profile.projectId,
    name: "Human UX acceptance",
    requirements: ["Critical journey is understandable and recoverable."],
    status: input.gateReady ? "candidate" : "not-ready",
    evidenceIds: input.gateReady ? ["evidence:preview:ux-review"] : [],
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: PREVIEW_TIME,
      updatedAt: PREVIEW_TIME
    }
  };

  const evidence: GateEvidence[] = input.gateReady
    ? [
        {
          id: "evidence:preview:ux-review",
          gateId: gate.id,
          kind: "review",
          source: "App Shell preview",
          revision: "preview",
          createdAt: PREVIEW_TIME
        }
      ]
    : [];

  const errors = [
    ...assertServerConstructedContract("WorkPackage", work),
    ...assertServerConstructedContract("QualityGate", gate),
    ...evidence.flatMap((item) =>
      assertServerConstructedContract("GateEvidence", item)
    )
  ];

  if (errors.length) {
    return {
      ok: false,
      message: "Server preview could not construct valid canonical shapes.",
      details: errors
    };
  }

  const projection = createPromptProjection(
    {
      profile: input.profile,
      blueprint: input.blueprint,
      templateVersions: input.templateVersions,
      workPackages: [work],
      qualityGates: [gate],
      evidence
    },
    PREVIEW_TIME
  );

  return { ok: true, projection };
}


import { randomUUID } from "node:crypto";
import { BlueprintResolutionConflictError } from "@blueprint-os/application";
import { getBlueprintServerRuntime } from "../src/server/runtime";
import { resolveWebActor, resolveWebIdentity } from "../src/auth/server-actor";
import {
  createCanonicalProject,
  createCanonicalWorkAndGate,
  generateCanonicalPrompt,
  type CanonicalWorkspaceIds
} from "../src/workspace/canonical";

export type CanonicalActionFailureKind =
  | "authentication"
  | "permission"
  | "conflict"
  | "validation"
  | "runtime";

export type CanonicalActionResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly kind: CanonicalActionFailureKind;
      readonly message: string;
    };

function errorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }
  return null;
}

function canonicalFailure(error: unknown): CanonicalActionResult<never> {
  const code = errorCode(error);
  if (code === "AUTHORIZATION_DENIED") {
    return {
      ok: false,
      kind: "permission",
      message: "Your account does not have authority for this project action."
    };
  }
  if (code === "RECORD_VERSION_CONFLICT") {
    return {
      ok: false,
      kind: "conflict",
      message: "Canonical state changed. Reload the project before trying again."
    };
  }
  if (error instanceof BlueprintResolutionConflictError) {
    return {
      ok: false,
      kind: "conflict",
      message: "Blueprint resolution has a structural conflict that must be resolved."
    };
  }
  if (error instanceof TypeError) {
    return { ok: false, kind: "validation", message: error.message };
  }
  return {
    ok: false,
    kind: "runtime",
    message: "The trusted server could not complete the canonical operation."
  };
}

function newCanonicalIds(): CanonicalWorkspaceIds {
  const token = randomUUID();
  return {
    projectId: `project:${token}`,
    profileId: `profile:${token}`,
    workPackageId: `work-package:${token}`,
    qualityGateId: `gate:${token}:human-ux`
  };
}

export async function bootstrapOwnerAction(): Promise<CanonicalActionResult<{ principalId: string }>> {
  try {
    const identity = await resolveWebIdentity();
    if (!identity) {
      return {
        ok: false,
        kind: "authentication",
        message: "Sign in before initializing Blueprint OS ownership."
      };
    }
    const runtime = getBlueprintServerRuntime();
    const principal = await runtime.authority.bootstrapOwner(identity);
    return { ok: true, value: { principalId: principal.id } };
  } catch (error) {
    return canonicalFailure(error);
  }
}

export async function createCanonicalProjectAction(
  input: BlueprintPreviewInput
): Promise<CanonicalActionResult<{
  profile: ProjectProfile;
  blueprint: ResolvedBlueprint;
  templateVersions: readonly { readonly id: string; readonly version: string }[];
  ids: CanonicalWorkspaceIds;
}>> {
  const actor = await resolveWebActor();
  if (!actor) {
    return {
      ok: false,
      kind: "authentication",
      message: "Sign in to create canonical Blueprint project state."
    };
  }

  try {
    const runtime = getBlueprintServerRuntime();
    const ids = newCanonicalIds();
    const state = await createCanonicalProject(
      runtime,
      actor,
      input,
      ids,
      new Date().toISOString()
    );
    return {
      ok: true,
      value: {
        profile: state.profile,
        blueprint: state.blueprint,
        templateVersions: state.templateVersions,
        ids
      }
    };
  } catch (error) {
    return canonicalFailure(error);
  }
}


export async function createCanonicalProjectFromBootstrapAction(
  input: ProjectBootstrapIntent
): Promise<CanonicalActionResult<{
  profile: ProjectProfile;
  blueprint: ResolvedBlueprint;
  templateVersions: readonly { readonly id: string; readonly version: string }[];
  bootstrapPlan: ProjectBootstrapPlan;
}>> {
  const actor = await resolveWebActor();
  if (!actor) {
    return {
      ok: false,
      kind: "authentication",
      message:
        "Sign in before confirming a Bootstrap Plan into canonical project state."
    };
  }

  try {
    const bootstrapPlan = createProjectBootstrapPlan(input);
    const ids = newCanonicalIds();
    const now = new Date().toISOString();
    const canonicalProfile: ProjectProfile = {
      ...structuredClone(bootstrapPlan.profile),
      id: ids.profileId,
      projectId: ids.projectId,
      meta: {
        schemaVersion: "1.0.0",
        recordVersion: 1,
        createdAt: now,
        updatedAt: now
      },
      extensions: {
        ...(bootstrapPlan.profile.extensions ?? {}),
        bootstrapPreviewFingerprint: bootstrapPlan.intentFingerprint,
        bootstrapConfirmedAt: now
      }
    };

    const runtime = getBlueprintServerRuntime();
    const resolution = await runtime.profiles.create(
      actor,
      canonicalProfile
    );

    return {
      ok: true,
      value: {
        profile: resolution.profile,
        blueprint: resolution.blueprint,
        templateVersions: resolution.templateVersions,
        bootstrapPlan
      }
    };
  } catch (error) {
    return canonicalFailure(error);
  }
}

export async function createCanonicalWorkAction(input: {
  readonly profile: ProjectProfile;
  readonly ids: CanonicalWorkspaceIds;
  readonly workTitle: string;
}): Promise<CanonicalActionResult<{
  workPackage: WorkPackage;
  qualityGate: QualityGate;
}>> {
  const actor = await resolveWebActor();
  if (!actor) {
    return { ok: false, kind: "authentication", message: "Sign in to persist project work." };
  }
  try {
    const value = await createCanonicalWorkAndGate(
      getBlueprintServerRuntime(),
      actor,
      { profile: input.profile },
      input.ids,
      input.workTitle,
      new Date().toISOString()
    );
    return {
      ok: true,
      value: {
        workPackage: value.workPackage!,
        qualityGate: value.qualityGate!
      }
    };
  } catch (error) {
    return canonicalFailure(error);
  }
}

export async function generateCanonicalPromptAction(
  projectId: string
): Promise<CanonicalActionResult<PromptProjection>> {
  const actor = await resolveWebActor();
  if (!actor) {
    return { ok: false, kind: "authentication", message: "Sign in to generate from canonical state." };
  }
  try {
    const projection = await generateCanonicalPrompt(
      getBlueprintServerRuntime(),
      actor,
      projectId
    );
    return { ok: true, value: projection };
  } catch (error) {
    return canonicalFailure(error);
  }
}
