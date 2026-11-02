# P2 signed PR identity v2 — canonical authority admission handoff (PROPOSAL ONLY)

**Status:** `BLOCKED / NOT_AUTHORIZED / NO_PRODUCTION` — 2026-11-02  
**Scope:** `BlueDragon33/Software-Blueprint-Hub` Draft PR #154 and private QA Worker Draft PR #5.  
**Policy:** Universal Constitution 1.3.0; independent professional review / Quality Gate / Production remain distinct.

This is an operator checklist and read-only evidence description, **not** a grant, approval,
migration instruction to run immediately, or permission to dispatch a private service.

## Read-only canonical observation

The connected Neon `software-blueprint-hub` production/default branch was inspected using
`SELECT` and `to_regclass` only. Evidence as observed, not permanent assumptions:

- Current authenticated GitHub connector: `BlueDragon33`.
- Its authenticated user subject matches the GitHub provider subject of the existing
  `SystemBootstrap` System Owner (identity mapping confirmed).
- **In-app authenticated session and `AuthorityService.require` are NOT verified.**
  The GitHub account/Neon ADMIN permission does not substitute for an in-app actor.
- `project:blueprint-os`: one ProjectProfile, zero WorkPackages, nine pre-existing
  QualityGates. Their existing PASS states are **not P2-specific acceptance**.
- `WorkflowExecutionIssuerDecision`, `WorkflowExecutionAdoptionDecision`, and
  `WorkflowExecutionClaim` are **absent** from the inspected production/default branch.
  The same tables have independently passed **disposable** PostgreSQL migration tests.
- Original P2 CI private three-service job is guarded to `workflow_dispatch`,
  `refs/heads/main`, correct GitHub repository, and Preview environment. Do not
  alter that guard or use a PR to claim real three-service success.

## Owner-controlled admission sequence (requires separate explicit authorization)

1. **Re-read state before any action.** Verify current project, main and PR SHA, database
   branch, authoritative profile record version, immutable issuer/adoption history,
   applicable policy version and open QA blockers. The exact SHA values in PR descriptions
   are snapshots and must never be treated as eternally current.
2. **Authenticate through the Hub.** Establish a real, current application session
   carrying an actor principal. Check `AuthorityService.require(actor,
   "project:blueprint-os", "PROJECT_MUTATE")`. A matching GitHub login alone is not a
   substitute for this check.
3. **Prepare a narrowly scoped Work Package.** Review acceptance criteria for
   read-only PR identity v2, immutable source SHA binding, authorized issuer,
   independent QA, journal readback, fail-closed replay/revocation, and
   `productionAuthorized:false`. Create only via
   `WorkQualityApplicationService.createWorkPackage` after owner approval; start in
   `planned` or `blocked`, **not** `completed` and not fabricated `ready`.
   Check every dependency through `validateWorkPackageDependencies`.
4. **Prepare new, P2-specific gate evidence.** Create required gate(s) via
   `WorkQualityApplicationService.createQualityGate` with `not-ready` or
   `candidate`. Do not reuse unrelated legacy PASS rows as P2 review approval.
   Only an independently authorized `PROJECT_REVIEW` actor may add evidence or
   decide a Quality Gate; CI green is not a professional human sign-off.
5. **Review production migration separately.** Existing official Prisma migrations
   already exercise append-only issuer/adoption decisions and atomic claim in
   disposable PostgreSQL. A migration on canonical/default/Production is a distinct,
   human-approved change subject to backup, compatibility and recovery review.
   Never run migrations through this Draft PR or with a generic Neon ADMIN token.
6. **Adopt the exact workflow and issuer independently.** After adoption is approved,
   use only `PostgresWorkflowExecutionAuthorityRepository.recordAdoption` and
   `recordIssuer` through the existing authenticated owner-controlled service.
   The issuer public key must have independent trusted provenance; private signing
   keys never go into Git, CI logs, Work Packages or PR comments.
7. **Reinspect without mutations.** Use
   `inspectCanonicalPrReviewPrerequisites` with the authenticated actor and the
   exact selected Work Package, gate references, workflow digest and issuer ID.
   `CANONICAL_PREREQUISITES_OBSERVED_ONLY` is **not** authority to start a job.
   Re-check issuer/adoption immediately before and after any eventual claim.
8. **Execute only a separately authorized read-only E2E.** Respect existing P2
   main-only/Preview job restrictions, exact pinned source and selected-repository
   GitHub App READ tokens, human approval and available budgets. If any precondition
   fails, retain `AUTHENTICATED_E2E=BLOCKED`; no fallback fixture issuer.

## Stop / rollback

- Failure or missing actor/profile/Work Package/gates/issuer/adoption/table/SHA:
  **BLOCK**, do not sign, journal-claim or launch the three-service job.
- PR code can be reverted by normal branch history without affecting main.
- Once canonical decisions or claims exist, they are append-only: reversal requires
  separately authenticated **revoke** records and a reviewed recovery process, not
  deletion or history rewriting.
- A migration to a live branch is **out of scope** here and needs its own approved
  recovery plan; this handoff does not authorize one.

**Current outcome:** Owner identity mapping observed; canonical admission incomplete.
No authenticated three-service E2E, no human PR approval, no Quality Gate PASS,
no merge, no ratification, no Production.
