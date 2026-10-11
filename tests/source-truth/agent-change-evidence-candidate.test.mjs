import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { evaluateAgentChangeEvidence as evaluate, summarizeFixCohorts, evaluateExecutionContinuity as continuity, buildMinimalWorkHandoff, resolveExecutionScaleProfile as profile, proposeNewProjectBlueprintIntake as intake } from "../../scripts/agent-change-evidence-candidate.mjs";

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

function execution() {
  return {
    repository: "BlueDragon33/Software-Blueprint-Hub",
    branch: "proposal/constitution-1-3-agent-reliability-20261009",
    headSha: HEAD,
    activePolicyVersion: "1.2.0",
    blueprintLevel: "B4",
    operationRisk: "L2",
    scopedChecks: [check("static"), check("regression"), check("integration")],
    goal: {
      id: "protect-save-flow", approved: true,
      acceptance: [{ id: "saved-data-roundtrip", status: "PASS", sourceSha: HEAD }]
    },
    checkpoint: { repository: "BlueDragon33/Software-Blueprint-Hub", branch: "proposal/constitution-1-3-agent-reliability-20261009", headSha: HEAD, policyVersion: "1.2.0", goalId: "protect-save-flow" },
    workPackages: [{ id: "WP-1", status: "DONE", dependsOn: [], evidenceSha: HEAD }],
    criticalJourneys: [{ id: "legacy-save-flow", status: "PASS", sourceSha: HEAD }],
    unavailableResources: [],
    release: { required: false },
    humanGate: { required: false }
  };
}

test("R15-R20 pilot positive: closed and evidenced work is only READY_FOR_REVIEW", () => {
  const result = continuity(execution());
  assert.equal(result.state, "READY_FOR_REVIEW");
  assert.equal(result.nextAction, "REVIEW_PRODUCT_CLOSURE");
  assert.equal(result.humanInterventionRequired, false);
  assert.deepEqual(result.authority, {
    canonicalGatePass: false, constitutionalRatification: false, productionRelease: false
  });
});

test("NEG-21: changed HEAD or Constitution invalidates restart checkpoint", () => {
  const h = execution();
  h.headSha = BASE;
  assert.equal(continuity(h).nextAction, "RECONCILE_LIVE_STATE");
  const p = execution();
  p.activePolicyVersion = "1.3.0";
  assert.equal(continuity(p).nextAction, "RECONCILE_LIVE_STATE");
});

test("NEG-22: changed prompt cannot silently replace approved objective", () => {
  const x = execution();
  x.proposedGoalId = "redesign-everything";
  const v = continuity(x);
  assert.equal(v.nextAction, "RESOLVE_GOAL_CHANGE");
  assert.equal(v.humanInterventionRequired, true);
});

test("NEG-23: duplicate canonical owner is not an invitation to build another service", () => {
  const x = execution();
  x.entropy = { duplicateCanonicalOwner: true };
  assert.equal(continuity(x).nextAction, "REMOVE_UNJUSTIFIED_COMPLEXITY");
});

test("NEG-24: previously working critical journey fails even if new checks are green", () => {
  const x = execution();
  x.criticalJourneys[0].status = "FAIL";
  const v = continuity(x);
  assert.equal(v.state, "BLOCKED");
  assert.equal(v.nextAction, "REPAIR_LEGACY_REGRESSION");
});

test("NEG-25: after three fixes choose safe independent work, otherwise reinvestigate", () => {
  const x = execution();
  x.workPackages = [
    { id: "bad", status: "ACTIVE", dependsOn: [], attempts: 3 },
    { id: "independent", status: "READY", dependsOn: [], attempts: 0 }
  ];
  const v = continuity(x);
  assert.equal(v.state, "CONTINUE");
  assert.equal(v.taskId, "independent");
  assert.ok(v.reasons.includes("REINVESTIGATE_OTHER_PACKAGE:bad"));
  assert.equal(v.humanInterventionRequired, false);
  x.workPackages.pop();
  assert.equal(continuity(x).nextAction, "REINVESTIGATE_ROOT_CAUSE");
});

test("NEG-26: exhausted browser credit pauses only affected slice, never claims done", () => {
  const x = execution();
  x.workPackages = [{ id: "preview", status: "ACTIVE", dependsOn: [], requires: ["browser"] }];
  x.unavailableResources = ["browser"];
  const v = continuity(x);
  assert.equal(v.nextAction, "PAUSED_RESOURCE");
  assert.equal(v.state, "UNVERIFIED");
  assert.equal(v.humanInterventionRequired, false);
});

