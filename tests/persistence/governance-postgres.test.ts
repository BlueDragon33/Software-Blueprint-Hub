import type {
  ArchitectureDecision,
  ProjectProfile,
  Risk,
  TechnicalDebt,
  WorkPackage
} from "../../packages/contracts/src";
import {
  AuthorityService,
  AuthorizationDeniedError,
  RecordVersionConflictError
} from "../../packages/core/src";
import { GovernanceApplicationService } from "../../packages/application/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresGovernanceRepository,
  PostgresProjectProfileRepository,
  PostgresWorkQualityRepository
} from "../../packages/persistence/src";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;
const projectId = "project:p6-004-governance";

const profile: ProjectProfile = {
  id: "profile:p6-004-governance",
  projectId,
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T23:30:00Z",
    updatedAt: "2026-09-25T23:30:00Z"
  },
  name: "P6-004 Governance Integration",
  projectType: "web-application",
  blueprintLevel: "B4",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Keep decisions, risks and debt as canonical state."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "long-lived"
};

const workPackage: WorkPackage = {
  id: "work-package:p6-004-remediation",
  projectId,
  title: "Remediate governance risk",
  purpose: "Back governance state with canonical work.",
  dependencies: [],
  acceptanceCriteria: ["Linked governance work is traceable."],
  qualityGateIds: [],
  status: "planned",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T23:31:00Z",
    updatedAt: "2026-09-25T23:31:00Z"
  }
};

function decision(
  id: string,
  status: ArchitectureDecision["status"],
  recordVersion = 1,
  supersedesId?: string
): ArchitectureDecision {
  return {
    id,
    projectId,
    title: "Use explicit canonical governance records",
    context: "Architecture decisions must survive UI and prompt changes.",
    decision: "Persist ADR records behind repository ports.",
    consequences: ["Decision history remains queryable and versioned."],
    status,
    ...(supersedesId ? { supersedesId } : {}),
    source: "blueprint-os:p6-004-test",
    sourceRevision: "revision-p6-004",
    meta: {
      schemaVersion: "1.0.0",
      recordVersion,
      createdAt: "2026-09-25T23:32:00Z",
      updatedAt:
        recordVersion === 1
          ? "2026-09-25T23:32:00Z"
          : "2026-09-25T23:33:00Z"
    }
  };
}

function risk(recordVersion = 1): Risk {
  return {
    id: "risk:p6-004-integration",
    projectId,
    title: "Governance state can drift from implementation",
    description: "Decision and debt records may become stale without review.",
    likelihood: "medium",
    impact: "high",
    status: "mitigating",
    mitigation: "Link mitigation to an explicit Work Package.",
    owner: "platform-team",
    linkedWorkPackageIds: [workPackage.id],
    source: "blueprint-os:p6-004-test",
    sourceRevision: "revision-p6-004",
    meta: {
      schemaVersion: "1.0.0",
      recordVersion,
      createdAt: "2026-09-25T23:32:00Z",
      updatedAt:
        recordVersion === 1
          ? "2026-09-25T23:32:00Z"
          : "2026-09-25T23:34:00Z"
    }
  };
}

const debt: TechnicalDebt = {
  id: "technical-debt:p6-004-integration",
  projectId,
  title: "Legacy governance notes remain in Markdown",
  description: "Historical notes need canonical migration over time.",
  severity: "medium",
  status: "planned",
  remediation: "Migrate active debt into structured records.",
  linkedWorkPackageIds: [workPackage.id],
  source: "blueprint-os:p6-004-test",
  sourceRevision: "revision-p6-004",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T23:32:00Z",
    updatedAt: "2026-09-25T23:32:00Z"
  }
};

