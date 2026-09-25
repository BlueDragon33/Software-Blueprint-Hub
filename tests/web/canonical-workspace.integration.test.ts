import { createBlueprintServerRuntime, closeBlueprintServerRuntime } from "../../packages/runtime/src";
import {
  createCanonicalProject,
  createCanonicalWorkAndGate,
  generateCanonicalPrompt,
  type CanonicalWorkspaceIds
} from "../../apps/web/src/workspace/canonical";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

const databaseUrl = process.env.DATABASE_URL;
const describePostgres = databaseUrl ? describe : describe.skip;
const ids: CanonicalWorkspaceIds = {
  projectId: "project:fnd009-canonical",
  profileId: "profile:fnd009-canonical",
  workPackageId: "work-package:fnd009-canonical",
  qualityGateId: "gate:fnd009-canonical:human-ux"
};

const now = "2026-09-25T19:40:00+07:00";

describePostgres("FND-009 canonical App Shell journey", () => {
  const runtime = createBlueprintServerRuntime(databaseUrl!);

  beforeEach(async () => {
    await runtime.prisma.gateEvidence.deleteMany({ where: { gate: { projectId: ids.projectId } } });
    await runtime.prisma.qualityGate.deleteMany({ where: { projectId: ids.projectId } });
    await runtime.prisma.workPackage.deleteMany({ where: { projectId: ids.projectId } });
    await runtime.prisma.authorityAuditEvent.deleteMany({ where: { projectId: ids.projectId } });
    await runtime.prisma.projectAuthority.deleteMany({ where: { projectId: ids.projectId } });
    await runtime.prisma.projectProfile.deleteMany({ where: { projectId: ids.projectId } });
    await runtime.prisma.project.deleteMany({ where: { id: ids.projectId } });
  });

  afterAll(async () => {
    await closeBlueprintServerRuntime(runtime);
  });

  async function ownerActor(): Promise<{ principalId: string }> {
    const existing = await runtime.prisma.systemBootstrap.findUnique({
      where: { id: "system" }
    });
    if (existing) {
      return { principalId: existing.ownerPrincipalId };
    }

    try {
      const principal = await runtime.authority.bootstrapOwner({
        provider: "github",
        providerSubject: "fnd009-owner"
      });
      return { principalId: principal.id };
    } catch {
      // Another parallel authority suite may win the one-time bootstrap race.
      const winner = await runtime.prisma.systemBootstrap.findUnique({
        where: { id: "system" }
      });
      if (!winner) {
        throw new Error("System Owner bootstrap did not produce an owner");
      }
      return { principalId: winner.ownerPrincipalId };
    }
  }

  it("persists Project/Profile, Work/Gate, then generates Prompt Projection from canonical state", async () => {
    const actor = await ownerActor();
    const state = await createCanonicalProject(
      runtime,
      actor,
      {
        projectName: "FND-009 Canonical",
        projectType: "web-application",
        blueprintLevel: "B4"
      },
      ids,
      now
    );

    const persistedProfile = await runtime.prisma.projectProfile.findUnique({
      where: { projectId: ids.projectId }
    });
    expect(persistedProfile).not.toBeNull();
    expect(state.profile.meta.recordVersion).toBe(1);

    const workState = await createCanonicalWorkAndGate(
      runtime,
      actor,
      state,
      ids,
      "Verify canonical App Shell",
      now
    );
    expect(workState.workPackage?.status).toBe("ready");
    expect(workState.qualityGate?.status).toBe("not-ready");

    const projection = await generateCanonicalPrompt(runtime, actor, ids.projectId);
    expect(projection.content).toContain("Verify canonical App Shell");
    expect(projection.content).toContain(ids.qualityGateId);
    expect(projection.content).not.toContain("evidence:preview:ux-review");
    expect(projection.sourceRevision).toMatch(/^sha256:[a-f0-9]{64}$/);
  });
});
