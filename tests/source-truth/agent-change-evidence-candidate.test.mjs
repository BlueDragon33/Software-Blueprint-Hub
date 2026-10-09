import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAgentChangeEvidence as evaluate, summarizeFixCohorts } from "../../scripts/agent-change-evidence-candidate.mjs";

const HEAD = "a".repeat(40);
const BASE = "b".repeat(40);
const check = (id, status = "PASS", sourceSha = HEAD) => ({ id, status, sourceSha });

function change() {
  return {
    repository: "BlueDragon33/Application-Management",
    workPackage: "QA-OBSERVATION-ONLY",
    baseSha: BASE,
    headSha: HEAD,
    policyVersion: "1.2.0",
    risk: "L2",
    evidence: { sourceSha: HEAD, runId: 2026100901 },
    scope: { allowedPaths: ["app/policy.ts"], changedPaths: ["app/policy.ts"] },
    checks: [check("static"), check("regression"), check("integration")],
    matureCohort: { verifiedFixes: 30, eligibleClosedDefects: 30 }
  };
}
function withChange(mutate) {
  const evidence = change();
  mutate(evidence);
  return evaluate(evidence);
}
function blocks(mutate, reason) {
  const result = withChange(mutate);
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.blocked.includes(reason), JSON.stringify(result));
  assert.deepEqual(result.authority, {
    canonicalGatePass: false, constitutionalRatification: false, productionRelease: false
  });
}
function unverified(mutate, reason) {
  const result = withChange(mutate);
  assert.equal(result.status, "UNVERIFIED");
  assert.ok(result.unverified.includes(reason), JSON.stringify(result));
  assert.equal(result.authority.productionRelease, false);
}

