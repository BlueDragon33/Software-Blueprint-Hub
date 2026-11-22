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
import { prepareNextActionIntake } from "../../packages/application/src/next-action-intake.candidate.mjs";


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
    const owner = await authority.resolveIdentity({
      provider: "github",
      providerSubject: "fnd007-owner"
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
        detail: { fixture: "fnd007" }
      }
    );
    return { principalId: owner.id };
  }

  async function reviewerActor(
    owner: { principalId: string }
  ): Promise<{ principalId: string }> {
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

  async function editorActor(
    owner: { principalId: string }
  ): Promise<{ principalId: string }> {
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

  it("loads project gates and evidence in one batch with newest evidence first", async () => {
    const actor = await ownerActor();
    await service.createQualityGate(actor, initialGate);

    const newerEvidence: GateEvidence = {
      ...evidence,
      id: "evidence:fnd007-newer",
      source: "github-actions:36130000001",
      revision: "revision-fnd007-newer",
      createdAt: "2026-09-25T18:34:00+07:00"
    };

    await service.addGateEvidence(actor, evidence);
    await service.addGateEvidence(actor, newerEvidence);

    const bundles = await repository.listQualityGateEvidenceByProject(projectId);

    expect(bundles).toHaveLength(1);
    expect(bundles[0]?.gate.id).toBe(initialGate.id);
    expect(bundles[0]?.evidence.map((item) => item.id)).toEqual([
      newerEvidence.id,
      evidence.id
    ]);
  });

  it("requires reviewer authority and real source/revision evidence before PASS", async () => {
    const owner = await ownerActor();
    const editor = await editorActor(owner);
    const reviewer = await reviewerActor(owner);

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

  // Next Action source-only business logic runs through the existing canonical
  // WorkQuality service; no second DB/table/authorization path is introduced.
  const nextActionRevision = "sha256:" + "a".repeat(64);
  function nextActionPlan(requestId: string, content: string) {
    const input = {
      projectId, requestId, sourceRevision: nextActionRevision,
      kind: "other" as const, content, selectedWorkPackageId: null
    };
    const context = {
      authorizedProjectId: projectId,
      currentSourceRevision: nextActionRevision,
      existingWorkPackages: [] as WorkPackage[],
      now: "2026-11-22T00:00:00.000Z"
    };
    const plan = prepareNextActionIntake(input, context);
    if (plan.kind !== "create-planned") throw new Error("Test precondition: expected PLANNED candidate");
    return { input, context, plan };
  }

  it("concurrent replay of the same Next Action request creates precisely one canonical record", async () => {
    const actor = await ownerActor();
    const { input, context, plan } = nextActionPlan(
      "12345678-1234-4123-9123-123456789abc", "One canonical requested change"
    );
    const writes = await Promise.allSettled(
      Array.from({ length: 8 }, () => service.createWorkPackage(actor, plan.workPackage))
    );
    expect(writes.filter(x => x.status === "fulfilled")).toHaveLength(1);
    expect(writes.filter(x => x.status === "rejected")).toHaveLength(7);
    const persisted = await service.listWorkPackages(actor, projectId);
    expect(persisted).toHaveLength(1);
    expect(persisted[0]).toMatchObject({
      id: plan.workPackageId, status: "planned",
      purpose: input.content, projectId
    });
    const replay = prepareNextActionIntake(input, {
      ...context, existingWorkPackages: [...persisted]
    });
    expect(replay).toMatchObject({
      kind: "already-saved", workPackageId: plan.workPackageId,
      mayDispatch: false
    });
  });

  it("conflicting content with the same request ID cannot overwrite the winning WorkPackage", async () => {
    const actor = await ownerActor();
    const requestId = "22345678-1234-4123-9123-123456789abc";
    const left = nextActionPlan(requestId, "Approved scope A");
    const right = nextActionPlan(requestId, "Different scope B");
    expect(left.plan.workPackageId).toBe(right.plan.workPackageId);
    const writes = await Promise.allSettled([
      service.createWorkPackage(actor, left.plan.workPackage),
      service.createWorkPackage(actor, right.plan.workPackage)
    ]);
    expect(writes.filter(x => x.status === "fulfilled")).toHaveLength(1);
    const stored = await service.listWorkPackages(actor, projectId);
    expect(stored).toHaveLength(1);
    const winner = stored[0]!.purpose;
    expect(["Approved scope A", "Different scope B"]).toContain(winner);
    const loser = winner === "Approved scope A" ? right : left;
    expect(() => prepareNextActionIntake(loser.input, {
      ...loser.context, existingWorkPackages: [...stored]
    })).toThrow(/request id conflict/);
    expect((await service.listWorkPackages(actor, projectId))[0]!.purpose).toBe(winner);
  });

  it("exposes the UNRESOLVED cross-request source CAS gap without falsely claiming it passed", async () => {
    const actor = await ownerActor();
    // Both independent callers prepared against the SAME earlier read.
    // Unique IDs do not serialize the project-wide Prompt source revision.
    const a = nextActionPlan("32345678-1234-4123-9123-123456789abc", "Separate scope A");
    const b = nextActionPlan("42345678-1234-4123-9123-123456789abc", "Separate scope B");
    const results = await Promise.allSettled([
      service.createWorkPackage(actor, a.plan.workPackage),
      service.createWorkPackage(actor, b.plan.workPackage)
    ]);
    expect(results.filter(x => x.status === "fulfilled")).toHaveLength(2);
    const stored = await service.listWorkPackages(actor, projectId);
    expect(stored.map(x => x.id).sort()).toEqual(
      [a.plan.workPackageId, b.plan.workPackageId].sort()
    );
    // This current behavior demonstrates a missing atomic project-level CAS
    // requirement, NOT an accepted/verified concurrency safety release gate.
    expect(stored.every(x => x.status === "planned")).toBe(true);
  });

  it("keeps per-record version CAS on simultaneous updates", async () => {
    const actor = await ownerActor();
    const candidate = wp("work-package:fnd007-concurrent-update", "planned", []);
    await service.createWorkPackage(actor, candidate);
    const a = wp(candidate.id, "ready", [], 2);
    const b = wp(candidate.id, "blocked", [], 2);
    const results = await Promise.allSettled([
      service.updateWorkPackage(actor, a, 1),
      service.updateWorkPackage(actor, b, 1)
    ]);
    expect(results.filter(x => x.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(x => x.status === "rejected")).toHaveLength(1);
    const saved = await repository.findWorkPackageById(candidate.id);
    expect(saved?.meta.recordVersion).toBe(2);
    expect(["ready", "blocked"]).toContain(saved?.status);
  });
});
