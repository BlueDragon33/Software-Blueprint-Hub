# Shared Development / Release Policy

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
