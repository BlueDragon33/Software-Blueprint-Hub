import { createHash } from "node:crypto";

import type {
  GateEvidence,
  ProjectProfile,
  PromptProjection,
  QualityGate,
  ResolvedBlueprint,
  WorkPackage
} from "@blueprint-os/contracts";
import { validateContract } from "@blueprint-os/contracts";
import {
  AuthorityService,
  type AuthenticatedActor,
  type PromptProjectionHistoryRepository,
  type WorkQualityRepository
} from "@blueprint-os/core";

export const EXECUTION_PROMPT_TEMPLATE_VERSION = "execution-prompt:v1";

export interface PromptTemplateVersionReference {
  readonly id: string;
  readonly version: string;
}

export interface PromptProfileResolution {
  readonly profile: ProjectProfile;
  readonly blueprint: ResolvedBlueprint;
  readonly templateVersions: readonly PromptTemplateVersionReference[];
}

export interface ProjectProfileReader {
  read(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<PromptProfileResolution | null>;
}

export interface PromptProjectionSource {
  readonly profile: ProjectProfile;
  readonly blueprint: ResolvedBlueprint;
  readonly templateVersions: readonly PromptTemplateVersionReference[];
  readonly workPackages: readonly WorkPackage[];
  readonly qualityGates: readonly QualityGate[];
  readonly evidence: readonly GateEvidence[];
}

export interface ProjectionClock {
  now(): string;
}

const systemClock: ProjectionClock = {
  now: () => new Date().toISOString()
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)])
    );
  }

  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function normalizeSource(
  source: PromptProjectionSource
): PromptProjectionSource {
  return {
    profile: structuredClone(source.profile),
    blueprint: structuredClone(source.blueprint),
    templateVersions: [...source.templateVersions]
      .map((item) => ({ ...item }))
      .sort(
        (a, b) =>
          a.id.localeCompare(b.id) || a.version.localeCompare(b.version)
      ),
    workPackages: [...source.workPackages]
      .map((item) => ({
        ...structuredClone(item),
        dependencies: [...item.dependencies].sort(),
        qualityGateIds: [...item.qualityGateIds].sort()
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    qualityGates: [...source.qualityGates]
      .map((item) => ({
        ...structuredClone(item),
        evidenceIds: [...item.evidenceIds].sort()
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    evidence: [...source.evidence]
      .map((item) => ({ ...structuredClone(item) }))
      .sort((a, b) => a.id.localeCompare(b.id))
  };
}

function renderPrompt(
  source: PromptProjectionSource,
  sourceRevision: string
): string {
  const evidenceById = new Map(
    source.evidence.map((item) => [item.id, item])
  );
  const lines: string[] = [
    "# Blueprint OS Execution Prompt",
    "",
    `Source revision: ${sourceRevision}`,
    `Project: ${source.profile.name} (${source.profile.projectId})`,
    `Blueprint level: ${source.profile.blueprintLevel}`,
    `Profile record version: ${source.profile.meta.recordVersion}`,
    "",
    "## Template versions"
  ];

  for (const item of source.templateVersions) {
    lines.push(`- ${item.id}@${item.version}`);
  }

  lines.push("", "## Required Blueprint");
  for (const moduleId of source.blueprint.requiredModules) {
    lines.push(`- module: ${moduleId}`);
  }
  for (const gateId of source.blueprint.requiredGates) {
    lines.push(`- gate: ${gateId}`);
  }

  lines.push("", "## Work Packages");
  if (!source.workPackages.length) {
    lines.push("- none");
  }
  for (const workPackage of source.workPackages) {
    lines.push(
      `- [${workPackage.status}] ${workPackage.id}: ${workPackage.title}`,
      `  purpose: ${workPackage.purpose}`,
      `  recordVersion: ${workPackage.meta.recordVersion}`,
      `  dependencies: ${workPackage.dependencies.join(", ") || "none"}`,
      `  gates: ${workPackage.qualityGateIds.join(", ") || "none"}`
    );
    for (const criterion of workPackage.acceptanceCriteria) {
      lines.push(`  acceptance: ${criterion}`);
    }
  }

  lines.push("", "## Quality Gates");
  if (!source.qualityGates.length) {
    lines.push("- none");
  }
  for (const gate of source.qualityGates) {
    lines.push(
      `- [${gate.status}] ${gate.id}: ${gate.name}`,
      `  recordVersion: ${gate.meta.recordVersion}`
    );
    for (const requirement of gate.requirements) {
      lines.push(`  requirement: ${requirement}`);
    }
    for (const evidenceId of gate.evidenceIds) {
      const evidence = evidenceById.get(evidenceId);
      lines.push(
        evidence
          ? `  evidence: ${evidence.id} | ${evidence.source} | ${evidence.revision}`
          : `  evidence: ${evidenceId} | MISSING`
      );
    }
  }

  lines.push(
    "",
    "## Execution constraints",
    "- Execute only against the canonical state represented by this source revision.",
    "- Do not infer PASS from Work Package completion.",
    "- Do not mutate canonical state from this generated prompt.",
    "- If the source revision is stale, regenerate before execution."
  );

  return `${lines.join("\n")}\n`;
}

export function promptSourceRevision(
  source: PromptProjectionSource
): string {
  const normalized = normalizeSource(source);
  return `sha256:${sha256(canonicalJson(normalized))}`;
}

export function createPromptProjection(
  source: PromptProjectionSource,
  generatedAt: string,
  templateVersion = EXECUTION_PROMPT_TEMPLATE_VERSION
): PromptProjection {
  const normalized = normalizeSource(source);
  const sourceRevision = `sha256:${sha256(canonicalJson(normalized))}`;
  const content = renderPrompt(normalized, sourceRevision);
  const contentHash = `sha256:${sha256(content)}`;

  const projection: PromptProjection = {
    id: `prompt-projection:${contentHash.slice("sha256:".length, 39)}`,
    projectId: normalized.profile.projectId,
    sourceRevision,
    templateVersion,
    generatedAt,
    contentHash,
    content
  };

  const validation = validateContract("PromptProjection", projection);
  if (!validation.valid) {
    const details = validation.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid PromptProjection: ${details}`);
  }

  return Object.freeze(projection);
}

export function isPromptProjectionStale(
  projection: Pick<PromptProjection, "sourceRevision">,
  currentSourceRevision: string
): boolean {
  return projection.sourceRevision !== currentSourceRevision;
}

export class PromptProjectionApplicationService {
  constructor(
    private readonly authority: AuthorityService,
    private readonly profiles: ProjectProfileReader,
    private readonly workQuality: WorkQualityRepository,
    private readonly clock: ProjectionClock = systemClock,
    private readonly historyRepository?: PromptProjectionHistoryRepository
  ) {}

  async generate(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<PromptProjection> {
    const source = await this.collectSource(actor, projectId);
    return createPromptProjection(source, this.clock.now());
  }

  async generateAndRecord(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<PromptProjection> {
    if (!this.historyRepository) {
      throw new Error("Prompt Projection history repository is not configured");
    }

    const projection = await this.generate(actor, projectId);
    return this.historyRepository.record(projection);
  }

  async history(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<readonly PromptProjection[]> {
    await this.authority.require(actor, projectId, "PROJECT_READ");
    if (!this.historyRepository) {
      return Object.freeze([]);
    }

    return Object.freeze([
      ...(await this.historyRepository.listByProject(projectId))
    ]);
  }

  async currentSourceRevision(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<string> {
    return promptSourceRevision(
      await this.collectSource(actor, projectId)
    );
  }

  private async collectSource(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<PromptProjectionSource> {
    await this.authority.require(actor, projectId, "PROJECT_READ");
    const profileResolution = await this.profiles.read(actor, projectId);
    if (!profileResolution) {
      throw new TypeError(`Unknown project ${projectId}`);
    }

    const [workPackages, qualityGates] = await Promise.all([
      this.workQuality.listWorkPackagesByProject(projectId),
      this.workQuality.listQualityGatesByProject(projectId)
    ]);

    const evidenceNested = await Promise.all(
      qualityGates.map((gate) =>
        this.workQuality.listGateEvidenceByGate(gate.id)
      )
    );

    return {
      profile: profileResolution.profile,
      blueprint: profileResolution.blueprint,
      templateVersions: profileResolution.templateVersions,
      workPackages,
      qualityGates,
      evidence: evidenceNested.flat()
    };
  }
}
