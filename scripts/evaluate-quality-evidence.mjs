#!/usr/bin/env node
// Blueprint OS quality evidence scorecard: read-only, dependency-free and fail-closed.
// Scoring is ADVISORY; canonical QualityGate, independent reviewer and release authority
// remain in their existing owners. No network, CI rerun, file mutation or "auto training".
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const policyPath = fileURLToPath(new URL("../control/quality-evaluation-standard.v1.json", import.meta.url));
const shaPattern = /^[0-9a-f]{40}$/;
const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const requiredFeatures = new Set(["browser", "performance", "offlineFull", "persistence", "releaseCandidate"]);
const round = value => Math.round(value * 100) / 100;
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const validUrl = value => typeof value === "string" &&
  /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/(?:actions\/runs\/[0-9]+|pull\/[0-9]+|issues\/[0-9]+)(?:\/.*)?$/.test(value);

export function validateStandard(standard) {
  if (!isRecord(standard) || standard.schemaVersion !== "1.0.0" ||
    standard.standardId !== "blueprint-quality-evidence-scorecard-v1" ||
    !Array.isArray(standard.metrics) || !isRecord(standard.scopeMustEnable)) {
    throw new Error("INVALID_STANDARD_STRUCTURE");
  }
  const ids = new Set();
  let total = 0;
  for (const m of standard.metrics) {
    if (!isRecord(m) || !/^[a-z][a-z0-9_]+$/.test(m.id) || ids.has(m.id) ||
      !(m.when === "always" || requiredFeatures.has(m.when)) ||
      !Number.isInteger(m.weight) || m.weight < 1 || m.weight > 100 ||
      !["min", "max"].includes(m.test) || !Number.isFinite(m.limit) ||
      m.critical !== true || (m.minSamples !== undefined && (!Number.isInteger(m.minSamples) || m.minSamples < 1))) {
      throw new Error("INVALID_STANDARD_METRIC");
    }
    ids.add(m.id);
    total += m.weight;
  }
  if (total !== 100 || standard.candidateScoreThreshold !== 90 ||
    standard.scoreIsNotReviewOrReleaseAuthorization !== true ||
    standard.learningPolicy?.proposalOnly !== true ||
    standard.failClosed?.neverIssueCanonicalQualityGatePass !== true ||
    standard.failClosed?.neverIssueIndependentReviewPass !== true ||
    standard.failClosed?.neverIssueProductionApproval !== true) {
    throw new Error("UNAUTHORIZED_STANDARD_WEAKENING");
  }
  return standard;
}

const fail = reason => { throw new Error(reason); };
function validateEnvelope(input, expectedSha, policy) {
  if (!isRecord(input) || input.schemaVersion !== "1.0.0" ||
    !repoPattern.test(input.repository || "") ||
    !shaPattern.test(input.sourceRevision || "") ||
    !shaPattern.test(expectedSha || "") ||
    !policy.applicableScopes.includes(input.scope) ||
    !isRecord(input.features) || !isRecord(input.metrics) ||
    !isRecord(input.notApplicable)) {
    fail("INVALID_ASSESSMENT_OR_MISSING_EXACT_SHA");
  }
  if (Object.keys(input.features).some(k => !requiredFeatures.has(k) || typeof input.features[k] !== "boolean") ||
    [...requiredFeatures].some(k => typeof input.features[k] !== "boolean")) {
    fail("INVALID_APPLICABILITY_FLAGS");
  }
  const required = policy.scopeMustEnable[input.scope];
  if (!Array.isArray(required) || required.some(key => input.features[key] !== true)) {
    fail("UNSAFE_SCOPE_DOWNGRADE");
  }
  const ids = new Set(policy.metrics.map(m => m.id));
  if (Object.keys(input.metrics).some(id => !ids.has(id)) ||
    Object.keys(input.notApplicable).some(id => !ids.has(id))) fail("UNKNOWN_METRIC_ID");
}

