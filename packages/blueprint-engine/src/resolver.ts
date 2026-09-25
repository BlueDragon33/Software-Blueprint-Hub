import { createHash } from "node:crypto";

import type { ProjectProfile, ResolvedBlueprint } from "@blueprint-os/contracts";

export const resolverVersion = "1.0.0";

export type AuthorityLayer =
  | "constitution"
  | "blueprint-level"
  | "project-type"
  | "domain-capability"
  | "project-addition";

export type RequirementKind = "module" | "gate";
export type RequirementDepth = "basic" | "standard" | "advanced" | "critical";

export interface TemplateRequirement {
  readonly id: string;
  readonly kind: RequirementKind;
  readonly required?: boolean;
  readonly depth?: RequirementDepth;
  readonly tags?: readonly string[];
  readonly dependsOn?: readonly string[];
  readonly constraint?: string;
  readonly description?: string;
}

export type ActivationField =
  | "blueprintLevel"
  | "projectType"
  | "dataSensitivity"
  | "persistence"
  | "authentication"
  | "authorization"
  | "offlineRequirement"
  | "aiUse"
  | "extensibilityRequirement"
  | "expectedLifetime"
  | "externalIntegrations";

export interface ActivationCondition {
  readonly field: ActivationField;
  readonly operator: "equals" | "includes";
  readonly value: string;
}

export interface TemplateActivation {
  readonly all: readonly ActivationCondition[];
  readonly explanation: string;
}

export interface BlueprintTemplate {
  readonly schemaVersion: "1.0.0";
  readonly id: string;
  readonly version: string;
  readonly authorityLayer: AuthorityLayer;
  readonly activation?: TemplateActivation;
  readonly requirements: readonly TemplateRequirement[];
}

export interface ResolutionInput {
  readonly profile: ProjectProfile;
  readonly templates: readonly BlueprintTemplate[];
  readonly projectAdditions?: readonly TemplateRequirement[];
}

export interface RequirementSource {
  readonly sourceId: string;
  readonly authorityLayer: AuthorityLayer;
  readonly version: string;
  readonly reason: string;
}

export interface ResolvedRequirement {
  readonly id: string;
  readonly kind: RequirementKind;
  readonly required: boolean;
  readonly depth: RequirementDepth;
  readonly tags: readonly string[];
  readonly dependsOn: readonly string[];
  readonly constraint: string | null;
  readonly sources: readonly RequirementSource[];
}

export type ResolutionConflictKind =
  | "INCOMPATIBLE_VALUE"
  | "MISSING_DEPENDENCY"
  | "DEPENDENCY_CYCLE";

export interface ResolutionConflict {
  readonly conflictId: string;
  readonly kind: ResolutionConflictKind;
  readonly targetId: string;
  readonly field: string;
  readonly sources: readonly string[];
  readonly values: readonly string[];
  readonly suggestedResolutionKinds: readonly string[];
}

export interface SuccessfulResolution {
  readonly status: "success";
  readonly blueprint: ResolvedBlueprint;
  readonly requirements: readonly ResolvedRequirement[];
}

export interface ConflictedResolution {
  readonly status: "conflict";
  readonly resolverVersion: string;
  readonly inputFingerprint: string;
  readonly projectId: string;
  readonly conflicts: readonly ResolutionConflict[];
}

export type ResolutionResult = SuccessfulResolution | ConflictedResolution;

interface MutableRequirement {
  id: string;
  kind: RequirementKind;
  required: boolean;
  depth: RequirementDepth;
  tags: Set<string>;
  dependsOn: Set<string>;
  constraint: string | null;
  sources: RequirementSource[];
}

const authorityRank: Readonly<Record<AuthorityLayer, number>> = {
  constitution: 0,
  "blueprint-level": 1,
  "project-type": 2,
  "domain-capability": 3,
  "project-addition": 4
};

const depthRank: Readonly<Record<RequirementDepth, number>> = {
  basic: 0,
  standard: 1,
  advanced: 2,
  critical: 3
};

const idPattern = /^[a-z][a-z0-9-]*:[A-Za-z0-9._:-]+$/;
const semverPattern =
  /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

function assertCanonicalId(id: string, label: string): void {
  if (!idPattern.test(id)) {
    throw new TypeError(`${label} must be a canonical ID: ${id}`);
  }
}

function parseSemver(version: string): readonly [number, number, number, string] {
  const match = semverPattern.exec(version);
  if (!match) {
    throw new TypeError(`Template version must be semantic: ${version}`);
  }
  return [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
    match[4] ?? ""
  ] as const;
}

