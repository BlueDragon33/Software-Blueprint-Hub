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
test("destination lock distinguishes Worker, D1 and environment; unknown target cannot authorize writes", () => {
  assert.match(proposal, /PAE-15 — Canonical destination lock before execution/);
  for (const term of [
    /repository\/branch\/HEAD/,
    /Worker name, D1 database name\/binding/,
    /Preview vs Production/,
    /not interchangeable identifiers/,
    /before protected writes/,
    /cannot authorize a mutation/
  ]) assert.match(proposal, term);
  assert.match(impact, /UX-16:.*Worker.*D1.*environment/);
  assert.match(impact, /UX-19:.*never bypasses migration.*security.*Production authority/);
});
test("shortest safe path avoids detours without trading away validation or human gates", () => {
  assert.match(proposal, /PAE-16 — Shortest safe path/);
  for (const term of [
    /single minimum dependency path/,
    /Do not repeatedly re-plan/,
    /unless a concrete new failure/,
    /never impose arbitrary token quotas/,
    /one cheapest authorized recovery path/
  ]) assert.match(proposal, term);
  assert.match(impact, /UX-17:.*active critical path/);
  assert.match(impact, /UX-19:.*Quality Gates.*Production authority/);
});
test("detour incident retains real provenance, impact uncertainty and regression conditions", () => {
  assert.match(proposal, /PAE-17 — Detour incident and corrective evidence/);
  for (const term of [
    /intended target vs\. actual attempted target/,
    /authoritative source used to correct the mapping/,
    /NOT_MEASURED/,
    /targeted regression scenario/,
    /not proof of deployed changes/
  ]) assert.match(proposal, term);
  assert.match(impact, /UX-18:.*evidence-bound execution defect/);
  for (const id of ["UX-16", "UX-17", "UX-18", "UX-19"]) assert.ok(impact.includes(id), id);
});

test("review-edit-approve is a project-scoped task dispatch, not ratification or deployment", () => {
  assert.match(proposal, /PAE-18 — Review, edit and approve task dispatch/);
  for (const term of [
    "XEM NHIỆM VỤ TIẾP THEO",
    "DUYỆT & GỬI THỰC HIỆN",
    "complete editable dispatch text",
    "zero external side effects",
    "once into a new interactive conversation turn",
    "not constitutional ratification",
    "before each protected mutation"
  ]) assert.ok(proposal.toLowerCase().includes(term.toLowerCase()), term);
  for (const id of ["UX-20", "UX-21", "UX-22", "UX-23"]) assert.ok(impact.includes(id), id);
  assert.match(impact, /real desktop\/mobile interaction acceptance remains NOT_RUN/);
});

test("companion R34.C.10 contract pin is exact and remains unratified", () => {
  assert.ok(proposal.includes("blob/eb9d6ae29457e55f420833a04524f783d95ed1b5/control/chatgpt-next-action-hands-off.candidate.v1.json"));
  assert.match(proposal, /No mutation to active Universal Constitution 1\\.3\\.0/);
  assert.match(impact, /no independent reviewer signoff/);
  assert.match(impact, /no human ratification/);
});
