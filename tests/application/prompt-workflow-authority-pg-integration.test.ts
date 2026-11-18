import { generateKeyPairSync } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

import { AuthorityService } from "../../packages/core/src";
import type { WorkPackage } from "../../packages/contracts/src";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresWorkflowExecutionAuthorityRepository
} from "../../packages/persistence/src";

const databaseUrl = process.env.DATABASE_URL;
const suite = process.env.BLUEPRINT_QA_DB_INTEGRATION === "true" && databaseUrl
  ? describe : describe.skip;

suite("P1 workflow execution authority PostgreSQL integrity", () => {
  const prisma = createPrismaClient(databaseUrl!);
  const authority = new AuthorityService(new PostgresAuthorityRepository(prisma));
  const repository = new PostgresWorkflowExecutionAuthorityRepository(prisma);
  let ownerId = "";
  const projectId = "project:p1-authority-integration";
  const policyVersion = "1.3.0";
  const digest = "sha256:" + "7".repeat(64);
  const publicKeyPem = generateKeyPairSync("ed25519").publicKey
    .export({ format: "pem", type: "spki" }).toString();

  beforeAll(async () => {
    const owner = await authority.bootstrapOwner({
      provider: "github", providerSubject: "p1-authority-owner"
    });
    ownerId = owner.id;
    await prisma.project.create({ data: { id: projectId } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("records owner-authenticated adoption and issuer allow without Production authority", async () => {
    const workflowId = "p1-authority-allow";
    const adopted = await repository.recordAdoption({
      projectId, workflowId, workflowDigest: digest, policyVersion,
      decision: "adopt", actorPrincipalId: ownerId
    });
    const allowed = await repository.recordIssuer({
      projectId, workflowId, issuerId: "trusted-owner", publicKeyPem,
      policyVersion, decision: "allow", actorPrincipalId: ownerId
    });
    expect(adopted).toMatchObject({ decision: "adopt", workflowDigest: digest });
    expect(allowed).toMatchObject({ decision: "allow", issuerId: "trusted-owner" });
    expect(await repository.latestAdoption(projectId, workflowId, digest))
      .toMatchObject({ decision: "adopt" });
    expect((await repository.currentAllowedIssuers(projectId, workflowId)).get("trusted-owner"))
      .toMatchObject({ publicKeyPem, decision: "allow" });
    const rows = await prisma.workflowExecutionAdoptionDecision.findMany({
      where: { projectId, workflowId }
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]?.productionReleaseAuthority).toBe(false);
  });

  it("latest append-only revocations remove authority without mutating history", async () => {
    const workflowId = "p1-authority-revoke";
    await repository.recordAdoption({
      projectId, workflowId, workflowDigest: digest, policyVersion,
      decision: "adopt", actorPrincipalId: ownerId
    });
    await repository.recordIssuer({
      projectId, workflowId, issuerId: "trusted-owner", publicKeyPem,
      policyVersion, decision: "allow", actorPrincipalId: ownerId
    });
    await repository.recordAdoption({
      projectId, workflowId, workflowDigest: digest, policyVersion,
      decision: "revoke", actorPrincipalId: ownerId
    });
    await repository.recordIssuer({
      projectId, workflowId, issuerId: "trusted-owner", publicKeyPem,
      policyVersion, decision: "revoke", actorPrincipalId: ownerId
    });
    expect(await repository.latestAdoption(projectId, workflowId, digest))
      .toMatchObject({ decision: "revoke" });
    expect(await repository.latestIssuer(projectId, workflowId, "trusted-owner"))
      .toMatchObject({ decision: "revoke" });
    expect((await repository.currentAllowedIssuers(projectId, workflowId)).size).toBe(0);
    expect(await prisma.workflowExecutionAdoptionDecision.count({
      where: { projectId, workflowId }
    })).toBe(2);
    expect(await prisma.workflowExecutionIssuerDecision.count({
      where: { projectId, workflowId }
    })).toBe(2);
  });

  it("rejects non-owner decisions and invalid/non-Ed25519 key material", async () => {
    const other = await authority.resolveIdentity({
      provider: "github", providerSubject: "p1-authority-other"
    });
    await expect(repository.recordAdoption({
      projectId, workflowId: "p1-denied", workflowDigest: digest, policyVersion,
      decision: "adopt", actorPrincipalId: other.id
    })).rejects.toThrow(/System Owner authority required/);
    await expect(repository.recordIssuer({
      projectId, workflowId: "p1-denied", issuerId: "trusted-owner",
      publicKeyPem: "-----BEGIN PUBLIC KEY-----\ninvalid\n-----END PUBLIC KEY-----",
      policyVersion, decision: "allow", actorPrincipalId: ownerId
    })).rejects.toThrow(/Ed25519/);
  });

  it("database rejects update, delete and truncate of authority history", async () => {
    const workflowId = "p1-immutable";
    await repository.recordAdoption({
      projectId, workflowId, workflowDigest: digest, policyVersion,
      decision: "adopt", actorPrincipalId: ownerId
    });
    const row = await prisma.workflowExecutionAdoptionDecision.findFirstOrThrow({
      where: { projectId, workflowId }
    });
    await expect(prisma.workflowExecutionAdoptionDecision.update({
      where: { id: row.id }, data: { decision: "revoke" }
    })).rejects.toThrow(/append-only/);
    await expect(prisma.workflowExecutionAdoptionDecision.delete({
      where: { id: row.id }
    })).rejects.toThrow(/append-only/);
    await expect(prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "WorkflowExecutionIssuerDecision", "WorkflowExecutionAdoptionDecision"'
    )).rejects.toThrow(/append-only/);
  });

  function previewBinding(label: string) {
    const now = new Date().toISOString();
    const workPackage: WorkPackage = {
      id: "work-package:p3-" + label, projectId, title: "Preview P3 binding",
      purpose: "Verify independent reviewer identity and canonical journal readback.",
      status: "planned", dependencies: [], qualityGateIds: [],
      acceptanceCriteria: ["Verify separate Reviewer A and B identities."],
      meta: { schemaVersion: "1.0.0", recordVersion: 1, createdAt: now, updatedAt: now }
    };
    return { workPackage, workflowId: "p3-" + label, workflowDigest: digest, policyVersion,
      issuerId: "p3-test-issuer", publicKeyPem, actorPrincipalId: ownerId };
  }

  it("records planned work and both authority decisions once, then respects revocation", async () => {
    const input = previewBinding("atomic");
    const attempt = () => repository.recordInitialPreviewBinding(input);
    await expect(attempt()).resolves.toMatchObject({ status: "created", workPackage: input.workPackage });
    await expect(attempt()).resolves.toMatchObject({ status: "existing", workPackage: input.workPackage });
    const where = { projectId, workflowId: input.workflowId };
    expect(await prisma.workflowExecutionAdoptionDecision.count({ where })).toBe(1);
    expect(await prisma.workflowExecutionIssuerDecision.count({ where })).toBe(1);
    await repository.recordIssuer({
      projectId, workflowId: input.workflowId, issuerId: input.issuerId,
      policyVersion, publicKeyPem, actorPrincipalId: ownerId, decision: "revoke"
    });
    await expect(attempt()).rejects.toThrow(/revoked/);
    expect(await prisma.workflowExecutionIssuerDecision.count({ where })).toBe(2);
  });

  it("rejects an authenticated non-Owner before creating any binding records", async () => {
    const input = previewBinding("denied");
    const actor = await authority.resolveIdentity({ provider: "github", providerSubject: "p3-non-owner" });
    await expect(repository.recordInitialPreviewBinding({ ...input, actorPrincipalId: actor.id }))
      .rejects.toThrow(/System Owner authority required/);
    const where = { projectId, workflowId: input.workflowId };
    expect(await prisma.workPackage.count({ where: { id: input.workPackage.id } })).toBe(0);
    expect(await prisma.workflowExecutionAdoptionDecision.count({ where })).toBe(0);
    expect(await prisma.workflowExecutionIssuerDecision.count({ where })).toBe(0);
  });

  it("rolls back the WorkPackage and adoption when saving the issuer fails", async () => {
    const input = previewBinding("rollback");
    // An isolated DB trigger fails the last insert during this test.
    await prisma.$executeRawUnsafe(`
      CREATE FUNCTION p3_test_deny_issuer() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW."workflowId" = 'p3-rollback' THEN
          RAISE EXCEPTION 'P3 issuer write rejected';
        END IF;
        RETURN NEW;
      END;
      $$`);
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TRIGGER p3_test_deny_issuer BEFORE INSERT ON "WorkflowExecutionIssuerDecision"
        FOR EACH ROW EXECUTE FUNCTION p3_test_deny_issuer()`);
      await expect(repository.recordInitialPreviewBinding(input)).rejects.toThrow();
      const where = { projectId, workflowId: input.workflowId };
      expect(await prisma.workPackage.count({ where: { id: input.workPackage.id } })).toBe(0);
      expect(await prisma.workflowExecutionAdoptionDecision.count({ where })).toBe(0);
      expect(await prisma.workflowExecutionIssuerDecision.count({ where })).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS p3_test_deny_issuer ON "WorkflowExecutionIssuerDecision"');
      await prisma.$executeRawUnsafe('DROP FUNCTION p3_test_deny_issuer()');
    }
  });
});
