/**
 * Constitution 1.3 candidate: PURE, PROPOSAL-ONLY change-evidence evaluator.
 * No filesystem, network, credentials, canonical Quality Gate mutation, or Production authority.
 * A positive result means READY_FOR_REVIEW, NEVER Constitutional PASS or release approval.
 */
const SHA = /^[a-f0-9]{40}$/;
const REQUIRED = Object.freeze({
  L1: ["static"],
  L2: ["static", "regression", "integration"],
  L3: ["static", "regression", "integration", "security", "recovery", "human-review"]
});

const isSha = (value) => typeof value === "string" && SHA.test(value);
const isNonEmpty = (value) => typeof value === "string" && value.trim().length > 0;

export function evaluateAgentChangeEvidence(change, policy = {}) {
  const blocked = new Set();
  const unverified = new Set();
  const warnings = new Set();

  if (!change || typeof change !== "object" || Array.isArray(change)) {
    return {
      status: "BLOCKED",
      blocked: ["INVALID_CHANGE_EVIDENCE"],
      unverified: [],
      warnings: [],
      authority: { canonicalGatePass: false, constitutionalRatification: false, productionRelease: false }
    };
  }

  const risk = change.risk;
  const expectedPolicy = policy.activePolicyVersion ?? "1.2.0";
  if (!Object.hasOwn(REQUIRED, risk)) blocked.add("UNKNOWN_RISK_LEVEL");
  if (!isNonEmpty(change.repository) || !isNonEmpty(change.workPackage)) {
    unverified.add("MISSING_IDENTITY");
  }
  if (!isSha(change.baseSha) || !isSha(change.headSha)) unverified.add("INVALID_REVISION");
  if (!isSha(change.evidence?.sourceSha) || change.evidence.sourceSha !== change.headSha) {
    unverified.add("STALE_OR_MISSING_EVIDENCE_SHA");
  }
  if (!Number.isSafeInteger(change.evidence?.runId) || change.evidence.runId <= 0) {
    unverified.add("MISSING_TRUSTED_RUN_ID");
  }
  if (change.policyVersion !== expectedPolicy) unverified.add("POLICY_VERSION_MISMATCH");

  if (change.claims?.canonicalGatePass === true ||
      change.claims?.constitutionalRatification === true ||
      change.claims?.productionRelease === true) {
    blocked.add("UNAUTHORIZED_AUTHORITY_CLAIM");
  }

  const allowed = change.scope?.allowedPaths;
  const changed = change.scope?.changedPaths;
  if (!Array.isArray(allowed) || !Array.isArray(changed) ||
      allowed.some((path) => !isNonEmpty(path)) ||
      changed.some((path) => !isNonEmpty(path))) {
    unverified.add("MISSING_OR_INVALID_SCOPE");
  } else {
    const authorized = new Set(allowed);
    if (changed.some((path) => !authorized.has(path))) {
      blocked.add("OUT_OF_SCOPE_FILE_CHANGE");
    }
  }

  if (change.testIntegrity?.weakenedAssertions === true ||
      change.testIntegrity?.unreviewedSkippedTests === true) {
    blocked.add("TEST_INTEGRITY_WEAKENED");
  }

  const checks = Array.isArray(change.checks) ? change.checks : [];
  const checkIds = new Set();
  for (const check of checks) {
    if (!check || !isNonEmpty(check.id) || checkIds.has(check.id)) {
      blocked.add("DUPLICATE_OR_INVALID_CHECK_ID");
      continue;
    }
    checkIds.add(check.id);
    if (!isSha(check.sourceSha) || check.sourceSha !== change.headSha) {
      unverified.add("CHECK_REVISION_MISMATCH");
    }
    if (check.status === "FAIL") blocked.add("FAILED_CHECK");
    else if (check.status !== "PASS") unverified.add("INCOMPLETE_CHECK");
  }
  for (const name of REQUIRED[risk] ?? []) {
    if (!checkIds.has(name)) unverified.add("MISSING_CHECK:" + name);
  }

  const regressions = Array.isArray(change.regressions) ? change.regressions : [];
  for (const defect of regressions) {
    if (defect?.attributable === true && defect?.resolved !== true) {
      if (["P0", "P1", "P2"].includes(defect.severity) ||
          (defect.severity === "P3" && defect.reviewedException !== true)) {
        blocked.add("UNRESOLVED_REGRESSION");
      } else {
        warnings.add("REGRESSION_REVIEW_REQUIRED");
      }
    }
  }

  const duplicates = change.duplication ?? {};
  if (duplicates.canonicalOwnerConflict === true) blocked.add("DUPLICATE_CANONICAL_OWNER");
  if (Number.isInteger(duplicates.confirmedGroups) && duplicates.confirmedGroups >= 2) {
    blocked.add("CONFIRMED_DUPLICATE_GROWTH");
  } else if (Number.isInteger(duplicates.confirmedGroups) && duplicates.confirmedGroups > 0) {
    warnings.add("DUPLICATE_GROWTH_REVIEW");
  }
  if (duplicates.candidateClones > 0) warnings.add("CLONE_CANDIDATES_NOT_PROOF");

  const writes = Array.isArray(change.protectedWrites) ? change.protectedWrites : [];
  for (const write of writes) {
    if (!write || !isNonEmpty(write.resource) || write.inDeclaredScope !== true) {
      blocked.add("OUT_OF_SCOPE_PROTECTED_WRITE");
    } else if (!Number.isSafeInteger(write.expectedVersion) ||
               !Number.isSafeInteger(write.currentVersion)) {
      unverified.add("MISSING_PROTECTED_WRITE_VERSION");
    } else if (write.expectedVersion !== write.currentVersion) {
      blocked.add("STALE_PROTECTED_WRITE");
    }
  }

  const outcomes = Array.isArray(change.persistenceOutcomes) ? change.persistenceOutcomes : [];
  if (change.persistentMutation === true && outcomes.length === 0) {
    unverified.add("MISSING_PERSISTENCE_READBACK");
  }
  for (const item of outcomes) {
    if (!item || !isNonEmpty(item.appId) || !isNonEmpty(item.field)) {
      unverified.add("INVALID_PERSISTENCE_OUTCOME");
    } else if (item.readbackState === "MISMATCH") {
      blocked.add("PERSISTENCE_READBACK_MISMATCH");
    } else if (item.readbackState !== "MATCH") {
      unverified.add("PERSISTENCE_READBACK_UNVERIFIED");
    }
  }

  if (change.uiReview?.confirmedRedundantCriticalSurface === true) {
    blocked.add("CONFIRMED_CRITICAL_UI_ENTROPY");
  }

  if (Number.isSafeInteger(change.failedAttempts) && change.failedAttempts >= 3) {
    blocked.add("STOP_REINVESTIGATE_ROOT_CAUSE");
  }

  const timing = change.performance;
  if (change.performanceRequired === true && !timing) unverified.add("MISSING_PERFORMANCE_EVIDENCE");
  if (timing) {
    const valid = [timing.baselineMs, timing.candidateMs, timing.samples].every(Number.isFinite) &&
      timing.baselineMs > 0 && timing.candidateMs > 0 && Number.isInteger(timing.samples) &&
      timing.samples >= 1;
    if (!valid) {
      unverified.add("INVALID_PERFORMANCE_EVIDENCE");
    } else {
      const ratio = timing.candidateMs / timing.baselineMs;
      if (timing.budgetMs !== undefined && (!Number.isFinite(timing.budgetMs) || timing.budgetMs <= 0)) {
        unverified.add("INVALID_PERFORMANCE_BUDGET");
      }
      if (ratio >= 1.2 || (Number.isFinite(timing.budgetMs) && timing.candidateMs > timing.budgetMs)) {
        if (timing.samples < 3 || timing.comparable !== true) {
          unverified.add("PERFORMANCE_REMEASUREMENT_REQUIRED");
        } else if (timing.critical === true) {
          blocked.add("CONFIRMED_CRITICAL_PERFORMANCE_REGRESSION");
        } else {
          warnings.add("NONCRITICAL_PERFORMANCE_REGRESSION");
        }
      } else if (ratio >= 1.1) {
        warnings.add("PERFORMANCE_WARNING");
      }
    }
  }

  const mature = change.matureCohort;
  if (mature) {
    if (!Number.isInteger(mature.verifiedFixes) || mature.verifiedFixes < 20 ||
        !Number.isInteger(mature.eligibleClosedDefects) || mature.eligibleClosedDefects < 20) {
      warnings.add("INSUFFICIENT_TREND_SAMPLE");
    }
  } else {
    warnings.add("TREND_METRICS_NOT_REPORTED");
  }

  const status = blocked.size ? "BLOCKED" : unverified.size ? "UNVERIFIED" : "READY_FOR_REVIEW";
  return {
    status,
    blocked: [...blocked].sort(),
    unverified: [...unverified].sort(),
    warnings: [...warnings].sort(),
    authority: { canonicalGatePass: false, constitutionalRatification: false, productionRelease: false }
  };
}

