import { readFileSync } from "node:fs";

function fail(message) {
  console.error("[constitution-compliance-matrix] " + message);
  process.exitCode = 1;
}

function json(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`Cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

const adoption = json("control/constitution-ecosystem-snapshot.json");
const compliance = json("control/constitution-compliance-snapshot.json");
if (!adoption || !compliance) process.exit(1);

if (compliance.schemaVersion !== "1.0.0") fail("Unsupported compliance snapshot schema");
if (compliance.source !== "operator-verified-repository-scan") {
  fail("Compliance snapshot source must be operator-verified-repository-scan");
}
if (compliance.policyId !== adoption.policyId) fail("Compliance/adoption policyId drift");
if (compliance.policyVersion !== adoption.activePolicyVersion) {
  fail("Compliance/adoption policyVersion drift");
}
if (!Array.isArray(compliance.observations)) {
  fail("Compliance observations must be an array");
  process.exit(1);
}

const adoptionByRepo = new Map(
  adoption.repositories.map((item) => [item.repository, item])
);
const seen = new Set();

for (const observation of compliance.observations) {
  const repository = observation?.repository;
  if (!repository || seen.has(repository)) {
    fail(`Duplicate or missing compliance repository ${repository ?? "<missing>"}`);
    continue;
  }
  seen.add(repository);

  const adopted = adoptionByRepo.get(repository);
  if (!adopted) {
    fail(`Compliance snapshot contains unregistered repository ${repository}`);
    continue;
  }

  if (observation.branch !== adopted.branch) fail(`Branch drift for ${repository}`);
  if (observation.sourceRevision !== adopted.sourceRevision) {
    fail(`Source revision drift for ${repository}`);
  }
  if (!/^[a-f0-9]{40}$/.test(observation.sourceRevision ?? "")) {
    fail(`Invalid source revision for ${repository}`);
  }
  const observedAt = Date.parse(observation.observedAt ?? "");
  if (
    Number.isNaN(observedAt) ||
    new Date(observedAt).toISOString() !== observation.observedAt
  ) {
    fail(`Invalid observedAt for ${repository}`);
  }

  const discoveries = new Set([
    "standard-attestation-found",
    "standard-attestation-not-found",
    "repository-unavailable"
  ]);
  if (!discoveries.has(observation.discovery)) {
    fail(`Invalid discovery state for ${repository}`);
  }

  if (observation.discovery === "standard-attestation-found" && !observation.attestation) {
    fail(`Found attestation state without attestation for ${repository}`);
  }
  if (observation.discovery !== "standard-attestation-found" && observation.attestation) {
    fail(`Attestation supplied for non-found discovery state in ${repository}`);
  }

  if (observation.attestation) {
    const att = observation.attestation;
    if (att.schemaVersion !== "1.0.0") fail(`Attestation schema drift for ${repository}`);
    if (att.kind !== "constitutional-compliance-attestation") fail(`Attestation kind drift for ${repository}`);
    if (att.source !== "trusted-project-compliance-attestation") fail(`Untrusted attestation source for ${repository}`);
    if (att.policyId !== compliance.policyId || att.policyVersion !== compliance.policyVersion) {
      fail(`Attestation policy drift for ${repository}`);
    }
    if (
      att.repository !== repository ||
      att.branch !== observation.branch ||
      att.sourceRevision !== observation.sourceRevision ||
      att.projectId !== adopted.manifest?.projectId ||
      att.blueprintLevel !== adopted.manifest?.blueprintLevel
    ) {
      fail(`Attestation provenance drift for ${repository}`);
    }
    if (!/^\d+$/.test(att.workflowRunId ?? "")) fail(`Invalid workflow run for ${repository}`);
    if (att.productionReleaseAuthority !== false) fail(`Production authority leak in ${repository}`);
    if (att.exactReleaseRevisionCertified !== false) fail(`Release certification leak in ${repository}`);
  }
}

if (seen.size !== adoptionByRepo.size) {
  fail(
    `Compliance snapshot coverage mismatch: ${seen.size} observations for ${adoptionByRepo.size} governed repositories`
  );
}
for (const repository of adoptionByRepo.keys()) {
  if (!seen.has(repository)) fail(`Missing compliance observation for ${repository}`);
}

if (!process.exitCode) {
  const found = compliance.observations.filter(
    (item) => item.discovery === "standard-attestation-found"
  ).length;
  console.log(
    `[constitution-compliance-matrix] PASS ${seen.size} repositories · ${found} standard attestations · policy ${compliance.policyVersion}`
  );
}