test("NEG-26b: a different independent available task can continue through outage", () => {
  const x = execution();
  x.workPackages = [
    { id: "browser", status: "ACTIVE", dependsOn: [], requires: ["browser"] },
    { id: "code", status: "READY", dependsOn: [], requires: ["github"] }
  ];
  x.unavailableResources = ["browser"];
  const v = continuity(x);
  assert.equal(v.nextAction, "EXECUTE_AND_VERIFY");
  assert.equal(v.taskId, "code");
});

test("NEG-27: real human and Production gates cannot be silently self-approved", () => {
  const x = execution();
  x.humanGate = { required: true, approved: false };
  let v = continuity(x);
  assert.equal(v.nextAction, "OBTAIN_EXPLICIT_HUMAN_DECISION");
  assert.equal(v.humanInterventionRequired, true);
  x.humanGate.approved = true;
  x.release = { required: true, authorized: false };
  v = continuity(x);
  assert.equal(v.nextAction, "OBTAIN_EXPLICIT_RELEASE_AUTHORITY");
  assert.equal(v.humanInterventionRequired, true);
  assert.equal(v.authority.productionRelease, false);
});

test("NEG-28: a merged old-SHA work package cannot claim present revision verified", () => {
  const x = execution();
  x.workPackages[0].evidenceSha = BASE;
  const v = continuity(x);
  assert.equal(v.nextAction, "REVERIFY_WORK_PACKAGE");
  assert.equal(v.taskId, "WP-1");
});

test("NEG-29: redundant critical UI and unjustified deps trigger architecture cleanup", () => {
  for (const entropy of [{ redundantCriticalSurface: true }, { unjustifiedDependency: true }]) {
    const x = execution();
    x.entropy = entropy;
    assert.equal(continuity(x).nextAction, "REMOVE_UNJUSTIFIED_COMPLEXITY");
  }
});

test("NEG-30: task closure is not product closure without original prompt acceptance", () => {
  const x = execution();
  x.goal.acceptance[0].status = "UNKNOWN";
  const v = continuity(x);
  assert.equal(v.state, "UNVERIFIED");
  assert.equal(v.nextAction, "VERIFY_ORIGINAL_PROMPT_ACCEPTANCE");
  assert.equal(v.humanInterventionRequired, false);
});

test("NEG-30b: no acceptance criteria never becomes fake product complete", () => {
  const x = execution();
  x.goal.acceptance = [];
  assert.equal(continuity(x).nextAction, "VERIFY_ORIGINAL_PROMPT_ACCEPTANCE");
});

test("DAG regression: missing/cyclic dependencies and competing active owners block", () => {
  const x = execution();
  x.workPackages = [{ id: "a", status: "READY", dependsOn: ["missing"] }];
  assert.equal(continuity(x).nextAction, "REPAIR_WORK_GRAPH");
  x.workPackages = [
    { id: "a", status: "READY", dependsOn: ["b"] },
    { id: "b", status: "READY", dependsOn: ["a"] }
  ];
  assert.equal(continuity(x).nextAction, "REPAIR_WORK_GRAPH");
  x.workPackages = [
    { id: "a", status: "ACTIVE", dependsOn: [] },
    { id: "b", status: "ACTIVE", dependsOn: [] }
  ];
  assert.equal(continuity(x).nextAction, "RECONCILE_CONCURRENT_OWNERS");
});

test("Dependency sequencing: next task requires verified dependent work", () => {
  const x = execution();
  x.workPackages = [
    { id: "foundation", status: "ACTIVE", dependsOn: [] },
    { id: "ux", status: "READY", dependsOn: ["foundation"] }
  ];
  assert.equal(continuity(x).taskId, "foundation");
  x.workPackages[0] = { id: "foundation", status: "DONE", dependsOn: [], evidenceSha: HEAD };
  assert.equal(continuity(x).taskId, "ux");
});

test("Release evidence is separate from claiming authority and needs readback", () => {
  const x = execution();
  x.release = { required: true, authorized: true, deployedSha: BASE, readback: "MATCH" };
  assert.equal(continuity(x).nextAction, "RUN_AUTHORIZED_RELEASE_GATE");
  x.release.deployedSha = HEAD;
  x.release.readback = "UNKNOWN";
  assert.equal(continuity(x).nextAction, "VERIFY_DEPLOYED_READBACK");
  x.release.readback = "MATCH";
  const v = continuity(x);
  assert.equal(v.state, "READY_FOR_REVIEW");
  assert.equal(v.authority.productionRelease, false);
});