/**
 * R25–R27 candidate: classify an ecosystem's proposed *topology*, not
 * implementation maturity. Inputs are assertions from a reviewed situational
 * brief, not evidence collected or authenticated by this pure function.
 * Existing per-project B0–B5 and L1–L3 policies remain untouched.
 */
export function proposeEcosystemReference(context) {
  const authority = Object.freeze({
    canonicalGatePass: false, constitutionalRatification: false,
    productionRelease: false
  });
  const reject = (reason) => Object.freeze({
    status: "UNVERIFIED", proposedEcosystemLevel: null, operationalMaturity: "UNVERIFIED",
    nextAction: reason, authority
  });
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    return reject("GATHER_ECOSYSTEM_TOPOLOGY");
  }
  const { productCount, domainCount, sharedContractCount,
    governanceOwner, operationsOwner, federatedEcosystemCount,
    crossTrustProtocol } = context;
  const counts = [productCount, domainCount, sharedContractCount, federatedEcosystemCount];
  if (counts.some((n) => !Number.isSafeInteger(n) || n < 0 || n > 100000) ||
      productCount < 1 || domainCount < 1 || domainCount > productCount ||
      typeof crossTrustProtocol !== "boolean" ||
      ![governanceOwner, operationsOwner].every((x) =>
        x === null || x === undefined ||
        (typeof x === "string" && x.length > 0 && x.length <= 128 &&
          /^[A-Za-z0-9_.:/-]+$/.test(x)))) {
    return reject("GATHER_ECOSYSTEM_TOPOLOGY");
  }
  const hasGovernance = isNonEmpty(governanceOwner);
  const hasOperations = isNonEmpty(operationsOwner);
  // Role separation is substantive; no magic superadmin or implicit merger.
  if (hasGovernance && hasOperations && governanceOwner === operationsOwner &&
      productCount >= 3 && domainCount >= 2) {
    return reject("REVIEW_ECOSYSTEM_AUTHORITY_SEPARATION");
  }
  const managed = productCount >= 3 && domainCount >= 2 &&
    hasGovernance && hasOperations;
  const federated = managed && federatedEcosystemCount >= 2 &&
    crossTrustProtocol && sharedContractCount >= 1;
  const suite = productCount >= 2 && sharedContractCount >= 1;
  if (productCount > 1 && !managed && !suite) {
    return reject("ASSESS_UNCONNECTED_PORTFOLIO");
  }
  const level = federated ? "E3" : managed ? "E2" : suite ? "E1" : "E0";
  const focus = {
    E0: ["PRESERVE_STANDALONE_DATA_OWNER", "VALIDATE_PRODUCT_JOURNEY"],
    E1: ["VERSION_SHARED_CONTRACTS", "VERIFY_ONE_CROSS_PRODUCT_JOURNEY"],
    E2: ["SEPARATE_POLICY_AND_OPERATIONS_PLANES", "VERIFY_SCOPED_APP_ENROLLMENT",
      "VERIFY_CROSS_PRODUCT_READBACK_AND_ISOLATION"],
    E3: ["REVIEW_FEDERATED_TRUST_CONTRACT", "VERIFY_CROSS_AUTHORITY_REVOCATION_AND_FAILOVER"]
  };
  return Object.freeze({
    status: "PROPOSAL_ONLY", proposedEcosystemLevel: level,
    operationalMaturity: "UNVERIFIED",
    projectClassificationUnchanged: true,
    nextAction: "REVIEW_CANONICAL_ECOSYSTEM_TOPOLOGY_AND_REAL_EVIDENCE",
    firstProofTargets: Object.freeze(focus[level]), authority
  });
}

