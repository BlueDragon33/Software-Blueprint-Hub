import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import test from "node:test";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { buildConstitutionCandidate } from "../../scripts/check-constitution-1.3-candidate.mjs";

test("one inactive candidate seals all 32 rules, contrast and canonical component paths", () => {
  const before = readFileSync("control/universal-constitution-version.json", "utf8");
  const run = spawnSync(process.execPath, ["scripts/check-constitution-1.3-candidate.mjs", "--json"],
    { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  const result = JSON.parse(run.stdout);
  assert.equal(result.status, JSON.parse(before).policyVersion === "1.2.0" ? "INACTIVE_CANDIDATE_VERIFIED" : "ACTIVE_AUTHORITY_SET_VERIFIED");
  assert.equal(result.activePolicyVersion, JSON.parse(before).policyVersion);
  assert.equal(result.candidatePolicyVersion, "1.3.0");
  assert.equal(result.ruleCount, 32);
  assert.equal(result.contrastIncluded, true);
  assert.equal(result.componentCount, 4);
  assert.match(result.authoritySetDigest, /^sha256:[a-f0-9]{64}$/);
  assert.match(result.publicationPatchDigest, /^sha256:[a-f0-9]{64}$/);
  assert.equal(result.productionReleaseAuthority, false);
  assert.equal(readFileSync("control/universal-constitution-version.json", "utf8"), before);
});

test("candidate verification refuses a stale or modified publication patch", () => {
  const run = spawnSync(process.execPath,
    ["scripts/check-constitution-1.3-candidate.mjs", "--patch", "package.json"], { encoding: "utf8" });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /patch.*drift|stale.*patch/i);
});

test("sealed activation passes the same checks without follow-on edits", () => {
  const staging = mkdtempSync(join(tmpdir(), "activated-constitution-test-"));
  try {
    const candidate = buildConstitutionCandidate();
    assert.equal(candidate.rules.length, 32);
    assert.equal(candidate.contract.academicProfiles.base, "S100");
    assert.equal(candidate.contract.academicProfiles.baseBands.length, 10);
    assert.equal(candidate.contract.academicProfiles.russian.profile, "R200");
    assert.equal(candidate.contract.academicProfiles.russian.inherits, "S100");
    assert.equal(candidate.contract.academicProfiles.implementationQuota, false);
    assert.equal(candidate.contract.academicProfiles.separateConstitution, false);
    assert.equal(candidate.contract.academicProfiles.verifiedMaturityFromThisContract, false);
    for (const [path, bytes] of candidate.files) {
      mkdirSync(dirname(join(staging, path)), { recursive: true });
      writeFileSync(join(staging, path), bytes);
    }
    for (const path of ["docs/amendments/CONSTITUTION-1.3-AGENT-CHANGE-RELIABILITY.md",
      "docs/amendments/CONSTITUTION-UI-CONTRAST-20261008-PROPOSAL.md",
      "docs/amendments/CONSTITUTION-1.3-PUBLICATION.patch"]) {
      mkdirSync(dirname(join(staging, path)), { recursive: true });
      writeFileSync(join(staging, path), readFileSync(path));
    }
    const run = spawnSync(process.execPath,
      [resolve("scripts/check-constitution-1.3-candidate.mjs"), "--json"], { cwd: staging, encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).status, "ACTIVE_AUTHORITY_SET_VERIFIED");
    assert.equal(JSON.parse(run.stdout).activePolicyVersion, "1.3.0");
    assert.equal(JSON.parse(readFileSync(join(staging, ".blueprint/constitution-adoption.json"))).policyVersion, "1.3.0");
    const before = JSON.parse(readFileSync("control/constitution-ecosystem-snapshot.json"));
    const after = JSON.parse(readFileSync(join(staging, "control/constitution-ecosystem-snapshot.json")));
    assert.deepEqual(after.repositories, before.repositories); // No invented per-app adoption.
    for (const path of ["scripts/check-constitution-adoption.mjs", "scripts/check-constitution-ecosystem-snapshot.mjs",
      "scripts/check-constitution-compliance-snapshot.mjs"]) {
      if (path.includes("ecosystem")) {
        mkdirSync(join(staging, "control"), { recursive: true });
        writeFileSync(join(staging, "control/constitution-governed-repositories.json"),
          readFileSync("control/constitution-governed-repositories.json"));
      }
      const checked = spawnSync(process.execPath, [resolve(path)], { cwd: staging, encoding: "utf8" });
      assert.equal(checked.status, 0, checked.stderr);
    }
  } finally { rmSync(staging, { recursive: true, force: true }); }
});
