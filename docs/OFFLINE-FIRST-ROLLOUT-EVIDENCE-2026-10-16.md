# Offline-First Ecosystem Rollout — Evidence and Open Blockers

As of 2026-10-16. This is an **operational snapshot**, not an accepted release or automatic Constitution adoption.
Owner directive: **every app develops/runs offline/local-first, except Bơi Ếch (`BOIECH_AI`)**. Canonical rule: `control/development-runtime-policy.v1.json`; governed inventory: `control/constitution-governed-repositories.json` plus current admitted/pending entries.

## Publication containment already merged

| Repository | Evidence | What changed |
|---|---|---|
| Bauman-master-ai-system | [PR #362](https://github.com/BlueDragon33/Bauman-master-ai-system/pull/362) | Cloudflare Preview/Live/Production opt-in defaults false; `OFFLINE-QUICKSTART.md`; 5/5 CI PASS |
| NC03_Modem | [PR #61](https://github.com/BlueDragon33/NC03_Modem/pull/61) | Remove auto GitHub Pages; optional manual release, verified-site build remains |
| Math_Bauman | [PR #70](https://github.com/BlueDragon33/Math_Bauman/pull/70) | Remove on-push Pages; manual release opt-in |
| GrowUP_MyChildren | [PR #33](https://github.com/BlueDragon33/GrowUP_MyChildren/pull/33) | Remove on-push Pages; retain build artifact |
| MPC_PID_System | [PR #25](https://github.com/BlueDragon33/MPC_PID_System/pull/25) | Remove on-push Pages; opt-in publication only |
| PriceReport_Tunggiabao | [PR #131](https://github.com/BlueDragon33/PriceReport_Tunggiabao/pull/131) | Disable on-push production publish and Pages automation; preserve CI/test |
| RU_LIFE | [PR #32](https://github.com/BlueDragon33/RU_LIFE/pull/32) | Remove live on-push Cloudflare; Preview/Production default no publish |
| CAD_CAM_3D | [PR #15](https://github.com/BlueDragon33/CAD_CAM_3D/pull/15) | Disable CI-completion automatic Pages Production release |

**Important:** pre-existing Constitution compliance failure in NC03, Math, GrowUP, MPC, PriceReport, RU_LIFE and CAD is due to `policyVersion=1.2.0` in each repository's adoption manifest while central active policy is `1.3.0`. Those workflow containment merges were **not** a declaration that this governance issue passed, was waived, or that the app is production-ready. Queue governance adoption audits; do not alter the ratified source or fake compliance.

## Unresolved publication exposure / owner-visible blockers

- **Application-Management**: `.github/workflows/live-development-deploy.yml` still uses `push: main` and has Production environment dependencies; `bootstrap-managed-client-production.yml` and `deploy-application-management-production.yml` permit issue-comment initiated work. No verified change applied. **Needs a separate fail-closed workflow hold and actual local-stack tests.** Existing `npm run local:system`, `npm run local:doctor`, `npm run local:offline-smoke` commands exist but `.github/workflows/local-offline-smoke-ci.yml` only prints a notice; it does not prove offline behavior.
- **Health_Care**: `.github/workflows/live-development-deploy.yml` still uses `push: main`; no verified modification applied. Needs fail-closed live-deploy containment and a privacy-safe local runtime/storage plan before claiming offline usability.

Neither blocker may be marked resolved merely by central policy publication.

## No auto-publication workflow found in observed Actions listings

- Software-Blueprint-Hub (operational policy owner; local DB / auth must still be validated)
- ROS-1-2
- Hardware_Simulation
- pc-manager-desktop (desktop installer workflow; signed Production release manually dispatched)
- ECAD_Design
- CAE_Simulation
- Blueprint-Russian-Expert-Engine

A lack of auto-publication in the inspected workflow directory **does not prove offline runtime acceptance** or absence of deployment outside GitHub Actions.

## Explicit exception

**BlueDragon33/BOIECH_AI (Bơi Ếch)** is excluded from forced offline changes. Its existing online/deploy behavior was not modified under this work package.

## Offline acceptance still required per non-exempt app

- Local one-time installation/build, then network-disconnected cold start.
- Localhost / bundled assets only for core routes and user journeys; no mandatory central App Manager or public host.
- Correct offline state, optional third-party/AI adapters disabled or honestly unavailable.
- Save/restore persisted data while disconnected; encrypted sensitive data handled appropriately.
- Independent repeatable browser/desktop QA with evidence bound to exact SHA.
- Existing public deployments may still be online; do not silently delete them or confuse release containment with takedown.

Overall status: **PUBLICATION_CONTAINMENT_PARTIAL; OFFLINE_RUNTIME_AT_SCALE_UNVERIFIED; PRODUCTION_RELEASE_UNAUTHORIZED.**