/**
 * Advisory intake for a NEW project before a canonical Project Profile exists.
 * Model the intended supported product, NOT the number of files in its seed.
 * No inputs are authenticated: the owner must confirm scope/level through the
 * existing Project Profile and Blueprint authority path. No writes or approvals.
 */
export function proposeNewProjectBlueprintIntake(situation) {
  const authority = Object.freeze({
    canonicalGatePass: false, constitutionalRatification: false, productionRelease: false
  });
  const invalid = () => Object.freeze({
    status: "UNVERIFIED", recommendedBlueprintLevel: null, scale: null,
    nextAction: "COLLECT_PROJECT_SITUATION", plan: Object.freeze([]), authority
  });
  if (!situation || typeof situation !== "object" || Array.isArray(situation)) return invalid();
  const { purpose, stage, criticalJourneys, independentModules, crossAppContracts,
    persistentUserState, highSensitivityData, privilegedControl,
    criticalFailureImpact, sharedPlatformRole } = situation;
  if (!isNonEmpty(purpose) || purpose.length > 160 ||
      !["foundation", "pilot", "operational"].includes(stage) ||
      [criticalJourneys, independentModules, crossAppContracts].some((n) =>
        !Number.isSafeInteger(n) || n < 0 || n > 10000) ||
      [persistentUserState, highSensitivityData, privilegedControl,
        criticalFailureImpact, sharedPlatformRole].some((v) => typeof v !== "boolean")) {
    return invalid();
  }
  // Risk and integration raise planning depth; a foundation-only repository does
  // not downgrade the intended product architecture.
  let level;
  if (criticalFailureImpact || highSensitivityData) level = "B5";
  else if (sharedPlatformRole || privilegedControl || crossAppContracts >= 3) level = "B4";
  else if (independentModules >= 3 || criticalJourneys >= 4 ||
    (crossAppContracts >= 1 && (independentModules >= 2 || criticalJourneys >= 3))) level = "B3";
  else if (persistentUserState || independentModules >= 2 || criticalJourneys >= 2) level = "B2";
  else if (independentModules >= 1 || criticalJourneys >= 1) level = "B1";
  else level = "B0";
  const scale = Number(level[1]) <= 2 ? "COMPACT" : "STRUCTURED";
  const plan = scale === "COMPACT"
    ? ["CONFIRM_ONE_USER_GOAL", "DELIVER_ONE_SCOPED_VERTICAL_SLICE",
      "VERIFY_RELEVANT_REGRESSION_AND_STATE", "RECONCILE_NEXT_GOAL"]
    : ["CONFIRM_PROJECT_PROFILE_AND_DEPENDENCY_OWNERS",
      "SELECT_ONE_CRITICAL_USER_JOURNEY",
      "DELIVER_ONE_CONTRACTED_VERTICAL_SLICE",
      "VERIFY_REAL_BOUNDARIES_AND_FAILURE_MODES",
      "RECONCILE_WORK_PACKAGES_BEFORE_EXPANSION"];
  return Object.freeze({
    status: "PROPOSAL_ONLY", recommendedBlueprintLevel: level, scale,
    nextAction: "REVIEW_AND_RECORD_CANONICAL_PROJECT_PROFILE",
    stage, plan: Object.freeze(plan), authority
  });
}

