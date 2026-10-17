import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateGoalContinuityCandidate,validateGoalCheckpoint,
  selectGoalAnchoredNextAction,buildBoundedWorkEscalation,
  assessContinuousExecutionPreflight
} from "../../scripts/product-goal-continuity.mjs";

const policy=JSON.parse(readFileSync(
  new URL("../../control/product-goal-continuity.candidate.v1.json",import.meta.url),"utf8"));
const SHA="a".repeat(40);
function task(id,kind="deliverable",extra={}) {
  return {id,goalId:"ios-widget-goal",kind,state:"ready",dependsOn:[],
    label:"Build concrete product "+id,actionId:"run-"+id,
    output:"Executable app or measurable result",
    ownerRepository:"Example/iOS-Product",sourceRevision:SHA,
    humanGate:false,safeAutonomous:true,priority:50,evidence:[],...extra};
}
function checkpoint() {
  return {
    project:{id:"project:ios-product",repository:"Example/iOS-Product",
      goalId:"ios-widget-goal",goalRevision:SHA,
      outcome:"Run a functional offline iOS vocabulary widget",
      acceptance:["App starts on physical iPhone","Lock screen changes approved entries","App-manager knows app"]},
    checkpoint:{projectId:"project:ios-product",goalId:"ios-widget-goal",
      goalRevision:SHA,appHead:SHA,workRevision:SHA,
      policyVersion:"1.3.0",evidenceRevision:"evidence-1"},
    sourceBinding:{kind:"canonical-snapshot-reference",projectId:"project:ios-product",
      repository:"Example/iOS-Product",goalRevision:SHA,appHead:SHA,
      workRevision:SHA,evidenceRevision:"evidence-1",
      repositoryHeads:{"Example/iOS-Product":SHA}},
    workItems:[task("build-widget"),
      task("review-ci","dependency-check",{state:"blocked",unblocks:["build-widget"],priority:100})]
  };
}
test("proposed universal contract validates but cannot claim ratification or deployment",()=>{
  assert.deepEqual(validateGoalContinuityCandidate(policy),[]);
  const x=structuredClone(policy);x.status="ACTIVE";assert(validateGoalContinuityCandidate(x).length);
  const y=structuredClone(policy);y.implementationState.realUiIntegrated=true;assert(validateGoalContinuityCandidate(y).length);
  const z=structuredClone(policy);z.nextAction.neverAssumeActionExecutedFromButton=false;assert(validateGoalContinuityCandidate(z).length);
  assert.equal(policy.implementationState.allAppPropagationVerified,false);
});
test("one primary real product deliverable outranks repetitive review status checks",()=>{
  const x=checkpoint();
  x.workItems[1].state="ready";
  const r=selectGoalAnchoredNextAction(x);
  assert.equal(r.state,"ACTIONABLE");
  assert.equal(r.primary.workId,"build-widget");
  assert.equal(r.primary.autonomous,true);
  assert.equal(r.executed,false);
  assert.equal(r.productionAuthorized,false);
});
test("human gated work is never autonomous even when priority highest",()=>{
  const x=checkpoint();
  x.workItems=[task("human-approval","review",{humanGate:true,safeAutonomous:false,priority:100,
    humanGateDetails:{reviewer:"Project Authority",action:"Review scoped package",
      reason:"Mandatory authenticated project decision"}})];
  const r=selectGoalAnchoredNextAction(x);
  assert.equal(r.state,"HUMAN_GATE");
  assert.equal(r.primary.autonomous,false);
  assert.equal(r.primary.requiresHuman,true);
});
test("previous identical external status check is suppressed when nothing changed",()=>{
  const x=checkpoint();
  x.workItems=[task("permission-check","dependency-check",
    {unblocks:["blocked-integration"],priority:90}),
    task("blocked-integration","deliverable",{state:"blocked"})];
  x.history={lastActionId:"run-permission-check",appHead:SHA,
    goalRevision:SHA,evidenceRevision:"evidence-1"};
  const r=selectGoalAnchoredNextAction(x);
  assert.equal(r.state,"STALE_CHECK_BLOCKED");
  assert.equal(r.primary,null);
  x.checkpoint.evidenceRevision="evidence-2";
  x.sourceBinding.evidenceRevision="evidence-2";
  assert.equal(selectGoalAnchoredNextAction(x).primary.workId,"permission-check");
});
test("different ready product work can continue past unrelated human gate",()=>{
  const x=checkpoint();
  x.workItems=[
    task("human-approval","review",{humanGate:true,safeAutonomous:false,
      humanGateDetails:{reviewer:"Project Authority",action:"Review accepted goal",
        reason:"Unverified human acceptance"}}),
    task("build-widget","deliverable")
  ];
  const r=selectGoalAnchoredNextAction(x);
  assert.equal(r.primary.workId,"build-widget");
  assert.equal(r.secondary[0].requiresHuman,true);
});
test("done without evidence cannot unlock dependent implementation",()=>{
  const x=checkpoint();
  x.workItems=[
    task("design","deliverable",{state:"done",evidence:[]}),
    task("implement","deliverable",{dependsOn:["design"]})
  ];
  assert.match(selectGoalAnchoredNextAction(x).errors.join(" "),/done without/);
  x.workItems[0].evidence=["github:Example/iOS-Product/commit/sha"];
  assert.equal(selectGoalAnchoredNextAction(x).primary.workId,"implement");
});
test("stale or incomplete goal cannot be replaced with progress theater",()=>{
  const x=checkpoint();delete x.project.acceptance;
  assert.equal(selectGoalAnchoredNextAction(x).state,"UNVERIFIED");
  const y=checkpoint();y.checkpoint.appHead="branch-main";
  assert.equal(selectGoalAnchoredNextAction(y).state,"UNVERIFIED");
  const z=checkpoint();z.workItems[0].goalId="other-project";
  assert.equal(selectGoalAnchoredNextAction(z).state,"UNVERIFIED");
});
test("duplicate IDs, missing dependencies and cycles fail closed",()=>{
  const x=checkpoint();x.workItems=[task("repeat"),task("repeat")];
  assert.match(validateGoalCheckpoint(x).join(" " ),/duplicate/);
  const y=checkpoint();y.workItems=[task("a","deliverable",{dependsOn:["b"]}),task("b","deliverable",{dependsOn:["a"]})];
  assert.match(validateGoalCheckpoint(y).join(" " ),/cyclic/);
  const z=checkpoint();z.workItems=[task("one","deliverable",{dependsOn:["missing"]})];
  assert.match(validateGoalCheckpoint(z).join(" "),/invalid item/);
});
test("no completed product claim from source code or closed work alone",()=>{
  const x=checkpoint();
  x.workItems=[task("app","deliverable",{state:"done",evidence:["github:example/commit/sha"]})];
  const r=selectGoalAnchoredNextAction(x);
  assert.equal(r.state,"EVIDENCE_COMPLETE_NOT_PRODUCT_CERTIFIED");
  assert.equal(r.primary,null);
});
test("bounded secondary actions do not claim one-click executor exists",()=>{
  const x=checkpoint();
  x.workItems=[task("job-a"),task("job-b"),task("job-c"),task("job-d")];
  const r=selectGoalAnchoredNextAction(x);
  assert.equal(r.secondary.length,2);
  assert.equal(r.executed,false);
});

