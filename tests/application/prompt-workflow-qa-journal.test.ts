import { describe, expect, it, vi } from "vitest";
import type { BlueprintPrismaClient } from "../../packages/persistence/src/client";
import {
  PostgresWorkflowInspectionQaJournal,
  INDEPENDENT_INSPECTION_VERIFIER_ID,
  type DurableInspectionQaRecord
} from "../../packages/runtime/src/workflow-inspection-qa-journal";

const proof: DurableInspectionQaRecord = {
  requestId:"sha256:" + "a".repeat(64), attempt:1,
  observationDigest:"sha256:" + "b".repeat(64),
  sourceRevision:"c".repeat(40),
  verifiedFiles:1,
  verifierId:INDEPENDENT_INSPECTION_VERIFIER_ID
};

function fixture() {
  const rows = new Map<string, DurableInspectionQaRecord>();
  const db = {
    workflowExecutionQaVerification: {
      create: vi.fn(async ({data}: {data:DurableInspectionQaRecord}) => {
        const key = data.requestId + ":" + data.attempt;
        if (rows.has(key)) throw Object.assign(new Error("Unique violation"), {code:"P2002"});
        rows.set(key,{...data});
        return data;
      }),
      findUnique: vi.fn(async ({where}: {where:{requestId_attempt:{requestId:string;attempt:number}}}) =>
        rows.get(where.requestId_attempt.requestId + ":" + where.requestId_attempt.attempt) ?? null)
    }
  };
  const journal = new PostgresWorkflowInspectionQaJournal(db as unknown as BlueprintPrismaClient);
  return {journal,db,rows};
}

describe("append-only independent QA evidence journal", () => {
  it("writes verified evidence exactly once and supports restart-safe read-back", async () => {
    const {journal,db} = fixture();
    expect(await journal.appendVerified(proof)).toBeUndefined();
    expect(await journal.readVerified(proof.requestId,1)).toEqual(proof);
    expect(Object.keys(db.workflowExecutionQaVerification)).toEqual(["create","findUnique"]);
    await expect(journal.appendVerified(proof)).rejects.toMatchObject({code:"P2002"});
  });
  it("rejects invalid digest, revision, count, verifier and request ID before DB access", async () => {
    const {journal,db}=fixture();
    for (const bad of [
      {...proof,observationDigest:"fake"},
      {...proof,sourceRevision:"main"},
      {...proof,verifiedFiles:31},
      {...proof,verifierId:"runner"} as unknown as DurableInspectionQaRecord,
      {...proof,requestId:"bad"}
    ]) {
      await expect(journal.appendVerified(bad)).rejects.toThrow(/Invalid independent QA/);
    }
    expect(db.workflowExecutionQaVerification.create).not.toHaveBeenCalled();
  });
  it("surfaces DB/migration failure and never claims verification", async () => {
    const {journal,db} = fixture();
    db.workflowExecutionQaVerification.create.mockRejectedValueOnce(new Error("Table missing"));
    await expect(journal.appendVerified(proof)).rejects.toThrow("Table missing");
    expect(await journal.readVerified(proof.requestId,1)).toBeNull();
  });
  it("refuses malformed stored evidence instead of returning a success", async () => {
    const {journal,rows} = fixture();
    rows.set(proof.requestId + ":1",{...proof,sourceRevision:"untrusted"});
    await expect(journal.readVerified(proof.requestId,1)).rejects.toThrow(/Invalid independent QA/);
  });
  it("refuses invalid read key", async () => {
    const {journal}=fixture();
    await expect(journal.readVerified("unknown",1)).rejects.toThrow(/Invalid independent QA/);
  });
});