/**
 * Proposal-only Universal execution-law projection (R21/R22).
 * B0–B2 = COMPACT, B3–B5 = STRUCTURED; operation risk may raise check depth
 * but never grants human, constitutional, quality-gate or production authority.
 * This does not classify projects from arbitrary prompt text: callers must
 * supply the Blueprint Level from the independently resolved project profile.
 */
export function resolveExecutionScaleProfile(input = {}) {
  const normalized = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const { blueprintLevel, operationRisk, protectedOperation = false } = normalized;
  const authority = Object.freeze({
    canonicalGatePass: false, constitutionalRatification: false, productionRelease: false
  });
  if (!/^B[0-5]$/.test(blueprintLevel ?? "") || !Object.hasOwn(REQUIRED, operationRisk) ||
      typeof protectedOperation !== "boolean") {
    return Object.freeze({
      status: "UNVERIFIED", scale: null, checks: Object.freeze([]),
      nextAction: "RESOLVE_CANONICAL_SCALE_AND_RISK", authority
    });
  }
  const scale = Number(blueprintLevel[1]) <= 2 ? "COMPACT" : "STRUCTURED";
  const risk = protectedOperation ? "L3" : operationRisk;
  const checks = Object.freeze([...REQUIRED[risk]]);
  return Object.freeze({
    status: "READY_FOR_REVIEW", scale, blueprintLevel, effectiveRisk: risk,
    executionMode: scale === "COMPACT" ? "FOCUSED_WORK_SLICE" : "DEPENDENCY_AWARE_WORK_QUEUE",
    checks, escalation: "CURRENT_CONNECTED_CAPABILITIES_FIRST",
    nextAction: "REVIEW_SCOPED_EXECUTION", authority
  });
}

/**
 * Pure continuity preflight for the proposed R15–R20 protocol.
 * A snapshot is supplied by the caller and NOT authenticated by this function.
 * Results are advisory next actions, never a command to mutate any system or
 * evidence of human acceptance, Constitutional PASS or Production authority.
 */
