import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const BASELINE = "control/constitution-governed-repositories.json";
const QUEUE = "control/governance-onboarding-queue.v1.json";
const LEDGER = "control/governance-registration-ledger.v1.json";
const POLICY = "control/universal-constitution-version.json";
const OUTPUT = "control/governance-current-view.v1.json";
const sha40 = /^[0-9a-f]{40}$/;
const projectIdPattern = /^project:[a-z0-9-]+$/;
const migrationIdPattern = /^[a-z0-9][a-z0-9-]{4,100}$/;
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
  return typeof value === "string" && !Number.isNaN(timestamp) && new Date(timestamp).toISOString() === value;
}

function checkQueueEntry(item, historicRecordedAt) {
  checkIdentity(item.repository, item.branch, item.projectId, item.proposedBlueprintLevel);
  assert(item.branch === "main", "pending default branch must be main");
  assert(item.visibility === undefined || item.visibility === "private", "invalid privacy boundary metadata");
  if(item.observedAt !== undefined) {
    assert(isExactIso(item.observedAt), "pending entry observedAt must be exact ISO");
    assert(Date.parse(item.observedAt) >= Date.parse(historicRecordedAt), "pending entry observedAt predates historical queue");
  }
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
}

/**
 * Read-only operational inventory projection. NEVER writes the sealed baseline,
 * invents an adoption attestation, certifies a Quality Gate or grants Production.
 * Operational registration is append-only in LEDGER and remains distinct from
 * the ratified Constitution publication artifact.
 */
