import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

import {
  findBreakingChanges,
  migrationEvidenceRequired
} from "./schema-compatibility-lib.mjs";

const root = process.cwd();
const baselinePath = resolve(
  root,
  "schemas/baselines/vertical-slice.contracts.v1.json"
);
const currentPath = resolve(root, "schemas/vertical-slice.contracts.v1.json");
const evidencePath = resolve(
  root,
  "schemas/migrations/vertical-slice.contracts.v1.md"
);

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

const [baselineText, currentText] = await Promise.all([
  readFile(baselinePath, "utf8"),
  readFile(currentPath, "utf8")
]);

const baseline = JSON.parse(baselineText);
const current = JSON.parse(currentText);
const changes = findBreakingChanges(baseline, current);

if (!migrationEvidenceRequired(changes)) {
  console.log("Schema compatibility: PASS (no detected breaking change)");
  process.exit(0);
}

try {
  await access(evidencePath, constants.R_OK);
} catch {
  console.error("Schema compatibility: FAIL");
  console.error("Breaking changes require exact migration evidence:");
  for (const change of changes) console.error(`- ${change}`);
  process.exit(1);
}

const evidence = await readFile(evidencePath, "utf8");
const requiredLines = [
  "Status: ACCEPTED",
  `From-SHA256: ${sha256(baselineText)}`,
  `To-SHA256: ${sha256(currentText)}`
];

const missing = requiredLines.filter((line) => !evidence.includes(line));
if (missing.length) {
  console.error("Schema compatibility: FAIL (stale/incomplete migration evidence)");
  for (const line of missing) console.error(`Missing: ${line}`);
  process.exit(1);
}

console.log("Schema compatibility: PASS with accepted exact-hash migration evidence");
