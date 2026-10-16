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

## Publication containment closed, offline runtime acceptance remains open

- **Application-Management**: Rechecked `main` on 2026-10-16 (observed SHA `126013134f13db5a51035162e789534fe9c15137`): Live no longer uses `push: main`; Live, Preview, Production and managed-runtime bootstrap are all explicitly `if: false` and automatic issue-comment production triggers are absent. **Publication hold: VERIFIED IN SOURCE.** The `npm run local:system`, `npm run local:doctor` and `npm run local:offline-smoke` scripts exist; the smoke script launches actual local sibling-app services, but `.github/workflows/local-offline-smoke-ci.yml` currently only prints a notice. **Disconnected-mode operational acceptance: NOT YET VERIFIED.**
- **Health_Care**: [PR #70](https://github.com/BlueDragon33/Health_Care/pull/70) merged at `345c958d530af47345be39e40a2f50b2df012b08`. Removed Live `push: main` and disabled all Health Preview/Live/Production deploy jobs with fail-closed job conditions. Dedicated Health Offline Deployment Boundary **PASS**; Health Fast CI **PASS**. Constitution Compliance **FAIL** on pre-existing `policyVersion=1.2.0` vs active `1.3.0`; no waiver claimed. **Publication hold: VERIFIED IN SOURCE; disconnected-mode sensitive-data runtime acceptance: NOT YET VERIFIED.**

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

Overall status: **OBSERVED_GITHUB_PUBLICATION_WORKFLOWS_CONTAINED_FOR_TRACKED_NON_EXEMPT_APPS; OFFLINE_RUNTIME_AT_SCALE_UNVERIFIED; PRODUCTION_RELEASE_UNAUTHORIZED.** This does not prove there are no other external deployment mechanisms.
