import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const BASELINE = "control/constitution-governed-repositories.json";
const QUEUE = "control/governance-onboarding-queue.v1.json";
const POLICY = "control/universal-constitution-version.json";
const OUTPUT = "control/governance-current-view.v1.json";
const sha40 = /^[0-9a-f]{40}$/;
const projectIdPattern = /^project:[a-z0-9-]+$/;
const errorsOf = (error) => error instanceof Error ? error.message : String(error);

function assert(value, message) {
  if (!value) throw new Error("[governance-current-view] " + message);
}

function checkIdentity(repository, branch, projectId, level) {
  assert(/^BlueDragon33\/[A-Za-z0-9_.-]+$/.test(repository ?? ""), "invalid repository");
  assert(/^(main|ros2)$/.test(branch ?? ""), "unexpected branch for " + repository);
  assert(projectIdPattern.test(projectId ?? ""), "invalid project ID for " + repository);
  assert(/^B[0-5]$/.test(level ?? ""), "invalid level for " + repository);
}

function isExactIso(value) {
  const timestamp = Date.parse(value);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
}

/**
 * Read-only operational inventory projection. NEVER writes the sealed baseline,
 * invents an adoption attestation, certifies a Quality Gate or grants Production.
 */
export function buildGovernanceCurrentView(baseline, queue, policy) {
  assert(baseline?.schemaVersion === "1.0.0", "baseline version mismatch");
  assert(queue?.schemaVersion === "1.0.0" && queue.kind === "governed-repository-onboarding-queue", "invalid onboarding source");
  assert(queue.scope === "bounded-observation-not-constitutional-authority", "onboarding source cannot grant authority");
  assert(policy?.policyVersion === "1.3.0", "only the sealed 1.3 policy is supported");
  assert(baseline.policyId === policy.policyId, "baseline policy mismatch");
  assert(queue.sealedBaseline?.policyVersion === policy.policyVersion, "queue policy mismatch");
  assert(queue.sealedBaseline?.registryPath === BASELINE, "unexpected baseline path");
  assert(Array.isArray(baseline.repositories) && Array.isArray(queue.entries), "missing repository collections");
  assert(queue.sealedBaseline.governedCount === baseline.repositories.length, "historical baseline count drift");
  assert(isExactIso(queue.recordedAt), "onboarding observedAt must be exact ISO");

  const seenRepos = new Set();
  const seenProjects = new Set();
  const reserve = (repo, projectId) => {
    assert(!seenRepos.has(repo), "duplicate repository: " + repo);
    assert(!seenProjects.has(projectId), "duplicate project identity: " + projectId);
    seenRepos.add(repo);
    seenProjects.add(projectId);
  };
  const sealed = baseline.repositories.map((item) => {
    checkIdentity(item.repository, item.branch, item.projectId, item.blueprintLevel);
    assert(item.role === "governed" || item.role === "authority-self", "unexpected sealed role");
    reserve(item.repository, item.projectId);
    return {
      repository: item.repository,
      branch: item.branch,
      projectId: item.projectId,
      blueprintLevel: item.blueprintLevel,
      registrationState: "sealed-baseline",
      sourceRevision: null,
      observedAt: null,
      sourceFreshness: "not-live-verified",
      complianceState: "UNVERIFIED",
      productionAuthority: false
    };
  });
  const pending = queue.entries.map((item) => {
    checkIdentity(item.repository, item.branch, item.projectId, item.proposedBlueprintLevel);
    assert(item.branch === "main", "pending default branch must be main");
    reserve(item.repository, item.projectId);
    assert(sha40.test(item.observedMainSha ?? ""), "pending source needs exact observed SHA");
    assert(item.state === "adopted-pending-canonical-registration", "pending must not claim registration");
    assert(item.canonicalCompliance === "UNVERIFIED" && item.productionAuthority === false, "pending may not self-certify");
    assert(
      typeof item.adoptionPr === "string" &&
      new RegExp("^https://github\\.com/" + item.repository + "/pull/[0-9]+$").test(item.adoptionPr),
      "invalid PR reference: " + item.repository
    );
    assert(
      typeof item.adoptionCI === "string" &&
      new RegExp("^https://github\\.com/" + item.repository + "/actions/runs/[0-9]+$").test(item.adoptionCI),
      "invalid CI reference: " + item.repository
    );
    return {
      repository: item.repository,
      branch: item.branch,
      projectId: item.projectId,
      blueprintLevel: item.proposedBlueprintLevel,
      registrationState: "pending-onboarding",
      sourceRevision: item.observedMainSha,
      observedAt: queue.recordedAt,
      sourceFreshness: "historical-reference-not-live-head",
      complianceState: "UNVERIFIED",
      productionAuthority: false
    };
  });
  return {
    schemaVersion: "1.0.0",
    kind: "governance-current-coverage-view",
    authority: "read-only-operational-observation",
    policyId: baseline.policyId,
    policyVersion: policy.policyVersion,
    generatedFrom: [BASELINE, QUEUE, POLICY],
    recordedAt: queue.recordedAt,
    sealedBaselineCount: sealed.length,
    pendingOnboardingCount: pending.length,
    trackedCount: sealed.length + pending.length,
    repositories: [...sealed, ...pending],
    canonicalProjectMutationAllowed: false,
    automaticQualityGatePassAllowed: false,
    productionReleaseAuthority: false
  };
}

function load(path) { return JSON.parse(readFileSync(path, "utf8")); }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const current = buildGovernanceCurrentView(load(BASELINE), load(QUEUE), load(POLICY));
    const text = JSON.stringify(current, null, 2) + "\n";
    if (process.argv.includes("--write")) {
      writeFileSync(OUTPUT, text);
      console.log("[governance-current-view] generated read-only current view");
    } else if (process.argv.includes("--check")) {
      assert(readFileSync(OUTPUT, "utf8") === text, "generated current view is stale; run --write");
      console.log("[governance-current-view] PASS " + current.sealedBaselineCount + " sealed + " + current.pendingOnboardingCount + " pending; no authority granted");
    } else {
      console.log(text.trimEnd());
    }
  } catch (error) {
    console.error(errorsOf(error));
    process.exitCode = 1;
  }
}