test("VALID-01: a complete scoped L2 proof is READY_FOR_REVIEW, never canonical PASS", () => {
  const result = evaluate(change());
  assert.equal(result.status, "READY_FOR_REVIEW");
  assert.deepEqual(result.blocked, []);
  assert.equal(result.authority.canonicalGatePass, false);
  assert.equal(result.authority.constitutionalRatification, false);
  assert.equal(result.authority.productionRelease, false);
});
test("NEG-14: isolated L1 diff does not need L2/L3 checks", () => {
  const result = withChange((data) => {
    data.risk = "L1";
    data.checks = [check("static")];
  });
  assert.equal(result.status, "READY_FOR_REVIEW");
});
test("NEG-01: an existing critical regression check fails despite successful static checks", () => {
  blocks((data) => { data.checks[1].status = "FAIL"; }, "FAILED_CHECK");
});
test("NEG-02: stale evidence SHA is never accepted", () => {
  unverified((data) => { data.evidence.sourceSha = BASE; }, "STALE_OR_MISSING_EVIDENCE_SHA");
});
test("NEG-02b: stale check SHA is separately rejected", () => {
  unverified((data) => { data.checks[1].sourceSha = BASE; }, "CHECK_REVISION_MISMATCH");
});
test("NEG-02c: missing trusted run ID is not PASS", () => {
  unverified((data) => { data.evidence.runId = 0; }, "MISSING_TRUSTED_RUN_ID");
});
test("NEG-03: weakening assertions or skipping unreviewed tests blocks the change", () => {
  blocks((data) => { data.testIntegrity = { weakenedAssertions: true }; }, "TEST_INTEGRITY_WEAKENED");
  blocks((data) => { data.testIntegrity = { unreviewedSkippedTests: true }; }, "TEST_INTEGRITY_WEAKENED");
});
test("NEG-04: duplicate canonical owner blocks even with green tests", () => {
  blocks((data) => { data.duplication = { canonicalOwnerConflict: true }; }, "DUPLICATE_CANONICAL_OWNER");
});
test("NEG-04b: multiple confirmed duplicate logic groups block", () => {
  blocks((data) => { data.duplication = { confirmedGroups: 2 }; }, "CONFIRMED_DUPLICATE_GROWTH");
});
test("NEG-05: HTTP success with mismatching readback is not success", () => {
  blocks((data) => {
    data.persistentMutation = true;
    data.persistenceOutcomes = [{ appId: "boi-ech", field: "autoApprove", readbackState: "MISMATCH" }];
  }, "PERSISTENCE_READBACK_MISMATCH");
});
test("NEG-05b: absent readback for a persistent mutation remains UNVERIFIED", () => {
  unverified((data) => { data.persistentMutation = true; }, "MISSING_PERSISTENCE_READBACK");
});
test("NEG-06: partial bulk outcome cannot become all-success", () => {
  blocks((data) => {
    data.persistentMutation = true;
    data.persistenceOutcomes = [
      { appId: "boi-ech", field: "autoApprove", readbackState: "MATCH" },
      { appId: "ru-life", field: "autoApprove", readbackState: "MISMATCH" }
    ];
  }, "PERSISTENCE_READBACK_MISMATCH");
});
test("VALID-02: all expected fields matching readback can proceed to review", () => {
  const result = withChange((data) => {
    data.persistentMutation = true;
    data.persistenceOutcomes = [{ appId: "boi-ech", field: "autoApprove", readbackState: "MATCH" }];
  });
  assert.equal(result.status, "READY_FOR_REVIEW");
});
test("NEG-07: out-of-scope source file changes block", () => {
  blocks((data) => { data.scope.changedPaths.push("secrets.env"); }, "OUT_OF_SCOPE_FILE_CHANGE");
});
test("NEG-07b: out-of-scope protected mutation blocks", () => {
  blocks((data) => {
    data.protectedWrites = [{ resource: "device:1", inDeclaredScope: false, currentVersion: 5, expectedVersion: 5 }];
  }, "OUT_OF_SCOPE_PROTECTED_WRITE");
});
test("NEG-08: stale versioned protected write is rejected", () => {
  blocks((data) => {
    data.protectedWrites = [{ resource: "device:1", inDeclaredScope: true, currentVersion: 9, expectedVersion: 8 }];
  }, "STALE_PROTECTED_WRITE");
});
test("NEG-08b: missing version evidence cannot pass", () => {
  unverified((data) => {
    data.protectedWrites = [{ resource: "device:1", inDeclaredScope: true }];
  }, "MISSING_PROTECTED_WRITE_VERSION");
});
test("NEG-09: noisy one-sample performance regression requests remeasurement", () => {
  unverified((data) => {
    data.performanceRequired = true;
    data.performance = { baselineMs: 100, candidateMs: 121, samples: 1, comparable: true, critical: true };
  }, "PERFORMANCE_REMEASUREMENT_REQUIRED");
});
test("NEG-10: repeatable critical performance regression blocks", () => {
  blocks((data) => {
    data.performanceRequired = true;
    data.performance = { baselineMs: 100, candidateMs: 122, samples: 5, comparable: true, critical: true };
  }, "CONFIRMED_CRITICAL_PERFORMANCE_REGRESSION");
});
test("NEG-10b: absent required performance evidence is not silently accepted", () => {
  unverified((data) => { data.performanceRequired = true; }, "MISSING_PERFORMANCE_EVIDENCE");
});
test("NEG-12: small K2/K5 cohorts show INSUFFICIENT_TREND_SAMPLE, not a percentage PASS", () => {
  const result = withChange((data) => { data.matureCohort = { verifiedFixes: 4, eligibleClosedDefects: 9 }; });
  assert.equal(result.status, "READY_FOR_REVIEW");
  assert.ok(result.warnings.includes("INSUFFICIENT_TREND_SAMPLE"));
});
test("NEG-13: three failed attempts require root-cause re-investigation", () => {
  blocks((data) => { data.failedAttempts = 3; }, "STOP_REINVESTIGATE_ROOT_CAUSE");
});
test("NEG-15: no Agent-originated claim can grant constitutional/production authority", () => {
  blocks((data) => { data.claims = { productionRelease: true }; }, "UNAUTHORIZED_AUTHORITY_CLAIM");
  blocks((data) => { data.claims = { canonicalGatePass: true }; }, "UNAUTHORIZED_AUTHORITY_CLAIM");
  blocks((data) => { data.claims = { constitutionalRatification: true }; }, "UNAUTHORIZED_AUTHORITY_CLAIM");
});
test("NEG-16: attempts to improve scores by weakening checks are blocked", () => {
  blocks((data) => {
    data.duplication = { confirmedGroups: 0 };
    data.testIntegrity = { weakenedAssertions: true };
  }, "TEST_INTEGRITY_WEAKENED");
});
test("NEG-17: CLI/desktop work may use non-browser checks without fake LCP measurements", () => {
  const result = withChange((data) => {
    data.risk = "L1";
    data.checks = [check("static")];
    data.performanceRequired = false;
  });
  assert.equal(result.status, "READY_FOR_REVIEW");
});
test("NEG-19: checks from another revision cannot certify the current one", () => {
  unverified((data) => { data.checks[2].sourceSha = BASE; }, "CHECK_REVISION_MISMATCH");
});
test("NEG-20: mature-cohort warning never invents Quality Gate PASS", () => {
  const result = withChange((data) => { data.matureCohort = { verifiedFixes: 1, eligibleClosedDefects: 2 }; });
  assert.ok(result.warnings.includes("INSUFFICIENT_TREND_SAMPLE"));
  assert.equal(result.authority.canonicalGatePass, false);
});
test("policy cannot be silently advanced from 1.2.0 to candidate 1.3.0", () => {
  unverified((data) => { data.policyVersion = "1.3.0"; }, "POLICY_VERSION_MISMATCH");
});
test("L3 requires security, recovery and human-review evidence", () => {
  unverified((data) => { data.risk = "L3"; }, "MISSING_CHECK:human-review");
});
test("unknown risk is BLOCKED rather than treated as LOW", () => {
  blocks((data) => { data.risk = "L0"; }, "UNKNOWN_RISK_LEVEL");
});
test("a failed P2 regression is not offset by positive trend metrics", () => {
  blocks((data) => {
    data.regressions = [{ severity: "P2", attributable: true, resolved: false }];
    data.matureCohort = { verifiedFixes: 99, eligibleClosedDefects: 99 };
  }, "UNRESOLVED_REGRESSION");
});
test("candidate clone is advisory; confirmed owner conflict remains blocking", () => {
  const result = withChange((data) => { data.duplication = { candidateClones: 1 }; });
  assert.equal(result.status, "READY_FOR_REVIEW");
  assert.ok(result.warnings.includes("CLONE_CANDIDATES_NOT_PROOF"));
});
test("empty or malformed input is BLOCKED", () => {
  assert.equal(evaluate(null).status, "BLOCKED");
  assert.equal(evaluate([]).status, "BLOCKED");
});

