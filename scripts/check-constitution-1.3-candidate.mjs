#!/usr/bin/env node
/** Inactive publication preparation; never writes active law or grants authority. */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const DRAFT = "docs/amendments/CONSTITUTION-1.3-AGENT-CHANGE-RELIABILITY.md";
const CONTRAST = "docs/amendments/CONSTITUTION-UI-CONTRAST-20261008-PROPOSAL.md";
const PROJECTIONS = [".blueprint/constitution-adoption.json", "control/constitution-ecosystem-snapshot.json",
  "control/constitution-compliance-snapshot.json"];
const PATCH = "docs/amendments/CONSTITUTION-1.3-PUBLICATION.patch";
const read = (root, path) => readFileSync(join(root, path), "utf8");
const hash = (bytes) => "sha256:" + createHash("sha256").update(bytes).digest("hex");
const json = (value) => JSON.stringify(value, null, 2) + "\n";
const write = (root, path, bytes) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), bytes);
};

// Strengthen existing owners/gates; no eighth pillar or competing gate engine.
const owners = [
  "gate:quality:evidence", "module:architecture:boundaries", "gate:quality:evidence",
  "gate:durability:ageing-regression", "module:data:source-of-truth",
  "gate:ux:commercial-quality", "module:quality:evidence", "module:governance:evolution",
  "gate:quality:evidence", "module:quality:evidence", "module:architecture:boundaries",
  "module:security:authority", "module:ux:product-elegance", "gate:security:authority",
  "module:product:purpose", "module:governance:evolution", "gate:quality:evidence",
  "module:architecture:structural-capacity", "gate:security:authority",
  "module:operations:release", "module:product:purpose", "module:governance:evolution",
  "module:product:purpose", "module:governance:architectural-longevity",
  "module:architecture:boundaries", "module:security:fortress-resilience",
  "gate:quality:evidence", "module:product:purpose",
  "module:product:purpose", "module:architecture:structural-capacity",
  "module:product:purpose", "module:governance:evolution"
];

