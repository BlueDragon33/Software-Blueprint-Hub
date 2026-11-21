# DIRECT-PRODUCTION-OWNER-001 — Release Flow Amendment Proposal

**Owner decision:** 2026-11-21 — direct Production release instead of a mandatory Preview
promotion, with the Owner personally initiating publication through PowerShell.
**Status:** CANDIDATE, NOT CONSTITUTIONALLY RATIFIED, NOT ACTIVE.
**Authority:** Software-Blueprint-Hub remains canonical; Constitution 1.3.0 ACTIVE
and `productionReleaseAuthority: false` remain unchanged.

## Proposed normative release rule

After implementation and independently required exact-SHA quality/security/data/
UX/recovery reviews are genuinely satisfied, an application may move to an
Owner-initiated **protected Production workflow without a mandatory online
Preview publication**. Preview remains optional and must not be reinstated as
a ceremonial universal phase. If a critical risk cannot be verified locally
or in isolated QA, block until genuine verification exists; no manufactured PASS.

The Owner's **per-release authenticated GitHub PowerShell workflow_dispatch**
requires a named repository, Production environment and immutable approved SHA;
only that dispatch may initiate publication. The Agent prepares the handoff and
must **not self-trigger Production**. Merge, CI, branch completion, or this
proposal do not themselves confer deployment authority. Existing independent
A/B, mandatory human review, constitution adoption, secrets, D1 isolation,
backup/restore, rollback, release/observability and post-deploy checks remain.

Every release response must include the command, exact SHA, a link to its
Actions workflow for tracking, the actual run URL once GitHub has created it,
the verified Production URL if available, and the observed post-deploy status.
No invented run URLs, arbitrary run identifiers or green badges.

## Compatibility and non-goals

- Proposed operational configuration: `control/development-runtime-policy.v1.json`.
  Canonical explanatory policy: `docs/DEVELOPMENT_RELEASE_POLICY.md`.
- Preserve existing offline-first runtime expectations. Skipping online Preview
  does not authorize Development auto-publish or Preview/Production DB merging.
- Preserve existing Production workflow identity, authorization, exact-SHA
  condition and environment protection. App-specific migration is required
  where current workflows genuinely depend on Preview deployment artifacts.
- One-person usage is a workflow preference, **not** evidence that sensitive
  applications contain only one identity or that other user's data is absent.
- ZERO-SPEND; no new GitHub site, repo, provider, paid service or domain.

## Acceptance and rollout

1. Verify 1.3.0 ACTIVE and check proposed text against R3/R9/R19/R20,
   governance authority, seven pillars and current release safety.
2. Check per-repo workflow dispatch fields, branch/ref and immutable SHA gates;
   preserve independent tests, secrets, databases and restore mechanisms.
3. Demonstrate QA path that does **not** publish a Preview URL; negative tests
   must reject bad SHA, unauthorized actor and failed mandatory gates.
4. Confirm a PowerShell-ready release handoff with the workflow tracking URL
   before dispatch and an actual matching run URL after dispatch.
5. For constitutional promotion, use authenticated Owner ratification, review
   and atomic update of the entire constitution authority set. Until then
   this proposal is NOT the effective universal constitutional law.
6. Do not merge/publish software or modify any Production workflow/data
   merely because this preference was recorded.