test("NEG-11: a reopened issue under a different ticket maps to its original root cause", () => {
  const records = [];
  for (let i = 0; i < 20; i++) {
    records.push({
      rootCauseId: "bug-" + i, original: true,
      mature14: true, mature30: true, firstAttempt: true
    });
  }
  records.push({ rootCauseId: "bug-2", original: false, recurDay: 6 });
  // One root cause, not two tickets; recurrence also invalidates prior first-pass success.
  const trend = summarizeFixCohorts(records);
  assert.equal(trend.status14, "REPORTABLE_TREND");
  assert.equal(trend.denominator14, 20);
  assert.equal(trend.reopenedCount14, 1);
  assert.equal(trend.reopenRate14, 0.05);
  assert.equal(trend.firstPassCount14, 19);
  assert.equal(trend.canonicalGatePass, false);
});

test("NEG-18: confirmed extra critical UI surface cannot be hidden by green tests", () => {
  blocks((data) => {
    data.uiReview = { confirmedRedundantCriticalSurface: true };
  }, "CONFIRMED_CRITICAL_UI_ENTROPY");
});

test("NEG-20b: recurrence after 14 days is tracked in the mature 30-day view", () => {
  const list = [{ rootCauseId: "b", original: true, mature14: true, mature30: true, firstAttempt: true },
    { rootCauseId: "b", original: false, recurDay: 22 }];
  const result = summarizeFixCohorts(list);
  assert.equal(result.denominator14, 1);
  assert.equal(result.reopenedCount14, 0);
  assert.equal(result.reopenedCount30, 1);
  assert.equal(result.reopenRate30, 1);
  assert.equal(result.status14, "INSUFFICIENT_DATA");
});

test("K2/K5 cohort cannot fake a denominator by duplicating the original issue", () => {
  assert.throws(() => summarizeFixCohorts([
    { rootCauseId: "same", original: true, mature14: true },
    { rootCauseId: "same", original: true, mature14: true }
  ]), /exactly one original/);
});

test("K2/K5 cohort requires aged samples before producing a reportable percentage", () => {
  const v = summarizeFixCohorts([
    { rootCauseId: "old", original: true, mature14: true, mature30: false, firstAttempt: true }
  ]);
  assert.equal(v.status14, "INSUFFICIENT_DATA");
  assert.equal(v.status30, "INSUFFICIENT_DATA");
  assert.equal(v.denominator30, 0);
  assert.equal(v.reopenRate30, null);
});

test("L3 claims never authorize release even with all proposed check names", () => {
  const result = withChange((data) => {
    data.risk = "L3";
    data.checks.push(check("security"), check("recovery"), check("human-review"));
  });
  assert.equal(result.status, "READY_FOR_REVIEW");
  assert.equal(result.authority.canonicalGatePass, false);
  assert.equal(result.authority.constitutionalRatification, false);
  assert.equal(result.authority.productionRelease, false);
});
