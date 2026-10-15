import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ScopedGitHubReadExecutor } from "../../packages/runtime/src/workflow-scoped-github-executor";
import { PinnedInspectionQaVerifier } from "../../packages/runtime/src/workflow-observation-qa";
import type { WorkflowScopedAction } from "../../packages/application/src/prompt-workflow-execution";

/**
 * Opt-in smoke of actual GitHub bytes. This tests the read-only transport and
 * independent QA only. No signed grant, workflow adoption, Postgres journal,
 * canonical Quality Gate, Production approval or product release is asserted.
 */
describe("live GitHub pinned source inspection and independent byte QA", () => {
  const smoke = process.env.BLUEPRINT_LIVE_PINNED_SMOKE === "true" ? it : it.skip;
  smoke("re-reads the same exact commit with independent source requests", async () => {
    const repo = "BlueDragon33/Software-Blueprint-Hub";
    const revision = process.env.BLUEPRINT_LIVE_SOURCE_SHA ?? "";
    expect(revision).toMatch(/^[0-9a-f]{40}$/);
    const token = process.env.GITHUB_TOKEN?.trim();
    expect(token).toBeTruthy();

    const action: WorkflowScopedAction = {
      requestId: "sha256:" + createHash("sha256")
        .update("bounded smoke " + revision).digest("hex"),
      projectId: "project:blueprint-os",
      repository: repo,
      appHead: revision,
      nodeId: "inventory",
      mode: "inspect-scoped",
      allowedPaths: ["README.md"],
      maxFiles: 1,
      maxTokenEstimate: 1000,
      attempt: 1
    };

    // Both calls happen separately over the GitHub API, not via the executor
    // response used as an oracle for QA. They share only a read-only credential.
    const executor = new ScopedGitHubReadExecutor({
      repository: repo, tokenProvider: async () => token ?? null
    });
    const independentQa = new PinnedInspectionQaVerifier({
      tokenProvider: async () => token ?? null
    });

    const raw = await executor.execute(action);
    expect(raw.outcome).toBe("succeeded");
    expect(raw.filesTouched).toEqual([]);
    expect(raw.tokensUsed).toBe(0);
    expect(raw.evidenceReferences).toEqual([
      "github:" + repo + "@" + revision + "#README.md"
    ]);
    const qa = await independentQa.verify(action, {
      attempt: 1,
      outcome: raw.outcome,
      observationDigest: raw.observationDigest,
      evidenceReferences: raw.evidenceReferences,
      filesTouched: raw.filesTouched,
      tokensUsed: raw.tokensUsed
    });
    expect(qa.status).toBe("verified-inspection-bytes");
    expect(qa.observationDigest).toBe(raw.observationDigest);
    expect(qa.sourceRevision).toBe(revision);
    expect(qa.completionReceiptIssued).toBe(false);
    expect(qa.qualityGatePassed).toBe(false);
    expect(qa.productionAuthorized).toBe(false);
  }, 30_000);
});
