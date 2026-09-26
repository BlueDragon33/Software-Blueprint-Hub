import type { ProjectProfile } from "../../packages/contracts/src";
import {
  AuthorityService,
  AuthorizationDeniedError,
  type AuthenticatedIdentity,
  type AuthorityAuditInput,
  type AuthorityRepository,
  type PrincipalRecord,
  type ProjectProfileRepository,
  type ProjectRole,
  type ProjectRoleAssignment
} from "../../packages/core/src";
import {
  ProjectProfileApplicationService,
  StaticTemplateCatalog
} from "../../packages/application/src";
import type { BlueprintTemplate } from "../../packages/blueprint-engine/src";
import { describe, expect, it } from "vitest";

const profile: ProjectProfile = {
  id: "profile:fnd006-unit",
  projectId: "project:fnd006-unit",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T10:30:00Z",
    updatedAt: "2026-09-25T10:30:00Z"
  },
  name: "FND-006 Unit",
  projectType: "web-application",
  blueprintLevel: "B2",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Resolve a profile through the application service."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "years"
};

class MemoryProfiles implements ProjectProfileRepository {
  value: ProjectProfile | null = null;

  async createProjectWithProfile(value: ProjectProfile): Promise<ProjectProfile> {
    this.value = value;
    return value;
  }

  async findProfileByProjectId(projectId: string): Promise<ProjectProfile | null> {
    return this.value?.projectId === projectId ? this.value : null;
  }

  async listProfiles(): Promise<readonly ProjectProfile[]> {
    return this.value ? [this.value] : [];
  }

  async listProfilesByProjectIds(
    projectIds: readonly string[]
  ): Promise<readonly ProjectProfile[]> {
    return this.value && projectIds.includes(this.value.projectId)
      ? [this.value]
      : [];
  }

  async updateProfile(
    value: ProjectProfile,
    expectedRecordVersion: number
  ): Promise<ProjectProfile> {
    if (this.value?.meta.recordVersion !== expectedRecordVersion) {
      throw new Error("stale");
    }
    this.value = value;
    return value;
  }
}

class MemoryAuthority implements AuthorityRepository {
  ownerId = "principal:owner";
  roles = new Map<string, ProjectRole>();

  async resolvePrincipal(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return {
      id: `principal:${identity.providerSubject}`,
      provider: identity.provider,
      providerSubject: identity.providerSubject,
      email: identity.email ?? null
    };
  }

  async bootstrapOwner(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return this.resolvePrincipal(identity);
  }

  async isSystemOwner(principalId: string): Promise<boolean> {
    return principalId === this.ownerId;
  }

  async findProjectRole(
    projectId: string,
    principalId: string
  ): Promise<ProjectRole | null> {
    return this.roles.get(`${projectId}:${principalId}`) ?? null;
  }

  async listProjectRolesForPrincipal(
    principalId: string
  ): Promise<readonly ProjectRoleAssignment[]> {
    const suffix = `:${principalId}`;
    return [...this.roles.entries()]
      .filter(([key]) => key.endsWith(suffix))
      .map(([key, role]) => ({
        projectId: key.slice(0, -suffix.length),
        principalId,
        role
      }));
  }

  async setProjectRole(
    assignment: ProjectRoleAssignment,
    _audit: AuthorityAuditInput
  ): Promise<ProjectRoleAssignment> {
    this.roles.set(
      `${assignment.projectId}:${assignment.principalId}`,
      assignment.role
    );
    return assignment;
  }
}

const templates: readonly BlueprintTemplate[] = [
  {
    schemaVersion: "1.0.0",
    id: "template:constitution:product",
    version: "1.0.0",
    authorityLayer: "constitution",
    requirements: [
      {
        id: "module:product:purpose",
        kind: "module",
        description: "Define product purpose"
      }
    ]
  },
  {
    schemaVersion: "1.0.0",
    id: "template:level:b2",
    version: "2.1.0",
    authorityLayer: "blueprint-level",
    activation: {
      all: [
        {
          field: "blueprintLevel",
          operator: "equals",
          value: "B2"
        }
      ],
      explanation: "B2 product baseline"
    },
    requirements: [
      {
        id: "module:architecture:context",
        kind: "module",
        dependsOn: ["module:product:purpose"]
      }
    ]
  }
];

describe("ProjectProfileApplicationService", () => {
  it("denies unauthenticated mutation before persistence", async () => {
    const profiles = new MemoryProfiles();
    const service = new ProjectProfileApplicationService(
      profiles,
      new AuthorityService(new MemoryAuthority()),
      new StaticTemplateCatalog(templates)
    );

    await expect(service.create(null, profile)).rejects.toBeInstanceOf(
      AuthorizationDeniedError
    );
    expect(profiles.value).toBeNull();
  });

  it("rejects an invalid profile before persistence", async () => {
    const profiles = new MemoryProfiles();
    const service = new ProjectProfileApplicationService(
      profiles,
      new AuthorityService(new MemoryAuthority()),
      new StaticTemplateCatalog(templates)
    );
    const invalid = {
      ...profile,
      blueprintLevel: "B9"
    } as unknown as ProjectProfile;

    await expect(
      service.create({ principalId: "principal:owner" }, invalid)
    ).rejects.toBeInstanceOf(TypeError);
    expect(profiles.value).toBeNull();
  });

  it("returns the exact profile version and exact template snapshot", async () => {
    const service = new ProjectProfileApplicationService(
      new MemoryProfiles(),
      new AuthorityService(new MemoryAuthority()),
      new StaticTemplateCatalog(templates)
    );

    const result = await service.create(
      { principalId: "principal:owner" },
      profile
    );

    expect(result.blueprint.profileRecordVersion).toBe(1);
    expect(result.templateVersions).toEqual([
      { id: "template:constitution:product", version: "1.0.0" },
      { id: "template:level:b2", version: "2.1.0" }
    ]);
  });

  it("does not accept UI state as resolution input", async () => {
    const profiles = new MemoryProfiles();
    const service = new ProjectProfileApplicationService(
      profiles,
      new AuthorityService(new MemoryAuthority()),
      new StaticTemplateCatalog(templates)
    );
    const uiState = { selectedTab: "settings", expandedCards: ["debug"] };

    const first = await service.create(
      { principalId: "principal:owner" },
      profile
    );
    uiState.selectedTab = "roadmap";

    const second = await service.read(
      { principalId: "principal:owner" },
      profile.projectId
    );

    expect(second?.blueprint.inputFingerprint).toBe(
      first.blueprint.inputFingerprint
    );
  });

  it("rejects ProjectProfile identity mutation before persistence", async () => {
    const profiles = new MemoryProfiles();
    const service = new ProjectProfileApplicationService(
      profiles,
      new AuthorityService(new MemoryAuthority()),
      new StaticTemplateCatalog(templates)
    );
    const actor = { principalId: "principal:owner" };

    await service.create(actor, profile);

    const renamedIdentity: ProjectProfile = {
      ...profile,
      id: "profile:forged-other-project",
      name: "Identity drift attempt",
      meta: {
        ...profile.meta,
        recordVersion: 2,
        updatedAt: "2026-09-26T07:50:00Z"
      }
    };

    await expect(
      service.update(actor, renamedIdentity, 1)
    ).rejects.toThrow(/identity is immutable/);

    expect(profiles.value?.id).toBe(profile.id);
    expect(profiles.value?.name).toBe(profile.name);
  });

});
