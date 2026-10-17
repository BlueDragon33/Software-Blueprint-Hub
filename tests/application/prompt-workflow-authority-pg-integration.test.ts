import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

import { AuthorityService } from "../../packages/core/src";
import {
  workflowExecutionGrantSigningPayload,
  type WorkflowExecutionGrantPayload
} from "../../packages/application/src/prompt-workflow-execution";
import { workflowManifestDigest } from "../../packages/application/src/prompt-workflow-orchestration";
import { PostgresWorkflowExecutionAuthority } from "../../packages/runtime/src/workflow-execution-authority";
import { PostgresWorkflowExecutionJournal } from "../../packages/runtime/src/workflow-execution-journal";
import { PostgresWorkflowInspectionQaJournal } from "../../packages/runtime/src/workflow-inspection-qa-journal";
import { WorkQualityApplicationService } from "../../packages/application/src/work-quality-service";
import { PostgresWorkQualityRepository, type BlueprintPrismaClient } from "../../packages/persistence/src";
import { admitIssue115Candidate, admitIssue115FromRuntime } from "../../packages/runtime/src/issue-115-intake";
import type { BlueprintServerRuntime } from "../../packages/runtime/src";
import { executeAndVerifyScopedInspection } from "../../packages/runtime/src/workflow-inspection-pipeline";
import { ScopedGitHubReadExecutor } from "../../packages/runtime/src/workflow-scoped-github-executor";
import { PinnedInspectionQaVerifier } from "../../packages/runtime/src/workflow-observation-qa";
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


  it("connects disposable owner authority → signed bounded inspection → PostgreSQL journal → independently re-fetched source and durable QA readback", async () => {
    // IMPORTANT: The owner identity and the approved manifest here exist ONLY in
    // the disposable CI database. This is a genuine integrated DATA-PATH test,
    // never a human-approved canonical Work Package, live enrollment, completion
    // receipt, independent human review or permission for Production execution.
    const template = JSON.parse(readFileSync(
      new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url),
      "utf8"
    ));
    const workflowId = "ci-p2-source-read";
    const workflow = {
      ...template,
      workflowId,
      status: "approved",
      project: {...template.project, id: projectId}
    };
    const keys = generateKeyPairSync("ed25519");
    const issuerId = "ci-test-owner-issuer";
    const issuerPublicKey = keys.publicKey.export({format: "pem", type: "spki"}).toString();
    const targetRepo = "BlueDragon33/Application-Management";
    const shaPattern = /^[0-9a-f]{40}$/;

    // Read *actual* current source. A branch movement during execution is
    // a failed freshness check; the independent QA reads exact pinned bytes.
    const currentHead = async (): Promise<string> => {
      const response = await fetch(
        "https://api.github.com/repos/BlueDragon33/Application-Management/commits/main",
        {headers: {Accept: "application/vnd.github+json"}, redirect: "error", signal: AbortSignal.timeout(8000)}
      );
      if (!response.ok) throw new Error("P2 CI source unavailable: " + response.status);
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("sha" in data) ||
          typeof data.sha !== "string" || !shaPattern.test(data.sha)) {
        throw new Error("P2 CI source is not an exact Git SHA");
      }
      return data.sha;
    };
    const pinnedHead = await currentHead();
    console.info("[P2 CI DATA-PATH ONLY] pinned source:", targetRepo + "@" + pinnedHead);
    const digest = workflowManifestDigest(workflow);
    const context = {
      projectId, repository: targetRepo, appHead: pinnedHead,
      canonicalDigest: "sha256:" + "a".repeat(64), // deliberately CI-only synthetic snapshot
      policyVersion
    };
    await repository.recordAdoption({
      projectId, workflowId, workflowDigest: digest, policyVersion,
      decision: "adopt", actorPrincipalId: ownerId
    });
    await repository.recordIssuer({
      projectId, workflowId, issuerId, publicKeyPem: issuerPublicKey,
      policyVersion, decision: "allow", actorPrincipalId: ownerId
    });
    const now = Date.now();
    const payload: WorkflowExecutionGrantPayload = {
      schemaVersion: "1.0.0",
      projectId, repository: targetRepo, workflowId,
      workflowVersion: workflow.workflowVersion,
      workflowDigest: digest, templateId: workflow.templateId,
      nodeId: "inventory", appHead: pinnedHead,
      canonicalDigest: context.canonicalDigest, policyVersion,
      issuerId, nonce: "b".repeat(32),
      issuedAt: new Date(now - 1000).toISOString(),
      expiresAt: new Date(now + 180_000).toISOString(),
      mode: "inspect-scoped", allowedPaths: ["README.md"],
      maxAttempts: 1, maxFiles: 1, maxTokenEstimate: 1000
    };
    const grant = {
      ...payload,
      signature: sign(null, Buffer.from(workflowExecutionGrantSigningPayload(payload)),
        keys.privateKey).toString("base64")
    };
    const runtimeAuthority = await PostgresWorkflowExecutionAuthority.load(
      repository, projectId, workflowId, policyVersion
    );
    const journal = new PostgresWorkflowExecutionJournal(prisma);
    const qaJournal = new PostgresWorkflowInspectionQaJournal(prisma);
    const deps = {
      authority: runtimeAuthority,
      journal, qaJournal,
      runner: new ScopedGitHubReadExecutor({repository: targetRepo}),
      qa: new PinnedInspectionQaVerifier(),
      freshness: {assertCurrent: async () => {
        const actual = await currentHead();
        if (actual !== pinnedHead) throw new Error("P2 source HEAD changed; stop and re-authorize");
      }},
      // The test explicitly uses a synthetic, not authentic, readiness source.
      source: {list: async () => []},
      trust: {publicKeyFor: () => null},
      verifier: {verify: async () => false}
    };
    const outcome = await executeAndVerifyScopedInspection(grant, workflow, context, deps);
    expect(outcome.status).toBe("independently-verified");
    expect(outcome.qa).toMatchObject({status: "verified-inspection-bytes", verifiedFiles: 1});
    expect(outcome.completionReceiptIssued).toBe(false);
    expect(outcome.qualityGatePassed).toBe(false);
    expect(outcome.productionAuthorized).toBe(false);
    const requestId = outcome.execution.requestId;
    expect((await journal.read(requestId)).attempts).toHaveLength(1);
    const proof = await qaJournal.readVerified(requestId, 1);
    expect(proof).toMatchObject({
      requestId, sourceRevision: pinnedHead, verifiedFiles: 1,
      observationDigest: outcome.qa?.observationDigest
    });
    await expect(executeAndVerifyScopedInspection(grant, workflow, context, deps))
      .rejects.toThrow(/replay/i);
    await repository.recordIssuer({
      projectId, workflowId, issuerId, publicKeyPem: issuerPublicKey,
      policyVersion, decision: "revoke", actorPrincipalId: ownerId
    });
    await expect(runtimeAuthority.assertMayExecute(projectId, workflowId, issuerId))
      .rejects.toThrow(/revoked/);
    console.info("[P2 CI DATA-PATH ONLY] durable QA proof recorded and read back; NO CANONICAL E2E PASS");
  }, 90_000);

  it("atomically rolls back an interrupted four-gate intake, then persists and idempotently re-reads blocked records", async () => {
    // Disposable isolated CI PostgreSQL only. Owner here is bootstrapped as
    // a TEST identity; no canonical Product Authority or release approval.
    const project = "project:blueprint-os";
    await prisma.project.create({data:{id:project}});
    // AUTHORITY TOCTOU and profile-version drift are exercised by the REAL
    // PostgreSQL-backed runtime adapter, not by the mocked unit boundary.
    const testTime = new Date().toISOString();
    await prisma.projectProfile.create({
      data: {
        id: "profile:blueprint-os", projectId: project,
        schemaVersion: "1.0.0", recordVersion: 1,
        document: {
          id: "profile:blueprint-os", projectId: project,
          meta: {schemaVersion:"1.0.0", recordVersion:1,
            createdAt:testTime, updatedAt:testTime},
          name:"CI isolated Blueprint OS", projectType:"platform",
          blueprintLevel:"B4", primaryUsers:["CI runner"],
          jobsToBeDone:["Verify authorized intake"], dataSensitivity:"internal",
          persistence:"server", authentication:"required",
          authorization:"policy-based", deploymentTarget:"local",
          expectedLifetime:"temporary"
        }
      }
    });
    const editorRecord = await authority.resolveIdentity({
      provider: "github", providerSubject: "ci-p2-115-transactional-editor"
    });
    const editorActor = {principalId:editorRecord.id};
    const ownerActorForGrant = {principalId:ownerId};
    const roleForEditor = async (role: "EDITOR" | "VIEWER") =>
      authority.grantProjectRole(ownerActorForGrant,
        {projectId:project, principalId:editorRecord.id, role});
    await roleForEditor("EDITOR");

    function injectedRuntime(
      beforeTransaction: () => Promise<void>
    ): BlueprintServerRuntime {
      return {
        prisma: {
          $transaction: async (
            callback: (tx: BlueprintPrismaClient) => Promise<unknown>,
            options: {isolationLevel: "Serializable";maxWait:number;timeout:number}
          ) => {
            await beforeTransaction();
            return prisma.$transaction(
              async tx => callback(tx as unknown as BlueprintPrismaClient),
              options
            );
          }
        },
        authority,
        profiles: {
          read: async () => ({
            profile: {meta: {recordVersion: 1}}
          })
        },
        workQuality: new WorkQualityApplicationService(
          new PostgresWorkQualityRepository(prisma), authority
        )
      } as unknown as BlueprintServerRuntime;
    }

    await expect(admitIssue115FromRuntime(
      injectedRuntime(async () => roleForEditor("VIEWER").then(() => undefined)),
      editorActor, project, 1
    )).rejects.toThrow(/PROJECT_MUTATE|Authorization denied/);
    expect(await prisma.workPackage.count({where:{projectId:project}})).toBe(0);
    expect(await prisma.qualityGate.count({where:{projectId:project}})).toBe(0);

    await roleForEditor("EDITOR");
    await expect(admitIssue115FromRuntime(
      injectedRuntime(async () => {
        await prisma.projectProfile.update({
          where: {projectId:project}, data:{recordVersion:2}
        });
      }),
      editorActor, project, 1
    )).rejects.toThrow(/profile version changed within transaction/);
    expect(await prisma.workPackage.count({where:{projectId:project}})).toBe(0);
    expect(await prisma.qualityGate.count({where:{projectId:project}})).toBe(0);

    let failThirdGate = true;
    let createdGates = 0;
    const realService = new WorkQualityApplicationService(
      new PostgresWorkQualityRepository(prisma), authority
    );
    const boundary = {
      requireMutate: (actor: {principalId:string} | null, id: string) =>
        authority.require(actor,id,"PROJECT_MUTATE"),
      profileVersion: async (_actor: {principalId:string}, id:string) =>
        id === project ? 1 : null, // CI fixture, not a production profile
      atomic: <T>(fn:(service: WorkQualityApplicationService)=>Promise<T>) =>
        prisma.$transaction(async tx => {
          const service = new WorkQualityApplicationService(
            new PostgresWorkQualityRepository(tx as unknown as BlueprintPrismaClient),authority);
          const guarded = {
            listWorkPackages: service.listWorkPackages.bind(service),
            listQualityGates: service.listQualityGates.bind(service),
            createWorkPackage: service.createWorkPackage.bind(service),
            createQualityGate: async (...args: Parameters<typeof service.createQualityGate>) => {
              createdGates++;
              if(failThirdGate && createdGates===3)throw new Error("CI injected mid-transaction failure");
              return service.createQualityGate(...args);
            }
          };
          return fn(guarded);
        }),
      readback: realService
    };
    const ownerActor={principalId:ownerId};
    const viewerPrincipal = await authority.resolveIdentity({
      provider: "github", providerSubject: "ci-p2-115-viewer"
    });
    const viewerActor = {principalId: viewerPrincipal.id};
    // Use the REAL AuthService/Postgres role scope, not the unit-test mock.
    // This principal has no PROJECT_MUTATE grant; no transaction may start.
    await expect(admitIssue115Candidate(boundary, null, project, 1))
      .rejects.toThrow(/authenticated/);
    await expect(admitIssue115Candidate(boundary, viewerActor, project, 1))
      .rejects.toThrow(/PROJECT_MUTATE|Authorization denied/);
    await expect(admitIssue115Candidate(boundary, ownerActor, "project:other", 1))
      .rejects.toThrow(/exact-project/);
    expect(createdGates).toBe(0);
    await expect(admitIssue115Candidate(boundary,ownerActor,project,1))
      .rejects.toThrow(/CI injected/);
    expect(await prisma.workPackage.count({where:{projectId:project}})).toBe(0);
    expect(await prisma.qualityGate.count({where:{projectId:project}})).toBe(0);
    failThirdGate=false;
    // Simultaneous requests must result in exactly one durable candidate;
    // a losing insert is "already-present" only after exact DB readback.
    const concurrent = await Promise.all([
      admitIssue115Candidate(boundary, ownerActor, project, 1),
      admitIssue115Candidate(boundary, ownerActor, project, 1)
    ]);
    expect(concurrent.map(x => x.state).sort()).toEqual(["already-present", "created"]);
    expect(concurrent.every(x => x.executionAuthorized === false)).toBe(true);
    expect(await prisma.workPackage.count({where:{projectId:project}})).toBe(1);
    expect(await prisma.qualityGate.count({where:{projectId:project}})).toBe(4);
    const replay=await admitIssue115Candidate(boundary,ownerActor,project,1);
    expect(replay.state).toBe("already-present");
    expect(await prisma.workPackage.count({where:{projectId:project}})).toBe(1);
    expect(await prisma.qualityGate.count({where:{projectId:project}})).toBe(4);
    const record=await prisma.workPackage.findFirstOrThrow({where:{projectId:project}});
    expect(record.recordVersion).toBe(1);
    expect(record.status).toBe("blocked");
  }, 40_000);

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