function compareSemver(a: string, b: string): number {
  const av = parseSemver(a);
  const bv = parseSemver(b);
  for (let index = 0; index < 3; index += 1) {
    const diff = av[index] - bv[index];
    if (diff !== 0) return diff;
  }
  if (av[3] === bv[3]) return 0;
  if (!av[3]) return 1;
  if (!bv[3]) return -1;
  return av[3].localeCompare(bv[3]);
}

function compareTemplates(a: BlueprintTemplate, b: BlueprintTemplate): number {
  return (
    authorityRank[a.authorityLayer] - authorityRank[b.authorityLayer] ||
    a.id.localeCompare(b.id) ||
    compareSemver(a.version, b.version)
  );
}

function readActivationField(
  profile: ProjectProfile,
  field: ActivationField
): string | readonly string[] | undefined {
  switch (field) {
    case "blueprintLevel":
      return profile.blueprintLevel;
    case "projectType":
      return profile.projectType;
    case "dataSensitivity":
      return profile.dataSensitivity;
    case "persistence":
      return profile.persistence;
    case "authentication":
      return profile.authentication;
    case "authorization":
      return profile.authorization;
    case "offlineRequirement":
      return profile.offlineRequirement;
    case "aiUse":
      return profile.aiUse;
    case "extensibilityRequirement":
      return profile.extensibilityRequirement;
    case "expectedLifetime":
      return profile.expectedLifetime;
    case "externalIntegrations":
      return profile.externalIntegrations;
  }
}

function conditionMatches(
  profile: ProjectProfile,
  condition: ActivationCondition
): boolean {
  const actual = readActivationField(profile, condition.field);
  if (condition.operator === "equals") {
    return actual === condition.value;
  }
  return Array.isArray(actual) && actual.includes(condition.value);
}

function isActive(profile: ProjectProfile, template: BlueprintTemplate): boolean {
  if (!template.activation) return true;
  if (!template.activation.explanation.trim()) {
    throw new TypeError(
      `Activated template ${template.id} must define an explanation`
    );
  }
  return template.activation.all.every((condition) =>
    conditionMatches(profile, condition)
  );
}

function maxDepth(
  current: RequirementDepth,
  incoming: RequirementDepth
): RequirementDepth {
  return depthRank[incoming] > depthRank[current] ? incoming : current;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableValue(child)])
    );
  }
  return value;
}

