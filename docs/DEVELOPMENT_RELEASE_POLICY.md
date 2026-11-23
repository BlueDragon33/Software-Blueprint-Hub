# Shared Development / Release Policy

## Addendum 2026-11-23 — GitHub-primary delivery + practical offline-first capacity (all projects)

**Status:** operational Blueprint implementation guidance, **not** a constitutional amendment,
ratification, app compliance attestation, merge or release authority. Applies to every current
and future governed project, **including Bơi Ếch for the engineering workflow**. The
machine-readable source is the existing `control/development-runtime-policy.v1.json`
(`deliveryWorkflow` and `offlineFirstDesign`). This addendum does not change the
ACTIVE Constitution 1.3.0, any sealed registry or the canonical owner of app data.

### A. Work primarily in GitHub; minimize paid/remote execution and Owner interruptions

1. Read the active law, verified repository HEAD, existing work queue and risk constraints.
   Reuse the existing Draft PR/branch, source-of-truth, CI and issue ledger; no duplicate
   app, helper system, monitoring daemon or parallel approval queue just to run a task.
2. Complete code and documents on GitHub; run existing Actions for Node, TypeScript,
   contract/unit/security/integration/browser checks where available and free within quota.
   Investigate failed job logs, fix the smallest causal defect, retest **the new exact SHA**.
   Fast CI and a merge are neither full product QA nor publication.
3. Consolidate all remotely solvable issues first. **Do not switch reflexively to
   ChatGPT Work or request intermittent PowerShell commands.** Work is optional only
   for a task that GitHub cannot reasonably perform, and must use an authorized runtime.
4. Where Windows/physical devices are genuinely required (local drives, peripheral
   access, installer, device protocol, signing), prepare **one final bounded, idempotent
   PowerShell/Windows QA package** after GitHub work is complete. Document prerequisite
   paths, allowed changes, rollback, captured evidence and a single blocker on failure.
   Never ask the Owner to shuttle between GitHub and one-line shell snippets.
5. Freeze and check the release artifact SHA; use the **existing** protected
   project-specific publish path only following the Owner's explicit authorization and
   the applicable Quality Gates. A publish succeeds only with post-deploy readback.
   The non-exempt apps' existing offline-development publication hold remains in force
   unless the Owner explicitly opts a **named app/environment** into release.
   BOIECH_AI retains its previously authorized **direct-to-Production, manually gated**
   profile, not automatic push/merge publication.

### B. Offline-first is the preferred app experience, not a claim of completed offline QA

- Prefer **local processing, local assets, durable on-device data and an installable or
  cached app shell** for core workflows when practical (learning, drafting, calculation,
  simulation, personal records). A hosted website without a tested offline shell is
  **not** an offline-capable product.
- Remote identity, collaboration, device sync, secure owner approval and live data that
  intrinsically require a trusted server remain online boundaries. Do **not** emulate
  authoritative server approval offline or accept privileged mutations from a stale token.
- For offline writes, design a versioned local queue, idempotent sync, conflict
  detection, explicit resolution and recoverable migration/backup. Label states
  **local**, **pending sync**, **synced**, **conflict** or **offline unavailable**
  truthfully. Protect sensitive data, secrets and cached records according to risk;
  do not cache private information indiscriminately.
- Keep online AI, media, telemetry, indexing and other resource-intensive features as
  optional/on-demand adapters where the product purpose allows. Use network budgets,
  bounded backoff and explicit reconnection—not infinite polling, invisible retries or
  unrestricted background sync. Reducing server usage must be measured, not assumed.
- Acceptance must include a real **install/cold-start disconnected → core journey →
  local save/restart → reconnect/conflict handling** sequence at the candidate SHA,
  alongside normal browser/mobile/keyboard checks. Report online requests, retry
  behavior and measurable before/after network/load metrics when claiming reduced
  online load. Offline readiness remains **UNVERIFIED** without app-specific results.
- Existing `BOIECH_AI` online-operation exception is preserved. It is **not exempt**
  from GitHub-primary development, protected release and truthful offline capability
  declarations. Offline conversion of its current online product is a separate,
  evidence-gated app decision, not an automatic change under this addendum.

**Rollout:** treat this central policy as a shared *target* across the governed portfolio.
Audit each app's existing behavior and app-specific ownership before making changes.
The central control does **not** silently change every deployed app, activate
service workers, claim offline compliance, rewrite adoption manifests or publish sites.

## Default now: Offline-First Development — owner directive 2026-10-16

**Operational policy (not a new ratification of Universal Constitution 1.3.0).**
The canonical machine-readable policy is `control/development-runtime-policy.v1.json`.
The operational rule covers ALL registered and future applications, **except `BlueDragon33/BOIECH_AI` (Bơi Ếch)**, whose existing online handling is left unchanged.

- **The installed application must launch and perform its core functions without internet**, using local files, localhost services and local persistence appropriate to its architecture. An online-hosted website is not an offline app.
- `main` is a source-code branch, **not an instruction to publish**. Git pushes, successful CI, PR merges and release candidates must never automatically deploy a website, Worker, Pages site, backend or publicly reachable service.
- During this phase no online Preview, live development, Cloudflare, Vercel, GitHub Pages or Production **publication** occurs for non-exempt apps. Preserve remote release workflows in a manually gated dormant state for potential future activation, without deleting release capabilities.
- Downloading dependencies, obtaining source code or running remote CI may use internet at build time. **Offline-runtime tests must disconnect the app from internet after installing it**; distinguish build-time downloads from app runtime network dependencies.
- Core app navigation, learning or work data, drafts, input and saved progress must remain usable locally and survive restart. Local backups and recovery are required where relevant. Online AI services, speech backends, central authentication, cloud databases, updates and sync are optional adapters: label them honestly when unavailable and do not invent mock success.
- Application Management may list, organize and launch **local entry points** (localhost, loopback, desktop protocol, local package path) if the underlying platform permits. It must not force an online URL, remote approval, cloud DB or sync merely to open an offline application.
- App-specific offline packaging/readiness MUST be verified by actual runnable smoke tests. Until verified: `OFFLINE_READINESS=UNVERIFIED`, not PASS. No claim that all apps have become offline merely because this policy is published.
- Offline does not mean removing internal local security; preserve authorization for sensitive data and actions.
- **Bơi Ếch exception:** leave `BOIECH_AI` deployment mode untouched, not an implied permission to publish other apps.
- Existing deployed public URLs are not deleted or revoked by a GitHub workflow change. Decommissioning them is a distinct reviewed action, not implicit in this instruction.

## BOIECH_AI operational release profile — OWNER decision 2026-11-21

This paragraph is a **project-scoped release policy**, not an amendment or
waiver of the published Universal Constitution 1.3.0. It is recorded in
the constitutional authority repository to avoid later agents imposing a
nonexistent Preview requirement on this single-app Owner workflow.

- Applies **only** to `BlueDragon33/BOIECH_AI`; no other governed repository
  inherits it by default. Current canonical project policy:
  `BOIECH_AI/docs/DEVELOPMENT_RELEASE_POLICY.md`.
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