test("source revision and delegated owners must match exact pinned snapshot",()=>{
  const x=checkpoint();x.workItems[0].sourceRevision="b".repeat(40);
  assert.equal(selectGoalAnchoredNextAction(x).state,"UNVERIFIED");
  const y=checkpoint();y.sourceBinding.appHead="b".repeat(40);
  assert.match(selectGoalAnchoredNextAction(y).errors.join(" "),/source revision binding/);
  const z=checkpoint();z.workItems[0].ownerRepository="Example/Other";
  assert.equal(selectGoalAnchoredNextAction(z).state,"UNVERIFIED");
  z.project.delegatedRepositories=["Example/Other"];
  z.sourceBinding.repositoryHeads["Example/Other"]=SHA;
  assert.equal(selectGoalAnchoredNextAction(z).primary.workId,"build-widget");
  const noSource=checkpoint();delete noSource.sourceBinding;
  assert.equal(selectGoalAnchoredNextAction(noSource).state,"UNVERIFIED");
});
test("duplicate action and stale review-only polling are not displayed as progress",()=>{
  const x=checkpoint();x.workItems=[task("one"),task("two")];
  x.workItems[1].actionId=x.workItems[0].actionId;
  assert.match(selectGoalAnchoredNextAction(x).errors.join(" "),/duplicate action/);
  const y=checkpoint();y.workItems=[task("review-progress","review",{statusOnly:true,
    humanGate:false,safeAutonomous:true})];
  y.history={lastActionId:"run-review-progress",appHead:SHA,goalRevision:SHA,
    evidenceRevision:"evidence-1"};
  assert.equal(selectGoalAnchoredNextAction(y).state,"STALE_CHECK_BLOCKED");
  assert.equal(selectGoalAnchoredNextAction(y).primary,null);
});
test("work escalation appears only for bounded real gap with independent Chat alternative",()=>{
  const x=checkpoint();
  x.workItems=[task("widget-build"),task("safe-chat-check")];
  const gap={kind:"CONFIRMED_CAPABILITY_GAP",workId:"widget-build",
    missingCapability:"macOS Xcode native signing",observedBlocker:"No macOS runner attached",
    allowedAction:"Compile isolated offline WidgetKit scheme on connected macOS runner",
    files:["App/Widget.swift","App/WidgetApp.swift"],
    logs:["GitHub SHA "+SHA],
    budget:{tokens:5000,minutes:20,toolCalls:8,attempts:1},
    qa:"Run xcodebuild for exact HEAD; report real simulator/device limits",
    stopCondition:"Native build log produced or runner unavailable"};
  // Product selector chooses widget-build, so safe alternative must not be the primary.
  // Supply Chat alternative as product-first READY item by making blocked work verification.
  x.workItems[0].kind="verification";
  const r=buildBoundedWorkEscalation(x,gap);
  assert.equal(r.visible,true);
  assert.equal(r.options.length,2);
  assert.equal(r.options[0].kind,"CONTINUE_IN_CHAT");
  assert.equal(r.options[1].kind,"PREPARE_WORK_HANDOFF");
  assert.match(r.options[1].prompt,/exact HEAD: a{40}/);
  assert.match(r.options[1].prompt,/max 5000 tokens/);
  assert.equal(r.modeSwitched,false);
  assert.equal(r.executed,false);
  assert.equal(buildBoundedWorkEscalation(x,{...gap,kind:"NO_GAP"}).visible,false);
  assert.equal(buildBoundedWorkEscalation(x,{...gap,files:["**/*"]}).visible,false);
  assert.equal(buildBoundedWorkEscalation(x,{...gap,budget:{...gap.budget,tokens:100000}}).visible,false);
  x.workItems=[task("widget-build")];x.workItems[0].kind="verification";
  assert.equal(buildBoundedWorkEscalation(x,gap).reason,"NO_INDEPENDENT_SAFE_CHAT_ACTION");
});
test("human gate must name reviewer, action and reason",()=>{
  const x=checkpoint();x.workItems=[task("sign-off","review",{
    humanGate:true,safeAutonomous:false})];
  assert.match(selectGoalAnchoredNextAction(x).errors.join(" "),/invalid item/);
});
test("work input fails closed instead of throwing on null entry",()=>{
  const x=checkpoint();x.workItems=[null];
  assert.equal(selectGoalAnchoredNextAction(x).state,"UNVERIFIED");
});