test("Adversarial malformed execution snapshot never throws or marks approval", () => {
  for (const x of [null, [], {}, { ...execution(), workPackages: null }]) {
    const v = continuity(x);
    assert.equal(v.state, "BLOCKED");
    assert.equal(v.authority.productionRelease, false);
  }
});

test("Checkpoint identity: same SHA on another repo/branch is stale", () => {
  const x = execution();
  x.branch = "main";
  assert.equal(continuity(x).nextAction, "RECONCILE_LIVE_STATE");
  x.branch = x.checkpoint.branch;
  x.repository = "BlueDragon33/Other";
  assert.equal(continuity(x).nextAction, "RECONCILE_LIVE_STATE");
});

test("Invalid resource, requires and duplicate acceptance data blocks without throwing", () => {
  for (const mutate of [
    (x) => { x.unavailableResources = "browser"; },
    (x) => { x.workPackages[0].requires = "browser"; },
    (x) => { x.workPackages[0].requires = [null]; },
    (x) => { x.goal.acceptance.push({ ...x.goal.acceptance[0] }); }
  ]) {
    const x = execution();
    mutate(x);
    assert.equal(continuity(x).state, "BLOCKED");
  }
});

test("Compact handoff names exact branch, HEAD and next package without full-repo scan", () => {
  const x = execution();
  x.workPackages = [{ id: "WP-continue", status: "READY", dependsOn: [] }];
  x.relevantPaths = ["packages/application/src/compass-acceptance.ts", "tests/application/compass-acceptance.test.ts"];
  const h = buildMinimalWorkHandoff(x);
  assert.equal(h.ready, true);
  assert.match(h.prompt, /Expected HEAD: a{40}/);
  assert.match(h.prompt, /Work package: "WP-continue"/);
  assert.match(h.prompt, /Read only live HEAD, affected PR\/diff\/CI/);
  assert.match(h.prompt, /Never self-ratify Constitution/);
  assert.ok(h.prompt.length < 2000);
  assert.equal(h.prompt.includes("no approval authority"), true);
});

test("Handoff excludes arbitrary input/secret fields and invalid path hints", () => {
  const x = execution();
  x.secret = "SHOULD_NOT_BE_IN_PROMPT";
  x.chatHistory = "SHOULD_NOT_BE_IN_PROMPT";
  x.relevantPaths = ["relative/path.ts", "../../../.env\nLEAK", "relative/path.ts"];
  const h = buildMinimalWorkHandoff(x);
  assert.equal(h.ready, true);
  assert.equal(h.prompt.includes("SHOULD_NOT_BE_IN_PROMPT"), false);
  assert.equal(h.prompt.includes("LEAK"), false);
  assert.equal(h.prompt.split("relative/path.ts").length, 2);
});

test("Invalid, stale or non-delegable decision never generates Work approval prompt", () => {
  const invalid = buildMinimalWorkHandoff(null);
  assert.equal(invalid.ready, false);
  assert.equal(invalid.prompt, null);
  const stale = execution();
  stale.checkpoint.headSha = BASE;
  assert.equal(buildMinimalWorkHandoff(stale).prompt, null);
  const human = execution();
  human.humanGate = { required: true, approved: false };
  assert.equal(buildMinimalWorkHandoff(human).prompt, null);
});

test("Unavailable browser resources can generate constrained handoff without fake PASS", () => {
  const x = execution();
  x.workPackages = [{ id: "verify-preview", status: "ACTIVE", dependsOn: [], requires: ["browser"] }];
  x.unavailableResources = ["browser"];
  const v = buildMinimalWorkHandoff(x);
  assert.equal(v.ready, true);
  assert.match(v.prompt, /PAUSED_RESOURCE/);
  assert.match(v.prompt, /Old screenshots, chat and this handoff are NOT proof/);
});

