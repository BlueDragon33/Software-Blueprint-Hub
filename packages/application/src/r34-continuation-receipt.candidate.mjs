/**
 * R34 REVIEW-ONLY receipt-shape gate; not a runner, trust anchor, source-of-truth,
 * human approval, canonical registry or independent evidence verifier.
 * It refuses premature self-reported completion before authorized review.
 */
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
  }
  if (packet.tasks.some(x => x.state === 'eligible'))
    return result('CONTINUE', 'eligible-steps-remain');

  if (packet.outcome === 'VERIFIED_COMPLETE') {
    if (!SHA.test(packet.sourceRevision ?? '') || !Number.isSafeInteger(packet.projectProfileVersion) ||
        packet.projectProfileVersion < 1)
      return result('REJECT', 'unverified-canonical-bindings');
    if (packet.tasks.some(x => x.state === 'blocked')) return result('REJECT', 'blocked-task-remains');
    if (!packet.tasks.some(x => x.state === 'verified')) return result('REJECT', 'no-real-verified-action');
    if (packet.stopReason !== 'requested-goal-verified-complete') return result('REJECT', 'invalid-completion-stop');
    return result('RECEIPT_SHAPE_COMPLETE', 'independent-real-evidence-must-still-be-read-back');
  }
  if (!STOPS.has(packet.stopReason)) return result('REJECT', 'stop-gate-not-substantiated');
  if (!packet.tasks.some(x => x.state === 'blocked')) return result('REJECT', 'partial-without-blocker');
  if (!Array.isArray(packet.attemptedRecovery) || packet.attemptedRecovery.length === 0 ||
      packet.attemptedRecovery.some(x => typeof x !== 'string' || !x.trim()))
    return result('REJECT', 'recovery-attempts-not-disclosed');
  if (packet.outcome === 'PARTIAL_CAPABILITY_LIMIT' &&
      packet.stopReason !== 'missing-enabled-tool-capability')
    return result('REJECT', 'capability-limit-without-capability-gate');
  if (packet.outcome === 'PARTIAL_BLOCKED' &&
      packet.stopReason === 'missing-enabled-tool-capability')
    return result('REJECT', 'capability-gate-misclassified');
  return result(packet.outcome === 'PARTIAL_BLOCKED' ? 'RECEIPT_SHAPE_BLOCKED'
    : 'RECEIPT_SHAPE_CAPABILITY_LIMIT', 'external-authority-readback-remains-required');
}
