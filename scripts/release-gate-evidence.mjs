import { mkdir, writeFile } from "node:fs/promises";
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
  passedChecks: Object.freeze([
    "prisma-generate",
    "prisma-validate",
    "migration-deploy",
    "migration-status",
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