describePostgres("P6-004 governance PostgreSQL + authority integration", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const profileRepository = new PostgresProjectProfileRepository(prisma);
  const workRepository = new PostgresWorkQualityRepository(prisma);
  const repository = new PostgresGovernanceRepository(prisma);
  const service = new GovernanceApplicationService(
    repository,
    workRepository,
    authority
  );

  beforeEach(async () => {
    await prisma.architectureDecision.deleteMany({ where: { projectId } });
    await prisma.risk.deleteMany({ where: { projectId } });
    await prisma.technicalDebt.deleteMany({ where: { projectId } });
    await prisma.workPackage.deleteMany({ where: { projectId } });
    await prisma.authorityAuditEvent.deleteMany({
      where: {
        OR: [
          { projectId },
          { actor: { providerSubject: { startsWith: "p6-004-" } } }
        ]
      }
    });
    await prisma.projectAuthority.deleteMany({ where: { projectId } });
    await prisma.principal.deleteMany({
      where: { providerSubject: { startsWith: "p6-004-" } }
    });
    await prisma.projectProfile.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });

    await profileRepository.createProjectWithProfile(profile);
    await workRepository.createWorkPackage(workPackage);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function ownerActor(): Promise<{ principalId: string }> {
    const owner = await authority.resolveIdentity({
      provider: "github",
      providerSubject: "p6-004-owner"
    });
    await authorityRepository.setProjectRole(
      { projectId, principalId: owner.id, role: "OWNER" },
      {
        actorPrincipalId: owner.id,
        targetPrincipalId: owner.id,
        projectId,
        action: "TEST_PROJECT_OWNER_SEEDED"
      }
    );
    return { principalId: owner.id };
  }

  async function viewerActor(
    owner: { principalId: string }
  ): Promise<{ principalId: string }> {
    const viewer = await authority.resolveIdentity({
      provider: "github",
      providerSubject: "p6-004-viewer"
    });
    await authority.grantProjectRole(owner, {
      projectId,
      principalId: viewer.id,
      role: "VIEWER"
    });
    return { principalId: viewer.id };
  }

  it("persists canonical decision risk and debt registers", async () => {
    const owner = await ownerActor();

    await service.createArchitectureDecision(
      owner,
      decision("architecture-decision:p6-004-base", "accepted")
    );
    await service.createRisk(owner, risk());
    await service.createTechnicalDebt(owner, debt);

    const decisions = await service.listArchitectureDecisions(owner, projectId);
    const risks = await service.listRisks(owner, projectId);
    const debts = await service.listTechnicalDebt(owner, projectId);

    expect(decisions.map((item) => item.id)).toEqual([
      "architecture-decision:p6-004-base"
    ]);
    expect(risks[0]?.linkedWorkPackageIds).toEqual([workPackage.id]);
    expect(debts[0]?.severity).toBe("medium");
  });

  it("allows read-only authority to read but not mutate governance state", async () => {
    const owner = await ownerActor();
    const viewer = await viewerActor(owner);
    const base = decision("architecture-decision:p6-004-read", "proposed");

    await service.createArchitectureDecision(owner, base);
    await expect(
      service.listArchitectureDecisions(viewer, projectId)
    ).resolves.toHaveLength(1);

    await expect(
      service.createRisk(viewer, risk())
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it("keeps accepted ADR content immutable and uses explicit supersession", async () => {
    const owner = await ownerActor();
    const base = decision("architecture-decision:p6-004-base", "accepted");
    await service.createArchitectureDecision(owner, base);

    await expect(
      service.updateArchitectureDecision(
        owner,
        {
          ...base,
          decision: "Silently replace accepted direction.",
          meta: { ...base.meta, recordVersion: 2 }
        },
        1
      )
    ).rejects.toThrow(/immutable/);

    const replacement = decision(
      "architecture-decision:p6-004-replacement",
      "proposed",
      1,
      base.id
    );
    await expect(
      service.createArchitectureDecision(owner, replacement)
    ).resolves.toMatchObject({ supersedesId: base.id });
  });

  it("rejects stale optimistic updates and invalid Work Package links", async () => {
    const owner = await ownerActor();
    const initial = risk();
    await service.createRisk(owner, initial);

    const version2: Risk = {
      ...initial,
      status: "accepted",
      meta: { ...initial.meta, recordVersion: 2, updatedAt: "2026-09-25T23:34:00Z" }
    };
    await service.updateRisk(owner, version2, 1);

    await expect(
      service.updateRisk(owner, { ...version2, title: "stale overwrite" }, 1)
    ).rejects.toBeInstanceOf(RecordVersionConflictError);

    await expect(
      service.createTechnicalDebt(owner, {
        ...debt,
        id: "technical-debt:p6-004-invalid-link",
        linkedWorkPackageIds: ["work-package:not-present"]
      })
    ).rejects.toThrow(/not canonical in this project/);
  });
});
