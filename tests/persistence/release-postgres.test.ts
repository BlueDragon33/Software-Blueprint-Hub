import type {
  GateEvidence,
  LessonLearned,
  ProjectProfile,
  QualityGate,
  ReleaseRecord,
  WorkPackage
} from "../../packages/contracts/src";
import {
  AuthorityService,
  AuthorizationDeniedError,
  RecordVersionConflictError
} from "../../packages/core/src";
import { ReleaseLessonsApplicationService } from "../../packages/application/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresProjectProfileRepository,
  PostgresReleaseRepository,
  PostgresWorkQualityRepository
} from "../../packages/persistence/src";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;
const projectId = "project:p6-006-release";
const revision = "revision-p6-006-exact";

const profile: ProjectProfile = {
  id: "profile:p6-006-release",
  projectId,
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-26T00:40:00Z",
    updatedAt: "2026-09-26T00:40:00Z"
  },
  name: "P6-006 Release Integration",
  projectType: "web-application",
  blueprintLevel: "B4",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Release exact revisions and preserve learning."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "long-lived"
};

const workPackage: WorkPackage = {
  id: "work-package:p6-006-release",
  projectId,
  title: "Prepare exact revision release",
  purpose: "Back a release with canonical work and evidence.",
  dependencies: [],
  acceptanceCriteria: ["Release points to exact evidence revision."],
  qualityGateIds: ["gate:p6-006-release"],
  status: "completed",
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-26T00:41:00Z",
    updatedAt: "2026-09-26T00:41:00Z"
  }
};

const gate: QualityGate = {
  id: "gate:p6-006-release",
  projectId,
  name: "Release evidence",
  requirements: ["Exact revision evidence is required."],
  status: "pass",
  evidenceIds: ["evidence:p6-006-release"],
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-26T00:42:00Z",
    updatedAt: "2026-09-26T00:42:00Z"
  }
};

const evidence: GateEvidence = {
  id: "evidence:p6-006-release",
  gateId: gate.id,
  kind: "test",
  source: "github-actions:p6-006",
  revision,
  createdAt: "2026-09-26T00:43:00Z"
};

function release(
  status: ReleaseRecord["status"] = "released",
  recordVersion = 1
): ReleaseRecord {
  return {
    id: "release:p6-006-v1",
    projectId,
    version: "v1.0.0",
    revision,
    environment: "production",
    artifactSource: "github-actions:p6-006/deployment",
    status,
    releasedAt: "2026-09-26T00:45:00Z",
    gateEvidenceIds: [evidence.id],
    rollbackPlan: "Restore the previous exact revision and verify health checks.",
    ...(status === "rolled-back"
      ? { rollbackRevision: "revision-p6-006-previous" }
      : {}),
    notes: "Exact revision release integration fixture.",
    meta: {
      schemaVersion: "1.0.0",
      recordVersion,
      createdAt: "2026-09-26T00:44:00Z",
      updatedAt:
        recordVersion === 1
          ? "2026-09-26T00:44:00Z"
          : "2026-09-26T00:46:00Z"
    }
  };
}

function lesson(recordVersion = 1): LessonLearned {
  return {
    id: "lesson:p6-006-release",
    projectId,
    title: "Release evidence must match the shipped revision",
    category: "operations",
    observation: "A release record is only useful when evidence targets the same revision.",
    impact: "Prevents release history from overstating verification.",
    action: "Keep exact revision matching as a release invariant.",
    source: "blueprint-os:p6-006-test",
    sourceRevision: revision,
    releaseId: "release:p6-006-v1",
    linkedWorkPackageIds: [workPackage.id],
    meta: {
      schemaVersion: "1.0.0",
      recordVersion,
      createdAt: "2026-09-26T00:47:00Z",
      updatedAt:
        recordVersion === 1
          ? "2026-09-26T00:47:00Z"
          : "2026-09-26T00:48:00Z"
    }
  };
}

