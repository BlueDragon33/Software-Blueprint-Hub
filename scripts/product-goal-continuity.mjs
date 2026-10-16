import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const GOAL_CONTINUITY_CANDIDATE = "universal-product-goal-continuity-candidate";
const SHA = /^[a-f0-9]{40}$/;
const IDENTIFIER = /^[a-z][a-z0-9-]{1,79}$/;
const repo = x => typeof x === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(x);
const list = x => Array.isArray(x) ? x : [];
const str = x => typeof x === "string" && Boolean(x.trim());
const unique = x => new Set(x).size === x.length;

export function validateGoalContinuityCandidate(contract) {
  const errors = [];
  if (contract?.schemaVersion !== "1.0.0" ||
      contract?.kind !== GOAL_CONTINUITY_CANDIDATE ||
      contract?.status !== "PROPOSED_NOT_RATIFIED" ||
      contract?.owner !== "BlueDragon33/Software-Blueprint-Hub" ||
      contract?.constitution?.policyVersion !== "1.3.0" ||
      contract?.constitution?.amendmentRequiredForNormativeEnforcement !== true) {
    errors.push("candidate policy cannot impersonate ratified Constitution");
  }
  for (const [name, value] of Object.entries({
    onePrimary:true, rejectRepeatedStatusOnlyLoops:true,
    statusCheckOnlyForRealDependency:true, primaryMustAdvanceProductGoal:true,
    proceedWithoutUnneededHumanInterruption:true,
    stopAtAuthenticatedHumanOrConstitutionalGate:true,
    buttonOnlyWhenActualSupportedActionExists:true,neverAssumeActionExecutedFromButton:true
  })) {
    if (contract?.nextAction?.[name] !== value) errors.push("unsafe next-action rule: "+name);
  }
  if (contract?.nextAction?.secondaryMax > 2 ||
      contract?.nextAction?.secondaryMax < 0 ||
      contract?.evidence?.forbidFabricatedCompletion !== true ||
      contract?.evidence?.forbidChatApprovalAsGitHubReview !== true ||
      contract?.evidence?.forbidImplicitReleaseAuthority !== true ||
      contract?.implementationState?.realUiIntegrated !== false ||
      contract?.implementationState?.allAppPropagationVerified !== false ||
      contract?.implementationState?.productionAuthority !== false ||
      contract?.implementationState?.universalQualityGatePassed !== false) {
    errors.push("candidate must remain non-authoritative with bounded navigation");
  }
  return errors;
}

export function validateGoalCheckpoint(input) {
  const errors = [];
  const bad = reason => errors.push(reason);
  const p = input?.project, c = input?.checkpoint, work = input?.workItems;
  if (!p || !/^project:[a-z][a-z0-9-]+$/.test(p.id ?? "") ||
      !repo(p.repository) || !IDENTIFIER.test(p.goalId ?? "") ||
      !SHA.test(p.goalRevision ?? "") || !str(p.outcome) ||
      !Array.isArray(p.acceptance) || !p.acceptance.length ||
      !p.acceptance.every(str)) bad("missing canonical product outcome/acceptance or revision");
  if (!c || c.projectId !== p?.id || c.goalId !== p?.goalId ||
      c.goalRevision !== p?.goalRevision || !SHA.test(c.appHead ?? "") ||
      !/^\d+\.\d+\.\d+$/.test(c.policyVersion ?? "") ||
      !str(c.evidenceRevision)) bad("stale or unbound checkpoint");
  if (!Array.isArray(work) || work.length > 100) bad("unbounded/missing work items");
  const ids = list(work).map(x => x?.id);
  if (!unique(ids)) bad("duplicate work identity");
  const known = new Map(list(work).map(x => [x.id,x]));
  for (const w of list(work)) {
    if (!IDENTIFIER.test(w?.id ?? "") || w.goalId !== p?.goalId ||
        !["deliverable","verification","dependency-check","review"].includes(w.kind) ||
        !["ready","blocked","done"].includes(w.state) ||
        !Array.isArray(w.dependsOn) || !unique(w.dependsOn) ||
        !w.dependsOn.every(x => known.has(x) && x !== w.id) ||
        !str(w.label) || !str(w.actionId) || !str(w.output) ||
        !repo(w.ownerRepository) || !SHA.test(w.sourceRevision ?? "") ||
        typeof w.humanGate !== "boolean" || typeof w.safeAutonomous !== "boolean" ||
        (w.humanGate && w.safeAutonomous) ||
        !Number.isInteger(w.priority) || w.priority < 0 || w.priority > 100) {
      bad("invalid item or ownership: "+w?.id);
    }
    if (w.state === "done" && !list(w.evidence).some(str)) {
      bad("done without verifiable evidence: "+w.id);
    }
    if (w.kind === "dependency-check" &&
        (!list(w.unblocks).length || !list(w.unblocks).every(id => known.has(id) && id !== w.id))) {
      bad("dependency check without actual blocked target: "+w.id);
    }
  }
  const visiting = new Set(), visited = new Set();
  function visit(id) {
    if (visiting.has(id)) {bad("cyclic work dependency");return;}
    if (visited.has(id)) return;
    visiting.add(id);
    for (const parent of list(known.get(id)?.dependsOn)) if (known.has(parent)) visit(parent);
    visiting.delete(id);visited.add(id);
  }
  for (const id of known.keys()) visit(id);
  return errors;
}

