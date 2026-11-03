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
    "VERIFIED_COMPLETE", "PARTIAL_BLOCKED",
    "PARTIAL_CAPABILITY_LIMIT", "PARTIAL_QA_UNVERIFIED"
  ]);
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
