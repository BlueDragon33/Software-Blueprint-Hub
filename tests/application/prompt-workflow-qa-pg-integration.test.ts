import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createPrismaClient } from "../../packages/persistence/src/client";
import {
  PostgresWorkflowInspectionQaJournal, INDEPENDENT_INSPECTION_VERIFIER_ID
} from "../../packages/runtime/src/workflow-inspection-qa-journal";

/**
 * Isolated CI-PostgreSQL integration. Never points at Preview/Production
 * credentials; the test workflow creates and discards its own database.
 */
describe("real PostgreSQL immutable QA verification integrity", () => {
  const live = process.env.BLUEPRINT_QA_DB_INTEGRATION === "true" ? it : it.skip;

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
