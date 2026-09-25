import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { AuthorityService, OwnerBootstrapConflictError } from "../../packages/core/src/authority";
import {
  createPrismaClient,
  PostgresAuthorityRepository
} from "../../packages/persistence/src";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;

describePostgres("PostgreSQL authority foundation", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const repository = new PostgresAuthorityRepository(prisma);
  const service = new AuthorityService(repository);

  beforeEach(async () => {
    await prisma.authorityAuditEvent.deleteMany({
      where: {
        OR: [
          { projectId: { startsWith: "project:authority-" } },
          {
            actor: {
              providerSubject: {
                in: ["owner-1", "editor-1", "attacker"]
              }
            }
          }
        ]
      }
    });
    await prisma.projectAuthority.deleteMany({
      where: {
        OR: [
          { projectId: { startsWith: "project:authority-" } },
          {
            principal: {
              providerSubject: {
                in: ["owner-1", "editor-1", "attacker"]
              }
            }
          }
        ]
      }
    });
    // SystemBootstrap is intentionally global. Integration files therefore run
    // serially; all other fixture cleanup remains namespace-scoped.
    await prisma.systemBootstrap.deleteMany();
    await prisma.principal.deleteMany({
      where: {
        providerSubject: {
          in: ["owner-1", "editor-1", "attacker"]
        }
      }
    });
    await prisma.project.deleteMany({
      where: { id: { startsWith: "project:authority-" } }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("bootstraps exactly one system Owner and persists an audit event", async () => {
    const owner = await service.bootstrapOwner({
      provider: "github",
      providerSubject: "owner-1",
      email: "owner@example.test"
    });

    expect(await repository.isSystemOwner(owner.id)).toBe(true);

    const audit = await prisma.authorityAuditEvent.findMany();
    expect(audit).toHaveLength(1);
    expect(audit[0]?.action).toBe("SYSTEM_OWNER_BOOTSTRAPPED");

    await expect(
      service.bootstrapOwner({
        provider: "github",
        providerSubject: "attacker"
      })
    ).rejects.toBeInstanceOf(OwnerBootstrapConflictError);

    expect(await prisma.systemBootstrap.count()).toBe(1);
  });

  it("persists project-scoped role without provider secrets", async () => {
    const owner = await service.bootstrapOwner({
      provider: "github",
      providerSubject: "owner-1"
    });
    const editor = await service.resolveIdentity({
      provider: "github",
      providerSubject: "editor-1",
      email: "editor@example.test"
    });

    await prisma.project.create({ data: { id: "project:authority-test" } });

    await service.grantProjectRole(
      { principalId: owner.id },
      {
        projectId: "project:authority-test",
        principalId: editor.id,
        role: "EDITOR"
      }
    );

    expect(
      await repository.findProjectRole("project:authority-test", editor.id)
    ).toBe("EDITOR");

    const persisted = await prisma.principal.findUniqueOrThrow({
      where: { id: editor.id }
    });

    expect(Object.keys(persisted)).not.toContain("accessToken");
    expect(Object.keys(persisted)).not.toContain("refreshToken");
    expect(Object.keys(persisted)).not.toContain("clientSecret");

    const audit = await prisma.authorityAuditEvent.findMany({
      where: { action: "PROJECT_ROLE_SET" }
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.actorPrincipalId).toBe(owner.id);
    expect(audit[0]?.targetPrincipalId).toBe(editor.id);
  });
});