export function buildConstitutionCandidate(root = process.cwd()) {
  const manifestPath = "control/universal-constitution-version.json";
  const manifest = JSON.parse(read(root, manifestPath));
  if (manifest.policyVersion === "1.3.0" && manifest.productionReleaseAuthority === false) {
    // Reconstruct the sealed baseline in scratch; never rewrite active files.
    const baseline = mkdtempSync(join(tmpdir(), "constitution-sealed-baseline-"));
    try {
      for (const path of [manifestPath, "docs/UNIVERSAL-CONSTITUTION.md",
        "control/universal-constitution.contract.json",
        "packages/application/src/foundation-templates.ts",
        "packages/application/src/constitution-authority.ts", ...PROJECTIONS, DRAFT, CONTRAST, PATCH]) {
        write(baseline, path, read(root, path));
      }
      const reversed = spawnSync("git", ["apply", "--reverse", PATCH], { cwd: baseline, encoding: "utf8" });
      if (reversed.status !== 0) throw new Error("Published patch cannot reconstruct sealed baseline: " + reversed.stderr);
      const candidate = buildConstitutionCandidate(baseline);
      if (candidatePatch(candidate) !== read(root, PATCH)) throw new Error("Published patch drift");
      for (const [path, bytes] of candidate.files) {
        if (read(root, path) !== bytes) throw new Error("Published authority-set drift: " + path);
      }
      return { ...candidate, activePolicyVersion: "1.3.0" };
    } finally { rmSync(baseline, { recursive: true, force: true }); }
  }
  if (manifest.policyVersion !== "1.2.0" || manifest.productionReleaseAuthority !== false) {
    throw new Error("Candidate baseline must be active 1.2.0 with no Production authority");
  }
  const canonicalPaths = {
    normativeDocument: "docs/UNIVERSAL-CONSTITUTION.md",
    machineContract: "control/universal-constitution.contract.json",
    universalTemplate: "packages/application/src/foundation-templates.ts",
    policySource: "packages/application/src/constitution-authority.ts"
  };
  for (const [name, path] of Object.entries(canonicalPaths)) {
    if (manifest[name]?.path !== path) throw new Error("Non-canonical authority path " + name);
  }
  const matches = [...read(root, DRAFT).matchAll(/^\*\*(R\d+) — (.+)$/gm)];
  if (matches.length !== 32 || matches.some((m, index) => m[1] !== "R" + (index + 1))) {
    throw new Error("Candidate must contain exactly ordered R1–R32");
  }
  const rules = matches.map((m, index) => ({
    id: m[1], requirementId: owners[index],
    enforcement: index >= 10 && index <= 13 ? "immediate-boundaries-migration-gated-functionality" : "immediate-evidence-obligation",
    normativeSection: "10." + m[1]
  }));
  const contrast = read(root, CONTRAST).split("## Proposed universal law (normative if ratified)\n")[1]
    ?.split("\n## Impact review")[0]?.trim();
  if (!contrast || !contrast.includes("4.5:1") || !contrast.includes("3:1") ||
      !contrast.includes("getComputedStyle") || !contrast.includes("56/3")) {
    throw new Error("Consolidated contrast requirements are incomplete");
  }
  const originals = new Map();
  const files = new Map();
  for (const path of [manifest.normativeDocument.path, manifest.machineContract.path,
    manifest.universalTemplate.path, manifest.policySource.path, manifestPath, ...PROJECTIONS]) {
    originals.set(path, read(root, path));
  }
  const scope = "Federated identity behavior in R11–R14 is migration-gated. Immediately require accurate capability declarations, explicit owners, least privilege, revocation/freshness design and no invented approval. Existing account/authentication and offline protections remain until an authorized, compatible implementation passes CP-01–CP-13 and the relevant project gates. Unsupported federation is UNVERIFIED, not exempt or compliant. No device is silently bulk-approved; central grants never imply constitutional, privileged business-data or Production authority. E2 is an architectural target until authenticated interoperability and isolation are evidenced; E3 requires independent ecosystem authorities.";
  files.set(manifest.normativeDocument.path,
    originals.get(manifest.normativeDocument.path).replace("Policy version: **1.2.0**", "Policy version: **1.3.0**") +
    "\n## 10. Universal execution and ecosystem discipline\n\n" + scope + "\n\n" +
    matches.map((m) => `### 10.${m[1]}\n\n**${m[1]} — ${m[2]}\n`).join("\n") +
    "\n## 11. Computed contrast and legibility\n\n" + contrast + "\n\n" +
    "Contrast strengthens gate:ux:commercial-quality and never replaces human UX acceptance. Existing deployments retain truthful FAIL/UNVERIFIED until scoped remediation and measured verification.\n");
  const contract = JSON.parse(originals.get(manifest.machineContract.path));
  contract.policyVersion = "1.3.0";
  contract.constitutionTemplate.version = "1.3.0";
  contract.executionRules = rules;
  // R29-R32 project profiles extend the existing authority set rather than
  // spawning child constitutions, a second registry or literal 100/200 modules.
  contract.academicProfiles = {
    status: "constitutional-capacity-reference-not-runtime-proof",
    base: "S100",
    baseBands: [
      "S01-10:source-ownership", "S11-20:learner-competencies",
      "S21-30:curriculum-prerequisites", "S31-40:concepts-and-worked-examples",
      "S41-50:authentic-practice", "S51-60:assessment-feedback",
      "S61-70:discipline-specific-artifacts-when-applicable",
      "S71-80:learning-state-evidence", "S81-90:accessible-ux-performance",
      "S91-100:security-interoperability-reliability"
    ],
    russian: {
      profile: "R200", inherits: "S100", extension: "R101-200",
      appliesTo: "comprehensive-Russian-language-learning",
      completion: "requires-linguistic-evidence-not-artificial-floor-count"
    },
    implementationQuota: false,
    separateConstitution: false,
    professionalReviewRequired: true,
    verifiedMaturityFromThisContract: false
  };
  contract.executionProfiles = {
    COMPACT: ["B0", "B1", "B2"], STRUCTURED: ["B3", "B4", "B5"],
    authority: "canonical-project-profile", riskRule: "L1-L3-per-operation-never-reduces-common-floor"
  };
  contract.ecosystemReference = {
    axis: "orthogonal-to-blueprint-level", levels: ["E0", "E1", "E2", "E3"],
    classificationAuthority: "reviewed-existing-project-profile-and-canonical-membership",
    operationalMaturity: "requires-exact-authenticated-cross-app-evidence",
    productionReleaseAuthority: false
  };
  contract.managementMigration = {
    requirementIds: rules.slice(10, 14).map((r) => r.requirementId),
    immediate: "truthful-capabilities-scoped-ownership-no-implicit-trust",
    functionality: "migration-gated-CP-01-through-CP-13-and-project-acceptance",
    centralOwner: "Application-Management", constitutionalOwner: "Software-Blueprint-Hub",
    businessDataOwner: "owning-application", unsupportedStatus: "UNVERIFIED",
    productionReleaseAuthority: false
  };
  contract.computedContrast = {
    requirementId: "gate:ux:commercial-quality", standard: "WCAG-2.2-AA",
    normalTextRatio: 4.5, largeTextRatio: 3, meaningfulNonTextRatio: 3,
    largeTextNormalCssPx: 24, largeTextBoldCssPx: 56 / 3,
    evidence: "browser-final-computed-composited-colors-desktop-mobile-states-themes",
    complexSurfaceWithoutRenderedEvidence: "UNVERIFIED", disabledException: "applicable-WCAG-exemption-only"
  };
  files.set(manifest.machineContract.path, json(contract));
  let template = originals.get(manifest.universalTemplate.path).replace(
    'version: "1.2.0"', 'version: "1.3.0"');
  const ownerSummaries = {
    "gate:quality:evidence": "Require exact revision, scope, truthful status, risk-appropriate checks, continuity and ecosystem evidence under R1/R3/R9/R17/R27; metrics never grant permission.",
    "module:architecture:boundaries": "Apply R2/R11/R25: one canonical owner, truthful catalog capability and independent B/E axes; no shadow registry.",
    "module:data:source-of-truth": "Apply R5: scoped version-safe writes, idempotency, readback and recovery.",
    "module:quality:evidence": "Apply R7/R10: bounded defect attempts and non-gamed quality cohorts.",
    "module:governance:evolution": "Apply R8/R16/R22/R32: one authority, one bounded queue, learning satellite inheritance and economical handoffs without child constitutions.",
    "module:security:authority": "R12 federation remains migration-gated; declarations and trust boundaries apply immediately; no forged or stale central approval.",
    "gate:security:authority": "Apply R14/R19: operational device approval never implies constitutional, business-data, privileged or Production authority.",
    "module:product:purpose": "Apply R15/R21/R23: preserved objective, canonical B0–B2 COMPACT/B3–B5 STRUCTURED and context-aware vertical-slice intake. R28/R29/R31 additionally require proven pedagogy, subject identity, unique practice and qualified Russian linguistic evidence where appropriate; no copy-paste curriculum or fake proficiency.",
    "module:operations:release": "Apply R20: distinguish code/test/merge/deploy/acceptance and require truthful cleanup, rollback and restart evidence.",
    "module:architecture:structural-capacity": "Apply R18/R30: measure entropy; S100 is long-term extensibility capacity, never a 100-file/feature quota.",
    "module:governance:architectural-longevity": "Apply R24: enrollment and reclassification require canonical profile/owner review; never downgrade risk for cost.",
    "module:security:fortress-resilience": "Apply R26: separate governance, operations and app data/releases; test least privilege, isolation and independent recovery.",
    "module:ux:product-elegance": "Apply R13: shared status vocabulary with task-appropriate responsive layouts and no duplicate approval surfaces.",
    "gate:durability:ageing-regression": "Apply R4: reproduce, diagnose first divergence, minimal coherent fix and affected critical-journey regression.",
    "gate:ux:commercial-quality": "R6 and WCAG 2.2 AA require measured final rendered/composited contrast: text 4.5:1, large text 3:1 (24px normal or 14pt bold), meaningful non-text 3:1; desktop/mobile/themes/states, fail-closed unknown colors and complex backgrounds, real human UX."
  };
  for (const [id, summary] of Object.entries(ownerSummaries)) {
    const start = template.indexOf(`id: "${id}"`);
    const end = template.indexOf("\n      }", start);
    if (start < 0 || end < 0) throw new Error("Missing canonical template owner " + id);
    const block = template.slice(start, end);
    const updated = block.replace(/(description:\s*")([^"]*)(")/, (_, a, b, c) => a + b + " " + summary + c);
    if (updated === block) throw new Error("Cannot strengthen template owner " + id);
    template = template.slice(0, start) + updated + template.slice(end);
  }
  files.set(manifest.universalTemplate.path, template);
  files.set(manifest.policySource.path, originals.get(manifest.policySource.path).replace(
    'CONSTITUTION_POLICY_VERSION = "1.2.0"', 'CONSTITUTION_POLICY_VERSION = "1.3.0"'));
  manifest.policyVersion = "1.3.0";
  for (const key of ["normativeDocument", "machineContract", "universalTemplate", "policySource"]) {
    manifest[key].version = "1.3.0";
  }
  files.set(manifestPath, json(manifest));
  // Update only local target projections; preserve exact historical app observations.
  for (const path of PROJECTIONS) {
    const projection = JSON.parse(originals.get(path));
    projection[path.includes("ecosystem") ? "activePolicyVersion" : "policyVersion"] = "1.3.0";
    files.set(path, json(projection));
  }
  return { originals, files, contract, rules, activePolicyVersion: "1.2.0" };
}

export function candidatePatch(candidate) {
  const staging = mkdtempSync(join(tmpdir(), "constitution-publication-diff-"));
  try {
    return [...candidate.files].map(([path, after]) => {
      write(staging, "before/" + path, candidate.originals.get(path));
      write(staging, "after/" + path, after);
      const compared = spawnSync("git", ["diff", "--no-index", "--no-color", "--",
        join(staging, "before", path), join(staging, "after", path)], { encoding: "utf8" });
      if (compared.status !== 1) throw new Error("Cannot produce bounded publication diff " + path);
      return compared.stdout.replace(/^diff --git .+$/m, `diff --git a/${path} b/${path}`)
        .replace(/^--- .+$/m, `--- a/${path}`).replace(/^\+\+\+ .+$/m, `+++ b/${path}`);
    }).join("");
  } finally { rmSync(staging, { recursive: true, force: true }); }
}

function main() {
  const root = process.cwd();
  const candidate = buildConstitutionCandidate(root);
  const patch = candidatePatch(candidate);
  const args = process.argv.slice(2);
  if (args.includes("--write-patch")) {
    if (candidate.activePolicyVersion !== "1.2.0") throw new Error("Cannot rewrite a published seal");
    write(root, PATCH, patch);
  }
  const patchPath = args.includes("--patch") ? args[args.indexOf("--patch") + 1] : PATCH;
  if (!patchPath || !existsSync(patchPath) || readFileSync(patchPath, "utf8") !== patch) {
    throw new Error("Publication patch drift: regenerate the stale patch from reviewed sources");
  }
  const overlay = mkdtempSync(join(tmpdir(), "constitution-1.3-inactive-"));
  try {
    // Apply the actual sealed patch, rather than checking unrelated generated files.
    for (const [path, bytes] of candidate.originals) write(overlay, path, bytes);
    write(overlay, "publication.patch", patch);
    const applied = spawnSync("git", ["apply", "publication.patch"], { cwd: overlay, encoding: "utf8" });
    if (applied.status !== 0) throw new Error("Cannot apply sealed candidate: " + applied.stderr);
    for (const [path, bytes] of candidate.files) {
      if (read(overlay, path) !== bytes) throw new Error("Applied authority-set drift: " + path);
    }
    const checked = spawnSync(process.execPath,
      [fileURLToPath(new URL("./check-constitution-authority-set.mjs", import.meta.url)), "--json"],
      { cwd: overlay, encoding: "utf8" });
    if (checked.status !== 0) throw new Error("Candidate authority-set check failed: " + checked.stderr);
    const attestation = JSON.parse(checked.stdout);
    const result = {
      status: candidate.activePolicyVersion === "1.2.0" ? "INACTIVE_CANDIDATE_VERIFIED" : "ACTIVE_AUTHORITY_SET_VERIFIED",
      activePolicyVersion: candidate.activePolicyVersion,
      candidatePolicyVersion: "1.3.0", ruleCount: candidate.rules.length,
      contrastIncluded: true, componentCount: attestation.components.length,
      authoritySetDigest: attestation.authoritySetDigest,
      publicationPatchDigest: hash(patch), productionReleaseAuthority: false
    };
    if (args.includes("--write-evidence")) {
      if (!/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? "") ||
          !/^\d+$/.test(process.env.GITHUB_RUN_ID ?? "")) {
        throw new Error("Candidate evidence requires exact trusted CI context");
      }
      write(root, "artifacts/constitution-1.3-authority-set.json", json(attestation));
      write(root, "artifacts/constitution-1.3-candidate.json", json({ ...result,
        sourceRevision: process.env.GITHUB_SHA, ciRunId: process.env.GITHUB_RUN_ID,
        source: candidate.activePolicyVersion === "1.2.0" ? "inactive-publication-candidate-ci-evidence" : "active-authority-set-integrity-ci-evidence",
        ratification: "NOT_ASSERTED", publication: "NOT_ASSERTED" }));
    }
    console.log(args.includes("--json") ? json(result).trimEnd() :
      `[constitution-1.3-candidate] ${result.status} ${result.authoritySetDigest}`);
  } finally {
    rmSync(overlay, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try { main(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
