import type { ProjectProfile } from "../../packages/contracts/src";
import {
  AuthenticationRequiredError,
  AuthorityService,
  type AuthenticatedIdentity,
  type AuthorityAuditInput,
  type AuthorityRepository,
  type PrincipalRecord,
  type ProjectProfileRepository,
  type ProjectRole,
  type ProjectRoleAssignment
} from "../../packages/core/src";
import { ProjectRegistryApplicationService } from "../../packages/application/src";
import { describe, expect, it } from "vitest";

function profile(
  projectId: string,
  name: string,
  updatedAt: string
): ProjectProfile {
  return {
    id: `profile:${projectId.split(":").at(-1)}`,
    projectId,
    meta: {
      schemaVersion: "1.0.0",
      recordVersion: 1,
      createdAt: updatedAt,
      updatedAt
    },
    name,
    projectType: "web-application",
    blueprintLevel: "B2",
    primaryUsers: ["builder"],
    jobsToBeDone: ["Build safely."],
    dataSensitivity: "internal",
    persistence: "server",
    authentication: "required",
    authorization: "role-based",
    deploymentTarget: "managed-web",
    expectedLifetime: "years"
  };
}

class MemoryProfiles implements ProjectProfileRepository {
  constructor(private readonly values: readonly ProjectProfile[]) {}

  async createProjectWithProfile(value: ProjectProfile): Promise<ProjectProfile> {
    return value;
  }

  async findProfileByProjectId(projectId: string): Promise<ProjectProfile | null> {
    return this.values.find((item) => item.projectId === projectId) ?? null;
  }

  async listProfiles(): Promise<readonly ProjectProfile[]> {
    return this.values;
  }

  async listProfilesByProjectIds(
    projectIds: readonly string[]
  ): Promise<readonly ProjectProfile[]> {
    return this.values.filter((item) => projectIds.includes(item.projectId));
  }

  async updateProfile(value: ProjectProfile): Promise<ProjectProfile> {
    return value;
  }
}

class MemoryAuthority implements AuthorityRepository {
  ownerId: string | null = null;
  readonly roles: ProjectRoleAssignment[] = [];

  async resolvePrincipal(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return {
      id: `principal:${identity.providerSubject}`,
      provider: identity.provider,
      providerSubject: identity.providerSubject,
      email: identity.email ?? null
    };
  }

  async bootstrapOwner(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    const principal = await this.resolvePrincipal(identity);
    this.ownerId = principal.id;
    return principal;
  }

  async isSystemOwner(principalId: string): Promise<boolean> {
    return principalId === this.ownerId;
  }

  async findProjectRole(
    projectId: string,
    principalId: string
  ): Promise<ProjectRole | null> {
    return (
      this.roles.find(
        (item) =>
          item.projectId === projectId && item.principalId === principalId
      )?.role ?? null
    );
  }

  async listProjectRolesForPrincipal(
    principalId: string
  ): Promise<readonly ProjectRoleAssignment[]> {
    return this.roles.filter((item) => item.principalId === principalId);
  }

  async setProjectRole(
    assignment: ProjectRoleAssignment,
    _audit: AuthorityAuditInput
  ): Promise<ProjectRoleAssignment> {
    this.roles.push(assignment);
    return assignment;
  }
}

describe("ProjectRegistryApplicationService", () => {
  const a = profile("project:registry-app-a", "Alpha", "2026-09-25T10:00:00Z");
  const b = profile("project:registry-app-b", "Beta", "2026-09-25T11:00:00Z");

  it("rejects unauthenticated registry reads", async () => {
    const service = new ProjectRegistryApplicationService(
      new MemoryProfiles([a, b]),
      new AuthorityService(new MemoryAuthority())
    );

    await expect(service.list(null)).rejects.toBeInstanceOf(
      AuthenticationRequiredError
    );
  });

  it("lets the System Owner enumerate all projects", async () => {
    const repository = new MemoryAuthority();
    const authority = new AuthorityService(repository);
    const owner = await authority.bootstrapOwner({
      provider: "github",
      providerSubject: "owner"
    });
    const service = new ProjectRegistryApplicationService(
      new MemoryProfiles([a, b]),
      authority
    );

    const items = await service.list({ principalId: owner.id });

    expect(items.map((item) => item.projectId)).toEqual([
      b.projectId,
      a.projectId
    ]);
    expect(items.every((item) => item.access === "SYSTEM_OWNER")).toBe(true);
  });

  it("does not expose projects outside the actor role scope", async () => {
    const repository = new MemoryAuthority();
    const authority = new AuthorityService(repository);
    repository.roles.push({
      projectId: a.projectId,
      principalId: "principal:viewer",
      role: "VIEWER"
    });
    const service = new ProjectRegistryApplicationService(
      new MemoryProfiles([a, b]),
      authority
    );

    const items = await service.list({ principalId: "principal:viewer" });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      projectId: a.projectId,
      access: "VIEWER"
    });
  });
});
