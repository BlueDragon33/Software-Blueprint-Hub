import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import type { PromptProjection } from "../../packages/contracts/src";
import {
  PromptWorkflowPreviewService,
  type PromptProjectionApplicationService
} from "../../packages/application/src";

const reference = JSON.parse(readFileSync(
  new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url),
  "utf8"
)) as unknown;
const projectId = "project:application-management";
const workflowId = "app-management-visa-form-recovery";
const SHA = "a".repeat(40);
const DIGEST = "sha256:" + "b".repeat(64);
const hash = (content: string) => "sha256:" + createHash("sha256").update(content).digest("hex");

function baseCanonical(): PromptProjection {
  const content = "# Existing authorized canonical prompt\nSource digest is bound.\n";
  return {
    id: "prompt-projection:" + "d".repeat(32),
    projectId,
    sourceRevision: DIGEST,
    templateVersion: "execution-prompt:v1",
    generatedAt: "2026-10-13T02:00:00.000Z",
    content,
    contentHash: hash(content)
  };
}

function fixture(input: {
  workflow?: unknown;
  canonical?: PromptProjection;
  head?: string;
  failedAuth?: boolean;
} = {}) {
  const canonical = vi.fn(async (_actor: unknown, _projectId: string) => {
    if (input.failedAuth) throw new Error("PROJECT_READ denied");
    return input.canonical ?? baseCanonical();
  });
  const registry = vi.fn(async (_id: string) => input.workflow ?? structuredClone(reference));
  const revision = vi.fn(async (_repo: string) => input.head ?? SHA);
  const service = new PromptWorkflowPreviewService(
    { generate: canonical } as unknown as PromptProjectionApplicationService,
    { read: registry },
    { readHead: revision },
    "1.3.0",
    () => "2026-10-13T02:10:00.000Z"
  );
  return { service, canonical, registry, revision };
}

describe("Central Workflow Node → authorized canonical Prompt Projection", () => {
  it("renders an actual contract-valid read-only prompt with both layers and trusted HEAD", async () => {
    const { service, canonical, registry, revision } = fixture();
    const result = await service.preview(null, projectId, workflowId, "inventory");
    expect(canonical).toHaveBeenCalledOnce();
    expect(canonical).toHaveBeenCalledWith(null, projectId);
    expect(registry).toHaveBeenCalledWith(workflowId);
    expect(revision).toHaveBeenCalledWith("BlueDragon33/Application-Management");
    expect(result.status).toBe("candidate");
    expect(result.canonicalPromptRevision).toBe(DIGEST);
    expect(result.appHead).toBe(SHA);
    expect(result.projection.templateVersion).toBe("workflow-node:v1");
    expect(result.projection.content).toContain("Existing authorized canonical prompt");
    expect(result.projection.content).toContain("Application HEAD: " + SHA);
    expect(result.projection.content).toContain("No self-PASS");
    expect(result.projection.contentHash).toBe(hash(result.projection.content));
    expect(result.projection.sourceRevision).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  it("changes revision on project HEAD, manifest node, policy or canonical source drift", async () => {
    const first = await fixture().service.preview(null, projectId, workflowId, "inventory");
    const movedHead = await fixture({ head: "c".repeat(40) }).service.preview(null, projectId, workflowId, "inventory");
    const manifest = structuredClone(reference) as { nodes: { goal: string }[] };
    manifest.nodes[0]!.goal += " Now inspect the failed save flow.";
    const updatedManifest = await fixture({ workflow: manifest }).service.preview(null, projectId, workflowId, "inventory");
    const changedCanonical = { ...baseCanonical(), sourceRevision: "sha256:" + "f".repeat(64) };
    const changedState = await fixture({ canonical: changedCanonical }).service.preview(null, projectId, workflowId, "inventory");
    expect(movedHead.projection.sourceRevision).not.toBe(first.projection.sourceRevision);
    expect(updatedManifest.projection.sourceRevision).not.toBe(first.projection.sourceRevision);
    expect(changedState.projection.sourceRevision).not.toBe(first.projection.sourceRevision);
    const identical = await fixture().service.preview(null, projectId, workflowId, "inventory");
    expect(identical.projection.contentHash).toBe(first.projection.contentHash);
  });

  it("does not read workflow or repository when underlying authorization is denied", async () => {
    const { service, registry, revision } = fixture({ failedAuth: true });
    await expect(service.preview(null, projectId, workflowId, "inventory")).rejects.toThrow("PROJECT_READ denied");
    expect(registry).not.toHaveBeenCalled();
    expect(revision).not.toHaveBeenCalled();
  });

  it("rejects identity mismatch, unknown and gated successor nodes", async () => {
    const { service } = fixture();
    await expect(service.preview(null, "project:other", workflowId, "inventory")).rejects.toThrow("identity mismatch");
    await expect(service.preview(null, projectId, workflowId, "unknown")).rejects.toThrow("Unknown workflow node");
    await expect(service.preview(null, projectId, workflowId, "patch")).rejects.toThrow("unmet dependencies");
    const wrong = structuredClone(reference) as { workflowId: string };
    wrong.workflowId = "another";
    await expect(fixture({ workflow: wrong }).service.preview(null, projectId, workflowId, "inventory")).rejects.toThrow("identity mismatch");
  });

  it("does not trust unsigned approval, release gate or malformed HEAD", async () => {
    const approved = structuredClone(reference) as { status: string };
    approved.status = "approved";
    await expect(fixture({ workflow: approved }).service.preview(null, projectId, workflowId, "inventory")).rejects.toThrow("must remain a candidate");
    await expect(fixture({ head: "" }).service.preview(null, projectId, workflowId, "inventory")).rejects.toThrow("HEAD is unavailable");
    const noHash = { ...baseCanonical(), contentHash: "sha256:" + "f".repeat(64) };
    await expect(fixture({ canonical: noHash }).service.preview(null, projectId, workflowId, "inventory")).rejects.toThrow("content hash mismatch");
  });

  it("never accidentally persists candidate preview as canonical history", async () => {
    const { service, canonical } = fixture();
    await service.preview(null, projectId, workflowId, "inventory");
    expect(canonical).toHaveBeenCalledTimes(1);
    expect("generateAndRecord" in service).toBe(false);
  });
});