function continuousPreflight(x=checkpoint()){
  return {
    projectId:x.project.id,goalRevision:x.checkpoint.goalRevision,
    appHead:x.checkpoint.appHead,workRevision:x.checkpoint.workRevision,
    evidenceRevision:x.checkpoint.evidenceRevision,
    policyVersion:x.checkpoint.policyVersion,
    checks:policy.continuousExecution.requiredChecks.map(id=>({
      id,state:"EVIDENCE_COLLECTED",
      evidenceRef:"authenticated-source-readback/fixture/"+id
    })),
    blockers:[]
  };
}
test("universal preflight candidate covers past/current/future; remains non-authoritative",()=>{
  assert.deepEqual(policy.continuousExecution.scope,["existing","active","future"]);
  assert.deepEqual(validateGoalContinuityCandidate(policy),[]);
  const weakened=structuredClone(policy);
  weakened.continuousExecution.preflightRequiredBeforeContinuousAction=false;
  assert.match(validateGoalContinuityCandidate(weakened).join(" "),/unsafe continuous execution/);
  const missing=structuredClone(policy);
  missing.continuousExecution.requiredChecks.pop();
  assert.match(validateGoalContinuityCandidate(missing).join(" "),/universal preflight/);
  const inflated=structuredClone(policy);
  inflated.implementationState.realUiIntegrated=true;
  assert(validateGoalContinuityCandidate(inflated).length);
});
test("continuous button remains unauthorised even with complete client evidence format",()=>{
  const x=checkpoint(),p=continuousPreflight(x);
  const r=assessContinuousExecutionPreflight(x,p);
  assert.equal(r.state,"PREFLIGHT_EVIDENCE_FORMAT_READY");
  assert.equal(r.buttonAuthorized,false);
  assert.equal(r.canOfferAfterTrustedReadback,true);
  assert.equal(r.requiresAuthenticatedSourceAndActor,true);
  assert.equal(r.requiresHeadRecheckAtClick,true);
  assert.equal(r.executesInBackground,false);
});
test("missing, invented or stale preflight evidence fails closed",()=>{
  const x=checkpoint(),p=continuousPreflight(x);
  p.checks.pop();
  assert.equal(assessContinuousExecutionPreflight(x,p).state,"PREFLIGHT_INCOMPLETE");
  p.checks=continuousPreflight(x).checks;
  p.checks[0].evidenceRef="";
  assert.equal(assessContinuousExecutionPreflight(x,p).state,"PREFLIGHT_INCOMPLETE");
  p.checks=continuousPreflight(x).checks;
  p.appHead="b".repeat(40);
  assert.equal(assessContinuousExecutionPreflight(x,p).state,"PREFLIGHT_INCOMPLETE");
  const stale=checkpoint();
  stale.checkpoint.workRevision="c".repeat(40);
  assert.equal(assessContinuousExecutionPreflight(stale,continuousPreflight(x)).state,
    "UNVERIFIED");
});
test("critical-path blocker prevents button; unrelated honest blocker permits only independent READY slice",()=>{
  const x=checkpoint(),p=continuousPreflight(x);
  p.blockers=[{id:"ru03-human-review",impact:"CRITICAL_PATH",
    kind:"HUMAN_AUTHORITY",state:"OPEN",evidenceRef:"reviewers-empty"}];
  assert.equal(assessContinuousExecutionPreflight(x,p).state,"BLOCKED_CRITICAL_PATH");
  p.blockers[0].impact="INDEPENDENT";
  const r=assessContinuousExecutionPreflight(x,p);
  assert.equal(r.state,"PREFLIGHT_EVIDENCE_FORMAT_READY");
  assert.deepEqual(r.unresolvedIndependent,["ru03-human-review"]);
  assert.equal(r.buttonAuthorized,false);
  p.blockers[0].evidenceRef="";
  assert.equal(assessContinuousExecutionPreflight(x,p).state,"PREFLIGHT_INCOMPLETE");
});
test("no independent READY engineering task means no continuous button",()=>{
  const x=checkpoint();
  x.workItems=[task("review-owner","review",{
    humanGate:true,safeAutonomous:false,priority:100,
    humanGateDetails:{reviewer:"Project Authority",
      action:"Check real acceptance",reason:"Human-only gate"}})];
  const result=assessContinuousExecutionPreflight(x,continuousPreflight(x));
  assert.equal(result.state,"NO_SAFE_READY_WORK");
  assert.equal(result.canOfferAfterTrustedReadback,false);
});
