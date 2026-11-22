# Compass canonical projection recovery

Goal: Home and Compass must agree with the existing revision-scoped acceptance receipt without granting new authority.

Spec: WORK MASTER PROMPT — BLUEPRINT OS FULL RECOVERY & COMPLETION, tasks 1–3 and 8.

Architecture: Reuse compassAcceptanceReceipt and the current review repository. One server loader supplies Home and Compass; the application projection takes canonical gate bundles and the deployed revision. No canonical writes, policy publication or database migration.

Constraints: active Constitution 1.2.0; Production remains on 6c86b059 until separate exact-revision release authority; missing/stale receipt must stay active; unauthorized readers retain the public baseline; database failures must not become cached LIVE success.

Review focus: signed-out/no-review authority; stale revision; PASS without linked artifact; approval/constitutional blockers; canonical outage.

## Task 1 — Projection and shared reader
- [x] Add regression tests for exact receipt completion, stale/missing evidence, missing approval, current-storey state and authority-filtered server reads; observe RED.
- [x] Extend getBlueprintCompassProjection with optional revision/gateBundles/constitutionAudit input, using existing preflight and receipt validation.
- [x] Extract Compass server reads into one loader; Home and Compass consume it; derive accepted current-storey state and present completed work accurately.
- [x] Run targeted tests, lint, typecheck, source-truth and full suite. Run CI full Release Gate on branch via existing [release-gate] trigger; do not change workflows.
- [x] Review exact diff, create PR, merge only on successful required checks, inspect main and Preview.

## Task 2 — Runtime and audit evidence
- [ ] Inspect existing Production/readiness and new Preview, preserving authentication and authority gates.
- [ ] Record deployment/SHA, CI jobs, outstanding migration ledger and integration/policy blockers. Do not declare overall completion if authenticated Preview journeys remain unavailable.

Ruling: Work in the fresh task-specific checkout on a recovery branch; do not create another repository or unnecessary worktree.
Ruling: Continue inline as explicitly authorized by the user; no plan approval pause.

## Follow-up — Final evidence provenance
- [x] Reproduce validator accepting skipped migration/lint checks and ambiguous duplicate jobs/steps.
- [x] Require every mandatory final workflow audit step exactly once and successful; preserve manual workflow and exact SHA checks.
- [x] Refresh review candidate to verified #99 merge SHA/artifact; preserve live Preview blockers and fresh human approval requirement.
- [ ] Review, supplemental full CI and merge the follow-up; inspect final main/Preview.

Database investigation: production has no migration ledger. Read-only comparison matched 178 columns and all 97 index/constraint definitions; Prisma migration status on a separate expiring branch is blocked by execution-environment DNS. No ledger or business-data writes were performed.

## Authenticated Preview follow-up

PR #100 merged as `2952ba75567162b496dc3d007ff260c9b55db6b8`. Main push38125574004 and manual Release Gate38125629118 passed with268 unit/integration tests and63 E2E, no skipped mandatory steps. Manual artifact11696812384 digest `sha256:6f4802c63f934fb3e13bfe06f44a2a258cc00b6f2ead516f7601d7d425d520df`.

The existing OAuth-configured `phase9/p9020-compass-acceptance` branch was fast-forwarded to that exact tested main revision, without changing secrets, callback or Production. Initial deployment failed before build (`git_info_fail`); one redeploy through the existing connection succeeded as Preview `dpl_aHQQHPxtkuFH99singFPdvhMKTGE`. Readiness confirms OAuth/database/schema present; existing authenticated System Owner session reads the canonical registry and current review candidate. This verifies session reuse, not a new OAuth handshake. Production remains `6c86b0596462bf3fbd2594e9788d42c9ebb5e557`.

Real Preview acceptance exposed two blockers: missing canonical `gate:operations:dependency-sovereignty` and missing approval for the refreshed candidate. Compass incorrectly displayed only the latter because its pre-approval branch returned the checked-in baseline before evaluating constitutional prerequisites.

- [x] Reproduce missing constitutional blocker and stale approval advancing P9-019 with two failing tests.
- [x] Evaluate canonical preflight before the approval branch; preserve public baseline and all authority boundaries.25 scoped tests, lint, typecheck, truth and boundaries pass.
- [ ] Full CI, independent review, merge and verify both blockers on the configured Preview.
- [ ] Collect valid dependency-sovereignty evidence through the governed Quality workflow; do not manufacture PASS or reuse old receipt.
- [ ] Human review and exact-revision P9-020 acceptance remain separate; no agent review approval or Production release.
