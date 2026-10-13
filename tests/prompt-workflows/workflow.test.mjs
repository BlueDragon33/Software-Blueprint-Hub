import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderNodePromptCandidate, suggestDependencyEligibleNodes, validateWorkflow } from "../../scripts/prompt-workflow-lib.mjs";

const original = JSON.parse(readFileSync(new URL("../../prompt-workflows/projects/application-management.visa-recovery.v1.json", import.meta.url), "utf8"));
const clone = () => structuredClone(original);

test("project candidate validates, without treating candidate as approved", () => {
  assert.equal(original.status, "candidate");
  assert.deepEqual(validateWorkflow(original), { valid: true, errors: [] });
});

test("dependency candidate follows evidence-supplied ordering only", () => {
  assert.deepEqual(suggestDependencyEligibleNodes(original), ["inventory"]);
  assert.deepEqual(suggestDependencyEligibleNodes(original, ["inventory"]), ["reproduce"]);
  assert.throws(() => suggestDependencyEligibleNodes(original, ["invented"]), /Unknown completed node/);
});

test("missing dependency fails closed", () => {
  const workflow = clone();
  workflow.nodes[1].dependsOn = ["phantom"];
  const result = validateWorkflow(workflow);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("; "), /unknown dependency/);
});

test("cycle and self-dependency are rejected", () => {
  const workflow = clone();
  workflow.nodes[0].dependsOn = ["reproduce"];
  const result = validateWorkflow(workflow);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("; "), /cycle|self dependency/);
});

test("release always needs a separate human gate", () => {
  const workflow = clone();
  workflow.nodes.at(-1).humanGate = false;
  assert.match(validateWorkflow(workflow).errors.join("; "), /RELEASE always requires/);
});

test("infinite attempt budget and missing acceptance evidence are rejected", () => {
  const workflow = clone();
  workflow.nodes[0].budget.maxAttempts = 999;
  workflow.nodes[0].evidence = [];
  assert.equal(validateWorkflow(workflow).valid, false);
});

test("projection never invents a source revision or approval", () => {
  const context = { projectId: "project:application-management", repository: "BlueDragon33/Application-Management",
    appHead: "a".repeat(40), canonicalDigest: "sha256:" + "b".repeat(64), policyVersion: "1.3.0" };
  const rendered = renderNodePromptCandidate(original, "inventory", context);
  assert.match(rendered, /READ-ONLY PROJECTION CANDIDATE/);
  assert.match(rendered, /Application HEAD: a{40}/);
  assert.match(rendered, /No self-PASS/);
  assert.throws(() => renderNodePromptCandidate(original, "inventory", { ...context, appHead: "" }), /Missing or mismatched canonical context/);
  assert.throws(() => renderNodePromptCandidate(original, "inventory", { ...context, policyVersion: "1.2.0" }), /below minimum/);
});

test("raw secrets are not accepted in prompts", () => {
  const workflow = clone();
  workflow.nodes[0].goal = "sk-" + "X".repeat(36);
  assert.match(validateWorkflow(workflow).errors.join("; "), /raw credentials forbidden/);
});
