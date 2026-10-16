import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { ScopedGitHubReadExecutor } from "../../packages/runtime/src/workflow-scoped-github-executor";
import { PinnedInspectionQaVerifier } from "../../packages/runtime/src/workflow-observation-qa";
import type { WorkflowScopedAction } from "../../packages/application/src/prompt-workflow-execution";

// Actual GitHub App credential/transport proof only. No signed execution grant,
// adoption, database journal, Quality Gate or P4 acceptance is asserted here.
const enabled = process.env.BLUEPRINT_LIVE_PRIVATE_BRIDGE === "true";
const live = enabled ? it : it.skip;
const executionToken = process.env.BLUEPRINT_EXECUTION_READ_TOKEN ?? "";
const qaToken = process.env.BLUEPRINT_QA_READ_TOKEN ?? "";
const onboarding = JSON.parse(readFileSync("control/private-execution-service-onboarding.v1.json", "utf8")) as {
  entries: Array<{ repository: string; sourceRevision: string }>;
};
const repositories = [
  { repository: "BlueDragon33/Software-Blueprint-Hub", sourceRevision: process.env.BLUEPRINT_LIVE_HUB_SHA ?? "" },
  ...onboarding.entries
];
const expectedNames = [
  "BlueDragon33/Software-Blueprint-Execution-Gateway",
  "BlueDragon33/Software-Blueprint-Execution-Worker",
  "BlueDragon33/Software-Blueprint-Hub",
  "BlueDragon33/Software-Blueprint-QA-Worker"
].sort();

async function github(path: string, token: string, method = "GET"): Promise<Response> {
  return fetch("https://api.github.com" + path, {
    method, redirect: "error", cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json", Authorization: "Bearer " + token,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    signal: AbortSignal.timeout(8000)
  });
}

async function assertHead(repository: string, expected: string, token: string): Promise<void> {
  const response = await github("/repos/" + repository + "/commits/main", token);
  expect(response.status).toBe(200);
  const commit = await response.json() as { sha: string };
  expect(commit.sha).toBe(expected);
}

function action(repository: string, sourceRevision: string): WorkflowScopedAction {
  return {
    requestId: "sha256:" + createHash("sha256").update("app-bridge:" + repository + "@" + sourceRevision).digest("hex"),
    projectId: "project:blueprint-os", repository, appHead: sourceRevision,
    nodeId: "inventory", mode: "inspect-scoped", allowedPaths: ["README.md"],
    maxFiles: 1, maxTokenEstimate: 1000, attempt: 1
  };
}

describe("live selected-repository App bridge (not full execution acceptance)", () => {
  afterAll(async () => {
    if (!enabled || !executionToken) return;
    // The workflow also retains the official action's post-job revocation.
    // Accept 401 here when the explicit revocation test already succeeded.
    const response = await github("/installation/token", executionToken, "DELETE");
    expect([204, 401].includes(response.status)).toBe(true);
  });

  live("uses separate App tokens restricted to exactly the four selected repositories", async () => {
    expect(Boolean(executionToken && qaToken)).toBe(true);
    expect(executionToken === qaToken).toBe(false); // Never print token values in assertions.
    expect(repositories.map(value => value.repository).sort()).toEqual(expectedNames);
    for (const token of [executionToken, qaToken]) {
      const response = await github("/installation/repositories?per_page=100", token);
      expect(response.status).toBe(200);
      const body = await response.json() as { total_count: number; repositories: Array<{ full_name: string }> };
      expect(body.total_count).toBe(4);
      expect(body.repositories.map(value => value.full_name).sort()).toEqual(expectedNames);
    }
  }, 30_000);

  live.each(repositories)("independently reads README at the exact current SHA: $repository", async ({ repository, sourceRevision }) => {
    expect(sourceRevision).toMatch(/^[0-9a-f]{40}$/);
    await assertHead(repository, sourceRevision, executionToken);
    const scope = action(repository, sourceRevision);
    const runner = new ScopedGitHubReadExecutor({ repository, tokenProvider: async () => executionToken });
    const verifier = new PinnedInspectionQaVerifier({ tokenProvider: async () => qaToken });
    const observed = await runner.execute(scope);
    expect(observed.outcome).toBe("succeeded");
    expect(observed.filesTouched).toEqual([]);
    expect(observed.tokensUsed).toBe(0);
    const proof = await verifier.verify(scope, { ...observed, attempt: 1 });
    expect(proof.status).toBe("verified-inspection-bytes");
    expect(proof.sourceRevision).toBe(sourceRevision);
    expect(proof.observationDigest).toBe(observed.observationDigest);
    expect(proof.completionReceiptIssued || proof.qualityGatePassed || proof.productionAuthorized).toBe(false);
    await assertHead(repository, sourceRevision, qaToken);
  }, 30_000);

  live("fails closed for an invalid GitHub credential against a selected private repository", async () => {
    const source = repositories.find(value => value.repository.endsWith("Execution-Gateway"))!;
    const runner = new ScopedGitHubReadExecutor({ repository: source.repository, tokenProvider: async () => "invalid-blueprint-preview-token" });
    await expect(runner.execute(action(source.repository, source.sourceRevision))).rejects.toThrow("(401)");
  }, 15_000);

  live("rejects a request outside the trusted repository binding", async () => {
    const runner = new ScopedGitHubReadExecutor({ repository: "BlueDragon33/Software-Blueprint-Hub", tokenProvider: async () => executionToken });
    const source = repositories.find(value => value.repository.endsWith("Execution-Gateway"))!;
    await expect(runner.execute(action(source.repository, source.sourceRevision))).rejects.toThrow("out-of-scope");
  });

  live("revokes the execution token and confirms the independent QA token still works", async () => {
    const source = repositories.find(value => value.repository.endsWith("Execution-Gateway"))!;
    const path = "/repos/" + source.repository + "/contents/README.md?ref=" + source.sourceRevision;
    expect((await github(path, executionToken)).status).toBe(200);
    expect((await github("/installation/token", executionToken, "DELETE")).status).toBe(204);
    expect((await github(path, executionToken)).status).toBe(401);
    expect((await github(path, qaToken)).status).toBe(200);
  }, 30_000);
});
