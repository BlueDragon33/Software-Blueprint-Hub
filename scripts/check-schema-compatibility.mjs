import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

import {
  findBreakingChanges,
  migrationEvidenceRequired
} from "./schema-compatibility-lib.mjs";

const root = process.cwd();

const contracts = [
  {
    name: "vertical-slice.contracts.v1",
    baselinePath: resolve(
      root,
      "schemas/baselines/vertical-slice.contracts.v1.json"
    ),
    currentPath: resolve(root, "schemas/vertical-slice.contracts.v1.json"),
    evidencePath: resolve(
      root,
      "schemas/migrations/vertical-slice.contracts.v1.md"
    )
  },
  {
    name: "reference-import-manifest.v1",
    baselinePath: resolve(
      root,
      "schemas/baselines/reference-import-manifest.v1.json"
    ),
    currentPath: resolve(root, "schemas/reference-import-manifest.v1.json"),
    evidencePath: resolve(
      root,
      "schemas/migrations/reference-import-manifest.v1.md"
    )
  }
];

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

async function verifyContract(contract) {
  const [baselineText, currentText] = await Promise.all([
    readFile(contract.baselinePath, "utf8"),
    readFile(contract.currentPath, "utf8")
  ]);

  const baseline = JSON.parse(baselineText);
  const current = JSON.parse(currentText);
  const changes = findBreakingChanges(baseline, current);

  if (!migrationEvidenceRequired(changes)) {
    console.log(
      `Schema compatibility: PASS (${contract.name}, no detected breaking change)`
    );
    return;
  }

  try {
    await access(contract.evidencePath, constants.R_OK);
  } catch {
    console.error(`Schema compatibility: FAIL (${contract.name})`);
    console.error("Breaking changes require exact migration evidence:");
    for (const change of changes) console.error(`- ${change}`);
    process.exitCode = 1;
    return;
  }

  const evidence = await readFile(contract.evidencePath, "utf8");
  const requiredLines = [
    "Status: ACCEPTED",
    `From-SHA256: ${sha256(baselineText)}`,
    `To-SHA256: ${sha256(currentText)}`
  ];

  const missing = requiredLines.filter((line) => !evidence.includes(line));
  if (missing.length) {
    console.error(
      `Schema compatibility: FAIL (${contract.name}, stale/incomplete migration evidence)`
    );
    for (const line of missing) console.error(`Missing: ${line}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Schema compatibility: PASS (${contract.name}) with accepted exact-hash migration evidence`
  );
}

for (const contract of contracts) {
  await verifyContract(contract);
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
