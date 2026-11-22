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
  const ce=contract?.continuousExecution;
  const required=["effective-authority","product-goal-and-exit-criteria",
    "current-source-and-checkpoint","critical-path-and-dependencies",
    "blocking-defects-and-repair","relevant-quality-gates",
    "risk-human-and-capability-boundaries","durable-handoff"];
  for (const [name,value] of Object.entries({
    preflightRequiredBeforeContinuousAction:true,
    resolveActionableEntryBlockersBeforeOffer:true,
    classifyUnresolvedHumanOrCapabilityBoundaries:true,
    allowIndependentVerifiedReadyWork:true,
    stopWhenNoSafeReadyWork:true,
    noUnsupportedPromiseOfZeroDefects:true,
    sourceRecheckRequiredOnUserTrigger:true,
    requireAuthenticatedCanonicalAndHostBindingForLiveButton:true,
    noImplicitBackgroundExecution:true,
    noReleaseOrApprovalFromPreflight:true
  })) {
    if (ce?.[name] !== value) errors.push("unsafe continuous execution rule: "+name);
  }
  if (!Array.isArray(ce?.scope) || ce.scope.join(",") !== "existing,active,future" ||
      !Array.isArray(ce?.requiredChecks) ||
      ce.requiredChecks.join(",") !== required.join(",")) {
    errors.push("universal preflight must cover all project cohorts and checks");
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
  // This checks consistency of a server-obtained snapshot, not a digital
  // signature or an authenticated read. The hosting adapter MUST authorize
  // the actor and resolve Profile/Work Packages/evidence server-side.
  const source = input?.sourceBinding;
  if (!source || source.kind !== "canonical-snapshot-reference" ||
      source.projectId !== p?.id || source.repository !== p?.repository ||
      source.goalRevision !== p?.goalRevision ||
      source.appHead !== c?.appHead ||
      source.workRevision !== c?.workRevision ||
      source.evidenceRevision !== c?.evidenceRevision ||
      !SHA.test(c?.workRevision ?? "") ||
      !source.repositoryHeads || Array.isArray(source.repositoryHeads) ||
      typeof source.repositoryHeads !== "object" ||
      source.repositoryHeads[p?.repository] !== c?.appHead) {
    bad("missing or conflicting canonical source revision binding");
  }
  if (p?.delegatedRepositories !== undefined &&
      (!Array.isArray(p.delegatedRepositories) ||
       !p.delegatedRepositories.every(repo) ||
       !unique(p.delegatedRepositories) ||
       p.delegatedRepositories.includes(p.repository))) {
    bad("invalid canonical project delegation");
  }
  if (!Array.isArray(work) || work.length === 0 || work.length > 100) {
    bad("missing or unbounded canonical work items");
  }
  const items = list(work);
  const ids = items.map(x => x?.id);
  if (!unique(ids)) bad("duplicate work identity");
  if (!unique(items.map(x => x?.actionId))) bad("duplicate action identity");
  const known = new Map(items.filter(x => x && typeof x === "object").map(x => [x.id,x]));
  for (const w of known.values()) {
    if (!IDENTIFIER.test(w?.id ?? "") || w.goalId !== p?.goalId ||
        !["deliverable","verification","dependency-check","review"].includes(w.kind) ||
        !["ready","blocked","done"].includes(w.state) ||
        !Array.isArray(w.dependsOn) || !unique(w.dependsOn) ||
        !w.dependsOn.every(x => known.has(x) && x !== w.id) ||
        !str(w.label) || !str(w.actionId) || !str(w.output) ||
        !repo(w.ownerRepository) || !SHA.test(w.sourceRevision ?? "") ||
        (!([p?.repository,...list(p?.delegatedRepositories)].includes(w.ownerRepository))) ||
        source?.repositoryHeads?.[w.ownerRepository] !== w.sourceRevision ||
        (w.statusOnly !== undefined && typeof w.statusOnly !== "boolean") ||
        (w.humanGate && (!w.humanGateDetails ||
          !str(w.humanGateDetails.reviewer) ||
          !str(w.humanGateDetails.action) ||
          !str(w.humanGateDetails.reason))) ||
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
  if (items.some(x => !x || typeof x !== "object")) bad("malformed work item");
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
  const eligible = ready.filter(x =>
    !((x.kind === "dependency-check" || (x.kind === "review" && x.statusOnly === true)) &&
      repeated(x)));
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
    requiresHuman:x.humanGate,autonomous:x.safeAutonomous&&!x.humanGate,
    ...(x.humanGate ? {humanGateDetails:x.humanGateDetails} : {}),
    advisoryOnly:true
  });
  return {state:primary.humanGate?"HUMAN_GATE":"ACTIONABLE",
    goalId:p.goalId,productOutcome:p.outcome,
    primary:action(primary),secondary:eligible.slice(1,3).map(action),errors:[],
    // This is UI advice, not a scheduler, authorization token or execution.
    executed:false,qualityGatePassed:false,productionAuthorized:false,
    projectionOnly:true,authenticatedBySelector:false};
}

