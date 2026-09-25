import { describe, expect, it } from "vitest";

import {
  AuthorityService,
  AuthorizationDeniedError,
  OwnerBootstrapConflictError,
  type AuthenticatedIdentity,
  type AuthorityAuditInput,
  type AuthorityRepository,
  type PrincipalRecord,
  type ProjectRole,
  type ProjectRoleAssignment
} from "../../packages/core/src/authority";

class MemoryAuthorityRepository implements AuthorityRepository {
  private ownerId: string | null = null;
  private nextPrincipal = 1;
  private readonly principals = new Map<string, PrincipalRecord>();
  private readonly roles = new Map<string, ProjectRole>();

  async resolvePrincipal(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    const key = `${identity.provider}:${identity.providerSubject}`;
    const existing = this.principals.get(key);
    if (existing) return existing;

    const principal = Object.freeze({
      id: `principal:${this.nextPrincipal++}`,
      provider: identity.provider,
      providerSubject: identity.providerSubject,
      email: identity.email ?? null
    });
    this.principals.set(key, principal);
    return principal;
  }

  async bootstrapOwner(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    if (this.ownerId) throw new OwnerBootstrapConflictError();
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
      }))
      .sort((a, b) => a.projectId.localeCompare(b.projectId));
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

describe("Blueprint-owned authority matrix", () => {
  it("denies unauthenticated persistent mutation", async () => {
    const service = new AuthorityService(new MemoryAuthorityRepository());

    await expect(
      service.require(null, "project:a", "PROJECT_MUTATE")
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it("allows Editor only inside the granted project scope", async () => {
    const repository = new MemoryAuthorityRepository();
    const service = new AuthorityService(repository);
    const owner = await service.bootstrapOwner({
      provider: "github",
      providerSubject: "owner"
    });
    const editor = await service.resolveIdentity({
      provider: "github",
      providerSubject: "editor"
    });

    await service.grantProjectRole(
      { principalId: owner.id },
      {
        projectId: "project:a",
        principalId: editor.id,
        role: "EDITOR"
      }
    );

    await expect(
      service.require(
        { principalId: editor.id },
        "project:a",
        "PROJECT_MUTATE"
      )
    ).resolves.toBeUndefined();

    await expect(
      service.require(
        { principalId: editor.id },
        "project:b",
        "PROJECT_MUTATE"
      )
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it("keeps Reviewer separate from Owner administration", async () => {
    const repository = new MemoryAuthorityRepository();
    const service = new AuthorityService(repository);
    const owner = await service.bootstrapOwner({
      provider: "github",
      providerSubject: "owner"
    });
    const reviewer = await service.resolveIdentity({
      provider: "github",
      providerSubject: "reviewer"
    });

    await service.grantProjectRole(
      { principalId: owner.id },
      {
        projectId: "project:a",
        principalId: reviewer.id,
        role: "REVIEWER"
      }
    );

    await expect(
      service.require(
        { principalId: reviewer.id },
        "project:a",
        "PROJECT_REVIEW"
      )
    ).resolves.toBeUndefined();

    await expect(
      service.require(
        { principalId: reviewer.id },
        "project:a",
        "ROLE_MANAGE"
      )
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it("allows Viewer to read but not mutate", async () => {
    const repository = new MemoryAuthorityRepository();
    const service = new AuthorityService(repository);
    const owner = await service.bootstrapOwner({
      provider: "github",
      providerSubject: "owner"
    });
    const viewer = await service.resolveIdentity({
      provider: "github",
      providerSubject: "viewer"
    });

    await service.grantProjectRole(
      { principalId: owner.id },
      {
        projectId: "project:a",
        principalId: viewer.id,
        role: "VIEWER"
      }
    );

    await expect(
      service.require({ principalId: viewer.id }, "project:a", "PROJECT_READ")
    ).resolves.toBeUndefined();

    await expect(
      service.require({ principalId: viewer.id }, "project:a", "PROJECT_MUTATE")
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it("returns an all-project read scope for the System Owner", async () => {
    const repository = new MemoryAuthorityRepository();
    const service = new AuthorityService(repository);
    const owner = await service.bootstrapOwner({
      provider: "github",
      providerSubject: "owner-scope"
    });

    await expect(
      service.readableProjectScope({ principalId: owner.id })
    ).resolves.toEqual({ kind: "all" });
  });

  it("returns only explicitly assigned readable projects for a normal actor", async () => {
    const repository = new MemoryAuthorityRepository();
    const service = new AuthorityService(repository);
    const owner = await service.bootstrapOwner({
      provider: "github",
      providerSubject: "owner-reader"
    });
    const viewer = await service.resolveIdentity({
      provider: "github",
      providerSubject: "scoped-viewer"
    });

    await service.grantProjectRole(
      { principalId: owner.id },
      {
        projectId: "project:allowed",
        principalId: viewer.id,
        role: "VIEWER"
      }
    );

    await expect(
      service.readableProjectScope({ principalId: viewer.id })
    ).resolves.toEqual({
      kind: "projects",
      assignments: [
        {
          projectId: "project:allowed",
          principalId: viewer.id,
          role: "VIEWER"
        }
      ]
    });
  });

  it("prevents owner bootstrap replay", async () => {
    const service = new AuthorityService(new MemoryAuthorityRepository());

    await service.bootstrapOwner({
      provider: "github",
      providerSubject: "first"
    });

    await expect(
      service.bootstrapOwner({
        provider: "github",
        providerSubject: "second"
      })
    ).rejects.toBeInstanceOf(OwnerBootstrapConflictError);
  });
});
