import type {
  GateEvidence,
  ProjectProfile,
  QualityGate,
  WorkPackage
} from "../../packages/contracts/src";
import {
  AuthorityService
} from "../../packages/core/src";
import {
  isPromptProjectionStale,
  ProjectProfileApplicationService,
  PromptProjectionApplicationService,
  StaticTemplateCatalog,
  WorkQualityApplicationService
} from "../../packages/application/src";
import type { BlueprintTemplate } from "../../packages/blueprint-engine/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresProjectProfileRepository,
  PostgresWorkQualityRepository
} from "../../packages/persistence/src";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;
const projectId = "project:fnd008-integration";

const profile: ProjectProfile = {
  id: "profile:fnd008-integration",
  projectId,
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T18:40:00+07:00",
    updatedAt: "2026-09-25T18:40:00+07:00"
  },
  name: "FND-008 Integration",
  projectType: "web-application",
  blueprintLevel: "B3",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Generate projection from persisted canonical state."],
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
    requirements: [
      { id: "module:product:purpose", kind: "module" }
    ]
  },
  {
    schemaVersion: "1.0.0",
    id: "template:level:b3",
    version: "3.0.0",
    authorityLayer: "blueprint-level",
    activation: {
      all: [
        {
          field: "blueprintLevel",
          operator: "equals",
          value: "B3"
        }
      ],
      explanation: "B3 system baseline"
    },
    requirements: [
      {
        id: "gate:fnd008-required",
        kind: "gate"
      }
    ]
  }
];

function work(status: WorkPackage["status"], recordVersion = 1): WorkPackage {
  return {
    id: "work-package:fnd008-integration",
    projectId,
    title: "Generate Prompt Projection",
    purpose: "Prove prompt staleness against canonical state.",
    dependencies: [],
    acceptanceCriteria: ["Projection hash changes when work state changes."],
    qualityGateIds: ["gate:fnd008-integration"],
    status,
    meta: {
      schemaVersion: "1.0.0",
      recordVersion,
      createdAt: "2026-09-25T18:41:00+07:00",
      updatedAt:
        recordVersion === 1
          ? "2026-09-25T18:41:00+07:00"
          : "2026-09-25T18:45:00+07:00"
    }
  };
}

const gateV1: QualityGate = {
  id: "gate:fnd008-integration",
  projectId,
  name: "Prompt Projection Gate",
  requirements: ["Evidence includes exact source and revision."],
  status: "not-ready",
  evidenceIds: [],
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T18:42:00+07:00",
    updatedAt: "2026-09-25T18:42:00+07:00"
  }
};

const evidence: GateEvidence = {
  id: "evidence:fnd008-integration",
  gateId: gateV1.id,
  kind: "test",
  source: "github-actions:fnd008",
  revision: "revision-fnd008",
  createdAt: "2026-09-25T18:43:00+07:00"
};

describePostgres("FND-008 persisted Prompt Projection flow", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const profileRepository = new PostgresProjectProfileRepository(prisma);
  const workQualityRepository = new PostgresWorkQualityRepository(prisma);
  const profiles = new ProjectProfileApplicationService(
    profileRepository,
    authority,
    new StaticTemplateCatalog(templates)
  );
  const workQuality = new WorkQualityApplicationService(
    workQualityRepository,
    authority
  );
  const prompts = new PromptProjectionApplicationService(
    authority,
    profiles,
    workQualityRepository,
    { now: () => "2026-09-25T18:46:00+07:00" }
  );

  beforeEach(async () => {
    await prisma.gateEvidence.deleteMany({
      where: { gate: { projectId } }
    });
    await prisma.qualityGate.deleteMany({ where: { projectId } });
    await prisma.workPackage.deleteMany({ where: { projectId } });
    await prisma.authorityAuditEvent.deleteMany({
      where: {
        OR: [
          { projectId },
          { actor: { providerSubject: { startsWith: "fnd008-" } } }
        ]
      }
    });
    await prisma.projectAuthority.deleteMany({ where: { projectId } });
    await prisma.principal.deleteMany({
      where: { providerSubject: { startsWith: "fnd008-" } }
    });
    await prisma.projectProfile.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });

    await profileRepository.createProjectWithProfile(profile);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function ownerActor(): Promise<{ principalId: string }> {
    const owner = await authority.resolveIdentity({
      provider: "github",
      providerSubject: "fnd008-owner"
    });
    await authorityRepository.setProjectRole(
      {
        projectId,
        principalId: owner.id,
        role: "OWNER"
      },
      {
        actorPrincipalId: owner.id,
        targetPrincipalId: owner.id,
        projectId,
        action: "TEST_PROJECT_OWNER_SEEDED",
        detail: { fixture: "fnd008" }
      }
    );
    return { principalId: owner.id };
  }

  it("generates from persisted canonical state and detects stale projection after Work change", async () => {
    const actor = await ownerActor();
    await workQuality.createQualityGate(actor, gateV1);
    await workQuality.createWorkPackage(actor, work("testing"));
    await workQuality.addGateEvidence(actor, evidence);
    await workQuality.updateQualityGate(
      actor,
      {
        ...gateV1,
        status: "pass",
        evidenceIds: [evidence.id],
        meta: {
          ...gateV1.meta,
          recordVersion: 2,
          updatedAt: "2026-09-25T18:44:00+07:00"
        }
      },
      1
    );

    const first = await prompts.generate(actor, projectId);

    expect(first.sourceRevision).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(first.contentHash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(first.content).toContain("github-actions:fnd008");
    expect(first.content).toContain("revision-fnd008");

    await workQuality.updateWorkPackage(
      actor,
      work("completed", 2),
      1
    );

    const currentRevision =
      await prompts.currentSourceRevision(actor, projectId);
    const second = await prompts.generate(actor, projectId);

    expect(currentRevision).toBe(second.sourceRevision);
    expect(currentRevision).not.toBe(first.sourceRevision);
    expect(isPromptProjectionStale(first, currentRevision)).toBe(true);
    expect(second.contentHash).not.toBe(first.contentHash);
  });
});
