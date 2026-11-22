// Candidate-only static consistency checks. This is NOT a native ChatGPT host test.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const contract = JSON.parse(read("control/chatgpt-next-action-hands-off.candidate.v1.json"));
const amendment = read("docs/amendments/CONSTITUTION-CHAT-NEXT-ACTION-HANDS-OFF-REVIEW-2026-11-03.md");
const active = read("docs/UNIVERSAL-CONSTITUTION.md");

test("active policy is not silently ratified or replaced", () => {
  assert.match(active, /Policy version: \*\*1\.3\.0\*\*/);
  assert.equal(contract.status, "PROPOSED_REVIEW_ONLY");
  assert.equal(contract.authority.activeConstitution, "1.3.0");
  assert.equal(contract.authority.ratified, false);
  assert.equal(contract.authority.published, false);
  assert.equal(contract.authority.productionAuthorized, false);
  assert.match(amendment, /NOT_RATIFIED/);
});

test("ChatGPT NEXT ACTION is not a fabricated in-app or background executor", () => {
  assert.equal(contract.intent.surface, "ChatGPT conversation/agent");
  assert.equal(contract.intent.canGuaranteeBackgroundWork, false);
  assert.equal(contract.intent.canAutoChainChatTurns, false);
  assert.equal(contract.intent.canInstallNativePersistentChatGPTToolbar, false);
  assert.equal(contract.deployment.chatgptHostAdapter, "NOT_INTEGRATED");
  assert.match(amendment, /does not supply a persistent native ChatGPT button/);
});

test("hands-off contract continues eligible work and stops only at a legitimate boundary", () => {
  assert.equal(contract.continuation.doAllEligibleWorkBeforeHandoff, true);
  assert.equal(contract.continuation.blockedBranchDoesNotBlockIndependentReadyWork, true);
  assert.equal(contract.continuation.permissionAndRevisionRevalidationPerOperation, true);
  assert.equal(contract.continuation.requireHumanOnlyForNonDelegableDecisions, true);
  assert.equal(contract.continuation.noGenericSelfRestart, true);
  assert.deepEqual(contract.terminalStates, [
    "VERIFIED_COMPLETE", "PARTIAL_BLOCKED", "PARTIAL_CAPABILITY_LIMIT"
  ]);
  assert.ok(contract.blockerReasonCodes.includes("QA_EVIDENCE_MISSING"));
  assert.equal(contract.continuation.capabilityLimitIsNotHumanRatification, true);
  assert.equal(contract.continuation.userQuestionOnlyWhenDecisionIsNonDelegable, true);
});

test("all governed projects inherit policy only after real ratification and adoption evidence", () => {
  assert.equal(contract.applicability.scope, "all-existing-active-and-future-governed-projects");
  assert.equal(contract.applicability.requiresRatifiedAdoption, true);
  assert.equal(contract.deployment.portfolioAppsTracked, 18);
  assert.equal(contract.deployment.portfolioAppsAdopted, 0);
  assert.equal(contract.deployment.reviewStatus, "REVIEW_BLOCKED");
});

test("CTA never manufactures privileged authority", () => {
  const denied = contract.forbiddenImpliedActions;
  for (const action of ["human-approval","constitutional-ratification","merge",
    "deploy","production-release","repository-visibility-change",
    "spend-paid-host-capacity","write-neon-production"]) {
    assert.ok(denied.includes(action), action);
  }
  assert.equal(contract.deployment.independentHumanReview, "MISSING");
  assert.equal(contract.receiptFields.filter(x => x === "oneConcreteNextAction").length, 1);
});

test("R34.8 complete evidence binding and no circular repeat", () => {
  const actualGateFields = [
    "kind", "actionId", "targetTaskId", "projectId", "sourceRevision",
    "ownerType", "selectionReason", "expectedEvidence",
    "blockedBy", "requiresHuman", "previousActionId", "newEvidenceIds"
  ];
  for (const field of actualGateFields) assert.ok(contract.nextActionFields.includes(field), field);
  for (const field of ["blockedByIfPartial", "previousActionIdAndNewEvidenceIfRepeated"]) {
    assert.ok(contract.r34SemanticProofObligations.includes(field), field);
    assert.ok(!contract.nextActionFields.includes(field), "rubric-not-runtime-field:" + field);
  }
  assert.deepEqual(contract.nextActionConditionalFields.onRepeatedSameAction,
    ["previousActionId", "newEvidenceIds"]);
  assert.equal(contract.repeatActionPolicy.rejectSameUnresolvedActionWithoutNewEvidence, true);
  assert.equal(contract.repeatActionPolicy.priorActionReferenceRequired, true);
  assert.equal(contract.compatibility.r34NextActionRequiredProofsAligned, true);
  assert.equal(contract.compatibility.terminalOutcomeEnumAlignedWithR34, true);
  assert.equal(contract.compatibility.packetFieldNamesAreR34GateCompatible, true);
  assert.match(amendment, /R34\.8 evidence fields/);
});

