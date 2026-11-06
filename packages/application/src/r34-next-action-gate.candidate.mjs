/**
 * R34 review-only final NEXT ACTION shape gate. Never a trust anchor, executor,
 * source-of-truth or human approval service. Caller still needs canonical readback.
 */
const PROJECT = /^project:[a-z0-9][a-z0-9-]{0,158}$/;
const KINDS = new Set(['close-verified-goal', 'human-authorization', 'resolve-unavailable-capability', 'reconcile-canonical-revision', 'resume-blocked-task']);
const OWNERS = new Set(['agent', 'human-authority', 'external-host']);
const GENERIC = /^(?:next action|ti[eế]p t[uụ]c(?: nhi[eệ]m v[uụ]| c[oô]ng vi[eệ]c)?|tri[eể]n khai t[ừư] [đd][ầa]u t[ớo]i cu[ốo]i|ki[eể]m tra(?: l[aạ]i)?|x[ửu] l[yý] ti[eế]p|l[aà]m ti[eế]p|open owner setup)[.!?\s]*$/iu;
const nonEmpty = x => typeof x === 'string' && x.trim().length > 0;
const deny = code => Object.freeze({ state: 'REJECT', code });

/**
 * A report's ONE next step must be a concrete externally justified boundary,
 * not a copyable prompt that restarts the same agent without new evidence.
 * This validates ONLY fields and consistency, not their real-world truth.
 */
export function reviewR34NextAction(packet) {
  if (!packet || typeof packet !== 'object') return deny('missing-packet');
  if (!PROJECT.test(packet.projectId ?? '')) return deny('noncanonical-project');
  if (!Array.isArray(packet.nextActions) || packet.nextActions.length !== 1 ||
      !nonEmpty(packet.nextActions[0])) return deny('not-exactly-one-next-action');
  const label = packet.nextActions[0].trim();
  if (GENERIC.test(label) || label.length < 18) return deny('generic-or-ambiguous-next-action');
  const next = packet.nextActionProof;
  if (!next || typeof next !== 'object') return deny('missing-next-action-proof');
  if (!KINDS.has(next.kind) || !OWNERS.has(next.ownerType)) return deny('invalid-next-action-kind-or-owner');
  if (!nonEmpty(next.actionId) || !nonEmpty(next.targetTaskId) || !nonEmpty(next.expectedEvidence) ||
      next.expectedEvidence.trim().length < 12 || !nonEmpty(next.selectionReason) ||
      next.selectionReason.trim().length < 12)
    return deny('non-actionable-next-action');
  if (next.projectId !== packet.projectId || next.sourceRevision !== packet.sourceRevision)
    return deny('next-action-canonical-binding-mismatch');
  if (!Array.isArray(packet.tasks) || !packet.tasks.some(t => t.id === next.targetTaskId))
    return deny('next-action-task-not-in-scope');
  const task = packet.tasks.find(t => t.id === next.targetTaskId);
  if (next.previousActionId === next.actionId &&
      (!Array.isArray(next.newEvidenceIds) || next.newEvidenceIds.length === 0))
    return deny('unchanged-next-action-loop');
  if (next.newEvidenceIds !== undefined &&
      (!Array.isArray(next.newEvidenceIds) || next.newEvidenceIds.some(v => !nonEmpty(v))))
    return deny('invalid-evidence-delta');
  if (packet.outcome === 'VERIFIED_COMPLETE') {
    if (next.kind !== 'close-verified-goal' || next.ownerType !== 'agent' ||
        task.state !== 'verified' || next.requiresHuman === true)
      return deny('completion-must-close-goal-not-delegate');
  } else {
    if (next.kind === 'close-verified-goal' || task.state !== 'blocked' ||
        next.blockedBy !== packet.stopReason)
      return deny('partial-next-action-not-bound-to-blocker');
    if (packet.stopReason === 'authenticated-human-authority-gate' &&
        (next.kind !== 'human-authorization' || next.ownerType !== 'human-authority' ||
         next.requiresHuman !== true))
      return deny('human-gate-next-action-mismatch');
    if (packet.stopReason === 'missing-enabled-tool-capability' &&
        next.kind !== 'resolve-unavailable-capability')
      return deny('capability-next-action-mismatch');
    if (packet.stopReason === 'stale-or-conflicting-canonical-revision' &&
        next.kind !== 'reconcile-canonical-revision')
      return deny('revision-next-action-mismatch');
    if (next.requiresHuman === true && next.ownerType === 'agent')
      return deny('unjustified-user-intervention');
    if (next.ownerType === 'human-authority' && next.requiresHuman !== true)
      return deny('human-owner-without-explicit-human-gate');
  }
  return Object.freeze({ state: 'SHAPE_VALID', code: 'independent-source-readback-still-required' });
}