test("R21: all six Blueprint Levels inherit precisely two universal execution scales", () => {
  for (const level of ["B0", "B1", "B2"]) {
    const v = profile({ blueprintLevel: level, operationRisk: "L1" });
    assert.equal(v.scale, "COMPACT");
    assert.equal(v.executionMode, "FOCUSED_WORK_SLICE");
    assert.deepEqual(v.checks, ["static"]);
    assert.equal(v.escalation, "CURRENT_CONNECTED_CAPABILITIES_FIRST");
    assert.equal(v.authority.productionRelease, false);
  }
  for (const level of ["B3", "B4", "B5"]) {
    const v = profile({ blueprintLevel: level, operationRisk: "L2" });
    assert.equal(v.scale, "STRUCTURED");
    assert.equal(v.executionMode, "DEPENDENCY_AWARE_WORK_QUEUE");
    assert.deepEqual(v.checks, ["static", "regression", "integration"]);
    assert.equal(v.authority.constitutionalRatification, false);
  }
});

test("R21: a small project performing protected L3 work receives strong checks", () => {
  const v = profile({ blueprintLevel: "B1", operationRisk: "L1", protectedOperation: true });
  assert.equal(v.scale, "COMPACT");
  assert.equal(v.effectiveRisk, "L3");
  assert.deepEqual(v.checks, ["static", "regression", "integration", "security", "recovery", "human-review"]);
  assert.equal(v.authority.productionRelease, false);
});

test("R21: a large project's low-risk change keeps focused tests", () => {
  const v = profile({ blueprintLevel: "B5", operationRisk: "L1" });
  assert.equal(v.scale, "STRUCTURED");
  assert.deepEqual(v.checks, ["static"]);
});

test("R21: unknown scale/risk or forged profile label cannot default to COMPACT", () => {
  for (const input of [
    undefined, {}, { blueprintLevel: "B6", operationRisk: "L1" },
    { blueprintLevel: "small", operationRisk: "L1" },
    { blueprintLevel: "B1", operationRisk: "LOW" },
    { blueprintLevel: "B1", operationRisk: "L2", protectedOperation: "false" }
  ]) {
    const v = profile(input);
    assert.equal(v.status, "UNVERIFIED");
    assert.equal(v.scale, null);
    assert.equal(v.authority.canonicalGatePass, false);
  }
});

test("R21: continuity cannot infer missing canonical Blueprint Level or risk", () => {
  const x = execution();
  delete x.blueprintLevel;
  assert.equal(continuity(x).nextAction, "RESOLVE_CANONICAL_SCALE_AND_RISK");
  x.blueprintLevel = "B1";
  delete x.operationRisk;
  assert.equal(continuity(x).state, "UNVERIFIED");
});

test("R21: compact work may finish with one focused goal and no Work Package bureaucracy", () => {
  const x = execution();
  x.blueprintLevel = "B2";
  x.operationRisk = "L1";
  x.workPackages = [];
  const v = continuity(x);
  assert.equal(v.state, "READY_FOR_REVIEW");
  assert.equal(v.humanInterventionRequired, false);
});

test("R21: large projects cannot silently discard structured work queue", () => {
  const x = execution();
  x.blueprintLevel = "B4";
  x.workPackages = [];
  const v = continuity(x);
  assert.equal(v.nextAction, "RECONCILE_STRUCTURED_WORK_QUEUE");
  assert.equal(v.state, "UNVERIFIED");
});

test("R22: compact handoff communicates execution scale but never percentage quotas", () => {
  const x = execution();
  x.blueprintLevel = "B1";
  x.operationRisk = "L1";
  x.workPackages = [{ id: "quick-fix", status: "READY", dependsOn: [] }];
  const h = buildMinimalWorkHandoff(x);
  assert.equal(h.ready, true);
  assert.match(h.prompt, /Execution scale: COMPACT/);
  assert.equal(h.prompt.includes("90-95"), false);
  assert.equal(h.prompt.includes("90–95"), false);
  assert.equal(h.prompt.includes("Codebase scan all"), false);
});

test("R22: large scale handoff retains scoped project context without permission leakage", () => {
  const x = execution();
  x.workPackages = [{ id: "contract-test", status: "READY", dependsOn: [] }];
  const h = buildMinimalWorkHandoff(x);
  assert.equal(h.ready, true);
  assert.match(h.prompt, /Execution scale: STRUCTURED/);
  assert.match(h.prompt, /Work package: "contract-test"/);
  assert.match(h.prompt, /Never self-ratify Constitution/);
});

test("Universal scale: invalid profile input null is UNVERIFIED, not an exception", () => {
  assert.equal(profile(null).status, "UNVERIFIED");
  assert.equal(profile([]).scale, null);
});

