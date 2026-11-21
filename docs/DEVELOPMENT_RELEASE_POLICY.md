# Shared Development / Release Policy

## Development default: Offline-First; manual direct-Production release — Owner directives 2026-10-16 and 2026-11-21

**Operational policy proposal on this branch (NOT a new ratification or ACTIVE constitutional text).**
The canonical machine-readable policy is `control/development-runtime-policy.v1.json`.
Offline-runtime obligations cover registered and future applications except the existing `BlueDragon33/BOIECH_AI` (Bơi Ếch) exemption. The new **owner-only manual Production dispatch** release overlay below is intended for all governed applications, including Bơi Ếch; adoption remains per repository and requires existing release gates.

- **The installed application must launch and perform its core functions without internet**, using local files, localhost services and local persistence appropriate to its architecture. An online-hosted website is not an offline app.
- `main` is a source-code branch, **not an instruction to publish**. Git pushes, successful CI, PR merges and release candidates must never automatically deploy a website, Worker, Pages site, backend or publicly reachable service.
- Development remains offline-first and never auto-publishes. A completed, verified application may be released **directly to Production without a Preview deployment** only through the Owner's explicit per-revision PowerShell dispatch of a protected workflow; until that dispatch and all required gates, remote publication remains disabled. Preserve existing release workflows and infrastructure; do not activate blocked deployments by editing this document alone.
- Downloading dependencies, obtaining source code or running remote CI may use internet at build time. **Offline-runtime tests must disconnect the app from internet after installing it**; distinguish build-time downloads from app runtime network dependencies.
- Core app navigation, learning or work data, drafts, input and saved progress must remain usable locally and survive restart. Local backups and recovery are required where relevant. Online AI services, speech backends, central authentication, cloud databases, updates and sync are optional adapters: label them honestly when unavailable and do not invent mock success.
- Application Management may list, organize and launch **local entry points** (localhost, loopback, desktop protocol, local package path) if the underlying platform permits. It must not force an online URL, remote approval, cloud DB or sync merely to open an offline application.
- App-specific offline packaging/readiness MUST be verified by actual runnable smoke tests. Until verified: `OFFLINE_READINESS=UNVERIFIED`, not PASS. No claim that all apps have become offline merely because this policy is published.
- Offline does not mean removing internal local security; preserve authorization for sensitive data and actions.
- **Bơi Ếch exception:** preserve its existing offline-runtime exemption and project-specific release safeguards; the common manual-direct-Production rule below extends to other apps but does not authorize publishing any app by itself.
- Existing deployed public URLs are not deleted or revoked by a GitHub workflow change. Decommissioning them is a distinct reviewed action, not implicit in this instruction.

## BOIECH_AI operational release profile — OWNER decision 2026-11-21

This paragraph is a **project-scoped release policy**, not an amendment or
waiver of the published Universal Constitution 1.3.0. It is recorded in
the constitutional authority repository to avoid later agents imposing a
nonexistent Preview requirement on this single-app Owner workflow.

- This **project-specific** operating profile applies to `BlueDragon33/BOIECH_AI`; its implementation details do not propagate to other repositories. A separately approved **ecosystem-wide** manual-release preference is proposed below. Current canonical project policy: `BOIECH_AI/docs/DEVELOPMENT_RELEASE_POLICY.md`.
- Routine BOIECH_AI release is **direct-to-Production**; a separate Cloudflare
  Preview stage is **optional, not mandatory**, at the Owner's request.
- The mandatory path remains exact-SHA scope → CI/regressions/build/Constitution
  checks → reviewed persistent-data migration plan and rollback points →
  explicit manual protected Production dispatch → live revision and asset,
  session, authorization/data-scope smoke → real Owner post-deploy acceptance.
- Do not relabel missing signed E2E or human UX evidence as PASS. A direct
  production release can be DEPLOYED while post-deploy USER_ACCEPTED is still
  pending; any required pre-deploy high-consequence gate remains fail-closed.
- For non-recoverable D1/schema/identity changes or unknown risk, stop and
  obtain appropriate evidence; skipping Preview does **not** waive integrity,
  human review, security, data recovery or Production authority.
- Retain Cloudflare-only, ZERO-SPEND, existing runtime identities and database.
  No auto-release on merge/push, no cross-project release privilege.

This is compatible with Universal Constitution 1.3.0 §§ 3, 5–8 and R3/R5/R9/R20.
Do **not** edit the normative Constitution, machine contract, canonical template,
version marker or claim constitutional ratification solely for this decision.

## Owner release preference — DIRECT-PRODUCTION-OWNER-001 (decision 2026-11-21)

**Owner instruction:** Once a project is CODE COMPLETE **and the applicable exact-SHA
quality, security, identity, data migration and recovery gates are satisfied**, do
not require a separate online Preview promotion just for process ceremony.
Prepare the protected **Production** release immediately for the Owner to initiate
**in PowerShell**. This is a release-mode preference, **not** blanket Production
authority, constitutional ratification, a claim of user acceptance, or permission
for autonomous CI/Agent deployment.

- Scope: governed current and future projects, with per-repository adoption of
  actual workflow names, expected inputs, environment and rollback method.
- Workflow: code and scoped QA -> release candidate at approved immutable SHA ->
  readiness/read-only inspection as applicable -> **Owner PowerShell dispatch**
  of the protected Production workflow -> post-deploy live readback, smoke and
  rollback verification. **Preview is OPTIONAL**, invoked only by Owner request
  or when a real risk cannot be verified adequately using local/isolated QA.