export function assessQuality(standard, input, expectedSha) {
  validateStandard(standard);
  validateEnvelope(input, expectedSha, standard);
  const blockers = [];
  if (expectedSha !== input.sourceRevision) blockers.push("SOURCE_SHA_MISMATCH");
  let earned = 0;
  let applicableWeight = 0;
  const criteria = [];
  for (const metric of standard.metrics) {
    const applicable = metric.when === "always" || input.features[metric.when] === true;
    const item = input.metrics[metric.id];
    const naReason = input.notApplicable[metric.id];
    if (!applicable) {
      if (item !== undefined || typeof naReason !== "string" || naReason.trim().length < 15) {
        blockers.push("UNJUSTIFIED_NA:" + metric.id);
        criteria.push({ id: metric.id, status: "BLOCKED_NA" });
      } else {
        criteria.push({ id: metric.id, status: "NOT_APPLICABLE", reason: naReason.trim() });
      }
      continue;
    }
    applicableWeight += metric.weight;
    if (naReason !== undefined) blockers.push("N_A_ON_REQUIRED_METRIC:" + metric.id);
    if (!isRecord(item) || !Number.isFinite(item.value) ||
      !shaPattern.test(item.sourceRevision || "") ||
      !validUrl(item.sourceUrl) ||
      !["ci", "artifact", "measurement", "review_note"].includes(item.evidenceKind) ||
      item.sourceRevision !== input.sourceRevision) {
      blockers.push("MISSING_OR_UNTRACEABLE_EVIDENCE:" + metric.id);
      criteria.push({ id: metric.id, status: "MISSING" });
      continue;
    }
    if (metric.id.endsWith("_ratio") && (item.value < 0 || item.value > 1)) {
      blockers.push("RATIO_OUT_OF_RANGE:" + metric.id);
      criteria.push({ id: metric.id, status: "INVALID" });
      continue;
    }
    if (metric.id.endsWith("_count") && (!Number.isInteger(item.value) || item.value < 0)) {
      blockers.push("COUNT_OUT_OF_RANGE:" + metric.id);
      criteria.push({ id: metric.id, status: "INVALID" });
      continue;
    }
    if (metric.minSamples && (!Number.isInteger(item.sampleCount) || item.sampleCount < metric.minSamples ||
      !Number.isInteger(item.baselineSampleCount) || item.baselineSampleCount < metric.minSamples)) {
      blockers.push("INSUFFICIENT_COMPARABLE_SAMPLES:" + metric.id);
      criteria.push({ id: metric.id, status: "INSUFFICIENT_SAMPLE" });
      continue;
    }
    const passed = metric.test === "max" ? item.value <= metric.limit : item.value >= metric.limit;
    if (passed) earned += metric.weight;
    else if (metric.critical) blockers.push("HARD_THRESHOLD_FAILED:" + metric.id);
    criteria.push({ id: metric.id, status: passed ? "MEETS_CRITERION" : "FAILS_CRITERION",
      measured: item.value, threshold: metric.test + ":" + metric.limit,
      sourceRevision: item.sourceRevision, sourceUrl: item.sourceUrl });
  }
  const score = applicableWeight > 0 ? round(earned * 100 / applicableWeight) : 0;
  if (score < standard.candidateScoreThreshold) blockers.push("SCORE_BELOW_90");
  const uniqueBlockers = [...new Set(blockers)];
  return {
    standardId: standard.standardId,
    repository: input.repository, scope: input.scope, sourceRevision: input.sourceRevision,
    expectedSha, score, applicableWeight, criteria, blockers: uniqueBlockers,
    technicalCriteria: uniqueBlockers.length ? "BLOCKED" : "SELF_REPORTED_CRITERIA_MET",
    provenanceLevel: "DECLARED_POINTERS_NOT_INDEPENDENTLY_VERIFIED",
    canonicalQualityGate: "UNASSESSED_BY_THIS_TOOL",
    independentReviewer: "NOT_ATTESTED_BY_THIS_TOOL",
    fullOfflineAcceptance: input.scope === "offline_full" && uniqueBlockers.length === 0
      ? "CRITERIA_REPORTED_ONLY_NOT_PRODUCT_ACCEPTANCE" : "UNVERIFIED",
    productionAuthority: "NONE",
    note: "Never treat this numeric score or an unverified GitHub URL as a reviewer signature or release gate."
  };
}

