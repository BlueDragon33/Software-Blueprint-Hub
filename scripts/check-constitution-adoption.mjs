#!/usr/bin/env node
import { readFileSync } from "node:fs";

function fail(message) {
  console.error("[constitution] " + message);
  process.exitCode = 1;
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`${label} is unreadable or invalid JSON: ${path} · ${error instanceof Error ? error.message : String(error)}`);
  }
}

const manifestPath =
  process.argv[2] ?? ".blueprint/constitution-adoption.json";
const contractPath =
  process.argv[3] ?? "control/universal-constitution.contract.json";

const contract = readJson(contractPath, "Constitution contract");
const manifest = readJson(manifestPath, "Constitution adoption manifest");

if (manifest.schemaVersion !== "1.0.0") {
  fail(`manifest schemaVersion must be 1.0.0; received ${String(manifest.schemaVersion)}`);
}
if (manifest.policyId !== contract.policyId) {
  fail(`policyId must be ${contract.policyId}; received ${String(manifest.policyId)}`);
}
if (manifest.policyVersion !== contract.policyVersion) {
  fail(
    `policyVersion must match the current Constitution ${contract.policyVersion}; received ${String(manifest.policyVersion)}`
  );
}
if (manifest.enforcementMode !== "enforced") {
  fail("enforcementMode must be enforced");
}

const levels = new Set(["B0", "B1", "B2", "B3", "B4", "B5"]);
if (!levels.has(manifest.blueprintLevel)) {
  fail("blueprintLevel must be one of B0, B1, B2, B3, B4, B5");
}

if (typeof manifest.projectId !== "string" || !manifest.projectId.trim()) {
  fail("projectId is required");
}

const requiredPillars = new Set(
  Array.isArray(contract.pillars)
    ? contract.pillars.map((pillar) => pillar.id)
    : []
);
const inherited = new Set(
  Array.isArray(manifest.inheritedPillars) ? manifest.inheritedPillars : []
);

for (const pillar of requiredPillars) {
  if (!inherited.has(pillar)) {
    fail(`missing mandatory inherited pillar: ${pillar}`);
  }
}

for (const pillar of inherited) {
  if (!requiredPillars.has(pillar)) {
    fail(`unknown inherited pillar: ${pillar}`);
  }
}

if (
  Array.isArray(manifest.disabledPillars) &&
  manifest.disabledPillars.length > 0
) {
  fail("disabledPillars must remain empty; Universal pillars cannot be disabled");
}

if (
  Array.isArray(manifest.constitutionalWaivers) &&
  manifest.constitutionalWaivers.length > 0
) {
  fail(
    "constitutionalWaivers must remain empty; implementation decisions may vary but Universal pillars cannot be waived"
  );
}

if (manifest.evidenceAuthority !== "canonical-quality-gates") {
  fail("evidenceAuthority must be canonical-quality-gates");
}
if (
  manifest.productionAuthority !== "separate-explicit-release-gate"
) {
  fail(
    "productionAuthority must remain separate-explicit-release-gate"
  );
}

if (!process.exitCode) {
  console.log(
    `[constitution] PASS ${manifest.projectId} · ${manifest.blueprintLevel} · policy ${manifest.policyVersion} · ${requiredPillars.size} mandatory pillars`
  );
}
