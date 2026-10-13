import { mkdir, writeFile, readFile } from "node:fs/promises";
import { dirname } from "node:path";

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

const outputPath = process.argv[2];
if (!outputPath) {
  throw new Error(
    "Usage: node scripts/release-gate-evidence.mjs <output-path>"
  );
}

const revision = required("RELEASE_GATE_REVISION").toLowerCase();
if (!/^[0-9a-f]{40}$/.test(revision)) {
  throw new Error(
    "RELEASE_GATE_REVISION must be an exact 40-character Git commit SHA"
  );
}

const jsonReport = async (path) => JSON.parse(await readFile(path, "utf8"));
const nodeReport = async (path) => {
  const xml = await readFile(path, "utf8");
  if (!xml.includes("</testsuites>")) throw new Error("Incomplete Node test report");
  const total = [...xml.matchAll(/<testcase\b/g)].length;
  const failed = [...xml.matchAll(/<(?:failure|error)\b/g)].length;
  const skipped = [...xml.matchAll(/<skipped\b/g)].length;
  return { passed: total - failed - skipped, failed, skipped };
};
const [candidate, truth, vitest, playwright] = await Promise.all([
  nodeReport("artifacts/constitution-node-tests.xml"), nodeReport("artifacts/source-truth-tests.xml"),
  jsonReport("artifacts/vitest-results.json"), jsonReport("artifacts/playwright-results.json")
]);
const testResults = {
  node: { passed: candidate.passed + truth.passed, failed: candidate.failed + truth.failed, skipped: candidate.skipped + truth.skipped },
  vitest: { passed: vitest.numPassedTests, failed: vitest.numFailedTests, skipped: vitest.numPendingTests },
  browser: { passed: playwright.stats.expected, failed: playwright.stats.unexpected, skipped: playwright.stats.skipped, flaky: playwright.stats.flaky }
};
for (const result of Object.values(testResults)) {
  if (!Number.isInteger(result.passed) || result.passed <= 0 || result.failed !== 0 || result.skipped !== 0 || (result.flaky ?? 0) !== 0) throw new Error("Release Gate reports failures/skips or missing test evidence");
}

const manifest = Object.freeze({
  schemaVersion: "1.0.0",
  kind: "blueprint-os-release-gate-evidence",
  repository: required("GITHUB_REPOSITORY"),
  revision,
  workflow: required("GITHUB_WORKFLOW"),
  runId: required("GITHUB_RUN_ID"),
  runAttempt: required("GITHUB_RUN_ATTEMPT"),
  eventName: required("GITHUB_EVENT_NAME"),
  ref: process.env.GITHUB_REF?.trim() || null,
  generatedAt: new Date().toISOString(),
  productionDeploymentAuthorized: false,
  testResults,
  passedChecks: Object.freeze([
    "prisma-generate",
    "prisma-validate",
    "migration-deploy",
    "migration-status",
    "universal-constitution-compliance",
    "constitution-authority-set",
    "constitution-ecosystem-snapshot",
    "constitution-compliance-matrix",
    "source-of-truth-contradiction",
    "source-of-truth-detector-self-test",
    "inactive-constitution-1.3-authority-set",
    "constitution-agent-adversarial-self-tests",
    "computed-contrast-negative-fixtures",
    "generated-contract-drift",
    "schema-compatibility",
    "lint",
    "typecheck",
    "architecture-boundaries",
    "unit-contract-authority-postgresql",
    "production-build",
    "browser-e2e"
  ])
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(manifest, null, 2) + "\n",
  "utf8"
);

process.stdout.write(
  `Release Gate evidence recorded for exact revision ${revision}\n`
);