function stableJson(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function sha256(value: unknown): string {
  return createHash("sha256").update(stableJson(value)).digest("hex");
}

function normalizeRequirementForFingerprint(
  requirement: TemplateRequirement
): Record<string, unknown> {
  return {
    id: requirement.id,
    kind: requirement.kind,
    required: requirement.required ?? true,
    depth: requirement.depth ?? "basic",
    tags: [...(requirement.tags ?? [])].sort(),
    dependsOn: [...(requirement.dependsOn ?? [])].sort(),
    constraint: requirement.constraint ?? null,
    description: requirement.description ?? ""
  };
}

function normalizeTemplateForFingerprint(
  template: BlueprintTemplate
): Record<string, unknown> {
  const activation = template.activation
    ? {
        explanation: template.activation.explanation,
        all: [...template.activation.all]
          .map((condition) => ({ ...condition }))
          .sort((a, b) =>
            stableJson(a).localeCompare(stableJson(b))
          )
      }
    : null;

  return {
    schemaVersion: template.schemaVersion,
    id: template.id,
    version: template.version,
    authorityLayer: template.authorityLayer,
    activation,
    requirements: [...template.requirements]
      .map(normalizeRequirementForFingerprint)
      .sort((a, b) =>
        String(a.id).localeCompare(String(b.id)) ||
        String(a.kind).localeCompare(String(b.kind))
      )
  };
}

function makeConflict(
  kind: ResolutionConflictKind,
  targetId: string,
  field: string,
  sources: readonly string[],
  values: readonly string[]
): ResolutionConflict {
  const core = {
    kind,
    targetId,
    field,
    sources: [...sources].sort(),
    values: [...values].sort()
  };
  return Object.freeze({
    conflictId: `conflict:${sha256(core).slice(0, 32)}`,
    ...core,
    suggestedResolutionKinds: Object.freeze([
      "correct-project-profile",
      "select-compatible-template",
      "publish-compatible-template-version",
      "record-adr-for-higher-contract-change"
    ])
  });
}

function validateTemplate(template: BlueprintTemplate): void {
  if (template.schemaVersion !== "1.0.0") {
    throw new TypeError(
      `Unsupported template schema version ${template.schemaVersion}`
    );
  }
  assertCanonicalId(template.id, "Template ID");
  parseSemver(template.version);
  for (const requirement of template.requirements) {
    assertCanonicalId(requirement.id, "Requirement ID");
    for (const dependency of requirement.dependsOn ?? []) {
      assertCanonicalId(dependency, "Dependency ID");
    }
  }
}

function mergeRequirement(
  target: Map<string, MutableRequirement>,
  conflicts: ResolutionConflict[],
  template: BlueprintTemplate,
  requirement: TemplateRequirement
): void {
  const incomingDepth = requirement.depth ?? "basic";
  const reason =
    requirement.description?.trim() ||
    `${template.authorityLayer} requirement from ${template.id}@${template.version}`;
  const source: RequirementSource = Object.freeze({
    sourceId: template.id,
    authorityLayer: template.authorityLayer,
    version: template.version,
    reason
  });
  const existing = target.get(requirement.id);

  if (!existing) {
    target.set(requirement.id, {
      id: requirement.id,
      kind: requirement.kind,
      required: requirement.required ?? true,
      depth: incomingDepth,
      tags: new Set(requirement.tags ?? []),
      dependsOn: new Set(requirement.dependsOn ?? []),
      constraint: requirement.constraint ?? null,
      sources: [source]
    });
    return;
  }

  if (existing.kind !== requirement.kind) {
    conflicts.push(
      makeConflict(
        "INCOMPATIBLE_VALUE",
        requirement.id,
        "kind",
        [...existing.sources.map((item) => item.sourceId), template.id],
        [existing.kind, requirement.kind]
      )
    );
    return;
  }

  const incomingConstraint = requirement.constraint ?? null;
  if (
    existing.constraint !== null &&
    incomingConstraint !== null &&
    existing.constraint !== incomingConstraint
  ) {
    conflicts.push(
      makeConflict(
        "INCOMPATIBLE_VALUE",
        requirement.id,
        "constraint",
        [...existing.sources.map((item) => item.sourceId), template.id],
        [existing.constraint, incomingConstraint]
      )
    );
  } else if (existing.constraint === null && incomingConstraint !== null) {
    existing.constraint = incomingConstraint;
  }

  existing.required = existing.required || (requirement.required ?? true);
  existing.depth = maxDepth(existing.depth, incomingDepth);
  for (const tag of requirement.tags ?? []) existing.tags.add(tag);
  for (const dependency of requirement.dependsOn ?? []) {
    existing.dependsOn.add(dependency);
  }
  existing.sources.push(source);
}

function dependencyClosure(
  requirements: Map<string, MutableRequirement>,
  conflicts: ResolutionConflict[]
): void {
  const queue = [...requirements.values()]
    .filter((requirement) => requirement.kind === "module" && requirement.required)
    .map((requirement) => requirement.id);
  const visited = new Set<string>();

  while (queue.length) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const requirement = requirements.get(id);
    if (!requirement || requirement.kind !== "module") continue;

    for (const dependencyId of [...requirement.dependsOn].sort()) {
      const dependency = requirements.get(dependencyId);
      if (!dependency || dependency.kind !== "module") {
        conflicts.push(
          makeConflict(
            "MISSING_DEPENDENCY",
            id,
            "dependsOn",
            requirement.sources.map((source) => source.sourceId),
            [dependencyId]
          )
        );
        continue;
      }

      if (!dependency.required) {
        dependency.required = true;
        dependency.sources.push(
          Object.freeze({
            sourceId: id,
            authorityLayer: "constitution",
            version: resolverVersion,
            reason: `Required transitively by ${id}`
          })
        );
      }
      queue.push(dependencyId);
    }
  }
}

function cycleConflicts(
  requirements: Map<string, MutableRequirement>
): ResolutionConflict[] {
  const requiredModules = new Set(
    [...requirements.values()]
      .filter((item) => item.kind === "module" && item.required)
      .map((item) => item.id)
  );
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const conflicts: ResolutionConflict[] = [];
  const seenCycles = new Set<string>();

  function visit(id: string): void {
    const current = state.get(id);
    if (current === "done") return;
    if (current === "visiting") {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      const normalized = [...new Set(cycle)].sort();
      const key = normalized.join("|");
      if (!seenCycles.has(key)) {
        seenCycles.add(key);
        conflicts.push(
          makeConflict(
            "DEPENDENCY_CYCLE",
            id,
            "dependsOn",
            normalized,
            cycle
          )
        );
      }
      return;
    }

    state.set(id, "visiting");
    stack.push(id);

    const requirement = requirements.get(id);
    for (const dependency of [...(requirement?.dependsOn ?? [])].sort()) {
      if (requiredModules.has(dependency)) visit(dependency);
    }

    stack.pop();
    state.set(id, "done");
  }

  for (const id of [...requiredModules].sort()) visit(id);
  return conflicts;
}

