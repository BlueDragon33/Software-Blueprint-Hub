# C4 — Two-stream Intelligent Workspace handoff
Status: CODE_COMMITTED / EXACT_HEAD_QA_UNVERIFIED / NO_AGENT_DISPATCH
Date: 2026-11-22. Draft PR #173. Source commit: 75819e8e7f61b45a868221cfb85c913db1327a27.
Constitution ACTIVE 1.3.0; ZERO-SPEND; no merge, ratify or publish.

## Implemented
- Fixed literal escaped newline sequences that broke TSX syntax in `universal-next-action.candidate.tsx`.
- Overview Next Action opens two-stream review, with existing task and optional addition/other task, explicit consent, no execution on first click.
- Reviewed payload is saved to browser `sessionStorage` scoped by project ID, then navigates to authenticated existing Prompt Workspace.
- New `next-action-draft-inbox.candidate.tsx` reads and validates draft shape, shows two streams and source revision freshness warning, allows clearing draft. Wired into `prompt/page.tsx`.
- No secrets embedded in URL; no mutation to canonical Work, gate or evidence; no agent dispatch or invented checkpoint.

## Known limitations
1. Browser session storage is not durable cross-device storage and does not confer authority. Additional work is not yet saved server-side or scheduled. The two-step review is a handoff, not a real start-execution approval.
2. Canonical source revision may be a digest rather than Git SHA. Comparison is only advisory; server-side authorization and exact source pinning must occur before any mutation.
3. No exact-HEAD Node/TypeScript/build/Playwright or multi-device QA has run; local GitHub checkout was blocked by DNS. All runtime gates remain UNVERIFIED.
4. No verified runner exists in this branch; do not label a navigation as Agent execution.
5. Existing Graph Studio PR #166 is not merged; avoid claiming full UI integration.

## Next technical action
Use an authorized checkout/runner to run typecheck, build, tests and browser UX; fix concrete failures. Then implement a server-owned, authenticated, versioned task-intake API with idempotency, conflict detection, role/gate checks and checkpoint readback; only then enable actual Agent execution. Keep two streams and single primary CTA, without prompt-copy friction. No merge/ratification/publish.
