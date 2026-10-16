import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const workflow = readFileSync(new URL("../../.github/workflows/p2-provider-neutral-integration.yml", import.meta.url), "utf8");
const smoke = readFileSync(new URL("../../scripts/ci-p2-cross-service-smoke.mjs", import.meta.url), "utf8");

test("P2 CI PostgreSQL URL and healthcheck match the existing fail-closed integration fixture", () => {
  assert.match(workflow, /^\s+POSTGRES_DB: blueprint_qa_test$/m);
  assert.match(workflow, /^\s+DATABASE_URL: postgresql:\/\/blueprint:blueprint@localhost:5432\/blueprint_qa_test$/m);
  assert.match(workflow, /pg_isready -U blueprint -d blueprint_qa_test/);
  assert.doesNotMatch(workflow, /blueprint_p2_disposable/);
  const existing = readFileSync(new URL("../../tests/application/prompt-workflow-qa-pg-integration.test.ts", import.meta.url), "utf8");
  assert.match(existing, /target\.pathname\)\.toBe\("\/blueprint_qa_test"\)/);
  assert.match(workflow, /pnpm db:migrate:status/);
});

test("Pull request preflight has no access to secrets, runtime is manual and fail-closed", () => {
  const parts = workflow.split("  cross-component-isolated:");
  assert.equal(parts.length, 2, "expected single isolated job");
  assert.doesNotMatch(parts[0], /\$\{\{\s*secrets\./);
  assert.match(parts[1], /if: github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main' && github\.repository == 'BlueDragon33\/Software-Blueprint-Hub'/);
  assert.match(parts[1], /environment: Preview/);
  assert.doesNotMatch(parts[1], /BLUEPRINT_CROSS_REPO_READ_TOKEN/);
  assert.equal((parts[1].match(/actions\/create-github-app-token@64ab729a6294000f5aa4a4bc0b73d1f32bc45510/g) ?? []).length, 2);
  assert.equal((parts[1].match(/private-key: \$\{\{ secrets\.BLUEPRINT_GITHUB_APP_PRIVATE_KEY \}\}/g) ?? []).length, 2);
  assert.equal((parts[1].match(/permission-contents: read/g) ?? []).length, 2);
  for (const name of ["Software-Blueprint-Hub", "Software-Blueprint-Execution-Gateway", "Software-Blueprint-Execution-Worker", "Software-Blueprint-QA-Worker"]) {
    assert.equal((parts[1].match(new RegExp("^            " + name + "$", "gm")) ?? []).length, 2);
  }
  assert.doesNotMatch(parts[1], /skip-token-revoke:\s*true/);
  assert.match(parts[1], /EXPECTED_INSTALLATION: \$\{\{ vars\.BLUEPRINT_GITHUB_INSTALLATION_ID \}\}/);
  assert.match(parts[1], /BLUEPRINT_EXECUTION_READ_TOKEN: \$\{\{ steps\.execution-token\.outputs\.token \}\}/);
  assert.match(parts[1], /BLUEPRINT_QA_READ_TOKEN: \$\{\{ steps\.qa-token\.outputs\.token \}\}/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.doesNotMatch(workflow, /contents: write/);
});

test("Execution and independent QA source reads use distinct credentials and bounded transport", () => {
  assert.match(smoke, /executionToken === qaToken/);
  assert.match(smoke, /readPinnedFile:.*executionToken/);
  assert.match(smoke, /readPinnedFileIndependent:.*qaToken/);
  assert.match(smoke, /assertFreshSource:.*currentRef\(qaToken\)/);
  assert.match(smoke, /AbortSignal\.timeout\(8000\)/);
  assert.match(smoke, /redirect:"error"/);
  assert.doesNotMatch(smoke, /process\.env\.GITHUB_TOKEN/);
});

test("Ephemeral smoke never asserts real canonical E2E or authority", () => {
  assert.match(smoke, /CI_FIXTURE_ONLY_NOT_VERIFIED/);
  assert.match(smoke, /durableHubJournal:"NOT_TESTED_BY_THIS_SCRIPT"/);
  assert.match(smoke, /authenticatedCrossPrivateRuntime:"NOT_VERIFIED"/);
  assert.match(smoke, /productionAuthority:false,qualityGatePassed:false,completionReceiptIssued:false/);
  assert.match(smoke, /independentlyVerifyInspection\(/);
  assert.match(smoke, /assert\.rejects\(executeInspection/);
  assert.doesNotMatch(smoke, /productionAuthorized:\s*true/);
});
