import { readFileSync } from "node:fs";

function fail(message) {
  console.error("[constitution-ecosystem] " + message);
  process.exitCode = 1;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const registry = readJson("control/constitution-governed-repositories.json");
const snapshot = readJson("control/constitution-ecosystem-snapshot.json");

if (!registry || !snapshot) process.exit(1);

if (registry.schemaVersion !== "1.0.0" || snapshot.schemaVersion !== "1.0.0") {
  fail("Unsupported registry/snapshot schemaVersion");
}
if (!registry.policyId || registry.policyId !== snapshot.policyId) {
  fail("Registry and snapshot policyId must match");
}
if (snapshot.source !== "github-default-branch-snapshot") {
  fail("Snapshot source must be github-default-branch-snapshot");
}
if (!/^\d+\.\d+\.\d+$/.test(snapshot.activePolicyVersion ?? "")) {
  fail("Snapshot activePolicyVersion must be semantic major.minor.patch");
}
if (!Array.isArray(registry.repositories) || !Array.isArray(snapshot.repositories)) {
  fail("Registry and snapshot repositories must be arrays");
  process.exit(1);
}

const registryByRepo = new Map();
for (const item of registry.repositories) {
  if (!item?.repository || registryByRepo.has(item.repository)) {
    fail(`Duplicate or invalid governed repository ${item?.repository ?? "<missing>"}`);
    continue;
  }
  registryByRepo.set(item.repository, item);
}

const snapshotByRepo = new Map();
for (const item of snapshot.repositories) {
  if (!item?.repository || snapshotByRepo.has(item.repository)) {
    fail(`Duplicate or invalid snapshot repository ${item?.repository ?? "<missing>"}`);
    continue;
  }
  snapshotByRepo.set(item.repository, item);
}

for (const [repository, definition] of registryByRepo) {
  const observed = snapshotByRepo.get(repository);
  if (!observed) {
    fail(`Missing adoption snapshot for ${repository}`);
    continue;
  }
  if (observed.branch !== definition.branch) {
    fail(`Branch drift for ${repository}`);
  }
  if (!/^[a-f0-9]{40}$/.test(observed.sourceRevision ?? "")) {
    fail(`Invalid exact sourceRevision for ${repository}`);
  }

  const manifest = observed.manifest;
  if (!manifest) {
    continue;
  }
  if (manifest.schemaVersion !== "1.0.0") fail(`Unsupported adoption schema for ${repository}`);
  if (manifest.policyId !== registry.policyId) fail(`Policy ID drift for ${repository}`);
  if (manifest.projectId !== definition.projectId) fail(`Project ID drift for ${repository}`);
  if (manifest.blueprintLevel !== definition.blueprintLevel) fail(`Blueprint Level drift for ${repository}`);
  if (manifest.enforcementMode !== "enforced") fail(`Enforcement disabled for ${repository}`);
  if (!/^\d+\.\d+\.\d+$/.test(manifest.policyVersion ?? "")) fail(`Invalid policyVersion for ${repository}`);
  if (manifest.disabledPillars?.length) fail(`Disabled Constitutional pillar in ${repository}`);
  if (manifest.constitutionalWaivers?.length) fail(`Constitutional waiver present in ${repository}`);
  if (manifest.evidenceAuthority !== "canonical-quality-gates") fail(`Invalid evidence authority in ${repository}`);
  if (manifest.productionAuthority !== "separate-explicit-release-gate") fail(`Invalid Production authority in ${repository}`);
}

for (const repository of snapshotByRepo.keys()) {
  if (!registryByRepo.has(repository)) {
    fail(`Snapshot contains unregistered repository ${repository}`);
  }
}

if (!process.exitCode) {
  console.log(
    `[constitution-ecosystem] PASS ${registryByRepo.size} governed repositories · active policy ${snapshot.activePolicyVersion}`
  );
}
