import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateGoalContinuityCandidate,validateGoalCheckpoint,
  selectGoalAnchoredNextAction
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
      goalRevision:SHA,appHead:SHA,policyVersion:"1.3.0",evidenceRevision:"evidence-1"},
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
  x.workItems=[task("human-approval","review",{humanGate:true,safeAutonomous:false,priority:100})];
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
  assert.equal(selectGoalAnchoredNextAction(x).primary.workId,"permission-check");
});
test("different ready product work can continue past unrelated human gate",()=>{
  const x=checkpoint();
  x.workItems=[
    task("human-approval","review",{humanGate:true,safeAutonomous:false}),
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
