import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const API = "https://api.github.com";
const sha = /^[a-f0-9]{40}$/;
const pillars = value => Array.isArray(value) ? [...value].sort().join("\n") : "";
function requireEvidence(condition, message) {
  if (!condition) throw new Error("[governance-live] " + message);
}
export async function githubJson(path, fetchImpl = fetch) {
  const result = await fetchImpl(API + path, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(process.env.GITHUB_TOKEN ? { Authorization: "Bearer " + process.env.GITHUB_TOKEN } : {})
    },
    signal: AbortSignal.timeout(9000)
  });
  requireEvidence(result.ok, "GitHub response " + result.status + " for " + path);
  return await result.json();
}

/**
 * Active GitHub inspection: exact branch HEAD, manifest fetched at SHA, and
 * completed successful compliance CI for that SAME SHA. No mutating actions.
 */
export async function inspectPendingOnboarding(queue, contract, getJson = githubJson) {
  requireEvidence(queue?.scope === "bounded-observation-not-constitutional-authority", "untrusted queue");
  requireEvidence(queue.sealedBaseline?.policyVersion === contract?.policyVersion, "policy mismatch");
  requireEvidence(Array.isArray(queue.entries) && queue.entries.length > 0, "no pending entries");
  requireEvidence(Array.isArray(contract?.pillars), "missing canonical pillars");
  const expectedPillars = pillars(contract.pillars.map(item => item.id));
  const results = [];
  for (const entry of queue.entries) {
    requireEvidence(/^BlueDragon33\/[a-zA-Z0-9_.-]+$/.test(entry.repository ?? ""), "invalid repository");
    requireEvidence(entry.branch === "main", "only the scoped main branch is allowed");
    requireEvidence(sha.test(entry.observedMainSha ?? ""), "invalid queued HEAD");
    const root = "/repos/" + entry.repository;
    const repository = await getJson(root);
    requireEvidence(repository.full_name === entry.repository && repository.default_branch === entry.branch, "repo identity/default branch mismatch: " + entry.repository);
    const branch = await getJson(root + "/branches/" + entry.branch);
    requireEvidence(branch.name === entry.branch && sha.test(branch.commit?.sha ?? ""), "unverified branch source: " + entry.repository);
    requireEvidence(branch.commit.sha === entry.observedMainSha, "queued HEAD is stale for " + entry.repository);
    const encoded = await getJson(root + "/contents/.blueprint/constitution-adoption.json?ref=" + branch.commit.sha);
    requireEvidence(encoded.encoding === "base64" && typeof encoded.content === "string" && encoded.type === "file", "adoption manifest bytes unavailable");
    let adoption;
    try {
      adoption = JSON.parse(Buffer.from(encoded.content.replace(/\s/g, ""), "base64").toString("utf8"));
    } catch {
      throw new Error("[governance-live] malformed adoption manifest: " + entry.repository);
    }
    requireEvidence(adoption.schemaVersion === "1.0.0" && adoption.policyId === contract.policyId &&
      adoption.policyVersion === contract.policyVersion && adoption.projectId === entry.projectId &&
      adoption.blueprintLevel === entry.proposedBlueprintLevel && adoption.enforcementMode === "enforced",
      "adoption policy/identity mismatch: " + entry.repository);
    requireEvidence(pillars(adoption.inheritedPillars) === expectedPillars &&
      Array.isArray(adoption.disabledPillars) && adoption.disabledPillars.length === 0 &&
      Array.isArray(adoption.constitutionalWaivers) && adoption.constitutionalWaivers.length === 0 &&
      adoption.evidenceAuthority === "canonical-quality-gates" &&
      adoption.productionAuthority === "separate-explicit-release-gate",
      "mandatory pillar or authority violation: " + entry.repository);
    const runList = await getJson(root + "/actions/runs?branch=main&per_page=30");
    requireEvidence(Array.isArray(runList.workflow_runs), "CI run source unavailable for " + entry.repository);
    const run = runList.workflow_runs.find(row =>
      row.head_sha === branch.commit.sha && row.path === ".github/workflows/constitution.yml" &&
      row.event === "push" && row.status === "completed" && row.conclusion === "success" &&
      Number.isSafeInteger(row.id) && row.id > 0
    );
    requireEvidence(run, "no successful same-SHA Constitution CI: " + entry.repository);
    results.push({
      repository: entry.repository,
      projectId: entry.projectId,
      branch: entry.branch,
      exactHead: branch.commit.sha,
      constitutionVersion: contract.policyVersion,
      verifiedCiRunId: String(run.id),
      adoptionState: "verified-at-exact-head",
      complianceState: "UNVERIFIED",
      qualityGatePassAllowed: false,
      productionReleaseAuthority: false
    });
  }
  return results;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const queue = JSON.parse(readFileSync("control/governance-onboarding-queue.v1.json", "utf8"));
    const contract = JSON.parse(readFileSync("control/universal-constitution.contract.json", "utf8"));
    const results = await inspectPendingOnboarding(queue, contract);
    console.log(JSON.stringify({
      kind: "read-only-live-governance-observation",
      observedAt: new Date().toISOString(),
      records: results,
      productionReleaseAuthority: false
    }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