export function evaluateExecutionContinuity(snapshot) {
  const noAuthority = Object.freeze({
    canonicalGatePass: false, constitutionalRatification: false, productionRelease: false
  });
  const result = (state, nextAction, taskId = null, reasons = [],
    humanInterventionRequired = false) => Object.freeze({
    state, nextAction, taskId, reasons: Object.freeze([...reasons]),
    humanInterventionRequired, authority: noAuthority
  });
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot) ||
      !new RegExp("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$").test(snapshot.repository ?? "") ||
      !/^[A-Za-z0-9_./-]+$/.test(snapshot.branch ?? "") ||
      snapshot.branch.includes("..") || snapshot.branch.endsWith("/") ||
      !isSha(snapshot.headSha) || !isNonEmpty(snapshot.activePolicyVersion) ||
      !isNonEmpty(snapshot.goal?.id) || snapshot.goal.approved !== true ||
      !Array.isArray(snapshot.goal.acceptance) ||
      !Array.isArray(snapshot.workPackages) ||
      !snapshot.checkpoint || typeof snapshot.checkpoint !== "object") {
    return result("BLOCKED", "REBUILD_EXECUTION_SNAPSHOT", null, ["INVALID_EXECUTION_SNAPSHOT"]);
  }

  const executionProfile = resolveExecutionScaleProfile({
    blueprintLevel: snapshot.blueprintLevel,
    operationRisk: snapshot.operationRisk,
    protectedOperation: snapshot.protectedOperation ?? false
  });
  if (executionProfile.status !== "READY_FOR_REVIEW") {
    return result("UNVERIFIED", "RESOLVE_CANONICAL_SCALE_AND_RISK", null,
      ["MISSING_OR_INVALID_EXECUTION_PROFILE"]);
  }
  if (executionProfile.scale === "STRUCTURED" && snapshot.workPackages.length === 0) {
    return result("UNVERIFIED", "RECONCILE_STRUCTURED_WORK_QUEUE", null,
      ["MISSING_STRUCTURED_WORK_PACKAGE"]);
  }

  const checkpoint = snapshot.checkpoint;
  if (checkpoint.headSha !== snapshot.headSha ||
      checkpoint.repository !== snapshot.repository ||
      checkpoint.branch !== snapshot.branch ||
      checkpoint.policyVersion !== snapshot.activePolicyVersion ||
      checkpoint.goalId !== snapshot.goal.id) {
    return result("UNVERIFIED", "RECONCILE_LIVE_STATE", null, ["STALE_CHECKPOINT"]);
  }
  if (snapshot.proposedGoalId && snapshot.proposedGoalId !== snapshot.goal.id) {
    return result("BLOCKED", "RESOLVE_GOAL_CHANGE", null, ["UNAPPROVED_GOAL_DELTA"], true);
  }
  // Evidence in this proposal is caller-supplied; independent validation remains
  // required by the real canonical Quality Gate. Never accept missing checks as PASS.
  const scopedChecks = snapshot.scopedChecks;
  if (!Array.isArray(scopedChecks)) {
    return result("UNVERIFIED", "VERIFY_RISK_SCOPED_CHECKS", null,
      ["MISSING_SCOPED_CHECK_EVIDENCE"]);
  }
  const scopedIds = new Set();
  for (const check of scopedChecks) {
    if (!isNonEmpty(check?.id) || scopedIds.has(check.id)) {
      return result("BLOCKED", "REPAIR_SCOPED_CHECK_MANIFEST", null,
        ["DUPLICATE_OR_INVALID_SCOPED_CHECK"]);
    }
    scopedIds.add(check.id);
    if (check.status === "FAIL") {
      return result("BLOCKED", "FIX_FAILED_SCOPED_CHECK", null, ["FAILED_SCOPED_CHECK:" + check.id]);
    }
    if (check.status !== "PASS" || check.sourceSha !== snapshot.headSha) {
      return result("UNVERIFIED", "VERIFY_RISK_SCOPED_CHECKS", null,
        ["STALE_OR_INCOMPLETE_SCOPED_CHECK:" + check.id]);
    }
  }
  if (executionProfile.checks.some((id) => !scopedIds.has(id))) {
    return result("UNVERIFIED", "VERIFY_RISK_SCOPED_CHECKS", null,
      ["MISSING_REQUIRED_SCOPED_CHECKS"]);
  }
  if (executionProfile.effectiveRisk === "L3" && snapshot.humanGate?.required !== true) {
    return result("BLOCKED", "DECLARE_REQUIRED_HUMAN_GATE", null,
      ["L3_HUMAN_AUTHORITY_BOUNDARY_MISSING"]);
  }

  const work = snapshot.workPackages;
  if (!Array.isArray(snapshot.unavailableResources ?? []) ||
      (snapshot.unavailableResources ?? []).some((x) => !isNonEmpty(x)) ||
      snapshot.goal.acceptance.some((x) => !isNonEmpty(x?.id)) ||
      new Set(snapshot.goal.acceptance.map((x) => x.id)).size !== snapshot.goal.acceptance.length) {
    return result("BLOCKED", "REBUILD_EXECUTION_SNAPSHOT", null, ["MALFORMED_EVIDENCE_OR_RESOURCES"]);
  }
  const ids = new Map();
  const validStatuses = new Set(["READY", "ACTIVE", "BLOCKED", "VERIFIED", "DONE"]);
  for (const item of work) {
    if (!item || !isNonEmpty(item.id) || ids.has(item.id) ||
        !validStatuses.has(item.status) || !Array.isArray(item.dependsOn) ||
        item.dependsOn.some((d) => !isNonEmpty(d)) ||
        (item.requires !== undefined &&
          (!Array.isArray(item.requires) || item.requires.some((r) => !isNonEmpty(r)))) ||
        (item.attempts !== undefined &&
          (!Number.isSafeInteger(item.attempts) || item.attempts < 0))) {
      return result("BLOCKED", "REPAIR_WORK_GRAPH", null, ["INVALID_WORK_PACKAGE"]);
    }
    ids.set(item.id, item);
  }
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    const item = ids.get(id);
    if (!item) return false;
    visiting.add(id);
    for (const parent of item.dependsOn) {
      if (!ids.has(parent) || !visit(parent)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  }
  if (![...ids.keys()].every(visit)) {
    return result("BLOCKED", "REPAIR_WORK_GRAPH", null, ["CYCLIC_OR_MISSING_DEPENDENCY"]);
  }
  if (work.filter((item) => item.status === "ACTIVE").length > 1) {
    return result("BLOCKED", "RECONCILE_CONCURRENT_OWNERS", null, ["MULTIPLE_ACTIVE_OWNERS"]);
  }
  if (snapshot.entropy?.duplicateCanonicalOwner === true ||
      snapshot.entropy?.redundantCriticalSurface === true ||
      snapshot.entropy?.unjustifiedDependency === true) {
    return result("BLOCKED", "REMOVE_UNJUSTIFIED_COMPLEXITY", null, ["ARCHITECTURE_UX_ENTROPY"]);
  }

  const legacy = snapshot.criticalJourneys ?? [];
  if (!Array.isArray(legacy) ||
      legacy.some((journey) => !isNonEmpty(journey?.id)) ||
      new Set(legacy.map((journey) => journey.id)).size !== legacy.length) {
    return result("UNVERIFIED", "VERIFY_LEGACY_JOURNEYS", null, ["INVALID_JOURNEY_EVIDENCE"]);
  }
  if (legacy.some((journey) => journey?.status === "FAIL")) {
    return result("BLOCKED", "REPAIR_LEGACY_REGRESSION", null, ["CRITICAL_JOURNEY_FAILED"]);
  }
  if (legacy.some((journey) => !isNonEmpty(journey?.id) ||
        journey.status !== "PASS" || journey.sourceSha !== snapshot.headSha)) {
    return result("UNVERIFIED", "VERIFY_LEGACY_JOURNEYS", null, ["MISSING_OR_STALE_JOURNEY_EVIDENCE"]);
  }

  const closed = (id) => ["VERIFIED", "DONE"].includes(ids.get(id)?.status);
  const stale = work.find((item) => closed(item.id) && item.evidenceSha !== snapshot.headSha);
  if (stale) {
    return result("UNVERIFIED", "REVERIFY_WORK_PACKAGE", stale.id, ["STALE_COMPLETION_EVIDENCE"]);
  }
  const eligible = (item) =>
    item.dependsOn.every(closed) && (item.status === "READY" || item.status === "ACTIVE");
  const active = work.find((item) => item.status === "ACTIVE");
  const resourceAvailable = (item) =>
    !item.requires || item.requires.every((name) =>
      !(snapshot.unavailableResources ?? []).includes(name));
  const candidates = [active, ...work.filter((item) => item.status === "READY")]
    .filter(Boolean).filter(eligible);
  const executable = candidates.find((item) =>
    (item.attempts ?? 0) < 3 && resourceAvailable(item));
  if (executable) {
    const reset = active && (active.attempts ?? 0) >= 3;
    return result("CONTINUE", "EXECUTE_AND_VERIFY", executable.id,
      reset ? ["REINVESTIGATE_OTHER_PACKAGE:" + active.id] : []);
  }
  if (active && (active.attempts ?? 0) >= 3) {
    return result("BLOCKED", "REINVESTIGATE_ROOT_CAUSE", active.id,
      ["THREE_DISTINCT_FAILED_ATTEMPTS"]);
  }
  if (candidates.some((item) => !resourceAvailable(item))) {
    return result("UNVERIFIED", "PAUSED_RESOURCE", candidates[0].id,
      ["REQUIRED_CAPABILITY_UNAVAILABLE"]);
  }
  const pending = work.filter((item) => !closed(item.id));
  if (pending.length > 0) {
    return result("BLOCKED", "RECONCILE_BLOCKED_DEPENDENCIES", pending[0].id,
      ["NO_ELIGIBLE_WORK_PACKAGE"]);
  }

  const acceptance = snapshot.goal.acceptance;
  if (acceptance.length === 0 ||
      acceptance.some((item) => !isNonEmpty(item?.id) ||
        item.status !== "PASS" || item.sourceSha !== snapshot.headSha)) {
    return result("UNVERIFIED", "VERIFY_ORIGINAL_PROMPT_ACCEPTANCE", null,
      ["ORIGINAL_GOAL_NOT_EVIDENCED"]);
  }
  if (snapshot.humanGate?.required === true &&
      snapshot.humanGate.approved !== true) {
    return result("BLOCKED", "OBTAIN_EXPLICIT_HUMAN_DECISION", null,
      ["NON_DELEGABLE_HUMAN_GATE"], true);
  }
  if (snapshot.release?.required === true) {
    if (snapshot.release.authorized !== true) {
      return result("BLOCKED", "OBTAIN_EXPLICIT_RELEASE_AUTHORITY", null,
        ["NON_DELEGABLE_PRODUCTION_GATE"], true);
    }
    if (snapshot.release.deployedSha !== snapshot.headSha) {
      return result("UNVERIFIED", "RUN_AUTHORIZED_RELEASE_GATE", null,
        ["DEPLOYMENT_NOT_EVIDENCED_AT_HEAD"]);
    }
    if (snapshot.release.readback !== "MATCH") {
      return result("UNVERIFIED", "VERIFY_DEPLOYED_READBACK", null,
        ["PRODUCTION_READBACK_NOT_PROVEN"]);
    }
  }
  return result("READY_FOR_REVIEW", "REVIEW_PRODUCT_CLOSURE", null,
    ["CALLER_EVIDENCE_NOT_INDEPENDENTLY_AUTHENTICATED"]);
}

