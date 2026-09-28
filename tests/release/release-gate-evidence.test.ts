import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];

async function tempOutput(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "blueprint-release-gate-"));
  tempDirs.push(dir);
  return join(dir, "release-gate-evidence.json");
}

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))
  );
});

describe("Release Gate evidence manifest", () => {
  it("records the exact certified revision without implying production deployment", async () => {
    const output = await tempOutput();
    const revision = "0123456789abcdef0123456789abcdef01234567";

    await execFileAsync(
      process.execPath,
      ["scripts/release-gate-evidence.mjs", output],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          RELEASE_GATE_REVISION: revision,
          GITHUB_REPOSITORY: "BlueDragon33/Software-Blueprint-Hub",
          GITHUB_WORKFLOW: "Release Gate CI",
          GITHUB_RUN_ID: "123456",
          GITHUB_RUN_ATTEMPT: "2",
          GITHUB_EVENT_NAME: "pull_request",
          GITHUB_REF: "refs/pull/27/merge"
        }
      }
    );

    const manifest = JSON.parse(await readFile(output, "utf8"));

    expect(manifest).toMatchObject({
      schemaVersion: "1.0.0",
      kind: "blueprint-os-release-gate-evidence",
      repository: "BlueDragon33/Software-Blueprint-Hub",
      revision,
      workflow: "Release Gate CI",
      runId: "123456",
      runAttempt: "2",
      eventName: "pull_request",
      productionDeploymentAuthorized: false
    });
    expect(manifest.passedChecks).toContain("browser-e2e");
    expect(manifest.passedChecks).toContain("migration-status");
    expect(manifest.passedChecks).toContain("universal-constitution-compliance");
    expect(manifest.passedChecks).toContain("constitution-authority-set");
    expect(manifest.passedChecks).toContain("constitution-ecosystem-snapshot");
    expect(manifest.passedChecks).toContain("constitution-compliance-matrix");
    expect(manifest.passedChecks).toContain("source-of-truth-contradiction");
    expect(manifest.passedChecks).toContain("source-of-truth-detector-self-test");
  });

  it("manual Release Gate includes the governance checks required by P9-020", async () => {
    const workflow = await readFile(
      new URL("../../.github/workflows/release-gate.yml", import.meta.url),
      "utf8"
    );

    expect(workflow).toContain("Universal Constitution compliance");
    expect(workflow).toContain("Constitution authority-set atomicity");
    expect(workflow).toContain("Constitution ecosystem snapshot");
    expect(workflow).toContain("Constitution compliance matrix snapshot");
    expect(workflow).toContain("Source-of-truth contradiction gate");
    expect(workflow).toContain("Source-of-truth detector self-test");
    expect(workflow).toContain("pnpm constitution:check");
    expect(workflow).toContain("pnpm check:truth");
    expect(workflow).toContain("pnpm test:truth");
  });

  it("rejects a non-exact revision instead of producing ambiguous evidence", async () => {
    const output = await tempOutput();

    await expect(
      execFileAsync(
        process.execPath,
        ["scripts/release-gate-evidence.mjs", output],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            RELEASE_GATE_REVISION: "main",
            GITHUB_REPOSITORY: "BlueDragon33/Software-Blueprint-Hub",
            GITHUB_WORKFLOW: "Release Gate CI",
            GITHUB_RUN_ID: "123456",
            GITHUB_RUN_ATTEMPT: "1",
            GITHUB_EVENT_NAME: "workflow_dispatch"
          }
        }
      )
    ).rejects.toThrow(/40-character Git commit SHA/);
  });
});
