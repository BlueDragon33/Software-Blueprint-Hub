# Active Next Action Chat v2 — UX regression and scoped merge checkpoint

Date: 2026-11-22.
Baseline: ACTIVE `blueprint-os:universal-century-grade@1.3.0`, main `0d0d0bece3afa82aaf5792a64c0d4bab56dc9825`.
Draft: `ACTIVE-NEXT-ACTION-CHAT-001`, PR #174.

## Owner UX report
The owner supplied a screenshot of the **assistant conversation** showing only a single large `Tiếp tục A–Z từ checkpoint mới` button and no visible secondary advanced-plan/supplement affordance. This is **REAL USER-REPORTED UX DEFECT**, not proof of a permanent ChatGPT-host code regression, and it cannot be resolved merely by merging repository files. Conversation UI elements are created by host rendering for this answer, not installed from GitHub. In this candidate, a supported host should show a compact source-grounded status summary **plus two visible controls** (primary continue, optional advanced); a primary-only screenshot **does not pass** the v2 UX acceptance condition.

## Scoped candidate correction
- NAI-03: visible secondary control, factual compact status panel, no mandatory checkbox.
- `docs/UANA-CHATGPT-PROJECT-INSTRUCTIONS.v2.md`: explicit two-control UX and degrade-honestly fallback.
- `control/candidates/active-next-action-chat-ui.v2.json`: versioned `presentation` invariants.
- `tests/governance/active-next-action-chat-ui.candidate.test.mjs`: 15 cases including prevention of primary-only regression, stale/unknown status and no false execution.
- NAI-01..NAI-12, R15–R22 and boundary rules remain proposal-only.

## Tests with honest scope
Exact GitHub blob contents of test + contract + proposed law + v2 guidance + ACTIVE 1.3 law + version manifest were fetched and executed with an isolated V8 harness that shims synchronous Node `test`, `assert`, `readFileSync` and `URL` for the candidate's pure assertions.
Results: **15/15 PASS**, 0 FAIL, after correcting one *test's* case-sensitive wording mismatch; this is a **V8-shim source consistency result**, **NOT** a real Node24 job, browser UX, independent A/B, release gate or constitutional ratification.
Git blob of tested file: `163f9cd8c020a6c017261a47bf272315a0475b06`.
A prior V8 pass 12/12 covered the initial draft; the latest 15/15 is the current candidate scope.

## Owner authorization and constitutional separation
The owner explicitly instructed "merge và publish" in ChatGPT and asserted final owner approval. This confirms intent to proceed with authorized engineering work, **not** an authenticated append-only constitutional ratification, because the governing protocol explicitly excludes chat text from ratification evidence.

**Allowed separately:** GitHub may merge this documentation-only **PROPOSED_ONLY candidate** into main if authorized and source scope verified, with no claim of a newly ACTIVE law. This is not a constitutional `PUBLISHED` transition.

**Still blocked:** writing a new ACTIVE law or machine contract version; marking canonical ratification; production deployment or native ChatGPT UI installation; asserting REAL_UX PASS. Those require their respective controls.

## Next boundary
After proposal merge (if authorized), use the existing constitutional application to create an authenticated ratification decision **against an exact final proposal and evidence set**, complete real host UX and independent review, coordinate pending PR #171 target version, then atomically update normative/document/contract/template/version manifests. Do not regenerate the same PR or ask for repeated Windows commands. User interaction should be limited to the actual nondelegable authenticated gate, not routine progress requests.