/**
 * A compact, non-authoritative handoff projection; NEVER forwards arbitrary
 * chat text, user data, credentials, full repository content or a stale prompt.
 * A receiving Agent must re-read live project authority and exact HEAD.
 */
export function buildMinimalWorkHandoff(snapshot) {
  const plan = evaluateExecutionContinuity(snapshot);
  const cannotDelegate = plan.humanInterventionRequired ||
    plan.nextAction === "REBUILD_EXECUTION_SNAPSHOT" ||
    plan.nextAction === "RESOLVE_GOAL_CHANGE" ||
    plan.nextAction === "RECONCILE_LIVE_STATE";
  if (cannotDelegate) {
    return Object.freeze({ ready: false, reason: plan.nextAction, prompt: null });
  }
  const paths = Array.isArray(snapshot.relevantPaths)
    ? [...new Set(snapshot.relevantPaths)]
      .filter((p) => typeof p === "string" &&
        p.length > 0 && p.length < 160 && p.split("/").every((segment) => /^[A-Za-z0-9_.-]+$/.test(segment)) &&
        !p.startsWith("/") && !p.includes("..") &&
        !p.split("/").some((segment) => segment === ".env" || segment.startsWith(".env."))).slice(0, 8)
    : [];
  const prompt = [
    "BOUNDED WORK HANDOFF — untrusted proposal projection, no approval authority.",
    "Repo: " + snapshot.repository + " | Branch: " + snapshot.branch,
    "Expected HEAD: " + snapshot.headSha +
      " | Active Constitution: " + snapshot.activePolicyVersion,
    "Execution scale: " + resolveExecutionScaleProfile({
      blueprintLevel: snapshot.blueprintLevel,
      operationRisk: snapshot.operationRisk,
      protectedOperation: snapshot.protectedOperation ?? false
    }).scale + " | Blueprint Level: " + snapshot.blueprintLevel +
      " | Scoped risk: " + (snapshot.protectedOperation === true ? "L3" : snapshot.operationRisk),
    "Original approved goal ID: " + JSON.stringify(snapshot.goal.id),
    "Next: " + plan.nextAction + (plan.taskId ? " | Work package: " + JSON.stringify(plan.taskId) : ""),
    "Evidence gaps: " + (plan.reasons.join(", ") || "none reported by candidate preflight"),
    "Read only live HEAD, affected PR/diff/CI and directly relevant paths first." +
      " Do not scan all repositories or regenerate existing work.",
    paths.length ? "Relevant path hints: " + paths.join(", ") : "Find minimal touched paths from scoped PR/diff.",
    "Reconcile objective, current work queue, permissions and gate status against canonical state." +
      " Old screenshots, chat and this handoff are NOT proof.",
    "Fix one scoped root cause, run focused checks, add regression evidence," +
      " then reevaluate next READY work package. Keep unrelated data and UI unchanged.",
    "Never self-ratify Constitution, claim Quality Gate PASS, approve devices or authorize Production." +
      " If truly non-delegable, stop with one precise decision; otherwise save the minimal checkpoint."
  ].join("\n");
  return Object.freeze({ ready: true, reason: plan.nextAction, prompt });
}

