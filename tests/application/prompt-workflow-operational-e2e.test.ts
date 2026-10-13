import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  executeEvidenceBoundWorkflowNode,
  workflowExecutionGrantSigningPayload,
  type WorkflowExecutionGrantPayload,
  type WorkflowAttemptRecord
} from "../../packages/application/src/prompt-workflow-execution";
import { workflowManifestDigest } from "../../packages/application/src/prompt-workflow-orchestration";
import { ScopedGitHubReadExecutor } from "../../packages/runtime/src/workflow-scoped-github-executor";

const source = JSON.parse(readFileSync(
  new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url), "utf8"
));
const adopted = { ...source, status: "approved" };
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const key = publicKey.export({ format: "pem", type: "spki" }).toString();
const clock = new Date("2026-10-13T03:05:00.000Z");
const context = {
  projectId: adopted.project.id,
  repository: adopted.project.repo,
  appHead: "a".repeat(40),
  canonicalDigest: "sha256:" + "b".repeat(64),
  policyVersion: "1.3.0"
};

function grant() {
  const payload: WorkflowExecutionGrantPayload = {
    schemaVersion: "1.0.0",
    projectId: context.projectId, repository: context.repository,
    workflowId: adopted.workflowId, workflowVersion: adopted.workflowVersion,
    workflowDigest: workflowManifestDigest(adopted),
    templateId: adopted.templateId, nodeId: "inventory",
    appHead: context.appHead, canonicalDigest: context.canonicalDigest,
    policyVersion: context.policyVersion, issuerId: "trusted-operator",
    nonce: "1".repeat(32),
    issuedAt: "2026-10-13T03:00:00.000Z",
    expiresAt: "2026-10-13T03:10:00.000Z",
    mode: "inspect-scoped", allowedPaths: ["src/visa/form.ts"],
    maxAttempts: 1, maxFiles: 1, maxTokenEstimate: 1000
  };
  return {
    ...payload,
    signature: sign(null, Buffer.from(workflowExecutionGrantSigningPayload(payload)),
      privateKey).toString("base64")
  };
}
const file = {
  type: "file", path: "src/visa/form.ts", size: 18,
  encoding: "base64", content: Buffer.from("actual source code").toString("base64")
};

function harness(options: { approved?: boolean; permit?: boolean; liveHead?: string; token?: string | null } = {}) {
  const observations: WorkflowAttemptRecord[] = [];
  const claims = new Set<string>();
  const fakeHttp = vi.fn(async (request: RequestInfo | URL) => {
    const url = new URL(String(request));
    if (url.searchParams.get("ref") !== context.appHead ||
        url.pathname !== "/repos/BlueDragon33/Application-Management/contents/src/visa/form.ts") {
      return new Response('{"message":"Not found"}', { status: 404 });
    }
    return new Response(JSON.stringify(file), { status: 200 });
  });
  const executor = new ScopedGitHubReadExecutor({
    repository: context.repository,
    http: fakeHttp as unknown as typeof fetch,
    tokenProvider: async () => options.token ?? null
  });
  const fresh = vi.fn(async () => {
    if ((options.liveHead ?? context.appHead) !== context.appHead) {
      throw new Error("Verified repository HEAD drift");
    }
  });
  const authority = {
    publicKeyFor: () => key,
    assertAdopted: async () => {
      if (options.approved === false) throw new Error("No independent adoption");
    },
    assertMayExecute: async () => {
      if (options.permit === false) throw new Error("No scoped operator capability");
    }
  };
  const run = (g: unknown = grant(), workflow = adopted) =>
    executeEvidenceBoundWorkflowNode(g, workflow, context, {
      source: { list: async () => [] },
      trust: { publicKeyFor: () => null },
      verifier: { verify: async () => false },
      authority,
      journal: {
        claim: async (id) => {
          if (claims.has(id)) return false;
          claims.add(id); return true;
        },
        append: async (_id, observation) => { observations.push(observation); }
      },
      runner: executor,
      freshness: { assertCurrent: fresh },
      clock: () => clock
    });
  return { run, observations, claims, fakeHttp, fresh };
}

describe("Real signed workflow to pinned GitHub source to journal E2E", () => {
  it("observes actual pinned source bytes and journals result without any QA or release escalation", async () => {
    const h = harness();
    const report = await h.run();
    expect(report.status).toBe("submitted-for-verification");
    expect(report.attempts).toBe(1);
    expect(report.completionReceiptIssued).toBe(false);
    expect(report.qualityGatePassed).toBe(false);
    expect(report.productionAuthorized).toBe(false);
    expect(h.observations).toHaveLength(1);
    expect(h.observations[0]!.evidenceReferences).toEqual([
      "github:" + context.repository + "@" + context.appHead + "#src/visa/form.ts"
    ]);
    expect(h.observations[0]!.observationDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(h.observations[0]!.filesTouched).toEqual([]);
    expect(h.observations[0]!.tokensUsed).toBe(0);
    expect(h.fakeHttp).toHaveBeenCalledTimes(1);
    expect(h.fresh).toHaveBeenCalledTimes(3);
    await expect(h.run()).rejects.toThrow("replay");
    expect(h.fakeHttp).toHaveBeenCalledTimes(1);
  });

  it("rejects the actual candidate manifest, even when grant is signed", async () => {
    const h = harness();
    await expect(h.run(grant(), source)).rejects.toThrow("approved execution");
    expect(h.fakeHttp).not.toHaveBeenCalled();
  });

  it("blocks unsigned changes, source drift, missing adoption and missing operator authority", async () => {
    const wrong = harness();
    await expect(wrong.run({ ...grant(), allowedPaths: ["secret/password.txt"] }))
      .rejects.toThrow("signature");
    expect(wrong.fakeHttp).not.toHaveBeenCalled();

    const drift = harness({ liveHead: "c".repeat(40) });
    await expect(drift.run()).rejects.toThrow("HEAD drift");
    expect(drift.fakeHttp).not.toHaveBeenCalled();

    const noAdoption = harness({ approved: false });
    await expect(noAdoption.run()).rejects.toThrow("No independent adoption");
    expect(noAdoption.fakeHttp).not.toHaveBeenCalled();

    const noPermission = harness({ permit: false });
    await expect(noPermission.run()).rejects.toThrow("No scoped operator capability");
    expect(noPermission.fakeHttp).not.toHaveBeenCalled();
  });
});
