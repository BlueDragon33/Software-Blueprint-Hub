/** Candidate only: deterministic, read-only, project-scoped Next Action frontier.
 * No shell, ChatGPT host control, gate mutation or execution authority.
 * Intended as a small integration contract for the existing Prompt Workspace.
 */
export const UNIVERSAL_NEXT_ACTION_VERSION = "ana-universal:candidate-v1";

const statuses = new Set(["planned","ready","in-progress","testing","review","blocked","completed","archived"]);
const sha40 = /^[a-f0-9]{40}$/;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9:._/-]{1,159}$/;
function invariant(ok, reason) { if (!ok) throw new TypeError("ANA_BLOCKED: " + reason); }
function freezeResult(o) { return Object.freeze(o); }

/** A canonical reader must authorize project scope before calling this pure projection. */
export function selectUniversalNextAction(snapshot) {
  invariant(snapshot && typeof snapshot === "object", "missing snapshot");
  const { projectId, sourceRevision, projectName, workPackages, capabilities = {}, checkpointRef = null } = snapshot;
  invariant(typeof projectId === "string" && /^project:[a-z0-9][a-z0-9-]{0,158}$/.test(projectId), "project identity");
  invariant(typeof projectName === "string" && projectName.trim().length > 0 && projectName.length < 160, "project name");
  invariant(typeof sourceRevision === "string" && sha40.test(sourceRevision), "exact source revision");
  invariant(Array.isArray(workPackages) && workPackages.length <= 500, "work list");
  invariant(checkpointRef === null || (typeof checkpointRef === "string" && checkpointRef.length > 0 && checkpointRef.length <= 300), "checkpoint");
  const byId = new Map();
  for (const work of workPackages) {
    invariant(work && work.projectId === projectId && idPattern.test(work.id) && !byId.has(work.id), "cross-project or duplicate work");
    invariant(statuses.has(work.status) && typeof work.title === "string" && work.title.length > 0 && work.title.length <= 240, "work status/title");
    invariant(Array.isArray(work.dependencies) && work.dependencies.length <= 100, "dependencies");
    invariant(Array.isArray(work.gates) && work.gates.length <= 100, "gates");
    byId.set(work.id, work);
  }
  for (const work of workPackages) {
    for (const dep of work.dependencies) invariant(byId.has(dep) && dep !== work.id, "unknown/self dependency");
    for (const gate of work.gates) invariant(gate && typeof gate.id === "string" && ["pass","fail","candidate","not-ready"].includes(gate.status) && typeof gate.evidenceComplete === "boolean", "gate integrity");
  }
  const color = new Map();
  function visit(id) {
    if (color.get(id) === 1) throw new TypeError("ANA_BLOCKED: dependency cycle");
    if (color.get(id) === 2) return;
    color.set(id, 1);
    for (const dep of byId.get(id).dependencies) visit(dep);
    color.set(id, 2);
  }
  for (const id of byId.keys()) visit(id);
  const pending = workPackages.filter(w => !["completed","archived"].includes(w.status));
  if (!pending.length) return freezeResult({kind:"none",projectId,sourceRevision,checkpointRef,mayExecute:false,reason:"no outstanding canonical work"});
  const ready = pending.filter(w =>
    ["ready","in-progress","testing"].includes(w.status) &&
    w.dependencies.every(id => byId.get(id).status === "completed") &&
    w.gates.every(g => g.status === "pass" && g.evidenceComplete)
  );
  const priority = {"in-progress":0,"testing":1,"ready":2};
  ready.sort((a,b)=>priority[a.status]-priority[b.status] || a.id.localeCompare(b.id));
  if (!ready.length) return freezeResult({
    kind:"blocked",projectId,sourceRevision,checkpointRef,mayExecute:false,
    blockedIds:Object.freeze(pending.map(w=>w.id).sort()),
    reason:"No READY work with satisfied dependencies and evidence-bound gates"
  });
  const selected = ready[0];
  const mayExecute = capabilities.scopedRunner === true && capabilities.currentAuthority === true;
  return freezeResult({
    kind: mayExecute ? "execute-eligible" : "send-guidance",
    projectId,projectName,sourceRevision,checkpointRef,workPackageId:selected.id,
    mayExecute,hostCanSend:capabilities.hostCanSend === true,
    requiresNativeBatch:capabilities.requiresWindows === true && capabilities.nativeWindows !== true,
    stopConditions:Object.freeze(["mandatory-human-gate","unavailable-capability","unapproved-cost-or-risk","scope-complete","environment-limit"]),
    instruction: "Continue authorized READY work for " + selected.id + " in " + projectName +
      ". Revalidate canonical state and authority before each mutation; complete all eligible dependent tasks, test and checkpoint. Do not self-ratify, publish or invent execution. Batch Windows diagnostics only if actually required."
  });
}

/** R19–R22 implementation: a single interruption boundary, never per-step polling.
 * Pure planning only; no shell execution, privilege grant or background operation.
 * Trusted callers must authenticate project and source before displaying the plan.
 */
export function planUniversalUserIntervention(input) {
  if (!input || typeof input !== 'object') throw new TypeError('ANA_BLOCKED: interaction context');
  const { state, authorityRequired = false, nativeWindowsRequired = false,
    nativeWindowsAvailable = false, connectedRunnerAvailable = false,
    nativeStepLabels = [] } = input;
  if (!['ready','working','blocked','complete'].includes(state) ||
      typeof authorityRequired !== 'boolean' ||
      typeof nativeWindowsRequired !== 'boolean' ||
      typeof nativeWindowsAvailable !== 'boolean' ||
      typeof connectedRunnerAvailable !== 'boolean' ||
      !Array.isArray(nativeStepLabels) || nativeStepLabels.length > 20 ||
      nativeStepLabels.some(s => typeof s !== 'string' || !s.trim() || s.length > 180)) {
    throw new TypeError('ANA_BLOCKED: invalid interaction plan');
  }
  const result = (kind, requiresUser, details) => Object.freeze({
    kind, requiresUser, ...details, mayExecute: false, mayPublish: false
  });
  if (authorityRequired) return result('human-authority-gate', true, {
    nextUserReadback: false, reason: 'Non-delegable human authority required'
  });
  if (state === 'complete') return result('final-report', false, { nextUserReadback: false });
  if (nativeWindowsRequired && !nativeWindowsAvailable && !connectedRunnerAvailable) {
    if (!nativeStepLabels.length) return result('capability-blocker', false, {
      nextUserReadback: false, reason: 'Native capability missing; prepare a verified batch before asking'
    });
    return result('one-native-batch', true, {
      nextUserReadback: true,
      steps: Object.freeze([...nativeStepLabels]),
      reason: 'One PowerShell batch and one readback after preflight; not repeated command prompts'
    });
  }
  if (state === 'blocked') return result('technical-checkpoint', false, {
    nextUserReadback: false, reason: 'Record blocker and diagnose; do not solicit routine input'
  });
  return result('continue-autonomously', false, { nextUserReadback: false });
}
