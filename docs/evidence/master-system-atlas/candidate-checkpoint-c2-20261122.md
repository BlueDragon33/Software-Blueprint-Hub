# MASTER ATLAS — C2 integration checkpoint (2026-11-22)
Status: CANDIDATE_CODE_COMMITTED / EXACT_HEAD_RUNTIME_QA_UNVERIFIED / UI_NOT_INTEGRATED.
Repo: BlueDragon33/Software-Blueprint-Hub, draft PR #173.
Last candidate code commit: 6cd2be5389e9fbe3f91f49352e0639acdcb3f231.
Observed main: 0d0d0bece3afa82aaf5792a64c0d4bab56dc9825.
Constitution ACTIVE 1.3.0 unchanged. ZERO-SPEND, no merge, ratification, deployment or paid actions.

## Concrete engineering
Read PR #166 exact source for `packages/application/src/graph-intelligence.ts`, `graph-intelligence-view.ts`, and `apps/web/src/server/graph-intelligence.ts`. Existing Graph Intelligence is an authenticated project-scoped read projection with no dispatch, gate mutation or release authority. Candidate adapter `packages/application/src/atlas-next-action-adapter.candidate.mjs` binds only an authenticated, exact-SHA-matched Atlas fixture and Next Action snapshot to that projection. It denies execution authority, missing source SHA, scope mismatch, invalid graph, invalid work frontier, and elevated Graph permissions. It does not mutate canonical state.

New tests: `tests/application/atlas-next-action-adapter.candidate.test.mjs` (8 declared cases). Existing Atlas tests: 14 declared cases. Existing Next Action tests: 5 declared cases. **Declared tests are not executed tests.** No exact-byte Node test PASS has been established in this checkpoint.

## Blocking evidence
GitHub API read/write connector was available and returned commit SHAs. Local shell Node v22.16.0 is present but `git ls-remote https://github.com/BlueDragon33/Software-Blueprint-Hub.git` failed `Could not resolve host: github.com`. Therefore exact-HEAD checkout, Node test run, JSON Schema/Ajv validation, full repo build, browser and cross-device UX tests are UNVERIFIED, not PASS. No GitHub Actions were launched.

## Immediate required sequence
1. In an authorized exact-HEAD checkout of PR #173, run `node --test tests/application/atlas-graph.candidate.test.mjs tests/application/universal-next-action-frontier.candidate.test.mjs tests/application/atlas-next-action-adapter.candidate.test.mjs` with captured exit code and pinned HEAD.
2. Compare candidate JSON Schema and validator using actual schema validation, including required fields, type compatibility, edge references, causality evidence, project scope, limits and dependency cycles. Resolve inconsistencies.
3. Integrate adapter into **existing** authenticated `loadGraphIntelligence` and Graph Studio UI on a branch that incorporates the verified PR #166 HEAD; do not assume #166 is in main. Never import candidate MJS directly into a production entrypoint without verified build/tests.
4. Deliver one actual UX slice with an actionable primary CTA, transparent host capability, mobile/touch/keyboard behavior, checkpoints, and true source/permission status. Only then evaluate G1–G7 with runtime evidence.
5. Maintain reviewer A/B and human approval gates independently.

## Priority rule: ANA-UNIVERSAL-001
A Next Action panel is a first-class deliverable and top-priority user experience, not an optional text appendix. It must show **one primary action**, accurate action semantics (send vs execute), current project/work ID, blocker only if real, last verified checkpoint and cross-device resume behavior where backend and host support exist. Never require repeated prompt copy or short-interval PowerShell readbacks when server-side work can continue. Do not claim host-tab control, background execution or account-wide state sync without a tested integration.

## Single active next action
Run exact-HEAD tests and schema consistency QA, then implement existing Graph Studio + Next Action UI vertical slice; continue all eligible work without routine approval interruptions, stop only for a genuine access or human-authority gate.
