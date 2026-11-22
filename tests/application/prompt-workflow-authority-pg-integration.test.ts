import { generateKeyPairSync } from "node:crypto";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

import { AuthorityService } from "../../packages/core/src";
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

  it("fails closed if same-timestamp revoke would lose to lexicographic adoption UUID", async () => {
    const workflowId = "p1-adoption-timestamp-tie";
    const decidedAt = new Date("2026-10-17T00:00:00.000Z");
    await prisma.workflowExecutionAdoptionDecision.createMany({data:[
      {
        id:"workflow-adoption:zz-adopt",projectId,workflowId,
        workflowDigest:digest,policyVersion,decision:"adopt",
        decidedAt,decidedByPrincipalId:ownerId,productionReleaseAuthority:false
      },
      {
        id:"workflow-adoption:aa-revoke",projectId,workflowId,
        workflowDigest:digest,policyVersion,decision:"revoke",
        decidedAt,decidedByPrincipalId:ownerId,productionReleaseAuthority:false
      }
    ]});
    const unsafeLexicographic = await prisma.workflowExecutionAdoptionDecision.findFirst({
      where:{projectId,workflowId,workflowDigest:digest},
      orderBy:[{decidedAt:"desc"},{id:"desc"}]
    });
    expect(unsafeLexicographic?.decision).toBe("adopt");
    expect(await repository.latestAdoption(projectId,workflowId,digest)).toBeNull();
  });

  it("fails closed on tied issuer allow/revoke for both grant snapshot and live recheck", async () => {
    const workflowId = "p1-issuer-timestamp-tie";
    const issuerId = "authorized-tie";
    const decidedAt = new Date("2026-10-17T00:00:00.000Z");
    await prisma.workflowExecutionIssuerDecision.createMany({data:[
      {
        id:"workflow-issuer:zz-allow",projectId,workflowId,issuerId,
        publicKeyPem,policyVersion,decision:"allow",
        decidedAt,decidedByPrincipalId:ownerId,productionReleaseAuthority:false
      },
      {
        id:"workflow-issuer:aa-revoke",projectId,workflowId,issuerId,
        publicKeyPem,policyVersion,decision:"revoke",
        decidedAt,decidedByPrincipalId:ownerId,productionReleaseAuthority:false
      }
    ]});
    const unsafeLexicographic=await prisma.workflowExecutionIssuerDecision.findFirst({
      where:{projectId,workflowId,issuerId},
      orderBy:[{decidedAt:"desc"},{id:"desc"}]
    });
    expect(unsafeLexicographic?.decision).toBe("allow");
    expect(await repository.latestIssuer(projectId,workflowId,issuerId)).toBeNull();
    expect((await repository.currentAllowedIssuers(projectId,workflowId)).has(issuerId)).toBe(false);
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
});
