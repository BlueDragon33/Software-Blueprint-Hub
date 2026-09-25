"use server";

import {
  createPromptProjection,
  foundationBlueprintTemplatesV1,
  resolveFoundationBlueprintPreview
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
