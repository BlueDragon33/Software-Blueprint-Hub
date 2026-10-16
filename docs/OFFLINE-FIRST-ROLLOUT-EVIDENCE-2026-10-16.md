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


## Direct adoption inventory readback — 2026-10-16

Scoped independent GitHub readback of 12 current project adoption manifests (not inferred from historical notes):

- **Still on Constitution 1.2.0, requiring project-specific evidence-backed 1.3 adoption:** `NC03_Modem` (B4), `Math_Bauman` (B2), `GrowUP_MyChildren` (B5), `MPC_PID_System` (B3), `PriceReport_Tunggiabao` (B3), `RU_LIFE` (B3), `CAD_CAM_3D` (B4), `ROS-1-2` (B3), `Hardware_Simulation` (B2). **Nine apps**, not presumed compliant, not granted waivers.
- **Manifest declares 1.3.0 (structure only, not Product PASS):** `ECAD_Design` (B2), `CAE_Simulation` (B2), `Blueprint-Russian-Expert-Engine` (B4).
- `Health_Care` was checked separately at merged main `316f1739ba16b947315dcdb24dffcfd51bd057aa` and now has a 1.3.0 manifest with source/crypto CI evidence; offline encrypted record persistence and human acceptance remain unverified.

Do not mass-replace version numbers. Each affected application requires scoped, actually tested dependency/feature gates appropriate to its Blueprint Level. Offline publish containment is independent from Constitution adoption and full disconnected runtime acceptance.

## Publication containment closed, offline runtime acceptance remains open

- **Application-Management**: [PR #359](https://github.com/BlueDragon33/Application-Management/pull/359) source-only MERGED at `126013134f13db5a51035162e789534fe9c15137`; Live, Preview, Production and managed-runtime bootstrap remain dormant with no push/comment auto-publish. [PR #361](https://github.com/BlueDragon33/Application-Management/pull/361) source-only MERGED at `93906a7fff0f3925139ab63dc01312e8d18caf17`. Its **real Docker `--network none` local cold-start** CI was SUCCESS at candidate exact HEAD `326bf82782e535116a7ea954374e89f08db2db87`, alongside Constitution and Development Fast CI. **Local HOME smoke: PASS with isolated network; full seven-app orchestration, real authentication, persistence/restore and Windows workstation acceptance: UNVERIFIED.** No claim that the user's machine has pulled or installed the app.
- **Health_Care**: [PR #70](https://github.com/BlueDragon33/Health_Care/pull/70) source-only MERGED at `345c958d530af47345be39e40a2f50b2df012b08`; public Live, Preview and Production workflow jobs held fail-closed. [PR #71](https://github.com/BlueDragon33/Health_Care/pull/71) source-only MERGED at `316f1739ba16b947315dcdb24dffcfd51bd057aa`, verified `main` now uses active Constitution `1.3.0` and preserves B5, seven inherited pillars, local sensitive data boundary, migration blockers and separate Production authority. **Exact-head CI 4/4 PASS** at `6c30cd18918ba163aa1ab553339ac6d88eb6d667`, including actual Docker `--network none` cold-start and health contract route. **Disconnected cold-start: scoped PASS; browser UX, encrypted record save/restart, Vault export/restore, independent clinical/privacy review, and final Product PASS: UNVERIFIED.** Earlier duplicate PR #69 was closed UNMERGED, superseded by #70 + #71.
  
These are evidence-bound **source/pipeline and partial disconnected-startup results**, not completion of the offline application acceptance checklist. Existing public URLs are not automatically removed; no Production authority has been granted.

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