/**
 * Advisory pre-publication preflight. It cannot authenticate a ratification,
 * publish a constitution, mutate canonical state, or authorize Production.
 * Its claims are caller supplied and require external trusted readback.
 */
export function evaluateConstitutionPublicationPreflight(input) {
  const authority = Object.freeze({
    constitutionalRatification: false,
    constitutionalPublication: false,
    canonicalGatePass: false,
    productionRelease: false
  });
  const blocked = new Set();
  const unverified = new Set();
  const output = () => Object.freeze({
    status: blocked.size ? "BLOCKED" : unverified.size ? "UNVERIFIED" : "READY_FOR_INDEPENDENT_REVIEW",
    blocked: Object.freeze([...blocked].sort()),
    unverified: Object.freeze([...unverified].sort()),
    authority
  });
  if (!input || typeof input !== "object" || Array.isArray(input) ||
      !isSha(input.candidateSha) ||
      !/^\d+\.\d+\.\d+$/.test(input.targetVersion ?? "") ||
      !/^\d+\.\d+\.\d+$/.test(input.activeVersion ?? "")) {
    blocked.add("INVALID_PUBLICATION_CANDIDATE");
    return output();
  }
  const targetParts = input.targetVersion.split(".").map(Number);
  const activeParts = input.activeVersion.split(".").map(Number);
  const targetIsNewer = targetParts.some((part, i) =>
    part > activeParts[i] && targetParts.slice(0, i)
      .every((prior, j) => prior === activeParts[j]));
  if (!targetIsNewer) blocked.add("VERSION_NOT_ADVANCED");
  const proposals = input.competingProposals;
  if (!Array.isArray(proposals) || proposals.some((p) => !isNonEmpty(p?.id) ||
      !/^\d+\.\d+\.\d+$/.test(p.version ?? ""))) {
    unverified.add("MISSING_VERSION_COLLISION_REVIEW");
  } else {
    const collisions = proposals.filter((p) =>
      p.version === input.targetVersion && p.resolved !== true);
    if (collisions.length > 0) blocked.add("UNRESOLVED_CONSTITUTION_VERSION_COLLISION");
  }
  if (input.changeCompatibility?.reviewed !== true ||
      input.changeCompatibility?.targetSha !== input.candidateSha) {
    unverified.add("MISSING_COMPATIBILITY_AND_SCOPE_REVIEW");
  }
  if (input.migration?.impactReviewed !== true ||
      input.migration?.stagedPlanReviewed !== true) {
    unverified.add("MIGRATION_PLAN_NOT_REVIEWED");
  }
  if (input.independentReview?.approved !== true ||
      input.independentReview?.sourceSha !== input.candidateSha) {
    unverified.add("MISSING_INDEPENDENT_REVIEW_AT_HEAD");
  }
  if (input.fullReleaseGate?.status !== "PASS" ||
      input.fullReleaseGate?.sourceSha !== input.candidateSha ||
      !Number.isSafeInteger(input.fullReleaseGate?.runId) ||
      input.fullReleaseGate.runId <= 0) {
    unverified.add("MISSING_FULL_RELEASE_GATE_AT_HEAD");
  }
  const names = ["normativeDocument", "machineContract", "universalTemplate",
    "policySource", "versionManifest", "validatorTests"];
  const components = input.authoritySet;
  if (!components || typeof components !== "object" ||
      names.some((name) => components[name]?.sourceSha !== input.candidateSha ||
        components[name]?.policyVersion !== input.targetVersion)) {
    unverified.add("INCOMPLETE_ATOMIC_AUTHORITY_SET");
  }
  const ratification = input.ratification;
  if (ratification?.authenticatedHuman !== true ||
      ratification?.appendOnlyRecorded !== true ||
      !isNonEmpty(ratification?.recordId) ||
      ratification?.sourceSha !== input.candidateSha ||
      ratification?.policyVersion !== input.targetVersion) {
    blocked.add("AUTHENTICATED_EXACT_REVISION_HUMAN_RATIFICATION_REQUIRED");
  }
  // READY_FOR_INDEPENDENT_REVIEW is never PUBLISHED, even with trusted claims.
  return output();
}