- Preserve established **A/B independent review, mandatory human gates, security,
  accessibility, persistence, migration isolation, restore/rollback and exact-SHA
  approval**. A failed or missing required gate is BLOCKED/UNVERIFIED, never
  relabeled PASS because Preview was skipped. If risk is untestable, do not deploy.
- Never auto-deploy on push, PR merge, green CI, build completion or Agent output.
  The Owner's actual protected dispatch for a **named repository, environment
  and approved SHA** is the release action. No Agent may submit that dispatch,
  bypass the GitHub Environment, or infer it from this policy.
- Keep existing Preview resources/variables where needed for environment
  separation or security tests; removing **a Preview deployment stage** does
  not mean collapsing Preview and Production databases or identities.
- Every READY_FOR_OWNER_RELEASE handoff MUST show: repository, branch/ref,
  **40-character exact approved SHA**, environment and protected workflow name,
  copyable PowerShell command, exact GitHub Actions workflow **tracking page**,
  actual **run URL** when a run exists, Production URL if verified, and post-release
  smoke/rollback result or pending state. Do not invent a run ID or URL.

**Verified Application Management workflow example only** (not interchangeable
with workflows in other apps): after all applicable release gates PASS and the
approved SHA equals the SHA of the selected ref:

```powershell
$repo = 'BlueDragon33/Application-Management'
$workflow = 'deploy-application-management-production.yml'
$ref = 'main'
$approvedSha = '<EXACT_APPROVED_40_CHARACTER_SHA>'
$sourceSha = (gh api "repos/$repo/commits/$ref" --jq .sha).Trim()
if ($sourceSha -ne $approvedSha) { throw 'RELEASE_SHA_MISMATCH — do not deploy' }
gh workflow run $workflow -R $repo --ref $ref -f confirm=DEPLOY_PRODUCTION -f release_revision=$approvedSha
if ($LASTEXITCODE -ne 0) { throw 'PRODUCTION_DISPATCH_FAILED' }
gh run list -R $repo --workflow $workflow --branch $ref --event workflow_dispatch --limit 10 --json databaseId,headSha,createdAt,status,conclusion,url
```

**Workflow tracking page** (works even before a run exists):
https://github.com/BlueDragon33/Application-Management/actions/workflows/deploy-application-management-production.yml

After dispatch, identify the correct new run by exact SHA and dispatch time;
publish that run's unique GitHub Actions URL, then follow it using
`gh run watch <RUN_DATABASE_ID> -R BlueDragon33/Application-Management --exit-status`.
A dispatched/queued run is **not** a deployed release. Record explicit outcome.

This proposed preference does **not** change Constitution 1.3.0 ACTIVE or its
`productionReleaseAuthority: false`. A constitutional amendment, if required,
must go through the normal atomic authority-set and authenticated ratification
process; see `docs/amendments/CONSTITUTION-DIRECT-PRODUCTION-OWNER-20261121-PROPOSAL.md`.

### Non-exempt deployment release boundary

To resume online deployment in the future, the owner must explicitly request it **for a named application and environment**. The project must first prove offline correctness and then meet applicable security, data migration, quality, release and production gates. Mere workflow_dispatch, a green test or an environment secret is not publication approval.
Existing deployment workflows must be explicitly opted in at **both dispatch input and job gate** when technically possible, or remain disabled pending a reviewed reactivation PR. No background autopublish on push / CI completion.

### Offline acceptance checklist

1. Build/install a runnable local package or documented localhost stack (no external public host).
2. Turn off internet (or block external HTTP/DNS) and verify essential routes, forms, learning/simulation flows and assets.
3. Save and reload local data; validate migration, backup, restore and storage errors.
4. Verify offline status is truthful, no infinite network retry/spinner, no silent fallback to online.
5. Collect exact revision and test evidence for each repository; preserve `UNVERIFIED` for incomplete items.

## Application Management access switch

When this app participates in Application Management:

- **Approval/Managed ON**: use device/access approval and central management.
- **Approval/Managed OFF**: enter directly in standalone local-first mode.
- Development defaults to OFF unless explicitly switched on by the user.

## Human review runtime

Protected human review may run locally or in a non-Production Preview, but it must remain a real authenticated/persistent runtime.

- Follow `docs/P9-019-HUMAN-REVIEW-RUNBOOK.md`.
- Run `/professional-review/readiness` before Owner bootstrap; blocked configuration/database/schema checks must be resolved before human review.
- Never expose first-come-first-served Owner bootstrap.
- Configure the exact bootstrap provider + provider subject before exposing `/setup/owner`.
- Missing or mismatched bootstrap identity must fail closed.
- Localhost HTTP is supported for local-first review; non-local Production hosts retain secure Auth.js cookie handling.
- A P9-019 decision lives in canonical PostgreSQL state and must not be lost by destroying an ephemeral review database.
- Human review authority is not Production authority.

## Release Mode

Release Mode starts only when the owner explicitly requests a stable/production release.

At release time:

1. Freeze the release revision.
2. Switch access mode back to managed/secure where required.
3. Restore or manually run the heavy release gates.
4. Validate database/schema migrations and remote contracts that are part of the release.
5. Verify the exact release artifact.
6. Deploy using the protected Release/Production workflow.
7. Run post-deploy smoke/read-back checks.
8. Record the release revision/version.
9. Return to Offline-First Development Mode unless the owner explicitly authorizes otherwise.

The Release workflow must remain available even while Development Live Mode is the default.