export function learnFromFeedback(standard, feedback, asOf) {
  validateStandard(standard);
  if (!isRecord(feedback) || feedback.schemaVersion !== "1.0.0" || !Array.isArray(feedback.events) ||
    typeof asOf !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(asOf) ||
    !Number.isFinite(Date.parse(asOf + "T00:00:00Z"))) fail("INVALID_FEEDBACK_ENVELOPE");
  const at = Date.parse(asOf + "T23:59:59Z");
  const since = at - standard.learningPolicy.windowDays * 86400000;
  const seen = new Set(), recent = [];
  for (const event of feedback.events) {
    if (!isRecord(event) || typeof event.id !== "string" || !/^[A-Za-z0-9_.:-]+$/.test(event.id) ||
      seen.has(event.id) || !repoPattern.test(event.repository || "") ||
      !shaPattern.test(event.revision || "") ||
      typeof event.category !== "string" || !/^[a-z][a-z0-9_-]+$/.test(event.category) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(event.date || "") ||
      !Number.isFinite(Date.parse(event.date + "T00:00:00Z")) ||
      !validUrl(event.evidenceUrl) || typeof event.closed !== "boolean" ||
      typeof event.firstAttemptFixed !== "boolean" ||
      typeof event.reopened !== "boolean" ||
      typeof event.regressionIntroduced !== "boolean" ||
      (event.firstAttemptFixed && !event.closed) ||
      (event.reopened && !event.closed)) fail("INVALID_FEEDBACK_EVENT");
    seen.add(event.id);
    const time = Date.parse(event.date + "T00:00:00Z");
    if (time > at) fail("FUTURE_DATED_FEEDBACK");
    if (time >= since) recent.push(event);
  }
  const closed = recent.filter(e => e.closed);
  const groups = new Map();
  for (const e of recent) {
    if (!groups.has(e.category)) groups.set(e.category, []);
    groups.get(e.category).push(e);
  }
  const proposals = [];
  for (const [category, events] of groups) {
    const projects = [...new Set(events.map(e => e.repository))];
    if (events.length < standard.learningPolicy.minimumEventsForRecurringPattern ||
      projects.length < standard.learningPolicy.minimumIndependentRepositories) continue;
    proposals.push({ category, eventCount: events.length, distinctProjects: projects.length,
      sourceEvents: events.map(e => ({ id: e.id, repository: e.repository, revision: e.revision, evidenceUrl: e.evidenceUrl })),
      suggestedAction: "PROPOSE_SCOPED_REGRESSION_TEST_AND_ROOT_CAUSE_REVIEW",
      approval: "REVIEW_REQUIRED", autopatch: false, thresholdChange: false });
  }
  const trend = (n, d, min) => d < min ? { state: "INSUFFICIENT_SAMPLE", numerator: n, denominator: d, required: min } :
    { state: "OBSERVED", numerator: n, denominator: d, pct: round(100 * n / d) };
  const first = trend(closed.filter(e=>e.firstAttemptFixed).length,closed.length,
    standard.trendTargets.firstAttemptFixPct.minClosed);
  const reopen = trend(closed.filter(e=>e.reopened).length,closed.length,
    standard.trendTargets.reopenedIssuePct.minClosed);
  const regress = trend(closed.filter(e=>e.regressionIntroduced).length,closed.length,
    standard.trendTargets.regressionsPer100ClosedChanges.minClosed);
  return {
    standardId: standard.standardId, asOf, windowDays: standard.learningPolicy.windowDays,
    inputEvents: feedback.events.length, consideredEvents: recent.length,
    trend: { firstAttemptFixPct: first, reopenedIssuePct: reopen, regressionsPer100ClosedChanges: regress },
    proposedImprovements: proposals, automaticTraining: false,
    qualityThresholdModified: false, status: "ADVISORY_FEEDBACK_REVIEW_ONLY",
    approval: "HUMAN_CHANGE_CONTROL_REQUIRED_FOR_GOVERNED_POLICY"
  };
}

function valueFor(name, argv) {
  const i=argv.indexOf(name);
  return i===-1 ? undefined : argv[i+1];
}
function main(argv) {
  const mode=argv[0], inputPath=argv[1];
  if (!["assess", "learn"].includes(mode) || !inputPath) {
    throw new Error("Usage: node scripts/evaluate-quality-evidence.mjs assess evidence.json --expected-sha <40hex> | learn feedback.json --at YYYY-MM-DD");
  }
  const standard=validateStandard(JSON.parse(readFileSync(policyPath,"utf8")));
  const data=JSON.parse(readFileSync(inputPath,"utf8"));
  if (mode === "assess") {
    const result=assessQuality(standard,data,valueFor("--expected-sha",argv)||process.env.GITHUB_PR_HEAD_SHA);
    process.stdout.write(JSON.stringify(result,null,2)+"\n");
    process.exitCode=result.blockers.length?2:0;
  } else {
    process.stdout.write(JSON.stringify(learnFromFeedback(standard,data,valueFor("--at",argv)),null,2)+"\n");
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write("QUALITY_EVIDENCE_BLOCKED: "+error.message+"\n"); process.exitCode=2; }
}
