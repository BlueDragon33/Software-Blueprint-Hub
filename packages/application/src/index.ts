import type {
  ProjectProfile,
  ResolvedBlueprint
} from "@blueprint-os/contracts";
import { validateProjectProfile } from "@blueprint-os/contracts";
import {
  AuthorityService,
  type AuthenticatedActor,
  type ProjectProfileRepository
} from "@blueprint-os/core";
import {
  resolveBlueprint,
  type BlueprintTemplate,
  type ResolutionConflict,
  type SuccessfulResolution
} from "@blueprint-os/blueprint-engine";

export interface TemplateCatalog {
  snapshotFor(
    profile: Readonly<ProjectProfile>
  ): Promise<readonly BlueprintTemplate[]>;
}

export interface TemplateVersionReference {
  readonly id: string;
  readonly version: string;
}

export interface ProjectProfileResolution {
  readonly profile: ProjectProfile;
  readonly blueprint: ResolvedBlueprint;
  readonly templateVersions: readonly TemplateVersionReference[];
}

export class BlueprintResolutionConflictError extends Error {
  readonly code = "BLUEPRINT_RESOLUTION_CONFLICT";

  constructor(readonly conflicts: readonly ResolutionConflict[]) {
    super("Project Profile produces a conflicting Blueprint resolution");
    this.name = "BlueprintResolutionConflictError";
  }
}

export class StaticTemplateCatalog implements TemplateCatalog {
  private readonly templates: readonly BlueprintTemplate[];

  constructor(templates: readonly BlueprintTemplate[]) {
    this.templates = Object.freeze(
      [...templates].map((template) =>
        Object.freeze({
          ...template,
          requirements: Object.freeze(
            template.requirements.map((requirement) =>
              Object.freeze({
                ...requirement,
                ...(requirement.tags
                  ? { tags: Object.freeze([...requirement.tags]) }
                  : {}),
                ...(requirement.dependsOn
                  ? { dependsOn: Object.freeze([...requirement.dependsOn]) }
                  : {})
              })
            )
          ),
          ...(template.activation
            ? {
                activation: Object.freeze({
                  explanation: template.activation.explanation,
                  all: Object.freeze(
                    template.activation.all.map((condition) =>
                      Object.freeze({ ...condition })
                    )
                  )
                })
              }
            : {})
        })
      )
    );
  }

  async snapshotFor(
    _profile: Readonly<ProjectProfile>
  ): Promise<readonly BlueprintTemplate[]> {
    return this.templates;
  }
}

export class ConstitutionLockedTemplateCatalog implements TemplateCatalog {
  constructor(
    private readonly delegate: TemplateCatalog,
    private readonly constitution: BlueprintTemplate
  ) {
    if (constitution.authorityLayer !== "constitution") {
      throw new TypeError(
        "Constitution lock requires a constitution-authority template"
      );
    }
    if (constitution.activation) {
      throw new TypeError(
        "Universal Constitution template must be unconditional"
      );
    }
  }

  async snapshotFor(
    profile: Readonly<ProjectProfile>
  ): Promise<readonly BlueprintTemplate[]> {
    const delegated = await this.delegate.snapshotFor(profile);
    const suppliedConstitution = delegated.find(
      (template) => template.id === this.constitution.id
    );

    if (
      suppliedConstitution &&
      JSON.stringify(suppliedConstitution) !== JSON.stringify(this.constitution)
    ) {
      throw new TypeError(
        `Universal Constitution template ${this.constitution.id}@${this.constitution.version} is runtime-controlled and cannot be replaced or weakened`
      );
    }

    return Object.freeze([
      this.constitution,
      ...delegated.filter((template) => template.id !== this.constitution.id)
    ]);
  }
}

function assertValidProfile(profile: unknown): asserts profile is ProjectProfile {
  const validation = validateProjectProfile(profile);

  if (!validation.valid) {
    const detail = validation.errors
      .map((error) => `${error.instancePath || "/"}: ${error.message}`)
      .join("; ");
    throw new TypeError(`Invalid ProjectProfile: ${detail}`);
  }
}

