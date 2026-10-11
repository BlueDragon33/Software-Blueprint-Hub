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
