import { describe, expect, it, vi } from "vitest";
import type { BlueprintPrismaClient } from "../../packages/persistence/src/client";
import type { WorkflowAttemptRecord } from "../../packages/application/src/prompt-workflow-execution";
import { PostgresWorkflowExecutionJournal } from "../../packages/runtime/src/workflow-execution-journal";

const requestId = "sha256:" + "a".repeat(64);
const future = new Date(Date.now() + 15 * 60_000).toISOString();
const record: WorkflowAttemptRecord = {
  attempt: 1,
  outcome: "failed",
  observationDigest: "sha256:" + "b".repeat(64),
  evidenceReferences: ["github:BlueDragon33/Application-Management@" + "c".repeat(40) + "#tests/form.ts"],
  filesTouched: ["src/form.ts"],
  tokensUsed: 300
};

function fixture() {
  const claimed = new Set<string>();
  const attempts = new Map<string, WorkflowAttemptRecord>();
  const db = {
    workflowExecutionClaim: {
      create: vi.fn(async ({ data }: { data: { requestId: string; expiresAt: Date } }) => {
        if (claimed.has(data.requestId)) {
          throw Object.assign(new Error("Unique constraint failed"), { code: "P2002" });
        }
        claimed.add(data.requestId);
        return data;
      }),
      findUnique: vi.fn(async ({ where }: { where: { requestId: string } }) =>
        claimed.has(where.requestId) ? { requestId: where.requestId } : null)
    },
    workflowExecutionObservation: {
      create: vi.fn(async ({ data }: { data: WorkflowAttemptRecord & { requestId: string } }) => {
        if (!claimed.has(data.requestId)) {
          throw Object.assign(new Error("Claim FK required"), { code: "P2003" });
        }
        const key = data.requestId + ":" + data.attempt;
        if (attempts.has(key)) {
          throw Object.assign(new Error("Duplicate attempt"), { code: "P2002" });
        }
        attempts.set(key, data);
        return data;
      }),
      findMany: vi.fn(async ({ where }: { where: { requestId: string } }) =>
        [...attempts.values()].filter((x) => x.requestId === where.requestId))
    }
  };
  const journal = new PostgresWorkflowExecutionJournal(db as unknown as BlueprintPrismaClient);
  return { journal, db, claimed, attempts };
}

describe("Phase 5C Postgres execution journal", () => {
  it("atomically claims once and never recycles the nonce, even after restart", async () => {
    const { journal, db } = fixture();
    expect(await journal.claim(requestId, future)).toBe(true);
    expect(await journal.claim(requestId, future)).toBe(false);
    expect(db.workflowExecutionClaim.create).toHaveBeenCalledTimes(2);
  });

  it("propagates storage connection/schema failure instead of claiming success", async () => {
    const { journal, db } = fixture();
    db.workflowExecutionClaim.create.mockRejectedValueOnce(new Error("Database unavailable"));
    await expect(journal.claim(requestId, future)).rejects.toThrow("Database unavailable");
    expect(await journal.claim(requestId, future)).toBe(true);
  });

  it("prevents observations before a claim and duplicate attempt overwrites", async () => {
    const { journal } = fixture();
    await expect(journal.append(requestId, record)).rejects.toMatchObject({ code: "P2003" });
    await journal.claim(requestId, future);
    await journal.append(requestId, record);
    await expect(journal.append(requestId, record)).rejects.toMatchObject({ code: "P2002" });
    const audit = await journal.read(requestId);
    expect(audit.claimed).toBe(true);
    expect(audit.attempts).toHaveLength(1);
    expect(audit.attempts[0]).toMatchObject(record);
  });

  it("rejects invalid nonce, expired grants and unexpected journal record content", async () => {
    const { journal, db } = fixture();
    await expect(journal.claim("attacker", future)).rejects.toThrow("Invalid");
    await expect(journal.claim(requestId, "2000-01-01T00:00:00Z")).rejects.toThrow("Expired");
    await expect(journal.append(requestId, { ...record, filesTouched: ["../escape"] }))
      .rejects.toThrow("Invalid");
    await expect(journal.append(requestId, { ...record, evidenceReferences: [] }))
      .rejects.toThrow("real digest");
    expect(db.workflowExecutionObservation.create).not.toHaveBeenCalled();
  });

  it("tracks error records without inventing successful evidence", async () => {
    const { journal } = fixture();
    await journal.claim(requestId, future);
    await journal.append(requestId, {
      attempt: 1, outcome: "runner-error",
      observationDigest: null, evidenceReferences: [],
      filesTouched: [], tokensUsed: 0
    });
    const audit = await journal.read(requestId);
    expect(audit.attempts[0]?.outcome).toBe("runner-error");
    expect(audit.attempts[0]?.observationDigest).toBeNull();
  });

  it("refuses stale or corrupted stored audit records", async () => {
    const { journal, attempts } = fixture();
    await journal.claim(requestId, future);
    attempts.set(requestId + ":1", {
      ...record, requestId, evidenceReferences: ["not-a-trusted-reference"]
    } as WorkflowAttemptRecord & { requestId: string });
    await expect(journal.read(requestId)).rejects.toThrow("Corrupted");
  });

  it("never uses upsert, update or delete for execution observations", async () => {
    const { journal, db } = fixture();
    await journal.claim(requestId, future);
    await journal.append(requestId, record);
    expect(Object.keys(db.workflowExecutionClaim)).toEqual(["create", "findUnique"]);
    expect(Object.keys(db.workflowExecutionObservation)).toEqual(["create", "findMany"]);
  });
});
