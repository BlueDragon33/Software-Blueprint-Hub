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