/**
 * Only a caller-confirmed capability gap can reveal the two-option Work
 * handoff. A prompt is COPY TEXT, never an automatic Work-mode switch.
 * Source identity here is still caller-supplied: the UI must bind it to
 * an authorized canonical server read before rendering.
 */
export function buildBoundedWorkEscalation(input, gap) {
  const advice = selectGoalAnchoredNextAction(input);
  if (advice.state === "UNVERIFIED") return {visible:false,reason:"UNVERIFIED_CANONICAL_SOURCE",options:[]};
  if (!gap || gap.kind !== "CONFIRMED_CAPABILITY_GAP") {
    return {visible:false,reason:"NO_CONFIRMED_CAPABILITY_GAP",options:[]};
  }
  const w = input.workItems.find(x => x.id === gap.workId);
  const ready = w && w.state === "ready" &&
    w.dependsOn.every(id => input.workItems.some(d => d.id === id && d.state === "done"));
  if (!ready || w.humanGate || !w.safeAutonomous ||
      !str(gap.missingCapability) || !str(gap.observedBlocker) ||
      !str(gap.allowedAction) || !str(gap.qa) || !str(gap.stopCondition) ||
      !Array.isArray(gap.files) || gap.files.length < 1 || gap.files.length > 8 ||
      !gap.files.every(x => typeof x === "string" &&
        x.length < 160 && !x.includes("..") && !x.includes("*") && !x.startsWith("/")) ||
      !unique(gap.files) || !Array.isArray(gap.logs) || gap.logs.length > 4 ||
      !gap.logs.every(str) ||
      !gap.budget || !Number.isInteger(gap.budget.tokens) ||
      gap.budget.tokens < 1000 || gap.budget.tokens > 16000 ||
      !Number.isInteger(gap.budget.minutes) || gap.budget.minutes < 1 ||
      gap.budget.minutes > 45 ||
      !Number.isInteger(gap.budget.toolCalls) || gap.budget.toolCalls < 1 ||
      gap.budget.toolCalls > 25 ||
      !Number.isInteger(gap.budget.attempts) || gap.budget.attempts < 1 ||
      gap.budget.attempts > 2) {
    return {visible:false,reason:"UNSAFE_OR_UNBOUNDED_GAP",options:[]};
  }
  const fallback = advice.primary?.autonomous && advice.primary.workId !== w.id
    ? advice.primary
    : null;
  if (!fallback) return {visible:false,reason:"NO_INDEPENDENT_SAFE_CHAT_ACTION",options:[]};
  const prompt = [
    "WORK HANDOFF — manually open Work mode; this text does not switch mode.",
    "Authority: existing Blueprint OS 1.3.0; proposed continuity rules NOT RATIFIED.",
    "Project: "+input.project.id+" | Goal: "+input.project.goalId,
    "Accepted outcome: "+input.project.outcome,
    "Canonical goal revision: "+input.project.goalRevision,
    "Work Package: "+w.id+" | Output: "+w.output,
    "Owner: "+w.ownerRepository+" | exact HEAD: "+w.sourceRevision,
    "Canonical work revision: "+input.checkpoint.workRevision,
    "Observed capability gap: "+gap.missingCapability+" — "+gap.observedBlocker,
    "Allowed action ONLY: "+gap.allowedAction,
    "Files (no full repo scan): "+gap.files.join(", "),
    "Relevant logs/evidence: "+(gap.logs.join(" | ") || "none supplied"),
    "Budgets: max "+gap.budget.tokens+" tokens; "+gap.budget.minutes+
      " minutes; "+gap.budget.toolCalls+" calls; "+gap.budget.attempts+
      " distinct repair attempts; "+gap.files.length+" named files.",
    "QA: "+gap.qa,
    "Stop when: "+gap.stopCondition,
    "No speculative loops, redoing verified work, Production, merge, ratification, RU03 approval or false PASS.",
    "Return exact HEAD, observed tests, unresolved blockers and one product-first next action."
  ].join("\n");
  return {visible:true,reason:"CONFIRMED_CAPABILITY_GAP",executed:false,
    modeSwitched:false,options:[
      {kind:"CONTINUE_IN_CHAT",label:"Continue safe independent work in Chat",
        workId:fallback.workId,advisoryOnly:true},
      {kind:"PREPARE_WORK_HANDOFF",label:"Copy bounded Work handoff for manual execution",
        prompt,advisoryOnly:true}
    ]};
}