describePostgres("P6-006 Release & Lessons PostgreSQL + authority integration", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const profileRepository = new PostgresProjectProfileRepository(prisma);
  const workRepository = new PostgresWorkQualityRepository(prisma);
  const repository = new PostgresReleaseRepository(prisma);
  const service = new ReleaseLessonsApplicationService(
    repository,
    workRepository,
    authority
  );

  beforeEach(async () => {
    await prisma.lessonLearned.deleteMany({ where: { projectId } });
    await prisma.releaseRecord.deleteMany({ where: { projectId } });
    await prisma.gateEvidence.deleteMany({
      where: { gate: { projectId } }
    });
    await prisma.qualityGate.deleteMany({ where: { projectId } });
    await prisma.workPackage.deleteMany({ where: { projectId } });
    await prisma.authorityAuditEvent.deleteMany({
      where: {
        OR: [
          { projectId },
          { actor: { providerSubject: { startsWith: "p6-006-" } } }
        ]
      }
    });
    await prisma.projectAuthority.deleteMany({ where: { projectId } });
    await prisma.principal.deleteMany({
      where: { providerSubject: { startsWith: "p6-006-" } }
    });
    await prisma.projectProfile.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });

    await profileRepository.createProjectWithProfile(profile);
    await workRepository.createWorkPackage(workPackage);
    await workRepository.createQualityGate(gate);
    await workRepository.createGateEvidence(evidence);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function ownerActor(): Promise<{ principalId: string }> {
    const owner = await authority.resolveIdentity({
      provider: "github",
      providerSubject: "p6-006-owner"
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
      providerSubject: "p6-006-viewer"
    });
    await authority.grantProjectRole(owner, {
      projectId,
      principalId: viewer.id,
      role: "VIEWER"
    });
    return { principalId: viewer.id };
  }

  async function seedRollbackTarget(
    owner: { principalId: string }
  ): Promise<void> {
    const previousRevision = "revision-p6-006-previous";
    const previousEvidence: GateEvidence = {
      ...evidence,
      id: "evidence:p7-007-rollback-target",
      revision: previousRevision,
      createdAt: "2026-09-26T00:42:30Z"
    };

    await workRepository.createGateEvidence(previousEvidence);
    await workRepository.updateQualityGate(
      {
        ...gate,
        evidenceIds: [evidence.id, previousEvidence.id],
        meta: {
          ...gate.meta,
          recordVersion: 2,
          updatedAt: "2026-09-26T00:42:45Z"
        }
      },
      1
    );

    await service.createRelease(owner, {
      ...release(),
      id: "release:p7-007-rollback-target",
      version: "v0.9.0",
      revision: previousRevision,
      gateEvidenceIds: [previousEvidence.id],
      releasedAt: "2026-09-26T00:43:30Z",
      notes: "Canonical rollback target fixture."
    });
  }

  it("persists an exact-revision release and linked lesson", async () => {
    const owner = await ownerActor();
    await service.createRelease(owner, release());
    await service.createLesson(owner, lesson());

    const releases = await service.listReleases(owner, projectId);
    const lessons = await service.listLessons(owner, projectId);

    expect(releases[0]).toMatchObject({
      version: "v1.0.0",
      revision,
      status: "released",
      gateEvidenceIds: [evidence.id]
    });
    expect(lessons[0]).toMatchObject({
      releaseId: "release:p6-006-v1",
      linkedWorkPackageIds: [workPackage.id]
    });
  });

  it("allows viewers to read but not create release state", async () => {
    const owner = await ownerActor();
    const viewer = await viewerActor(owner);
    await service.createRelease(owner, release());

    await expect(service.listReleases(viewer, projectId)).resolves.toHaveLength(1);
    await expect(
      service.createRelease(viewer, {
        ...release(),
        id: "release:p6-006-viewer"
      })
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);
  });

  it("rejects evidence for a different revision and incomplete rollback state", async () => {
    const owner = await ownerActor();

    await expect(
      service.createRelease(owner, {
        ...release(),
        id: "release:p6-006-wrong-revision",
        revision: "revision-not-evidenced"
      })
    ).rejects.toThrow(/not release revision/);

    await expect(
      service.createRelease(owner, {
        ...release("rolled-back"),
        id: "release:p6-006-invalid-rollback",
        rollbackRevision: undefined
      })
    ).rejects.toThrow(/requires rollbackRevision/);
  });

  it("keeps released identity immutable and rejects stale optimistic updates", async () => {
    const owner = await ownerActor();
    await seedRollbackTarget(owner);
    const initial = release();
    await service.createRelease(owner, initial);

    await expect(
      service.updateRelease(
        owner,
        {
          ...initial,
          revision: "revision-mutated",
          meta: { ...initial.meta, recordVersion: 2 }
        },
        1
      )
    ).rejects.toThrow(/immutable/);

    const rolledBack = release("rolled-back", 2);
    await service.updateRelease(owner, rolledBack, 1);

    await expect(
      service.updateRelease(
        owner,
        {
          ...rolledBack,
          notes: "stale overwrite"
        },
        1
      )
    ).rejects.toBeInstanceOf(RecordVersionConflictError);
  });

  it("requires rollbackRevision to identify a canonical prior released revision", async () => {
    const owner = await ownerActor();

    await expect(
      service.createRelease(owner, {
        ...release("rolled-back"),
        id: "release:p7-007-unknown-rollback",
        rollbackRevision: "revision:not-canonical"
      })
    ).rejects.toThrow(/not a canonical previously released revision/);

    await expect(
      service.createRelease(owner, {
        ...release("rolled-back"),
        id: "release:p7-007-self-rollback",
        rollbackRevision: revision
      })
    ).rejects.toThrow(/must differ from the release revision/);

    await seedRollbackTarget(owner);

    await expect(
      service.createRelease(owner, {
        ...release("rolled-back"),
        id: "release:p7-007-valid-rollback"
      })
    ).resolves.toMatchObject({
      rollbackRevision: "revision-p6-006-previous",
      status: "rolled-back"
    });
  });

  it("rejects lessons linked outside canonical release/work state", async () => {
    const owner = await ownerActor();
    await service.createRelease(owner, release());

    await expect(
      service.createLesson(owner, {
        ...lesson(),
        id: "lesson:p6-006-missing-work",
        linkedWorkPackageIds: ["work-package:not-present"]
      })
    ).rejects.toThrow(/not canonical in this project/);

    await expect(
      service.createLesson(owner, {
        ...lesson(),
        id: "lesson:p6-006-missing-release",
        releaseId: "release:not-present"
      })
    ).rejects.toThrow(/not canonical in this project/);
  });
});
