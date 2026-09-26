import { createHash } from "node:crypto";

import type {
  ProjectProfile,
  ResolvedBlueprint
} from "@blueprint-os/contracts";
import { validateProjectProfile } from "@blueprint-os/contracts";

import {
  foundationBlueprintTemplatesV1,
  resolveFoundationBlueprintPreview
} from "./foundation-templates";

export type BootstrapCriticality =
  | "low"
  | "standard"
  | "high"
  | "critical";

export interface ProjectBootstrapIntent {
  readonly name: string;
  readonly projectType: string;
  readonly primaryUsers: readonly string[];
  readonly jobsToBeDone: readonly string[];
  readonly dataSensitivity: ProjectProfile["dataSensitivity"];
  readonly persistence: ProjectProfile["persistence"];
  readonly authentication: ProjectProfile["authentication"];
  readonly authorization: ProjectProfile["authorization"];
  readonly offlineRequirement: NonNullable<ProjectProfile["offlineRequirement"]>;
  readonly externalIntegrations: readonly string[];
  readonly aiUse: NonNullable<ProjectProfile["aiUse"]>;
  readonly extensibilityRequirement: NonNullable<
    ProjectProfile["extensibilityRequirement"]
  >;
  readonly expectedLifetime: ProjectProfile["expectedLifetime"];
  readonly deploymentTarget: string;
  readonly criticality: BootstrapCriticality;
  readonly minimumBlueprintLevel?: ProjectProfile["blueprintLevel"];
  readonly expectedScale?: string;
  readonly availabilityRequirement?: string;
  readonly complianceSecuritySensitivity?: string;
  readonly maintenanceModel?: string;
}

export interface BlueprintLevelRecommendation {
  readonly level: ProjectProfile["blueprintLevel"];
  readonly reasons: readonly string[];
}

export interface BootstrapRoadmapItem {
  readonly id: string;
  readonly kind: "module" | "gate";
  readonly sourceRequirementId: string;
  readonly title: string;
  readonly purpose: string;
  readonly dependsOn: readonly string[];
  readonly qualityGateIds: readonly string[];
  readonly status: "ready" | "planned";
}

export interface ProjectBootstrapPlan {
  readonly kind: "project-bootstrap-preview";
  readonly canonicalMutationAllowed: false;
  readonly requiresExplicitCreateConfirmation: true;
  readonly intentFingerprint: string;
  readonly recommendation: BlueprintLevelRecommendation;
  readonly profile: ProjectProfile;
  readonly blueprint: ResolvedBlueprint;
  readonly activatedTemplates: readonly {
    readonly id: string;
    readonly version: string;
    readonly authorityLayer: string;
  }[];
  readonly roadmap: readonly BootstrapRoadmapItem[];
  readonly summary: {
    readonly modules: number;
    readonly gates: number;
    readonly roadmapItems: number;
    readonly readyItems: number;
  };
}

const PREVIEW_TIME = "2026-01-01T00:00:00.000Z";
const levels: readonly ProjectProfile["blueprintLevel"][] = [
  "B0",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5"
];

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

