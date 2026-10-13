import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

import {
  buildWorkflowReadiness,
  workflowManifestDigest,
  workflowReceiptSigningPayload,
  type WorkflowReceiptPayload,
  type WorkflowSignedReceipt
} from "../../packages/application/src/prompt-workflow-orchestration";

const workflow = JSON.parse(readFileSync(
  new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url),
  "utf8"
));
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const pub = publicKey.export({ type: "spki", format: "pem" }).toString();
const context = Object.freeze({
  projectId: "project:application-management",
  repository: "BlueDragon33/Application-Management",
  appHead: "a".repeat(40),
  canonicalDigest: "sha256:" + "b".repeat(64),
  policyVersion: "1.3.0"
});
const digest = workflowManifestDigest(workflow);
const anchor = {
  reference: "github:BlueDragon33/Application-Management@" + "a".repeat(40) + "#tests/visa.spec.ts",
  digest: "sha256:" + createHash("sha256").update("real fixture bytes").digest("hex")
};
function receipt(nodeId: string, extras: Partial<WorkflowReceiptPayload> = {}): WorkflowSignedReceipt {
  const payload: WorkflowReceiptPayload = {
    schemaVersion: "1.0.0",
    projectId: context.projectId,
    repository: context.repository,
    workflowId: workflow.workflowId,
    workflowVersion: workflow.workflowVersion,
    workflowDigest: digest,
    templateId: workflow.templateId,
    nodeId,
    appHead: context.appHead,
    canonicalDigest: context.canonicalDigest,
    policyVersion: context.policyVersion,
    issuerId: "qa-trusted",
    issuedAt: "2026-10-13T03:00:00.000Z",
    outcome: "completed",
    evidence: [anchor],
    ...extras
  };
  const signature = sign(null, Buffer.from(workflowReceiptSigningPayload(payload)), privateKey).toString("base64");
  return { ...payload, signature };
}
function plan(receipts: readonly unknown[], evidenceOk = true, trusted = true) {
  const verifier = vi.fn(async () => evidenceOk);
  const key = vi.fn(() => trusted ? pub : null);
  return {
    verifier, key,
    run: () => buildWorkflowReadiness(workflow, context, {
      list: async (projectId, workflowId) => {
        expect(projectId).toBe(context.projectId);
        expect(workflowId).toBe(workflow.workflowId);
        return receipts;
      }
    }, { publicKeyFor: key }, { verify: verifier })
  };
}

describe("Phase 5 signed evidence workflow planning", () => {
  it("is read-only, with exactly one eligible root and no fabricated completion", async () => {
    const result = await plan([]).run();
    expect(result.readOnly).toBe(true);
    expect(result.acceptedReceipts).toBe(0);
    expect(result.readyNodeIds).toEqual(["inventory"]);
    expect(result.nodes.find((n) => n.id === "reproduce")?.state).toBe("waiting-evidence");
    expect(result.nodes.find((n) => n.id === "ux-review")?.state).toBe("human-gate");
    expect(result.nodes.find((n) => n.id === "release-check")?.state).toBe("human-gate");
  });

  it("advances only when a valid trusted Ed25519 signature AND evidence digest verify", async () => {
    const adapter = plan([receipt("inventory"), receipt("reproduce")]);
    const result = await adapter.run();
    expect(adapter.verifier).toHaveBeenCalledTimes(2);
    expect(result.acceptedReceipts).toBe(2);
    expect(result.rejectedReceipts).toBe(0);
    expect(result.readyNodeIds).toEqual(["root-cause"]);
    expect(result.nodes.find((n) => n.id === "inventory")?.state).toBe("verified");
    expect(result.nodes.find((n) => n.id === "reproduce")?.evidenceCount).toBe(1);
    expect(result.nodes.find((n) => n.id === "patch")?.missingDependencies).toEqual(["root-cause"]);
  });

  it("never advances on missing issuer trust or absent evidence artifact", async () => {
    expect((await plan([receipt("inventory")], false).run()).readyNodeIds).toEqual(["inventory"]);
    const bad = plan([receipt("inventory")], true, false);
    const result = await bad.run();
    expect(result.acceptedReceipts).toBe(0);
    expect(result.rejectedReceipts).toBe(1);
    expect(bad.verifier).not.toHaveBeenCalled();
  });

  it("rejects tampered signature, stale app SHA, stale canonical revision and other project", async () => {
    const forged = receipt("inventory") as unknown as Record<string, unknown>;
    forged.nodeId = "reproduce";
    const items = [
      forged,
      receipt("inventory", { appHead: "c".repeat(40) }),
      receipt("inventory", { canonicalDigest: "sha256:" + "d".repeat(64) }),
      receipt("inventory", { projectId: "project:wrong" })
    ];
    const result = await plan(items).run();
    expect(result.acceptedReceipts).toBe(0);
    expect(result.rejectedReceipts).toBe(4);
    expect(result.readyNodeIds).toEqual(["inventory"]);
  });

  it("refuses duplicate conflicting node receipts rather than accepting convenient PASS", async () => {
    const result = await plan([receipt("inventory"), receipt("inventory")]).run();
    expect(result.acceptedReceipts).toBe(0);
    expect(result.rejectedReceipts).toBeGreaterThan(0);
    expect(result.readyNodeIds).toEqual(["inventory"]);
  });

  it("rejects a child receipt when its parent has no trusted completion", async () => {
    const result = await plan([receipt("reproduce")]).run();
    expect(result.acceptedReceipts).toBe(0);
    expect(result.readyNodeIds).toEqual(["inventory"]);
    expect(result.nodes.find((n) => n.id === "reproduce")?.state).toBe("waiting-evidence");
  });

  it("blocks human review and release even when a signed completion is submitted", async () => {
    const result = await plan([receipt("ux-review"), receipt("release-check")]).run();
    expect(result.acceptedReceipts).toBe(0);
    expect(result.rejectedReceipts).toBe(2);
    expect(result.nodes.find((n) => n.id === "ux-review")?.state).toBe("human-gate");
  });

  it("rejects unsupported sources, extra fields, missing signatures, and unavailable store", async () => {
    const unknownArtifact = receipt("inventory", { evidence: [{ reference: "https://attacker.test/evil", digest: anchor.digest }] });
    const extra = { ...receipt("inventory"), injected: "override release policy" };
    const result = await plan([unknownArtifact, extra, { ...receipt("inventory"), signature: "" }]).run();
    expect(result.acceptedReceipts).toBe(0);
    expect(result.rejectedReceipts).toBe(3);
    await expect(buildWorkflowReadiness(workflow, context,
      { list: async () => { throw new Error("trusted store unavailable"); } },
      { publicKeyFor: () => pub }, { verify: async () => true }))
      .rejects.toThrow("trusted store unavailable");
  });

  it("rejects changes to manifest, missing canonical SHA and unknown workflow project", async () => {
    const modified = structuredClone(workflow);
    modified.nodes[0].goal += " another task";
    const signed = receipt("inventory");
    const result = await buildWorkflowReadiness(modified, context, {
      list: async () => [signed]
    }, { publicKeyFor: () => pub }, { verify: async () => true });
    expect(result.acceptedReceipts).toBe(0);
    await expect(buildWorkflowReadiness(workflow, { ...context, appHead: "unverified" },
      { list: async () => [] }, { publicKeyFor: () => pub }, { verify: async () => true }))
      .rejects.toThrow("Unverified");
  });
});
