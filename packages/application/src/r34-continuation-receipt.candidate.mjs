/**
 * R34 REVIEW-ONLY receipt-shape gate; not a runner, trust anchor, source-of-truth,
 * human approval, canonical registry or independent evidence verifier.
 * Rejects incomplete next actions and premature self-reported completion.
 */
import { reviewR34NextAction } from './r34-next-action-gate.candidate.mjs';
const SHA = /^[0-9a-f]{40}$/;
const PROJECT = /^project:[a-z0-9][a-z0-9-]{0,158}$/;
const STOPS = new Set([
  'authenticated-human-authority-gate',
  'missing-enabled-tool-capability',
  'stale-or-conflicting-canonical-revision',
  'budget-or-cost-limit',
  'privacy-or-safety-boundary'
]);
const ALLOWED_TASKS = new Set(['eligible', 'verified', 'blocked', 'not-applicable']);
const OUTCOMES = new Set(['VERIFIED_COMPLETE', 'PARTIAL_BLOCKED', 'PARTIAL_CAPABILITY_LIMIT']);

const result = (decision, reason) => Object.freeze({
  decision, reason, mayClaimQaPass: false,
  mayExerciseAuthority: false, requiresIndependentCanonicalReadback: true
});

export function reviewR34ContinuationReceipt(packet) {
  if (!packet || typeof packet !== 'object') return result('REJECT', 'missing-packet');
  if (!PROJECT.test(packet.projectId ?? '')) return result('REJECT', 'noncanonical-project');
  if (!OUTCOMES.has(packet.outcome)) return result('REJECT', 'invalid-outcome');
  if (packet.autoLaunchWork === true || packet.autoPublish === true || packet.implicitGrant === true)
    return result('REJECT', 'forbidden-implicit-authority');
  if (packet.reaskedKnownQuestion === true) return result('REJECT', 'repeated-known-question');
  if (!Array.isArray(packet.nextActions) || packet.nextActions.length !== 1 ||
      typeof packet.nextActions[0] !== 'string' || !packet.nextActions[0].trim())
    return result('REJECT', 'not-exactly-one-next-action');
  if (!Array.isArray(packet.tasks) || packet.tasks.length === 0)
    return result('REJECT', 'missing-task-inventory');
  if (!Array.isArray(packet.scopeTaskIds) || packet.scopeTaskIds.length === 0 ||
      new Set(packet.scopeTaskIds).size !== packet.scopeTaskIds.length ||
      !packet.scopeTaskIds.every(id => typeof id === 'string' && id.trim()))
    return result('REJECT', 'missing-or-duplicated-approved-scope');
  const ids = new Set();
  for (const task of packet.tasks) {
    if (!task || typeof task.id !== 'string' || !task.id.trim() || ids.has(task.id))
      return result('REJECT', 'missing-or-duplicate-task-id');
    ids.add(task.id);
    if (!ALLOWED_TASKS.has(task.state)) return result('REJECT', 'unknown-task-state');
    if (task.state === 'verified') {
      if (!SHA.test(task.evidence?.sourceRevision ?? '') ||
          task.evidence.sourceRevision !== packet.sourceRevision ||
          task.evidence.independentReadback !== true || task.evidence.realAcceptance !== true)
        return result('REJECT', 'unverified-or-stale-task-evidence');
    }
    if (task.state === 'blocked' &&
        (typeof task.blockedBy !== 'string' || !STOPS.has(task.blockedBy) ||
         !Array.isArray(task.recoveryAttempts) || task.recoveryAttempts.length === 0))
      return result('REJECT', 'unsupported-task-blocker');
  }
  if (ids.size !== packet.scopeTaskIds.length || packet.scopeTaskIds.some(id => !ids.has(id)))
    return result('REJECT', 'incomplete-approved-scope');
  if (packet.tasks.some(x => x.state === 'eligible'))
    return result('CONTINUE', 'eligible-steps-remain');

  if (packet.outcome === 'VERIFIED_COMPLETE') {
    if (!SHA.test(packet.sourceRevision ?? '') || !Number.isSafeInteger(packet.projectProfileVersion) ||
        packet.projectProfileVersion < 1)
      return result('REJECT', 'unverified-canonical-bindings');
    if (packet.tasks.some(x => x.state === 'blocked')) return result('REJECT', 'blocked-task-remains');
    if (!packet.tasks.some(x => x.state === 'verified')) return result('REJECT', 'no-real-verified-action');
    if (packet.stopReason !== 'requested-goal-verified-complete') return result('REJECT', 'invalid-completion-stop');
    const next = reviewR34NextAction(packet);
    if (next.state !== 'SHAPE_VALID') return result('REJECT', next.code);
    return result('RECEIPT_SHAPE_COMPLETE', 'independent-real-evidence-must-still-be-read-back');
  }
  if (!STOPS.has(packet.stopReason)) return result('REJECT', 'stop-gate-not-substantiated');
  if (!packet.tasks.some(x => x.state === 'blocked' && x.blockedBy === packet.stopReason))
    return result('REJECT', 'partial-without-matching-blocker');
  if (!Array.isArray(packet.attemptedRecovery) || packet.attemptedRecovery.length === 0 ||
      packet.attemptedRecovery.some(x => typeof x !== 'string' || !x.trim()))
    return result('REJECT', 'recovery-attempts-not-disclosed');
  if (packet.outcome === 'PARTIAL_CAPABILITY_LIMIT' &&
      packet.stopReason !== 'missing-enabled-tool-capability')
    return result('REJECT', 'capability-limit-without-capability-gate');
  if (packet.outcome === 'PARTIAL_BLOCKED' &&
      packet.stopReason === 'missing-enabled-tool-capability')
    return result('REJECT', 'capability-gate-misclassified');
  const next = reviewR34NextAction(packet);
  if (next.state !== 'SHAPE_VALID') return result('REJECT', next.code);
  return result(packet.outcome === 'PARTIAL_BLOCKED' ? 'RECEIPT_SHAPE_BLOCKED'
    : 'RECEIPT_SHAPE_CAPABILITY_LIMIT', 'external-authority-readback-remains-required');
}
