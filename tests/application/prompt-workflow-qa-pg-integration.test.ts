import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPrismaClient } from "../../packages/persistence/src/client";
import { PostgresWorkflowExecutionJournal } from "../../packages/runtime/src/workflow-execution-journal";
import {
  PostgresWorkflowInspectionQaJournal, INDEPENDENT_INSPECTION_VERIFIER_ID
} from "../../packages/runtime/src/workflow-inspection-qa-journal";

/**
 * Isolated CI-PostgreSQL integration. Never points at Preview/Production
 * credentials; the test workflow creates and discards its own database.
 */
describe("real PostgreSQL immutable QA verification integrity", () => {
  const live = process.env.BLUEPRINT_QA_DB_INTEGRATION === "true" ? it : it.skip;

  async function seededJournal() {
    const url = process.env.DATABASE_URL ?? "";
    const target = new URL(url);
    expect(target.hostname).toBe("localhost");
    expect(target.pathname).toBe("/blueprint_qa_test");
    const prisma = createPrismaClient(url);
    const requestId = "sha256:" + randomBytes(32).toString("hex");
    const observationDigest = "sha256:" + "b".repeat(64);
    const sourceRevision = "c".repeat(40);
    try {
      const claim = await prisma.workflowExecutionClaim.create({
        data: { requestId, expiresAt: new Date(Date.now() + 60_000) }
      });
      const observation = await prisma.workflowExecutionObservation.create({
        data: {
          requestId, attempt: 1, outcome: "succeeded", observationDigest,
          evidenceReferences: ["github:BlueDragon33/Software-Blueprint-Hub@" + sourceRevision + "#README.md"],
          filesTouched: [], tokensUsed: 0
        }
      });
      const evidence = {
        requestId, attempt: 1, observationDigest, sourceRevision,
        verifiedFiles: 1, verifierId: INDEPENDENT_INSPECTION_VERIFIER_ID
      };
      await new PostgresWorkflowInspectionQaJournal(prisma).appendVerified(evidence);
      return { prisma, url, requestId, claim, observation, evidence };
    } catch (error) {
      await prisma.$disconnect();
      throw error;
    }
  }

  const mutations = [
    ["claim expiry rewrite", 'UPDATE "WorkflowExecutionClaim" SET "expiresAt" = "expiresAt" + interval \'1 minute\' WHERE "requestId" = $1'],
    ["claim removal", 'DELETE FROM "WorkflowExecutionClaim" WHERE "requestId" = $1'],
    ["observation outcome rewrite", 'UPDATE "WorkflowExecutionObservation" SET "outcome" = \'failed\' WHERE "requestId" = $1'],
    ["observation removal", 'DELETE FROM "WorkflowExecutionObservation" WHERE "requestId" = $1'],
    ["QA source revision rewrite", 'UPDATE "WorkflowExecutionQaVerification" SET "sourceRevision" = repeat(\'d\', 40) WHERE "requestId" = $1'],
    ["QA removal", 'DELETE FROM "WorkflowExecutionQaVerification" WHERE "requestId" = $1']
  ] as const;

  live.each(mutations)("blocks %s without changing persisted evidence", async (_name, query) => {
    const { prisma, requestId, claim, observation, evidence } = await seededJournal();
    try {
      await expect(prisma.$executeRawUnsafe(query, requestId))
        .rejects.toThrow("Execution journal is append-only");
      expect(await prisma.workflowExecutionClaim.findUnique({ where: { requestId } })).toEqual(claim);
      expect(await prisma.workflowExecutionObservation.findUnique({
        where: { requestId_attempt: { requestId, attempt: 1 } }
      })).toEqual(observation);
      expect(await new PostgresWorkflowInspectionQaJournal(prisma).readVerified(requestId, 1)).toEqual(evidence);
    } finally {
      await prisma.$disconnect();
    }
  }, 30_000);

  live.each(["WorkflowExecutionClaim", "WorkflowExecutionObservation", "WorkflowExecutionQaVerification"])(
    "blocks TRUNCATE CASCADE of %s", async (table) => {
      const { prisma, requestId, evidence } = await seededJournal();
      try {
        // A failed regression must also roll back the truncate in this disposable DB.
        // The table comes only from the fixed test cases above, never user input.
        await expect(prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
          throw new Error("TRUNCATE unexpectedly succeeded");
        })).rejects.toThrow("Execution journal is append-only");
        expect(await new PostgresWorkflowInspectionQaJournal(prisma).readVerified(requestId, 1)).toEqual(evidence);
      } finally {
        await prisma.$disconnect();
      }
    }, 30_000
  );

  live("cannot recycle a claim that has no observation yet", async () => {
    const { prisma } = await seededJournal();
    const requestId = "sha256:" + randomBytes(32).toString("hex");
    try {
      const journal = new PostgresWorkflowExecutionJournal(prisma);
      expect(await journal.claim(requestId, new Date(Date.now() + 60_000).toISOString())).toBe(true);
      await expect(prisma.workflowExecutionClaim.delete({ where: { requestId } }))
        .rejects.toThrow("Execution journal is append-only");
      expect(await journal.claim(requestId, new Date(Date.now() + 60_000).toISOString())).toBe(false);
    } finally {
      await prisma.$disconnect();
    }
  }, 30_000);

  live("rolls back a new attempt and retains replay protection after reconnect", async () => {
    const { prisma, url, requestId, evidence } = await seededJournal();
    try {
      await expect(prisma.$transaction(async (tx) => {
        await tx.workflowExecutionObservation.create({
          data: {
            requestId, attempt: 2, outcome: "runner-error", observationDigest: null,
            evidenceReferences: [], filesTouched: [], tokensUsed: 0
          }
        });
        throw new Error("abort attempt transaction");
      })).rejects.toThrow("abort attempt transaction");
      expect(await prisma.workflowExecutionObservation.findUnique({
        where: { requestId_attempt: { requestId, attempt: 2 } }
      })).toBeNull();
    } finally {
      await prisma.$disconnect();
    }
    const reconnected = createPrismaClient(url);
    try {
      const journal = new PostgresWorkflowExecutionJournal(reconnected);
      const stored = await journal.read(requestId);
      expect(stored.claimed).toBe(true);
      expect(stored.attempts).toHaveLength(1);
      expect(stored.attempts[0].observationDigest).toBe(evidence.observationDigest);
      expect(await journal.claim(requestId, new Date(Date.now() + 60_000).toISOString())).toBe(false);
      expect(await new PostgresWorkflowInspectionQaJournal(reconnected).readVerified(requestId, 1)).toEqual(evidence);
    } finally {
      await reconnected.$disconnect();
    }
  }, 30_000);

  live("requires the matching succeeded observation and blocks forgery/duplicates", async () => {
    const url = process.env.DATABASE_URL ?? "";
    expect(url).toContain("localhost");
    expect(url).toContain("blueprint_qa_test");
    const prisma = createPrismaClient(url);
    const requestId = "sha256:" + randomBytes(32).toString("hex");
    const obs = "sha256:" + "b".repeat(64);
    const source = "c".repeat(40);
    try {
      await prisma.workflowExecutionClaim.create({
        data: {requestId, expiresAt: new Date(Date.now() + 60_000)}
      });
      await prisma.workflowExecutionObservation.create({
        data: {
          requestId,attempt:1,outcome:"succeeded",
          observationDigest:obs,
          evidenceReferences:["github:BlueDragon33/Software-Blueprint-Hub@" + source + "#README.md"],
          filesTouched:[], tokensUsed:0
        }
      });
      await prisma.workflowExecutionObservation.create({
        data: {
          requestId,attempt:2,outcome:"failed",
          observationDigest:"sha256:" + "d".repeat(64),
          evidenceReferences:["github:BlueDragon33/Software-Blueprint-Hub@" + source + "#README.md"],
          filesTouched:[], tokensUsed:0
        }
      });
      const journal=new PostgresWorkflowInspectionQaJournal(prisma);
      const evidence={requestId,attempt:1,observationDigest:obs,
        sourceRevision:source,verifiedFiles:1,verifierId:INDEPENDENT_INSPECTION_VERIFIER_ID};
      await journal.appendVerified(evidence);
      expect(await journal.readVerified(requestId,1)).toEqual(evidence);
      await expect(journal.appendVerified(evidence)).rejects.toThrow();
      await expect(journal.appendVerified({...evidence,attempt:2,observationDigest:"sha256:" + "d".repeat(64)})).rejects.toThrow();
      await prisma.workflowExecutionObservation.create({
        data: {
          requestId,attempt:3,outcome:"succeeded",
          observationDigest:"sha256:"+"e".repeat(64),
          evidenceReferences:["github:BlueDragon33/Software-Blueprint-Hub@" + source + "#README.md"],
          filesTouched:["README.md"], tokensUsed:0
        }
      });
      await expect(journal.appendVerified({...evidence,attempt:3,observationDigest:"sha256:"+"e".repeat(64)})).rejects.toThrow();
      await expect(journal.appendVerified({...evidence,attempt:4})).rejects.toThrow();
      await expect(journal.readVerified(requestId,2)).resolves.toBeNull();
    } finally {
      await prisma.$disconnect();
    }
  },30_000);
});