function fingerprint(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function normalizedList(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function normalizeIntent(intent: ProjectBootstrapIntent): ProjectBootstrapIntent {
  const primaryUsers = normalizedList(intent.primaryUsers);
  const jobsToBeDone = normalizedList(intent.jobsToBeDone);

  if (!intent.name.trim()) {
    throw new TypeError("Project name is required");
  }
  if (!intent.projectType.trim()) {
    throw new TypeError("Project type is required");
  }
  if (!primaryUsers.length) {
    throw new TypeError("At least one primary user is required");
  }
  if (!jobsToBeDone.length) {
    throw new TypeError("At least one job-to-be-done is required");
  }
  if (!intent.deploymentTarget.trim()) {
    throw new TypeError("Deployment target is required");
  }

  const expectedScale = intent.expectedScale?.trim();
  const availabilityRequirement = intent.availabilityRequirement?.trim();
  const complianceSecuritySensitivity =
    intent.complianceSecuritySensitivity?.trim();
  const maintenanceModel = intent.maintenanceModel?.trim();

  return {
    ...intent,
    name: intent.name.trim(),
    projectType: intent.projectType.trim(),
    primaryUsers,
    jobsToBeDone,
    externalIntegrations: normalizedList(intent.externalIntegrations),
    deploymentTarget: intent.deploymentTarget.trim(),
    ...(expectedScale ? { expectedScale } : {}),
    ...(availabilityRequirement ? { availabilityRequirement } : {}),
    ...(complianceSecuritySensitivity
      ? { complianceSecuritySensitivity }
      : {}),
    ...(maintenanceModel ? { maintenanceModel } : {})
  };
}

function maxLevel(
  a: ProjectProfile["blueprintLevel"],
  b: ProjectProfile["blueprintLevel"]
): ProjectProfile["blueprintLevel"] {
  const selected = levels[Math.max(levels.indexOf(a), levels.indexOf(b))];
  if (!selected) {
    throw new TypeError("Unsupported Blueprint Level comparison");
  }
  return selected;
}

export function recommendBlueprintLevel(
  rawIntent: ProjectBootstrapIntent
): BlueprintLevelRecommendation {
  const intent = normalizeIntent(rawIntent);
  let level: ProjectProfile["blueprintLevel"] = "B0";
  const reasons: string[] = [
    "Start from the smallest engineering depth and escalate only from explicit project signals."
  ];

  function raise(
    target: ProjectProfile["blueprintLevel"],
    reason: string
  ): void {
    if (levels.indexOf(target) > levels.indexOf(level)) {
      level = target;
    }
    reasons.push(reason);
  }

  if (
    intent.persistence !== "none" ||
    intent.authentication !== "none" ||
    intent.expectedLifetime === "years" ||
    intent.expectedLifetime === "long-lived"
  ) {
    raise(
      "B1",
      "Persistent/authenticated or multi-year software requires at least small-application engineering depth."
    );
  }

  if (
    intent.persistence === "server" ||
    intent.persistence === "hybrid" ||
    intent.authentication === "required" ||
    intent.authorization === "role-based" ||
    intent.authorization === "policy-based" ||
    intent.dataSensitivity === "confidential"
  ) {
    raise(
      "B2",
      "Server state, required identity, structured authorization or confidential data requires product-level domain and data design."
    );
  }

  if (
    intent.externalIntegrations.length > 0 ||
    intent.offlineRequirement === "read-write" ||
    intent.aiUse === "core-feature" ||
    intent.aiUse === "agentic" ||
    intent.criticality === "high"
  ) {
    raise(
      "B3",
      "Integration, write-capable offline behavior, core AI or high criticality requires integrated-system architecture and observability."
    );
  }

  if (
    intent.extensibilityRequirement === "templates" ||
    intent.extensibilityRequirement === "plugins" ||
    intent.externalIntegrations.length >= 3
  ) {
    raise(
      "B4",
      "Template/plugin extensibility or a broad integration surface requires platform compatibility contracts."
    );
  }

  if (
    intent.criticality === "critical" ||
    (intent.dataSensitivity === "restricted" &&
      intent.authorization === "policy-based")
  ) {
    raise(
      "B5",
      "Critical operation or restricted data with policy-based authority requires critical-system threat modelling and recovery verification."
    );
  }

  if (intent.minimumBlueprintLevel) {
    const before = level;
    level = maxLevel(level, intent.minimumBlueprintLevel);
    if (level !== before) {
      reasons.push(
        `Requested minimum ${intent.minimumBlueprintLevel} raises the recommendation; a minimum may increase but never weaken derived engineering depth.`
      );
    }
  }

  return Object.freeze({
    level,
    reasons: Object.freeze([...new Set(reasons)])
  });
}

function profileFromIntent(
  intent: ProjectBootstrapIntent,
  recommendation: BlueprintLevelRecommendation
): ProjectProfile {
  const normalized = normalizeIntent(intent);
  const idHash = fingerprint(normalized).slice(0, 24);

  return {
    id: `profile:bootstrap-${idHash}`,
    projectId: `project:bootstrap-${idHash}`,
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: PREVIEW_TIME,
      updatedAt: PREVIEW_TIME
    },
    name: normalized.name,
    projectType: normalized.projectType,
    blueprintLevel: recommendation.level,
    primaryUsers: normalized.primaryUsers as [string, ...string[]],
    jobsToBeDone: normalized.jobsToBeDone as [string, ...string[]],
    dataSensitivity: normalized.dataSensitivity,
    persistence: normalized.persistence,
    authentication: normalized.authentication,
    authorization: normalized.authorization,
    offlineRequirement: normalized.offlineRequirement,
    externalIntegrations: [...normalized.externalIntegrations],
    aiUse: normalized.aiUse,
    extensibilityRequirement: normalized.extensibilityRequirement,
    expectedLifetime: normalized.expectedLifetime,
    ...(normalized.expectedScale
      ? { expectedScale: normalized.expectedScale }
      : {}),
    ...(normalized.availabilityRequirement
      ? { availabilityRequirement: normalized.availabilityRequirement }
      : {}),
    ...(normalized.complianceSecuritySensitivity
      ? {
          complianceSecuritySensitivity:
            normalized.complianceSecuritySensitivity
        }
      : {}),
    deploymentTarget: normalized.deploymentTarget,
    maintenanceModel:
      normalized.maintenanceModel ?? "versioned continuous maintenance",
    extensions: {
      bootstrapCriticality: normalized.criticality,
      bootstrapIntentFingerprint: fingerprint(normalized)
    }
  };
}

function titleFromRequirement(id: string): string {
  return id
    .split(":")
    .slice(1)
    .join(" · ")
    .replaceAll("-", " ");
}

function workId(requirementId: string): string {
  return `bootstrap-work:${requirementId.replace(/[^A-Za-z0-9._:-]/g, "-")}`;
}

export function createProjectBootstrapPlan(
  rawIntent: ProjectBootstrapIntent
): ProjectBootstrapPlan {
  const intent = normalizeIntent(rawIntent);
  const recommendation = recommendBlueprintLevel(intent);
  const profile = profileFromIntent(intent, recommendation);
  const validation = validateProjectProfile(profile);

  if (!validation.valid) {
    throw new TypeError(
      "Generated Project Profile is invalid: " +
        validation.errors
          .map((error) => `${error.instancePath || "/"}: ${error.message}`)
          .join("; ")
    );
  }

  const resolution = resolveFoundationBlueprintPreview(profile);
  if (resolution.status === "conflict") {
    throw new TypeError(
      "Bootstrap Blueprint resolution conflict: " +
        resolution.conflicts
          .map((conflict) => `${conflict.targetId} · ${conflict.kind}`)
          .join("; ")
    );
  }

  const requirementById = new Map(
    resolution.requirements.map((item) => [item.id, item] as const)
  );

  const moduleItems: BootstrapRoadmapItem[] =
    resolution.blueprint.requiredModules.map((moduleId) => {
      const requirement = requirementById.get(moduleId);
      const dependencies = (requirement?.dependsOn ?? [])
        .filter((dependency) =>
          resolution.blueprint.requiredModules.includes(dependency)
        )
        .map(workId)
        .sort();

      return Object.freeze({
        id: workId(moduleId),
        kind: "module" as const,
        sourceRequirementId: moduleId,
        title: titleFromRequirement(moduleId),
        purpose:
          requirement?.sources[0]?.reason ??
          `Implement required Blueprint module ${moduleId}.`,
        dependsOn: Object.freeze(dependencies),
        qualityGateIds: Object.freeze([]),
        status: dependencies.length ? ("planned" as const) : ("ready" as const)
      });
    });

  const gateItems: BootstrapRoadmapItem[] =
    resolution.blueprint.requiredGates.map((gateId) => {
      const requirement = requirementById.get(gateId);
      const moduleDependencies = (requirement?.dependsOn ?? [])
        .filter((dependency) =>
          resolution.blueprint.requiredModules.includes(dependency)
        )
        .map(workId)
        .sort();

      return Object.freeze({
        id: workId(gateId),
        kind: "gate" as const,
        sourceRequirementId: gateId,
        title: titleFromRequirement(gateId),
        purpose:
          requirement?.sources[0]?.reason ??
          `Collect exact evidence for required Quality Gate ${gateId}.`,
        dependsOn: Object.freeze(moduleDependencies),
        qualityGateIds: Object.freeze([gateId]),
        status: moduleDependencies.length
          ? ("planned" as const)
          : ("ready" as const)
      });
    });

  const roadmap = Object.freeze([...moduleItems, ...gateItems]);
  const intentFingerprint = fingerprint(intent);

  return Object.freeze({
    kind: "project-bootstrap-preview",
    canonicalMutationAllowed: false,
    requiresExplicitCreateConfirmation: true,
    intentFingerprint,
    recommendation,
    profile: Object.freeze(profile),
    blueprint: resolution.blueprint,
    activatedTemplates: Object.freeze(
      resolution.blueprint.activatedTemplates.map((item) =>
        Object.freeze({ ...item })
      )
    ),
    roadmap,
    summary: Object.freeze({
      modules: resolution.blueprint.requiredModules.length,
      gates: resolution.blueprint.requiredGates.length,
      roadmapItems: roadmap.length,
      readyItems: roadmap.filter((item) => item.status === "ready").length
    })
  });
}

export function bootstrapTemplateVersions(
  plan: Pick<ProjectBootstrapPlan, "profile">
): readonly { readonly id: string; readonly version: string }[] {
  return Object.freeze(
    foundationBlueprintTemplatesV1
      .filter((template) => {
        if (!template.activation) return true;
        return template.activation.all.every((condition) => {
          const actual = plan.profile[condition.field];
          return condition.operator === "equals"
            ? actual === condition.value
            : Array.isArray(actual) && actual.includes(condition.value);
        });
      })
      .map((template) =>
        Object.freeze({ id: template.id, version: template.version })
      )
      .sort(
        (a, b) =>
          a.id.localeCompare(b.id) || a.version.localeCompare(b.version)
      )
  );
}