function freezeRequirement(
  item: MutableRequirement
): ResolvedRequirement {
  return Object.freeze({
    id: item.id,
    kind: item.kind,
    required: item.required,
    depth: item.depth,
    tags: Object.freeze([...item.tags].sort()),
    dependsOn: Object.freeze([...item.dependsOn].sort()),
    constraint: item.constraint,
    sources: Object.freeze(
      [...item.sources].sort(
        (a, b) =>
          authorityRank[a.authorityLayer] - authorityRank[b.authorityLayer] ||
          a.sourceId.localeCompare(b.sourceId) ||
          compareSemver(a.version, b.version)
      )
    )
  });
}

export function resolveBlueprint(input: ResolutionInput): ResolutionResult {
  if (input.profile.meta.schemaVersion !== "1.0.0") {
    throw new TypeError(
      `Unsupported ProjectProfile schema version ${input.profile.meta.schemaVersion}`
    );
  }

  const templateIds = new Set<string>();
  const suppliedTemplates = [...input.templates];
  for (const template of suppliedTemplates) {
    validateTemplate(template);
    if (templateIds.has(template.id)) {
      throw new TypeError(
        `Resolution input must contain one exact version per template ID: ${template.id}`
      );
    }
    templateIds.add(template.id);
  }

  if (input.projectAdditions?.length) {
    suppliedTemplates.push({
      schemaVersion: "1.0.0",
      id: `template:project-addition:${input.profile.projectId.replace(/[^A-Za-z0-9._:-]/g, "-")}`,
      version: "1.0.0",
      authorityLayer: "project-addition",
      requirements: input.projectAdditions
    });
  }

  const sortedTemplates = suppliedTemplates.sort(compareTemplates);
  const fingerprintInput = {
    resolverVersion,
    profile: input.profile,
    templates: sortedTemplates.map(normalizeTemplateForFingerprint)
  };
  const inputFingerprint = sha256(fingerprintInput);

  const activated = sortedTemplates.filter((template) =>
    isActive(input.profile, template)
  );
  const requirements = new Map<string, MutableRequirement>();
  const conflicts: ResolutionConflict[] = [];

  for (const template of activated) {
    for (const requirement of [...template.requirements].sort(
      (a, b) => a.id.localeCompare(b.id) || a.kind.localeCompare(b.kind)
    )) {
      mergeRequirement(requirements, conflicts, template, requirement);
    }
  }

  dependencyClosure(requirements, conflicts);
  conflicts.push(...cycleConflicts(requirements));

  if (conflicts.length) {
    return Object.freeze({
      status: "conflict",
      resolverVersion,
      inputFingerprint,
      projectId: input.profile.projectId,
      conflicts: Object.freeze(
        [...conflicts].sort(
          (a, b) =>
            a.targetId.localeCompare(b.targetId) ||
            a.field.localeCompare(b.field) ||
            a.conflictId.localeCompare(b.conflictId)
        )
      )
    });
  }

  const frozenRequirements = [...requirements.values()]
    .map(freezeRequirement)
    .sort((a, b) => a.id.localeCompare(b.id));

  const requiredModules = frozenRequirements
    .filter((item) => item.kind === "module" && item.required)
    .map((item) => item.id);
  const requiredGates = frozenRequirements
    .filter((item) => item.kind === "gate" && item.required)
    .map((item) => item.id);

  const dependencyEdges = frozenRequirements
    .filter((item) => item.kind === "module" && item.required)
    .flatMap((item) =>
      item.dependsOn.map((dependency) => ({
        from: item.id,
        to: dependency
      }))
    )
    .sort(
      (a, b) =>
        a.from.localeCompare(b.from) || a.to.localeCompare(b.to)
    );

  const rationale = frozenRequirements
    .filter((item) => item.required)
    .flatMap((item) =>
      item.sources.map((source) => ({
        targetId: item.id,
        sourceId: source.sourceId,
        reason: source.reason
      }))
    )
    .sort(
      (a, b) =>
        a.targetId.localeCompare(b.targetId) ||
        a.sourceId.localeCompare(b.sourceId) ||
        a.reason.localeCompare(b.reason)
    );

  const blueprint: ResolvedBlueprint = Object.freeze({
    resolutionId: `resolution:${inputFingerprint.slice(0, 32)}`,
    resolverVersion,
    inputFingerprint,
    projectId: input.profile.projectId,
    profileRecordVersion: input.profile.meta.recordVersion,
    activatedTemplates: activated.map((template) => ({
      id: template.id,
      version: template.version,
      authorityLayer: template.authorityLayer
    })),
    requiredModules,
    requiredGates,
    dependencyEdges,
    rationale,
    warnings: []
  });

  return Object.freeze({
    status: "success",
    blueprint,
    requirements: Object.freeze(frozenRequirements)
  });
}
