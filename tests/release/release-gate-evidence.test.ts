import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const tempDirs: string[] = [];
const script = fileURLToPath(new URL("../../scripts/release-gate-evidence.mjs", import.meta.url));

async function reportFixture(output: string) {
  const dir = join(output, "..", "artifacts");
  await mkdir(dir);
  await Promise.all([
    writeFile(join(dir, "constitution-node-tests.xml"), '<testsuites><testsuite><testcase name="candidate" /></testsuite></testsuites>'),
    writeFile(join(dir, "source-truth-tests.xml"), '<testsuites><testsuite><testcase name="truth" /></testsuite></testsuites>'),
    writeFile(join(dir, "vitest-results.json"), JSON.stringify({ numPassedTests: 3, numFailedTests: 0, numPendingTests: 0 })),
    writeFile(join(dir, "playwright-results.json"), JSON.stringify({ stats: { expected: 4, unexpected: 0, skipped: 0, flaky: 0 } }))
  ]);
  return dir;
}

function runEvidence(output: string, revision = "0123456789abcdef0123456789abcdef01234567") {
  return execFileAsync(process.execPath, [script, output], {
    cwd: join(output, ".."),
    env: { ...process.env, RELEASE_GATE_REVISION: revision,
      GITHUB_REPOSITORY: "BlueDragon33/Software-Blueprint-Hub", GITHUB_WORKFLOW: "Release Gate CI",
      GITHUB_RUN_ID: "123456", GITHUB_RUN_ATTEMPT: "2", GITHUB_EVENT_NAME: "pull_request", GITHUB_REF: "refs/pull/27/merge" }
  });
}

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
    await reportFixture(output);
    await runEvidence(output, revision);

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
      productionDeploymentAuthorized: false,
      testResults: {
        node: { passed: 2, failed: 0, skipped: 0 },
        vitest: { passed: 3, failed: 0, skipped: 0 },
        browser: { passed: 4, failed: 0, skipped: 0, flaky: 0 }
      }
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
    expect(workflow).toContain("tests/source-truth/source-truth-detector.test.mjs");
    expect(workflow).toContain("--test-reporter=junit");
    expect(workflow).toContain("artifacts/source-truth-tests.xml");
    expect(workflow).toContain("--outputFile.json=artifacts/vitest-results.json");
    expect(workflow).toContain("pnpm exec vitest run --passWithNoTests --fileParallelism=false");
  });

  it("rejects a non-exact revision instead of producing ambiguous evidence", async () => {
    const output = await tempOutput();

    await expect(runEvidence(output, "main")).rejects.toThrow(/40-character Git commit SHA/);
  });

  it.each(["missing", "failed", "skipped", "flaky"])("rejects %s test evidence without writing a manifest", async defect => {
    const output = await tempOutput();
    const reports = await reportFixture(output);
    if (defect === "missing") await rm(join(reports, "constitution-node-tests.xml"));
    if (defect === "failed") await writeFile(join(reports, "source-truth-tests.xml"), '<testsuites><testcase><failure /></testcase></testsuites>');
    if (defect === "skipped") await writeFile(join(reports, "vitest-results.json"), JSON.stringify({ numPassedTests: 3, numFailedTests: 0, numPendingTests: 1 }));
    if (defect === "flaky") await writeFile(join(reports, "playwright-results.json"), JSON.stringify({ stats: { expected: 4, unexpected: 0, skipped: 0, flaky: 1 } }));
    await expect(runEvidence(output)).rejects.toThrow();
    await expect(readFile(output)).rejects.toThrow(/ENOENT/);
  });
});
