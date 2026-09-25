import type {
  GateEvidence,
  ProjectProfile,
  QualityGate,
  WorkPackage
} from "../../packages/contracts/src";
import {
  AuthorityService,
  AuthorizationDeniedError
} from "../../packages/core/src";
import {
  WorkQualityApplicationService
} from "../../packages/application/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresProjectProfileRepository,
  PostgresWorkQualityRepository
} from "../../packages/persistence/src";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;

const projectId = "project:fnd007-integration";

const profile: ProjectProfile = {
  id: "profile:fnd007-integration",
  projectId,
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T18:30:00+07:00",
    updatedAt: "2026-09-25T18:30:00+07:00"
  },
  name: "FND-007 Integration",
  projectType: "web-application",
  blueprintLevel: "B3",
  primaryUsers: ["builder"],
  jobsToBeDone: ["Track work and evidence without false PASS."],
  dataSensitivity: "internal",
  persistence: "server",
  authentication: "required",
  authorization: "role-based",
  deploymentTarget: "managed-web",
  expectedLifetime: "long-lived"
};

function wp(
  id: string,
  status: WorkPackage["status"],
  dependencies: readonly string[],
  recordVersion = 1
): WorkPackage {
  return {
    id,
    projectId,
    title: id,
    purpose: "Integration dependency flow.",
    dependencies: [...dependencies],
    acceptanceCriteria: ["Dependency semantics are correct."],
    qualityGateIds: ["gate:fnd007-integration"],
    status,
    meta: {
      schemaVersion: "1.0.0",
      recordVersion,
      createdAt: "2026-09-25T18:31:00+07:00",
      updatedAt:
        recordVersion === 1
          ? "2026-09-25T18:31:00+07:00"
          : "2026-09-25T18:32:00+07:00"
    }
  };
}

const initialGate: QualityGate = {
  id: "gate:fnd007-integration",
  projectId,
  name: "FND-007 Integration Gate",
  requirements: ["CI evidence exists."],
  status: "not-ready",
  evidenceIds: [],
  meta: {
    schemaVersion: "1.0.0",
    recordVersion: 1,
    createdAt: "2026-09-25T18:31:00+07:00",
    updatedAt: "2026-09-25T18:31:00+07:00"
  }
};

const evidence: GateEvidence = {
  id: "evidence:fnd007-integration",
  gateId: initialGate.id,
  kind: "test",
  source: "github-actions:36130000000",
  revision: "revision-fnd007-integration",
  createdAt: "2026-09-25T18:32:00+07:00"
};

describePostgres("FND-007 Work Package + Quality Gate integration", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const profileRepository = new PostgresProjectProfileRepository(prisma);
  const repository = new PostgresWorkQualityRepository(prisma);
  const service = new WorkQualityApplicationService(repository, authority);

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
          { actor: { providerSubject: { startsWith: "fnd007-" } } }
        ]
      }
    });
    await prisma.projectAuthority.deleteMany({ where: { projectId } });
    await prisma.systemBootstrap.deleteMany();
    await prisma.principal.deleteMany({
      where: { providerSubject: { startsWith: "fnd007-" } }
    });
    await prisma.projectProfile.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });

    await profileRepository.createProjectWithProfile(profile);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function ownerActor(): Promise<{ principalId: string }> {
    const owner = await authority.bootstrapOwner({
      provider: "github",
      providerSubject: "fnd007-owner"
    });
    return { principalId: owner.id };
  }

  async function reviewerActor(): Promise<{ principalId: string }> {
    const owner = await ownerActor();
    const reviewer = await authority.resolveIdentity({
      provider: "github",
      providerSubject: "fnd007-reviewer"
    });
    await authority.grantProjectRole(owner, {
      projectId,
      principalId: reviewer.id,
      role: "REVIEWER"
    });
    return { principalId: reviewer.id };
  }

  async function editorActor(): Promise<{ principalId: string }> {
    const owner = await ownerActor();
    const editor = await authority.resolveIdentity({
      provider: "github",
      providerSubject: "fnd007-editor"
    });
    await authority.grantProjectRole(owner, {
      projectId,
      principalId: editor.id,
      role: "EDITOR"
    });
    return { principalId: editor.id };
  }

  it("explains blocked work until its dependency completes", async () => {
    const actor = await ownerActor();
    const base = wp("work-package:fnd007-base", "testing", []);
    const child = wp(
      "work-package:fnd007-child",
      "blocked",
      [base.id]
    );

    await service.createWorkPackage(actor, base);
    await service.createWorkPackage(actor, child);

    const blocked = await service.readiness(actor, child.id);
    expect(blocked?.state).toBe("blocked");
    expect(blocked?.blockers[0]?.dependencyId).toBe(base.id);
    expect(blocked?.blockers[0]?.status).toBe("testing");

    await service.updateWorkPackage(
      actor,
      wp(base.id, "completed", [], 2),
      1
    );

    const ready = await service.readiness(actor, child.id);
    expect(ready).toEqual({ state: "ready", blockers: [] });
  });

  it("does not auto-pass a Quality Gate when Work Package completes", async () => {
    const actor = await ownerActor();
    const workPackage = wp("work-package:fnd007-gated", "in-progress", []);

    await service.createQualityGate(actor, initialGate);
    await service.createWorkPackage(actor, workPackage);
    await service.updateWorkPackage(
      actor,
      wp(workPackage.id, "completed", [], 2),
      1
    );

    const storedGate =
      await repository.findQualityGateById(initialGate.id);
    expect(storedGate?.status).toBe("not-ready");
    expect(storedGate?.evidenceIds).toEqual([]);
  });

  it("requires reviewer authority and real source/revision evidence before PASS", async () => {
    const owner = await ownerActor();
    const editor = await editorActor();
    const reviewer = await reviewerActor();

    await service.createQualityGate(owner, initialGate);

    await expect(
      service.addGateEvidence(editor, evidence)
    ).rejects.toBeInstanceOf(AuthorizationDeniedError);

    await service.addGateEvidence(reviewer, evidence);

    const passingGate: QualityGate = {
      ...initialGate,
      status: "pass",
      evidenceIds: [evidence.id],
      meta: {
        ...initialGate.meta,
        recordVersion: 2,
        updatedAt: "2026-09-25T18:33:00+07:00"
      }
    };

    const stored = await service.updateQualityGate(
      reviewer,
      passingGate,
      1
    );
    expect(stored.status).toBe("pass");

    const persistedEvidence =
      await repository.findGateEvidenceById(evidence.id);
    expect(persistedEvidence).toMatchObject({
      source: "github-actions:36130000000",
      revision: "revision-fnd007-integration"
    });
  });
});
