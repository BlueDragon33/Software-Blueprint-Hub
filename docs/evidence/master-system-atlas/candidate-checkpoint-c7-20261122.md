# C7 — Next Action canonical task intake and isolated QA
Date: 2026-11-22. Draft PR #173. HEAD before checkpoint: `f0b92a6fe7ba5eca02c649c28c8ce48bf158d5b4`.
Constitution ACTIVE 1.3.0 unchanged. ZERO-SPEND. No merge, ratification, release or paid resources.

## Completed in candidate branch
- Replaced browser-only `sessionStorage` handoff with a project-authenticated Server Action in the existing Prompt Workspace. It calls the existing `WorkQualityApplicationService.createWorkPackage`, which enforces `PROJECT_MUTATE` and validates the canonical `WorkPackage` contract. No new database tables, registries, role service or backend were introduced.
- Two streams remain: currently loaded Work Package (read from authenticated canonical project), optional addition or other task; a user review/approval step precedes submitting. After success, app opens existing Prompt Workspace.
- Additional tasks are stored as `PLANNED`, not READY/executed/PASS. Existing Prompt Workspace renders real canonical `work:next-*` work packages from server-backed repository, enabling cross-device visibility when authenticated backend is available.
- Deterministic `requestId` → Work Package ID, bounded source-revision check, scoped dependency resolution, idempotent retry/duplicate conflict, safe failure and planned-only status. This does not issue Agent execution authority.
- Retired the unverified browser-session-only draft inbox. Corrected the UI's false assumption that canonical Prompt source revision must be a 40-char Git SHA.

## Actual tests
- Node 22.16.0 `node --test`: 62/62 tests PASS, 0 fail, 0 skip, in isolated exact-source candidate reconstruction. Suite includes the existing 50 Atlas/ANA tests plus 12 new task-intake tests. TAP SHA256 `e6dd8315e579f88d4e2991c938a9388dd30e8108635b7f4ff3265900de362d07`.
- New module/blob `6345d191166c07e48ed078af8f34ffd8ac40f4a2`; declaration `54c9bb5c09336d7353259af3fe7835091785052f`; tests `27e464b6eae172bcf5d93137dac10d94f0c24a59`. Exact SHA matches GitHub.
- Server Action was independently TypeScript-parsed (0 syntax errors) and exercised in a locally mocked ESM VM: 7/7 PASS (create planned, idempotent replay, signed-in requirement, stale source, invalid input, no-op navigation, safe failed write). This is **mocked**, NOT an authenticated Postgres QA or real Server Action runtime test.
- Actual Next Action TSX source `622a5c67907f9655538d18a8005aa931da6fc7a1` was independently TypeScript/TSX-parsed (0 syntax diagnostics). No full app typecheck/build/Playwright QA.

## Material limits
- Runtime PostgreSQL transaction/concurrency, source-version atomicity and role/device checks are UNVERIFIED. The read-before-write freshness check is not a transaction-level CAS; the idempotency key/DB uniqueness reduces duplicate submissions but is not proof against all concurrent changes.
- No authenticated Codex/Agent runner or live event stream is connected. The Atlas live adapter is metadata-only, cannot invent running tasks, and no production SSE, checkpoint synchronization or replay UI is verified.
- Graph Intelligence Studio remains separate draft PR #166; actual combined build/route integration is UNVERIFIED.
- Windows earlier hung silently during an unbounded Git/network/installer step. Candidate script in this PR now has bounded subprocess timeouts, but the owner's previously downloaded script is unchanged and may need Ctrl+C locally.
- No further routine PowerShell requests; under ACTIVE R19–R22, only a consolidated native handoff at a genuine final capability boundary after other eligible work is completed.

## Next bounded engineering requirements
Reconcile #166/#161 with this real task-intake path without competing stores. Prove source-revision CAS/idempotency using authenticated disposable Postgres, run Next.js build/typecheck and mobile/desktop/role/browser tests, then integrate only a truly authorized Codex runner and observed live event transport. Reviewer A/B and human ratification/release gates remain separate. Status remains CODED_CANDIDATE / LOCAL_UNIT_QA_PASS / INTEGRATED_RUNTIME_UNVERIFIED.