const EXECUTION_PREFLIGHT_CHECKS=[
  "effective-authority","product-goal-and-exit-criteria",
  "current-source-and-checkpoint","critical-path-and-dependencies",
  "blocking-defects-and-repair","relevant-quality-gates",
  "risk-human-and-capability-boundaries","durable-handoff"
];

/**
 * Advisory, fail-closed gate for the user-triggered "continuous execution"
 * handoff across existing, active and future projects. This is NOT a trusted
 * preflight verifier: callers must authenticate canonical readback and actor
 * authority at the server boundary, then re-check HEAD on actual user click.
 * No pure projection can certify that every unknown defect was fixed.
 */
export function assessContinuousExecutionPreflight(input, preflight) {
  const sourceErrors=validateGoalCheckpoint(input);
  if (sourceErrors.length) return {
    state:"UNVERIFIED",buttonAuthorized:false,canOfferAfterTrustedReadback:false,
    errors:sourceErrors
  };
  const c=input.checkpoint;
  const errors=[];
  if (!preflight || preflight.projectId!==input.project.id ||
      preflight.goalRevision!==c.goalRevision ||
      preflight.appHead!==c.appHead ||
      preflight.workRevision!==c.workRevision ||
      preflight.evidenceRevision!==c.evidenceRevision ||
      preflight.policyVersion!==c.policyVersion) {
    errors.push("preflight does not match current canonical checkpoint");
  }
  const steps=list(preflight?.checks);
  if (steps.length!==EXECUTION_PREFLIGHT_CHECKS.length ||
      !unique(steps.map(x=>x?.id)) ||
      !EXECUTION_PREFLIGHT_CHECKS.every(id=>steps.some(x=>x?.id===id))) {
    errors.push("missing or duplicate mandatory preflight checks");
  }
  for (const row of steps) {
    if (!row || !EXECUTION_PREFLIGHT_CHECKS.includes(row.id) ||
        row.state!=="EVIDENCE_COLLECTED" || !str(row.evidenceRef)) {
      errors.push("missing evidence for mandatory preflight step");
      break;
    }
  }
  if (!Array.isArray(preflight?.blockers) ||
      preflight.blockers.some(x=>!x||!str(x.id)||
        !["CRITICAL_PATH","INDEPENDENT"].includes(x.impact)||
        !["RESOLVED","OPEN"].includes(x.state)||
        !["ENGINEERING","CAPABILITY","HUMAN_AUTHORITY","SECURITY","EXTERNAL"].includes(x.kind)||
        !str(x.evidenceRef)) ||
      !unique(list(preflight?.blockers).map(x=>x.id))) {
    errors.push("blocker inventory missing or malformed");
  }
  if (errors.length) return {
    state:"PREFLIGHT_INCOMPLETE",buttonAuthorized:false,
    canOfferAfterTrustedReadback:false,errors
  };
  const unresolved=preflight.blockers.filter(x=>x.state==="OPEN");
  if (unresolved.some(x=>x.impact==="CRITICAL_PATH")) return {
    state:"BLOCKED_CRITICAL_PATH",buttonAuthorized:false,
    canOfferAfterTrustedReadback:false,errors:[],
    unresolved:unresolved.map(x=>x.id)
  };
  const advice=selectGoalAnchoredNextAction(input);
  if (advice.state!=="ACTIONABLE"||!advice.primary?.autonomous) return {
    state:"NO_SAFE_READY_WORK",buttonAuthorized:false,
    canOfferAfterTrustedReadback:false,errors:advice.errors??[],
    unresolved:advice.unresolved??[]
  };
  return {
    // Caller-provided evidence can satisfy a FORMAT gate ONLY.
    // Neither authenticated Project Authority nor a live UI is proved here.
    state:"PREFLIGHT_EVIDENCE_FORMAT_READY",
    buttonAuthorized:false,canOfferAfterTrustedReadback:true,
    requiresAuthenticatedSourceAndActor:true,
    requiresHeadRecheckAtClick:true,
    executesInBackground:false,
    primary:advice.primary,unresolvedIndependent:unresolved.map(x=>x.id),
    errors:[]
  };
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