test("Shared constitutional floor: missing scoped checks cannot certify either size", () => {
  for (const blueprintLevel of ["B0", "B3"]) {
    const x = execution();
    x.blueprintLevel = blueprintLevel;
    delete x.scopedChecks;
    const v = continuity(x);
    assert.equal(v.state, "UNVERIFIED");
    assert.equal(v.nextAction, "VERIFY_RISK_SCOPED_CHECKS");
    assert.equal(v.authority.canonicalGatePass, false);
  }
});

test("Small protected operation requires complete L3 checks and human gate", () => {
  const x = execution();
  x.blueprintLevel = "B1";
  x.operationRisk = "L1";
  x.protectedOperation = true;
  x.humanGate = { required: true, approved: false };
  assert.equal(continuity(x).nextAction, "VERIFY_RISK_SCOPED_CHECKS");
  x.scopedChecks.push(
    check("security"), check("recovery"), check("human-review")
  );
  assert.equal(continuity(x).nextAction, "OBTAIN_EXPLICIT_HUMAN_DECISION");
  x.humanGate = { required: false, approved: false };
  assert.equal(continuity(x).nextAction, "DECLARE_REQUIRED_HUMAN_GATE");
});

test("Small and large scales block failed or stale required tests", () => {
  for (const blueprintLevel of ["B2", "B4"]) {
    const failed = execution();
    failed.blueprintLevel = blueprintLevel;
    failed.scopedChecks[1].status = "FAIL";
    assert.equal(continuity(failed).nextAction, "FIX_FAILED_SCOPED_CHECK");
    const stale = execution();
    stale.blueprintLevel = blueprintLevel;
    stale.scopedChecks[1].sourceSha = BASE;
    assert.equal(continuity(stale).nextAction, "VERIFY_RISK_SCOPED_CHECKS");
  }
});

test("Scope check duplication never earns approval with extra PASS records", () => {
  const x = execution();
  x.scopedChecks.push(check("static"));
  const v = continuity(x);
  assert.equal(v.state, "BLOCKED");
  assert.equal(v.nextAction, "REPAIR_SCOPED_CHECK_MANIFEST");
  assert.equal(v.authority.productionRelease, false);
});

function situation() {
  return {
    purpose: "A scoped engineering app", stage: "foundation",
    criticalJourneys: 2, independentModules: 1, crossAppContracts: 0,
    persistentUserState: true, highSensitivityData: false,
    privilegedControl: false, criticalFailureImpact: false, sharedPlatformRole: false
  };
}

test("New project intake: standalone moderate product gets COMPACT B2", () => {
  const x = intake(situation());
  assert.equal(x.status, "PROPOSAL_ONLY");
  assert.equal(x.recommendedBlueprintLevel, "B2");
  assert.equal(x.scale, "COMPACT");
  assert.equal(x.nextAction, "REVIEW_AND_RECORD_CANONICAL_PROJECT_PROFILE");
  assert.equal(x.authority.canonicalGatePass, false);
  assert.ok(x.plan.includes("DELIVER_ONE_SCOPED_VERTICAL_SLICE"));
});

test("New project intake: a multidisciplinary foundation plans for intended B3 scale", () => {
  const x = situation();
  x.criticalJourneys = 5;
  x.independentModules = 5;
  x.crossAppContracts = 1;
  const answer = intake(x);
  assert.equal(answer.scale, "STRUCTURED");
  assert.equal(answer.recommendedBlueprintLevel, "B3");
  assert.equal(answer.stage, "foundation");
  assert.ok(answer.plan.includes("DELIVER_ONE_CONTRACTED_VERTICAL_SLICE"));
});

test("New project intake: platform and privileged cross-app control require STRUCTURED B4", () => {
  for (const field of ["sharedPlatformRole", "privilegedControl"]) {
    const x = situation();
    x[field] = true;
    const a = intake(x);
    assert.equal(a.recommendedBlueprintLevel, "B4");
    assert.equal(a.scale, "STRUCTURED");
    assert.equal(a.authority.productionRelease, false);
  }
});

test("New project intake: high-sensitivity records and safety-critical tasks trigger B5", () => {
  for (const field of ["highSensitivityData", "criticalFailureImpact"]) {
    const x = situation();
    x[field] = true;
    const a = intake(x);
    assert.equal(a.recommendedBlueprintLevel, "B5");
    assert.equal(a.scale, "STRUCTURED");
    assert.equal(a.authority.constitutionalRatification, false);
  }
});

