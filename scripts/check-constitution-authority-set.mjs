#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

function fail(message) {
  console.error("[constitution-authority-set] " + message);
  process.exitCode = 1;
}

function read(path) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    throw new Error(
      `Cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function json(path) {
  try {
    return JSON.parse(read(path));
  } catch (error) {
    throw new Error(
      `Invalid JSON ${path}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function sha256(value) {
  return "sha256:" + createHash("sha256").update(value).digest("hex");
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stable(child)])
    );
  }
  return value;
}

function exactMatch(source, pattern, label) {
  const match = source.match(pattern);
  if (!match?.[1]) {
    fail(`Cannot resolve ${label}`);
    return null;
  }
  return match[1];
}

const cliArgs = process.argv.slice(2);
let manifestPath = "control/universal-constitution-version.json";

for (let index = 0; index < cliArgs.length; index += 1) {
  const arg = cliArgs[index];
  if (arg === "--write") {
    index += 1;
    continue;
  }
  if (arg === "--json") continue;
  if (arg?.startsWith("--")) {
    fail(`Unknown argument ${arg}`);
    continue;
  }
  if (arg) {
    manifestPath = arg;
  }
}

if (process.exitCode) process.exit();

const manifest = json(manifestPath);

if (manifest.schemaVersion !== "1.0.0") {
  fail("version manifest schemaVersion must be 1.0.0");
}
if (manifest.productionReleaseAuthority !== false) {
  fail("version manifest must never grant Production authority");
}

const policyId = String(manifest.policyId ?? "");
const policyVersion = String(manifest.policyVersion ?? "");
if (!policyId || !/^\d+\.\d+\.\d+$/.test(policyVersion)) {
  fail("version manifest requires policyId and semantic policyVersion");
}

const docPath = manifest.normativeDocument?.path;
const contractPath = manifest.machineContract?.path;
const templatePath = manifest.universalTemplate?.path;
const policyPath = manifest.policySource?.path;

for (const [label, path] of [
  ["normative document", docPath],
  ["machine contract", contractPath],
  ["Universal template", templatePath],
  ["policy source", policyPath]
]) {
  if (typeof path !== "string" || !path.trim()) {
    fail(`${label} path is required`);
  }
}

if (process.exitCode) process.exit();

const documentSource = read(docPath);
const contractSource = read(contractPath);
const contract = JSON.parse(contractSource);
const templateSource = read(templatePath);
const policySource = read(policyPath);

const documentPolicyId = exactMatch(
  documentSource,
  /^Policy ID:\s*`([^`]+)`/m,
  "normative document Policy ID"
);
const documentVersion = exactMatch(
  documentSource,
  /^Policy version:\s*\*\*([^*]+)\*\*/m,
  "normative document Policy version"
);

if (documentPolicyId !== policyId) {
  fail(`normative document policyId ${documentPolicyId} != ${policyId}`);
}
if (documentVersion !== policyVersion) {
  fail(`normative document version ${documentVersion} != ${policyVersion}`);
}

if (contract.policyId !== policyId) {
  fail(`machine contract policyId ${String(contract.policyId)} != ${policyId}`);
}
if (contract.policyVersion !== policyVersion) {
  fail(
    `machine contract policyVersion ${String(contract.policyVersion)} != ${policyVersion}`
  );
}
if (manifest.machineContract?.version !== policyVersion) {
  fail("version manifest machineContract.version must equal policyVersion");
}

const templateAnchor = templateSource.indexOf(
  "export const universalConstitutionTemplateV1"
);
const templateEnd = templateSource.indexOf(
  "satisfies BlueprintTemplate",
  templateAnchor
);
if (templateAnchor < 0 || templateEnd < 0) {
  fail("Cannot locate universalConstitutionTemplateV1 source block");
}
const templateBlock =
  templateAnchor >= 0 && templateEnd >= 0
    ? templateSource.slice(templateAnchor, templateEnd)
    : "";

const templateId = exactMatch(
  templateBlock,
  /\bid:\s*"([^"]+)"/,
  "Universal template id"
);
const templateVersion = exactMatch(
  templateBlock,
  /\bversion:\s*"([^"]+)"/,
  "Universal template version"
);

if (templateId !== manifest.universalTemplate?.id) {
  fail(
    `Universal template id ${templateId} != ${String(manifest.universalTemplate?.id)}`
  );
}
if (templateVersion !== policyVersion) {
  fail(`Universal template version ${templateVersion} != ${policyVersion}`);
}
if (manifest.universalTemplate?.version !== policyVersion) {
  fail("version manifest universalTemplate.version must equal policyVersion");
}
if (
  contract.constitutionTemplate?.id !== templateId ||
  contract.constitutionTemplate?.version !== templateVersion
) {
  fail("machine contract Constitution template reference drifts from runtime template");
}

const sourcePolicyId = exactMatch(
  policySource,
  /CONSTITUTION_POLICY_ID\s*=\s*"([^"]+)"/,
  "application CONSTITUTION_POLICY_ID"
);
const sourcePolicyVersion = exactMatch(
  policySource,
  /CONSTITUTION_POLICY_VERSION\s*=\s*"([^"]+)"/,
  "application CONSTITUTION_POLICY_VERSION"
);
if (sourcePolicyId !== policyId) {
  fail(`application policy id ${sourcePolicyId} != ${policyId}`);
}
if (sourcePolicyVersion !== policyVersion) {
  fail(`application policy version ${sourcePolicyVersion} != ${policyVersion}`);
}
if (manifest.policySource?.version !== policyVersion) {
  fail("version manifest policySource.version must equal policyVersion");
}
if (manifest.normativeDocument?.version !== policyVersion) {
  fail("version manifest normativeDocument.version must equal policyVersion");
}

if (process.exitCode) process.exit();

const components = [
  {
    id: "normative-document",
    path: docPath,
    version: policyVersion,
    digest: sha256(documentSource)
  },
  {
    id: "machine-contract",
    path: contractPath,
    version: policyVersion,
    digest: sha256(contractSource)
  },
  {
    id: "universal-template",
    path: templatePath,
    version: policyVersion,
    digest: sha256(templateBlock)
  },
  {
    id: "policy-version",
    path: policyPath,
    version: policyVersion,
    digest: sha256(
      JSON.stringify({
        policyId: sourcePolicyId,
        policyVersion: sourcePolicyVersion
      })
    )
  }
].sort((a, b) => a.id.localeCompare(b.id));

const attestation = {
  schemaVersion: "1.0.0",
  source: "trusted-ci-attestation",
  policyId,
  policyVersion,
  sourceRevision: process.env.GITHUB_SHA ?? null,
  ciRunId: process.env.GITHUB_RUN_ID ?? null,
  components,
  authoritySetDigest: sha256(JSON.stringify(stable({ policyId, policyVersion, components }))),
  productionReleaseAuthority: false
};

const writeIndex = process.argv.indexOf("--write");
if (writeIndex >= 0) {
  const outputPath = process.argv[writeIndex + 1];
  if (!outputPath) {
    fail("--write requires an output path");
  } else if (!attestation.sourceRevision || !attestation.ciRunId) {
    fail("--write requires GITHUB_SHA and GITHUB_RUN_ID trusted CI context");
  } else {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(attestation, null, 2) + "\n");
  }
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(attestation, null, 2));
} else if (!process.exitCode) {
  console.log(
    `[constitution-authority-set] PASS ${policyId}@${policyVersion} · ${components.length} components · ${attestation.authoritySetDigest}`
  );
}