/**
 * Proposal-only K2/K5 cohort. Correlates recurrent reports by stable root cause,
 * not ticket count. Historical 14/30-day values use different mature cohorts.
 * Does not independently verify Issue history; trusted collection is future work.
 */
export function summarizeFixCohorts(reports, minimum = 20) {
  if (!Number.isInteger(minimum) || minimum < 1) {
    throw new TypeError("minimum must be a positive integer");
  }
  const cases = new Map();
  for (const report of reports) {
    if (!report || !isNonEmpty(report.rootCauseId)) {
      throw new TypeError("every report needs rootCauseId");
    }
    const item = cases.get(report.rootCauseId) ?? {
      originals: 0, mature14: false, mature30: false,
      firstAttempt: false, recurrences: []
    };
    if (report.original === true) {
      item.originals += 1;
      item.mature14 = report.mature14 === true;
      item.mature30 = report.mature30 === true;
      item.firstAttempt = report.firstAttempt === true;
    } else if (Number.isInteger(report.recurDay) && report.recurDay >= 0) {
      item.recurrences.push(report.recurDay);
    } else {
      throw new TypeError("follow-up report requires nonnegative recurDay");
    }
    cases.set(report.rootCauseId, item);
  }
  for (const item of cases.values()) {
    if (item.originals !== 1) {
      throw new TypeError("exactly one original per root cause required");
    }
  }
  const c14 = [...cases.values()].filter((x) => x.mature14);
  const c30 = [...cases.values()].filter((x) => x.mature30);
  const reopened14 = c14.filter((x) => x.recurrences.some((d) => d <= 14)).length;
  const reopened30 = c30.filter((x) => x.recurrences.some((d) => d <= 30)).length;
  const firstPass14 = c14.filter((x) =>
    x.firstAttempt && !x.recurrences.some((d) => d <= 14)
  ).length;
  return Object.freeze({
    status14: c14.length < minimum ? "INSUFFICIENT_DATA" : "REPORTABLE_TREND",
    status30: c30.length < minimum ? "INSUFFICIENT_DATA" : "REPORTABLE_TREND",
    denominator14: c14.length,
    denominator30: c30.length,
    firstPassCount14: firstPass14,
    reopenedCount14: reopened14,
    reopenedCount30: reopened30,
    firstPassRate14: c14.length ? firstPass14 / c14.length : null,
    reopenRate14: c14.length ? reopened14 / c14.length : null,
    reopenRate30: c30.length ? reopened30 / c30.length : null,
    canonicalGatePass: false,
    productionRelease: false
  });
}
