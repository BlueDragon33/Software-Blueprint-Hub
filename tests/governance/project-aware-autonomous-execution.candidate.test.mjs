// Candidate consistency only; no native host or interaction acceptance is claimed.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../../", import.meta.url);
const read = p => readFileSync(new URL(p, root), "utf8");
const proposal = read("docs/amendments/PROJECT-AWARE-AUTONOMOUS-EXECUTION-20261104-PROPOSAL.md");
const impact = read("docs/amendments/PROJECT-AWARE-AUTONOMOUS-EXECUTION-IMPACT-MIGRATION-20261104.md");
const audit = read("docs/amendments/PROJECT-AWARE-AUTONOMOUS-EXECUTION-PR156-INDEPENDENT-AUDIT-HANDOFF.md");
test("primary action opens the editable complete prompt before explicit Send", () => {
  assert.match(proposal, /PAE-13 — Editable full prompt/);
  assert.match(proposal, /OPEN_EDITABLE_DRAFT/);
  assert.match(proposal, /Opening.*must not submit/i);
  assert.match(proposal, /edited text/);
  assert.doesNotMatch(proposal, /affordance should submit the context-specific follow-up directly/);
});
test("A-Z inherits only explicit scope while protected authority remains separate", () => {
  assert.match(proposal, /PAE-14 — Scoped A-to-Z execution/);
  assert.match(proposal, /SCOPED_A_TO_Z/);
  assert.match(proposal, /existing explicit authorization/);
  assert.match(proposal, /R7/);
  assert.match(proposal, /No mutation to active Universal Constitution 1\.3\.0/);
  assert.match(proposal, /NOT RATIFIED/);
});
test("one companion contract is pinned without claiming main-branch adoption", () => {
  assert.match(proposal, /https:\/\/github\.com\/BlueDragon33\/Software-Blueprint-Hub\/blob\/[a-f0-9]{40}\/control\/chatgpt-next-action-hands-off\.candidate\.v1\.json/);
  assert.match(proposal, /companion Draft PR #155/);
  assert.match(proposal, /not an active main-branch dependency/);
});
test("acceptance covers edits, cancel, duplicate sends, stale context and bounded A-Z", () => {
  for (const id of ["UX-11", "UX-12", "UX-13", "UX-14", "UX-15"]) assert.ok(impact.includes(id), id);
  for (const term of [/actual edited text/, /cancel/, /duplicate/, /stale/]) assert.match(impact, term);
  assert.match(audit, /OWNER_REVIEW_NOT_READY/);
  assert.match(audit, /source change invalidates prior exact-HEAD review/i);
});
