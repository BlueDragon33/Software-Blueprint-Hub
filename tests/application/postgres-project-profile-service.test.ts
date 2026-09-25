import type { ProjectProfile } from "../../packages/contracts/src";
import {
  AuthorityService,
  RecordVersionConflictError
} from "../../packages/core/src";
import {
  ProjectProfileApplicationService,
  StaticTemplateCatalog
} from "../../packages/application/src";
import type { BlueprintTemplate } from "../../packages/blueprint-engine/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresProjectProfileRepository
} from "../../packages/persistence/src";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;

const baseProfile: ProjectProfile = {
  id: "profile:fnd006-integration",
  projectId: "project:fnd006-integration",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T10:30:00Z",
    updatedAt: "2026-09-25T10:30:00Z"
  },
  name: "FND-006 Integration",
  projectType: "web-application",
  blueprintLevel: "B4",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Persist and resolve the project profile."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "long-lived"
};

const templates: readonly BlueprintTemplate[] = [
  {
    schemaVersion: "1.0.0",
    id: "template:constitution:base",
    version: "1.0.0",
    authorityLayer: "constitution",
    requirements: [{ id: "module:product:purpose", kind: "module" }]
  },
  {
    schemaVersion: "1.0.0",
    id: "template:level:b4",
    version: "4.0.0",
    authorityLayer: "blueprint-level",
    activation: {
      all: [
        { field: "blueprintLevel", operator: "equals", value: "B4" }
      ],
      explanation: "B4 platform baseline"
    },
    requirements: [
      {
        id: "module:platform:registry",
        kind: "module",
        dependsOn: ["module:product:purpose"]
      }
    ]
  },
  {
    schemaVersion: "1.0.0",
    id: "template:level:b0",
    version: "1.0.0",
    authorityLayer: "blueprint-level",
    activation: {
      all: [
        { field: "blueprintLevel", operator: "equals", value: "B0" }
      ],
      explanation: "B0 micro baseline"
    },
    requirements: [
      {
        id: "module:micro:purpose",
        kind: "module"
      }
    ]
  }
];

describePostgres("FND-006 PostgreSQL application flow", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const profileRepository = new PostgresProjectProfileRepository(prisma);
  const service = new ProjectProfileApplicationService(
    profileRepository,
    authority,
    new StaticTemplateCatalog(templates)
  );

  beforeEach(async () => {
    await prisma.authorityAuditEvent.deleteMany({
      where: {
        OR: [
          { projectId: "project:fnd006-integration" },
          { actor: { providerSubject: { startsWith: "fnd006-" } } }
        ]
      }
    });
    await prisma.projectAuthority.deleteMany({
      where: { projectId: "project:fnd006-integration" }
    });
    await prisma.systemBootstrap.deleteMany();
    await prisma.principal.deleteMany({
      where: { providerSubject: { startsWith: "fnd006-" } }
    });
    await prisma.projectProfile.deleteMany({
      where: { projectId: "project:fnd006-integration" }
    });
    await prisma.project.deleteMany({
      where: { id: "project:fnd006-integration" }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function ownerActor(): Promise<{ principalId: string }> {
    const owner = await authority.bootstrapOwner({
      provider: "github",
      providerSubject: "fnd006-owner"
    });
    return { principalId: owner.id };
  }

  it("creates a validated profile and resolves exact versions", async () => {
    const result = await service.create(await ownerActor(), baseProfile);

    expect(result.profile).toEqual(baseProfile);
    expect(result.blueprint.profileRecordVersion).toBe(1);
    expect(result.blueprint.requiredModules).toContain(
      "module:platform:registry"
    );
    expect(result.templateVersions).toContainEqual({
      id: "template:level:b4",
      version: "4.0.0"
    });
  });

  it("re-resolves when a relevant profile dimension changes", async () => {
    const actor = await ownerActor();
    const created = await service.create(actor, baseProfile);

    const updated: ProjectProfile = {
      ...created.profile,
      blueprintLevel: "B0",
      meta: {
        ...created.profile.meta,
        recordVersion: 2,
        updatedAt: "2026-09-25T10:31:00Z"
      }
    };

    const result = await service.update(actor, updated, 1);

    expect(result.blueprint.profileRecordVersion).toBe(2);
    expect(result.blueprint.requiredModules).toContain(
      "module:micro:purpose"
    );
    expect(result.blueprint.requiredModules).not.toContain(
      "module:platform:registry"
    );
    expect(result.blueprint.inputFingerprint).not.toBe(
      created.blueprint.inputFingerprint
    );
  });

  it("rejects a concurrent stale update without returning a false resolution", async () => {
    const actor = await ownerActor();
    await service.create(actor, baseProfile);

    const version2: ProjectProfile = {
      ...baseProfile,
      name: "Current version",
      meta: {
        ...baseProfile.meta,
        recordVersion: 2,
        updatedAt: "2026-09-25T10:31:00Z"
      }
    };
    await service.update(actor, version2, 1);

    const staleVersion2: ProjectProfile = {
      ...version2,
      name: "Stale overwrite"
    };

    await expect(
      service.update(actor, staleVersion2, 1)
    ).rejects.toBeInstanceOf(RecordVersionConflictError);

    const stored = await profileRepository.findProfileByProjectId(
      baseProfile.projectId
    );
    expect(stored?.name).toBe("Current version");
  });
});