test("New project intake: micro task and tiny utility use compact B0/B1", () => {
  const x = situation();
  x.criticalJourneys = 0;
  x.independentModules = 0;
  x.persistentUserState = false;
  assert.equal(intake(x).recommendedBlueprintLevel, "B0");
  x.criticalJourneys = 1;
  assert.equal(intake(x).recommendedBlueprintLevel, "B1");
});

test("New project intake: incomplete/invalid context must not silently select small", () => {
  for (const x of [null, [], {}, { ...situation(), criticalJourneys: -1 },
    { ...situation(), sharedPlatformRole: undefined },
    { ...situation(), stage: "unknown" },
    { ...situation(), criticalJourneys: "4" }]) {
    const answer = intake(x);
    assert.equal(answer.status, "UNVERIFIED");
    assert.equal(answer.scale, null);
    assert.deepEqual(answer.plan, []);
  }
});

test("New project intake: authoritative project level cannot be replaced by an intake guess", () => {
  const a = intake({ ...situation(), independentModules: 5 });
  assert.equal(a.recommendedBlueprintLevel, "B3");
  assert.equal(a.nextAction, "REVIEW_AND_RECORD_CANONICAL_PROJECT_PROFILE");
  assert.equal(a.authority.canonicalGatePass, false);
  // The existing project must still use its independently recorded level.
  assert.equal(profile({ blueprintLevel: "B2", operationRisk: "L1" }).scale, "COMPACT");
});

test("Canonical governed manifest maps every existing repository to one profile", () => {
  const source = new URL("../../control/constitution-governed-repositories.json", import.meta.url);
  const manifest = JSON.parse(readFileSync(source, "utf8"));
  assert.equal(manifest.schemaVersion, "1.0.0");
  assert.ok(Array.isArray(manifest.repositories));
  const seen = new Set();
  for (const entry of manifest.repositories) {
    assert.ok(entry.repository.startsWith("BlueDragon33/"));
    assert.ok(entry.projectId.startsWith("project:"));
    assert.ok(entry.branch.length > 0);
    assert.equal(seen.has(entry.repository), false, "duplicate registered project");
    seen.add(entry.repository);
    // This assertion reads exact authoritative level. No per-project shadow map.
    const v = profile({ blueprintLevel: entry.blueprintLevel, operationRisk: "L1" });
    assert.equal(v.status, "READY_FOR_REVIEW");
    assert.equal(v.scale, Number(entry.blueprintLevel.slice(1)) <= 2 ? "COMPACT" : "STRUCTURED");
    assert.equal(v.authority.canonicalGatePass, false);
  }
  // Snapshot evidence: 15 governance entries plus two observed unenrolled
  // foundations on the 2026-10-11 review date; later valid registry additions
  // can grow without requiring a test rewrite.
  assert.ok(seen.size >= 15);
});

test("New foundation candidates cannot fabricate authority or enrollment", () => {
  for (const purpose of ["Schematic-to-PCB design", "Engineering solver and CAD feedback"]) {
    const a = intake({ ...situation(), purpose, independentModules: 5,
      criticalJourneys: 5, crossAppContracts: 1, persistentUserState: true });
    assert.equal(a.scale, "STRUCTURED");
    assert.equal(a.recommendedBlueprintLevel, "B3");
    assert.equal(a.nextAction, "REVIEW_AND_RECORD_CANONICAL_PROJECT_PROFILE");
    assert.equal(a.authority.constitutionalRatification, false);
    assert.equal(a.authority.productionRelease, false);
  }
});

test("Later scope expansion may suggest reclassification but never alters recorded level", () => {
  const before = intake({ ...situation(), criticalJourneys: 1, independentModules: 1,
    persistentUserState: false });
  const after = intake({ ...situation(), criticalJourneys: 5, independentModules: 4,
    crossAppContracts: 1 });
  assert.equal(before.scale, "COMPACT");
  assert.equal(after.scale, "STRUCTURED");
  assert.equal(before.nextAction, after.nextAction);
  const currentCanonical = profile({ blueprintLevel: "B2", operationRisk: "L1" });
  assert.equal(currentCanonical.scale, "COMPACT");
  assert.equal(currentCanonical.authority.productionRelease, false);
});