test("active R7 and R15–R22 are not superseded by a host-surface proposal", () => {
  for (const rule of ["R7", "R15", "R16", "R17", "R18", "R19", "R20", "R21", "R22"]) {
    assert.match(active, new RegExp("\\*\\*" + rule + " —"), rule);
  }
  assert.equal(contract.compatibility.proposalMustReconcileBeforeRatification, true);
  assert.equal(contract.compatibility.noDuplicateConstitutionalAuthority, true);
  assert.match(amendment, /A standalone merge of #155 does not implement or ratify #153/);
  assert.match(amendment, /capability boundary.*not a human approval gate/);
});

test("Owner review is not offered before both technical reviewer lanes close", () => {
  const gate = contract.ownerAssessmentHandoff;
  assert.equal(gate.status, "NOT_READY");
  assert.equal(gate.ownerRequestBeforeReady, "PROHIBITED");
  assert.equal(gate.readyOnlyWhenAllRequiredGatesPass, true);
  for (const required of [
    "reviewer-A-technical-scope-closed",
    "reviewer-B-independent-identity-and-provenance-verified",
    "reviewer-B-exact-same-HEAD-source-readback",
    "reviewer-B-independent-technical-findings-resolved",
    "no-unresolved-blocking-findings",
    "all-mandatory-QA-and-security-acceptance-evidenced",
    "complete-owner-assessment-package"
  ]) assert.ok(gate.requiredGates.includes(required), required);
  assert.match(amendment, /R34\.C\.8 — Two technical reviewers finish before Owner assessment/);
});

test("Reviewer B is distinct and cannot impersonate human constitutional authority", () => {
  const gate = contract.ownerAssessmentHandoff;
  assert.equal(gate.roles.reviewerA.mayIssueIndependentApproval, false);
  assert.equal(gate.roles.reviewerB.mustBeDistinctFromImplementer, true);
  assert.equal(gate.roles.reviewerB.mayIssueConstitutionalRatification, false);
  assert.equal(gate.roles.owner.noAutomaticRatification, true);
  assert.equal(gate.lastVerifiedReviewers.reviewerB, "NOT_CONFIGURED_OR_NOT_PROVEN");
  assert.equal(gate.revalidation.ifReviewerBUnconfigured.includes("REVIEW_BLOCKED"), true);
  assert.equal(gate.revalidation.separateGitHubApprovalFromTechnicalReview, true);
  assert.equal(gate.revalidation.separateConstitutionalRatificationFromGithubReview, true);
});

test("A repair invalidates B prior revision; Owner packet remains unsubmitted", () => {
  const gate = contract.ownerAssessmentHandoff;
  assert.match(gate.revalidation.onEveryCodeChange, /Invalidate prior exact-HEAD technical reviews/);
  assert.equal(gate.noAutoSubmitToOwnerWithoutCurrentAuthority, true);
  assert.ok(gate.handoffPacketFields.includes("reviewerAIdentityAndTechnicalEvidence"));
  assert.ok(gate.handoffPacketFields.includes("reviewerBIdentityAndIndependentEvidence"));
  assert.ok(gate.handoffPacketFields.includes("exactHead"));
  assert.ok(gate.permittedOwnerDecision.includes("RETURN_FOR_CHANGES"));
  assert.match(amendment, /do not request premature Owner ratification/);
});

test("opening the action exposes a complete editable draft without execution", () => {
  const e = contract.promptInteraction;
  assert.ok(e, "editable prompt contract is required");
  assert.equal(e.onActivate, "OPEN_EDITABLE_DRAFT");
  assert.equal(e.primaryActionsPerProject, 1);
  for (const key of ["fullPromptVisible", "editableBeforeSend", "sendRequiresExplicitUserAction", "submitEditedTextExactlyOnce"]) assert.equal(e[key], true, key);
  for (const key of ["openingDraftTriggersExecution", "cancelledDraftHasSideEffects", "userEditsAreAuthorityGrants", "submissionMeansExecutionComplete"]) assert.equal(e[key], false, key);
  const executionClause = amendment.split("### R34.C.3")[1].split("### R34.C.4")[0];
  assert.match(executionClause, /On explicit Send, after draft submission:/);
  assert.doesNotMatch(executionClause, /On activation:/);
});
test("Send revalidates identity, scope, revision and real host capability", () => {
  const e = contract.promptInteraction;
  assert.ok(e);
  assert.deepEqual(e.revalidateOnSubmit, ["projectId", "repository", "sourceRevision", "acceptedGoal", "actorPermissions", "hostCapabilities"]);
  assert.equal(e.unsupportedHost, "HOST_UNSUPPORTED_NO_FAKE_SEND");
  assert.equal(contract.deployment.chatgptHostAdapter, "NOT_INTEGRATED");
});
test("A-Z is selected or inherited from an explicit bounded authorization", () => {
  const m = contract.executionModes;
  assert.ok(m, "scoped A-Z mode is required");
  assert.deepEqual(m.available, ["NEXT_STEP", "SCOPED_A_TO_Z"]);
  assert.equal(m.default, "INHERIT_EXPLICIT_PROJECT_AUTHORIZATION_ELSE_NEXT_STEP");
  assert.equal(m.aToZ.requiresUserSelectionOrExistingAuthorization, true);
  assert.equal(m.aToZ.maxScope, "accepted-goal-and-granted-operations");
  assert.equal(m.aToZ.continueAllIndependentReadyWork, true);
  assert.equal(m.aToZ.routineTechnicalConfirmations, false);
  assert.equal(m.aToZ.hardRetryCapInheritedFromR7, 3);
  assert.equal(m.aToZ.unattendedBackgroundByDefault, false);
  assert.equal(m.aToZ.completionRequiresApplicableEvidence, true);
  assert.equal(m.aToZ.protectedGatePolicy, "RETAIN_EXISTING_AUTHORITY_REQUIREMENTS");
});
test("shared A-Z template carries the current goal and evidence without claiming dispatch", () => {
  assert.equal(typeof contract.aToZPromptTemplate, "string");
  for (const f of ["projectName", "projectId", "repository", "sourceRevision", "acceptedGoal", "checkpoint", "grantedScope"]) assert.ok(contract.aToZPromptTemplate.includes(`{${f}}`), f);
  assert.match(contract.aToZPromptTemplate, /DONE.*READY.*BLOCKED/);
  assert.match(contract.aToZPromptTemplate, /ZERO-SPEND/);
  assert.match(contract.aToZPromptTemplate, /không tự phê duyệt/);
  assert.match(amendment, /R34\.C\.9 — Editable full prompt and scoped A-to-Z execution/);
  assert.match(amendment, /opening.*draft.*must not submit/i);
});

test("task preview, editable draft and explicit approval are separate from protected authority", () => {
  const r = contract.promptInteraction.reviewApproveDispatch;
  assert.deepEqual(r.sequence, ["PREVIEW_TASK", "EDIT_FULL_PROMPT", "EXPLICIT_APPROVE_AND_SEND", "DELIVERED_TO_INTERACTIVE_TURN", "EXECUTION_READBACK"]);
  assert.equal(r.visiblePreviewButton, "XEM_NHIEM_VU_TIEP_THEO");
  assert.equal(r.visibleApproveButton, "DUYET_VA_GUI_THUC_HIEN");
  assert.equal(r.previewAndEditHaveExternalSideEffects, false);
  assert.equal(r.fullDraftEditable, true);
  assert.equal(r.explicitApprovalRequiredBeforeDispatch, true);
  assert.equal(r.approvedPayload, "ACTUAL_USER_EDITED_TEXT");
  assert.equal(r.approvalScope, "TASK_DISPATCH_INTENT_ONLY");
  assert.equal(r.dispatchEffect, "SUBMIT_ONE_INTERACTIVE_CHAT_TURN_ONLY");
  assert.equal(r.submissionMeansCompletion, false);
  assert.equal(r.duplicateSubmitPreventionRequired, true);
  assert.equal(r.revalidateScopeAndVersionBeforeProtectedOperations, true);
  assert.equal(r.nativePermanentProjectButtonGuaranteed, false);
  assert.equal(r.hostAcceptance, "NOT_RUN");
  for (const gate of ["CONSTITUTION_RATIFICATION", "INDEPENDENT_REVIEW", "MERGE", "PRODUCTION_RELEASE", "DESTRUCTIVE_WRITE", "PAID_SPEND"]) assert.ok(r.approvalsThatRemainSeparate.includes(gate), gate);
  for (const f of ["projectId", "goal", "repository", "sourceRevision", "scope", "plannedActions", "requiredEvidence", "knownBlockers", "protectedGates"]) assert.ok(r.previewMustShow.includes(f), f);
  assert.match(amendment, /R34\.C\.10 — Review, edit and explicitly approve task dispatch/);
  assert.match(amendment, /DUYỆT & GỬI THỰC HIỆN/);
  assert.match(amendment, /task-dispatch instruction only/);
  assert.match(amendment, /not a persistent ChatGPT Project toolbar/);
});