function exactTemplateVersions(
  templates: readonly BlueprintTemplate[]
): readonly TemplateVersionReference[] {
  return Object.freeze(
    templates
      .map((template) =>
        Object.freeze({
          id: template.id,
          version: template.version
        })
      )
      .sort(
        (a, b) =>
          a.id.localeCompare(b.id) || a.version.localeCompare(b.version)
      )
  );
}

export class ProjectProfileApplicationService {
  constructor(
    private readonly profiles: ProjectProfileRepository,
    private readonly authority: AuthorityService,
    private readonly templates: TemplateCatalog
  ) {}

  async create(
    actor: AuthenticatedActor | null,
    profile: ProjectProfile
  ): Promise<ProjectProfileResolution> {
    await this.authority.require(actor, profile.projectId, "PROJECT_MUTATE");
    assertValidProfile(profile);

    if (profile.meta.recordVersion !== 1) {
      throw new TypeError("A new ProjectProfile must start at recordVersion 1");
    }

    const resolved = await this.resolve(profile);
    const stored = await this.profiles.createProjectWithProfile(profile);

    return Object.freeze({
      profile: stored,
      blueprint: resolved.resolution.blueprint,
      templateVersions: resolved.templateVersions
    });
  }

  async update(
    actor: AuthenticatedActor | null,
    profile: ProjectProfile,
    expectedRecordVersion: number
  ): Promise<ProjectProfileResolution> {
    await this.authority.require(actor, profile.projectId, "PROJECT_MUTATE");
    assertValidProfile(profile);

    const current = await this.profiles.findProfileByProjectId(profile.projectId);
    if (!current) {
      throw new TypeError(`Unknown ProjectProfile for ${profile.projectId}`);
    }
    if (current.id !== profile.id) {
      throw new TypeError(
        `ProjectProfile identity is immutable; expected ${current.id}, received ${profile.id}`
      );
    }

    const resolved = await this.resolve(profile);
    const stored = await this.profiles.updateProfile(
      profile,
      expectedRecordVersion
    );

    return Object.freeze({
      profile: stored,
      blueprint: resolved.resolution.blueprint,
      templateVersions: resolved.templateVersions
    });
  }

  async read(
    actor: AuthenticatedActor | null,
    projectId: string
  ): Promise<ProjectProfileResolution | null> {
    await this.authority.require(actor, projectId, "PROJECT_READ");
    const profile = await this.profiles.findProfileByProjectId(projectId);
    if (!profile) return null;

    const resolved = await this.resolve(profile);
    return Object.freeze({
      profile,
      blueprint: resolved.resolution.blueprint,
      templateVersions: resolved.templateVersions
    });
  }

  private async resolve(profile: ProjectProfile): Promise<{
    readonly resolution: SuccessfulResolution;
    readonly templateVersions: readonly TemplateVersionReference[];
  }> {
    const templates = await this.templates.snapshotFor(
      Object.freeze({ ...profile })
    );
    const result = resolveBlueprint({ profile, templates });

    if (result.status === "conflict") {
      throw new BlueprintResolutionConflictError(result.conflicts);
    }

    return Object.freeze({
      resolution: result,
      templateVersions: exactTemplateVersions(templates)
    });
  }
}

export * from "./work-quality-service";

export * from "./prompt-projection";

export * from "./foundation-templates";

export * from "./project-registry";

export * from "./project-readiness";

export * from "./governance-service";

export * from "./knowledge-library";

export * from "./release-service";

export * from "./reference-imports";

export * from "./compass-dashboard";

export * from "./compass-architecture";

export * from "./project-bootstrap";

export * from "./pattern-governance";

export * from "./canonical-portability";

export * from "./operational-diagnostics";

export * from "./provider-boundary";

export * from "./ai-copilot";

export * from "./project-portfolio";

export * from "./quality-evidence-graph";

export * from "./release-orchestration";

export * from "./security-threat-model";

export * from "./data-lifecycle";

export * from "./adaptive-ux-audit";

export * from "./performance-capacity";

export * from "./ecosystem-dogfood";

export * from "./professional-review";

export * from "./compass-acceptance";

export * from "./constitutional-compliance";

export * from "./constitution-authority";

export * from "./constitution-propagation";

export * from "./constitution-compliance-matrix";
