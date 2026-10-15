import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { inspectPendingOnboarding } from "../../scripts/verify-governance-onboarding-live.mjs";

const load = path => JSON.parse(readFileSync(path, "utf8"));
const queue = load("control/governance-onboarding-queue.v1.json");
const contract = load("control/universal-constitution.contract.json");

function provider(overrides = {}) {
  return async path => {
    const entry = queue.entries.find(e => path.startsWith("/repos/" + e.repository + "/"));
    if (!entry) {
      const repo = queue.entries.find(e => path === "/repos/" + e.repository);
      assert.ok(repo, "unexpected URL: " + path);
      return { full_name: repo.repository, default_branch: overrides.branch ?? "main" };
    }
    if (path.endsWith("/branches/main")) return { name: "main", commit: { sha: overrides.sha ?? entry.observedMainSha } };
    if (path.includes("/contents/.blueprint/constitution-adoption.json")) {
      const adoption = {
        schemaVersion: "1.0.0",
        policyId: contract.policyId, policyVersion: contract.policyVersion,
        projectId: overrides.projectId ?? entry.projectId,
        blueprintLevel: entry.proposedBlueprintLevel, enforcementMode: "enforced",
        inheritedPillars: contract.pillars.map(x => x.id),
        disabledPillars: overrides.disabledPillars ?? [], constitutionalWaivers: [],
        evidenceAuthority: "canonical-quality-gates", productionAuthority: "separate-explicit-release-gate"
      };
      return { encoding: "base64", type: "file", content: Buffer.from(JSON.stringify(adoption)).toString("base64") };
    }
    if (path.includes("/actions/runs")) {
      return { workflow_runs: [{
        path: ".github/workflows/constitution.yml",
        head_sha: overrides.ciSha ?? entry.observedMainSha,
        event: "push", status: "completed", conclusion: overrides.conclusion ?? "success", id: 12345
      }] };
    }
    throw new Error("unrecognized path " + path);
  };
}

test("live inspection verifies SHA-pinned adoption and CI, but never quality gate or Production", async () => {
  const out = await inspectPendingOnboarding(queue, contract, provider());
  assert.equal(out.length, 2);
  assert.ok(out.every(x => x.adoptionState === "verified-at-exact-head" &&
    x.complianceState === "UNVERIFIED" && x.qualityGatePassAllowed === false && x.productionReleaseAuthority === false));
});
test("stale observed HEAD blocks onboarding", async () => {
  await assert.rejects(inspectPendingOnboarding(queue, contract, provider({sha:"f".repeat(40)})), /queued HEAD is stale/);
});
test("missing same-SHA successful CI blocks onboarding", async () => {
  await assert.rejects(inspectPendingOnboarding(queue, contract, provider({conclusion:"failure"})), /no successful same-SHA/);
  await assert.rejects(inspectPendingOnboarding(queue, contract, provider({ciSha:"a".repeat(40)})), /no successful same-SHA/);
});
test("wrong project manifest and weakened pillars block onboarding", async () => {
  await assert.rejects(inspectPendingOnboarding(queue, contract, provider({projectId:"project:wrong"})), /adoption policy\/identity mismatch/);
  await assert.rejects(inspectPendingOnboarding(queue, contract, provider({disabledPillars:["structural-capacity"]})), /mandatory pillar/);
});
test("unexpected default branch and untrusted queue block onboarding", async () => {
  await assert.rejects(inspectPendingOnboarding(queue, contract, provider({branch:"develop"})), /default branch mismatch/);
  const bad = structuredClone(queue);
  bad.scope = "production-authorized";
  await assert.rejects(inspectPendingOnboarding(bad, contract, provider()), /untrusted queue/);
});
test("unavailable or incomplete GitHub response fails closed", async () => {
  await assert.rejects(inspectPendingOnboarding(queue, contract, async () => { throw new Error("GitHub 403"); }), /GitHub 403/);
  await assert.rejects(inspectPendingOnboarding(queue, contract, async () => ({})), /repo identity/);
});