export function buildGovernanceCurrentView(baseline, queue, ledger, policy) {
  assert(baseline?.schemaVersion === "1.0.0", "baseline version mismatch");
  assert(queue?.schemaVersion === "1.0.0" && queue.kind === "governed-repository-onboarding-queue", "invalid onboarding source");
  assert(queue.scope === "bounded-observation-not-constitutional-authority", "onboarding source cannot grant authority");
  assert(ledger?.schemaVersion === "1.0.0" && ledger.kind === "governed-repository-registration-ledger", "invalid registration ledger");
  assert(ledger.authority === "operational-registration-not-constitutional-amendment", "registration ledger claims constitutional authority");
  assert(policy?.policyVersion === "1.3.0", "only the sealed 1.3 policy is supported");
  assert(baseline.policyId === policy.policyId && ledger.policyId === policy.policyId, "baseline/ledger policy mismatch");
  assert(ledger.policyVersion === policy.policyVersion, "ledger policy version mismatch");
  assert(queue.sealedBaseline?.policyVersion === policy.policyVersion, "queue policy mismatch");
  assert(queue.sealedBaseline?.registryPath === BASELINE && ledger.sealedBaseline?.registryPath === BASELINE, "unexpected baseline path");
  assert(Array.isArray(baseline.repositories) && Array.isArray(queue.entries) && Array.isArray(ledger.migrations), "missing repository collections");
  assert(queue.sealedBaseline.governedCount === baseline.repositories.length, "historical baseline count drift");
  assert(ledger.sealedBaseline.governedCount === baseline.repositories.length, "ledger attempts to rewrite sealed baseline count");
  assert(isExactIso(queue.recordedAt), "onboarding observedAt must be exact ISO");

  const sealedRepos = new Set();
  const sealedProjects = new Set();
  const sealed = baseline.repositories.map((item) => {
    checkIdentity(item.repository, item.branch, item.projectId, item.blueprintLevel);
    assert(item.role === "governed" || item.role === "authority-self", "unexpected sealed role");
    assert(!sealedRepos.has(item.repository), "duplicate sealed repository: " + item.repository);
    assert(!sealedProjects.has(item.projectId), "duplicate sealed project identity: " + item.projectId);
    sealedRepos.add(item.repository);
    sealedProjects.add(item.projectId);
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

  let latestRecordedAt = queue.recordedAt;
  const queueByRepo = new Map();
  const queueProjects = new Set();
  for (const item of queue.entries) {
    checkQueueEntry(item, queue.recordedAt);
    assert(!sealedRepos.has(item.repository), "duplicate repository: " + item.repository);
    assert(!sealedProjects.has(item.projectId), "duplicate project identity: " + item.projectId);
    assert(!queueByRepo.has(item.repository), "duplicate repository: " + item.repository);
    assert(!queueProjects.has(item.projectId), "duplicate project identity: " + item.projectId);
    queueByRepo.set(item.repository, item);
    if (item.observedAt && Date.parse(item.observedAt) > Date.parse(latestRecordedAt)) latestRecordedAt = item.observedAt;
    queueProjects.add(item.projectId);
  }

  const admittedByRepo = new Map();
  const admittedProjects = new Set();
  for (const migration of ledger.migrations) {
    assert(migration && typeof migration === "object" && migrationIdPattern.test(migration.migrationId ?? ""), "invalid registration migration ID");
    assert(isExactIso(migration.sourceQueueRecordedAt), "registration migration queue source timestamp invalid");
    assert(isExactIso(migration.registeredAt) && Date.parse(migration.registeredAt) >= Date.parse(queue.recordedAt), "invalid registration timestamp");
    if (Date.parse(migration.registeredAt) > Date.parse(latestRecordedAt)) latestRecordedAt = migration.registeredAt;
    assert(Array.isArray(migration.entries) && migration.entries.length > 0, "registration migration has no entries");
    for (const item of migration.entries) {
      checkIdentity(item.repository, item.branch, item.projectId, item.blueprintLevel);
      assert(!admittedByRepo.has(item.repository), "repository admitted more than once: " + item.repository);
      assert(!admittedProjects.has(item.projectId), "project admitted more than once: " + item.projectId);
      const staged = queueByRepo.get(item.repository);
      assert(staged, "registration has no staged onboarding source: " + item.repository);
      assert(migration.sourceQueueRecordedAt === (staged.observedAt ?? queue.recordedAt), "registration migration queue source mismatch");
      assert(item.projectId === staged.projectId && item.branch === staged.branch &&
        item.blueprintLevel === staged.proposedBlueprintLevel &&
        item.admittedMainSha === staged.observedMainSha &&
        item.adoptionPr === staged.adoptionPr, "registration diverges from staged identity/source: " + item.repository);
      assert(sha40.test(item.admittedMainSha ?? ""), "registration needs exact admitted SHA");
      assert(
        typeof item.constitutionCi === "string" &&
        new RegExp("^https://github\\.com/" + item.repository + "/actions/runs/[0-9]+$").test(item.constitutionCi),
        "invalid registration CI reference: " + item.repository
      );
      assert(item.registrationState === "admitted-registration" &&
        item.complianceState === "UNVERIFIED" &&
        item.canonicalProjectProfile === false &&
        item.productionAuthority === false, "registration may not self-certify authority");
      admittedByRepo.set(item.repository, { item, registeredAt: migration.registeredAt });
      admittedProjects.add(item.projectId);
    }
  }

  const registered = [];
  const pending = [];
  for (const staged of queue.entries) {
    const admitted = admittedByRepo.get(staged.repository);
    if (admitted) {
      const item = admitted.item;
      registered.push({
        repository: item.repository,
        branch: item.branch,
        projectId: item.projectId,
        blueprintLevel: item.blueprintLevel,
        registrationState: "admitted-registration",
        sourceRevision: item.admittedMainSha,
        observedAt: admitted.registeredAt,
        sourceFreshness: "verified-admission-source",
        complianceState: "UNVERIFIED",
        productionAuthority: false
      });
    } else {
      pending.push({
        repository: staged.repository,
        branch: staged.branch,
        projectId: staged.projectId,
        blueprintLevel: staged.proposedBlueprintLevel,
        registrationState: "pending-onboarding",
        sourceRevision: staged.observedMainSha,
        observedAt: staged.observedAt ?? queue.recordedAt,
        sourceFreshness: "historical-reference-not-live-head",
        complianceState: "UNVERIFIED",
        productionAuthority: false
      });
    }
  }

  return {
    schemaVersion: "1.0.0",
    kind: "governance-current-coverage-view",
    authority: "read-only-operational-observation",
    policyId: baseline.policyId,
    policyVersion: policy.policyVersion,
    generatedFrom: [BASELINE, QUEUE, LEDGER, POLICY],
    recordedAt: latestRecordedAt,
    sealedBaselineCount: sealed.length,
    admittedRegistrationCount: registered.length,
    pendingOnboardingCount: pending.length,
    trackedCount: sealed.length + registered.length + pending.length,
    repositories: [...sealed, ...registered, ...pending],
    canonicalProjectMutationAllowed: false,
    automaticQualityGatePassAllowed: false,
    productionReleaseAuthority: false
  };
}

function load(path) { return JSON.parse(readFileSync(path, "utf8")); }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const current = buildGovernanceCurrentView(load(BASELINE), load(QUEUE), load(LEDGER), load(POLICY));
    const text = JSON.stringify(current, null, 2) + "\n";
    if (process.argv.includes("--write")) {
      writeFileSync(OUTPUT, text);
      console.log("[governance-current-view] generated read-only current view");
    } else if (process.argv.includes("--check")) {
      assert(readFileSync(OUTPUT, "utf8") === text, "generated current view is stale; run --write");
      console.log("[governance-current-view] PASS " + current.sealedBaselineCount + " sealed + " +
        current.admittedRegistrationCount + " admitted + " + current.pendingOnboardingCount +
        " pending; no constitutional/Production authority granted");
    } else {
      console.log(text.trimEnd());
    }
  } catch (error) {
    console.error(errorsOf(error));
    process.exitCode = 1;
  }
}
