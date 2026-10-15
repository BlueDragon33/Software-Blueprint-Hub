import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { PinnedInspectionQaVerifier } from "../../packages/runtime/src/workflow-observation-qa";
import type { WorkflowScopedAction, WorkflowAttemptRecord } from "../../packages/application/src/prompt-workflow-execution";

const sha = "a".repeat(40);
const body = Buffer.from("observed source code", "utf8");
const hash = (bytes: Buffer | string) =>
  "sha256:" + createHash("sha256").update(bytes).digest("hex");
const filePath = "src/form.ts";
const sourceRef = "github:BlueDragon33/Application-Management@" + sha + "#" + filePath;
const action: WorkflowScopedAction = {
  requestId: "sha256:" + "b".repeat(64),
  projectId: "project:application-management",
  repository: "BlueDragon33/Application-Management",
  appHead: sha,
  nodeId: "inventory",
  mode: "inspect-scoped",
  allowedPaths: [filePath],
  maxFiles: 1, maxTokenEstimate: 1000, attempt: 1
};
const digest = hash(JSON.stringify({
  schemaVersion: "1.0.0", projectId: action.projectId,
  repository: action.repository, appHead: action.appHead, nodeId: action.nodeId,
  mode: action.mode, files: [{path: filePath, bytes: body.length, sha256: hash(body)}]
}));
const record: WorkflowAttemptRecord = {
  attempt: 1, outcome: "succeeded",
  observationDigest: digest, evidenceReferences: [sourceRef],
  filesTouched: [], tokensUsed: 0
};

function harness(content: unknown = {
  type: "file", path: filePath, size: body.length,
  encoding: "base64", content: body.toString("base64")
}, status = 200) {
  const http = vi.fn(async (_request: RequestInfo | URL) => new Response(JSON.stringify(content), {status}));
  return { http, checker: new PinnedInspectionQaVerifier({http: http as unknown as typeof fetch}) };
}

describe("Independent pinned inspection QA (no self-certified PASS)", () => {
  it("re-reads actual bytes at exact app HEAD and matches runner observation digest", async () => {
    const h = harness();
    const result = await h.checker.verify(action, record);
    expect(result.status).toBe("verified-inspection-bytes");
    expect(result.observationDigest).toBe(digest);
    expect(result.verifiedFiles).toBe(1);
    expect(result.completionReceiptIssued).toBe(false);
    expect(result.qualityGatePassed).toBe(false);
    expect(result.productionAuthorized).toBe(false);
    expect(h.http).toHaveBeenCalledOnce();
    expect(String(h.http.mock.calls[0]?.[0])).toContain("ref=" + sha);
  });

  it("rejects forged digest even if a runner said succeeded", async () => {
    const h = harness();
    await expect(h.checker.verify(action, {...record, observationDigest: hash("fake")})).rejects.toThrow("digest mismatch");
  });
  it("rejects a changed file byte stream after inspection", async () => {
    const changed = Buffer.from("different source bytes");
    const h = harness({type:"file", path:filePath, size:changed.length, encoding:"base64", content:changed.toString("base64")});
    await expect(h.checker.verify(action, record)).rejects.toThrow("digest mismatch");
  });
  it("rejects evidence from another repo or another commit SHA", async () => {
    const h = harness();
    await expect(h.checker.verify(action, {...record,
      evidenceReferences:[sourceRef.replace(sha, "c".repeat(40))]})).rejects.toThrow("not bound");
    expect(h.http).not.toHaveBeenCalled();
  });
  it("rejects malicious scopes, duplicate evidence and fabricated edit/token effects", async () => {
    const h = harness();
    await expect(h.checker.verify(action, {...record, evidenceReferences:[
      sourceRef.replace(filePath, "private/password.ts")]})).rejects.toThrow("escapes signed");
    await expect(h.checker.verify({...action, allowedPaths:["src/../secret"]},record)).rejects.toThrow("scope");
    await expect(h.checker.verify({...action,maxFiles:2}, {...record,evidenceReferences:[sourceRef,sourceRef]})).rejects.toThrow("Duplicate evidence");
    await expect(h.checker.verify(action,{...record,filesTouched:[filePath]})).rejects.toThrow("inconsistent");
    await expect(h.checker.verify(action,{...record,tokensUsed:2})).rejects.toThrow("inconsistent");
    expect(h.http).not.toHaveBeenCalled();
  });
  it("rejects missing, forged or over-budget source bytes", async () => {
    await expect(harness({type:"symlink",path:filePath}).checker.verify(action,record))
      .rejects.toThrow("bounded regular file");
    await expect(harness({type:"file",path:filePath,size:body.length,encoding:"base64",content:"!!!!!!"}).checker.verify(action,record))
      .rejects.toThrow("Malformed independent evidence");
    await expect(harness(undefined,404).checker.verify(action,record))
      .rejects.toThrow("evidence unavailable");
  });
});