const order = {deliverable:0,verification:1,review:2,"dependency-check":3};

/**
 * Deterministic ADVISORY navigation projection from TRUSTED canonical
 * project/work inputs. NEVER submits, approves, merges, publishes or clicks.
 * A consumer must verify project read-access and authenticate evidence first.
 */
export function selectGoalAnchoredNextAction(input) {
  const errors = validateGoalCheckpoint(input);
  if (errors.length) return {state:"UNVERIFIED",primary:null,secondary:[],errors};
  const {project:p, checkpoint:c,workItems:work,history} = input;
  const known = new Map(work.map(x => [x.id,x]));
  const done = id => known.get(id)?.state === "done";
  const ready = work.filter(x =>
    x.state === "ready" && x.dependsOn.every(done) &&
    (x.kind !== "dependency-check" ||
      x.unblocks.some(id => known.get(id)?.state === "blocked")));
  ready.sort((a,b) => order[a.kind]-order[b.kind] ||
    b.priority-a.priority || a.id.localeCompare(b.id));
  const repeated = x => history?.lastActionId === x.actionId &&
    history?.appHead === c.appHead &&
    history?.goalRevision === c.goalRevision &&
    history?.evidenceRevision === c.evidenceRevision;
  // Do not keep presenting the identical status check without fresh evidence.
  const eligible = ready.filter(x => !(x.kind === "dependency-check" && repeated(x)));
  const primary = eligible[0] ?? null;
  const projectDone = work.length > 0 && work.every(x => x.state === "done");
  if (!primary) {
    return {state:projectDone?"EVIDENCE_COMPLETE_NOT_PRODUCT_CERTIFIED":
      ready.length?"STALE_CHECK_BLOCKED":"BLOCKED",primary:null,secondary:[],
      errors:[],goalId:p.goalId,unresolved:work.filter(x=>x.state!=="done").map(x=>x.id)};
  }
  const action = x => ({
    id:x.actionId,label:x.label,workId:x.id,output:x.output,
    ownerRepository:x.ownerRepository,sourceRevision:x.sourceRevision,
    requiresHuman:x.humanGate,autonomous:x.safeAutonomous&&!x.humanGate
  });
  return {state:primary.humanGate?"HUMAN_GATE":"ACTIONABLE",
    goalId:p.goalId,productOutcome:p.outcome,
    primary:action(primary),secondary:eligible.slice(1,3).map(action),errors:[],
    // This is UI advice, not a scheduler, authorization token or execution.
    executed:false,qualityGatePassed:false,productionAuthorized:false};
}

const invoked = process.argv[1] && fileURLToPath(import.meta.url) ===
  new URL("file://" + process.argv[1]).pathname;
if (invoked) {
  try {
    const policy=JSON.parse(readFileSync(
      new URL("../control/product-goal-continuity.candidate.v1.json",import.meta.url),"utf8"));
    const errors=validateGoalContinuityCandidate(policy);
    if (errors.length) {
      errors.forEach(x=>console.error("[goal-continuity] "+x));
      process.exitCode=1;
    } else console.log("[goal-continuity] candidate contract validated; NOT RATIFIED or propagated");
  } catch(error) {console.error("[goal-continuity] "+error.message);process.exitCode=1;}
}
