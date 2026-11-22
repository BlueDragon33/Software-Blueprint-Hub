# C14 — Source-semantic UANA divergence, cross-app PR triage and authority stop

**Date:** 2026-11-22. **PUBLIC** evidence-only checkpoint on Hub Draft PR #173.  
**Observed PR #173 HEAD before this evidence commit:** `db9de1d656c29cce2cf1cdb5a06d94059999d0d1`. **main:** `4e9c30cd718dca5c4cd01eabaa1a728f63ed25d1`. **ACTIVE Constitution:** `1.3.0`.  
**No source/contract/runtime mutation, new ledger, extra backend, PR close, merge, ratification, publication or cross-repository scope elevation.** The compared original PRs are different historical base commits; file diffs and Git trees were inspected separately. Evidence is *not* a declaration of behavioral equivalence or universal QA PASS.

## 1. Actual HEAD and independent authority readback

- #173 remains OPEN/DRAFT/UNMERGED: `db9de1d656c29cce2cf1cdb5a06d94059999d0d1`.
- #147 `fd4913b016d2ccce898164f68274542d6e7e3bc4`; #151 `3a443128ffea06596cac83594f630d58dda1be82`; #152 `b06d93704b088319e1cc8b26161f0b4dc217858e`; #153 `a6af60976ffbed982661d776413e90ecc1cb35c6`; #161 `09fd24545a567ac2a892706857f63c84226e761c`, all OPEN/DRAFT, not merged.
- #166 `ca498220ee77e259cca8906622ff9432810288fb`, #168 `b94f7385bd7656167edad98fcf85ff4314acf4bc` remain separate OPEN/DRAFT.
- GitHub connected App installation count observed: **1**, no all-repo testing override; #173 and #166 had **0 GitHub PR submitted reviews**. This does *not* prove any private credential value absent, but does not establish the required independent A/B credential identity or eight protected bridge-case PASS.
- C13 QA is **pinned to the exact earlier code Git tree** `f303e9ac6ac90549b3a14adb3c1e24bf3688d3a2` on source #173 `244f6f5bf053fdf6cdc1f4538cdc7fc000663166` and QA-only commit `2a75c3099107bcd59a437b483a856f7324c417fd`. [Run](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45024916467) SUCCESS with Graph/Dual/ANA **28/28 Vitest**, **3/3 Chromium** plus isolated PostgreSQL/typecheck/build. This does not establish full no-skip Release Gate or all PR diff semantics.
- C13 subsequent documentation-only commit adds no app source behavior. Original CI provenance must remain pinned to the source tree, never reassigned to a documentation commit without tree comparison.

## 2. Five old Next Action / one current Hub PR: precise semantic classification

| Original PR | Inspected exact source difference | #173 correspondence | Decision |
|---|---|---|---|
| **#147** | `continuous-execution-offer.ts` requires a separately signed server-provisioned grant, workflow/manifest, `PROJECT_MUTATE`, adopted authority and canonical preflight before an execution *offer*. Also contains real-auth E2E and migrations. | #173 uses authenticated PROJECT_READ read-only readiness and PROJECT_MUTATE only for *PLANNED task creation*. No credential mint, real continuous runner or receipt. | **KEEP_SEPARATE_PROTECTED_AUTHORITY**; never copy grant logic into UI |
| **#151** | Universal offline-entry CTA on launcher and other discovery surfaces, two safe internal navigation links; explicitly `data-execution-authorized=false`. | #173 shows two controls **inside** authorized project Workspace, not the unauthenticated app directory. | **ENTRYPOINT_GAP**; decide owner UX intent before integrating launcher |
| **#152** | Dedicated Prisma `NextActionWorkBindingDecision` append-only ledger tying work record versions to adopted workflow SHA, strict issuer authority; additional repo and migration. | #173 reuses existing WorkQuality `createWorkPackage` and Prompt projection, no workflow-binding table or adopted runner. | **DISTINCT_WORKFLOW_BINDING_CONTRACT**; migration/security review required, no shadow DB |
| **#153** | One-click bounded read-only preflight and fixed `git-head/git-status/node-version` CMD allowlist, manual pasted-output is UNVERIFIED; includes R33/R34 proposed governance. | #173 only local navigation + server-authored PLANNED intake, not a shell/CMD executor or Work host. | **DISTINCT_CAPABILITY**; don't bring command-paste burden back without concrete user need |
| **#161** | `verifyUanaSourceForCopyAction` rechecks PROJECT_READ, current canonical digest, latest Prompt Projection ID/revision immediately before **clipboard copy**; generates an editable UANA copy panel. | #173 has no clipboard-copy UI; source revision rechecked for PLANNED write, but not equivalent to Prompt Projection copy freshness. | **FRESHNESS_GUARD_ONLY_IF_COPY_ADOPTED**; no fake parity |
| **#173** | Canonical Work/QualityGate projection; server action only creates PLANNED tasks via authorized WorkQuality service, page two-control navigation/detail UI; Graph + Dual source-only reference advisory candidate. | Primary integrated **Draft** candidate, **not** ChatGPT native toolbar, runner, or production release. | **KEEP_PRIMARY_DRAFT**; no merge until exact-tree release and independent identity |

**Security readback:** actual `WorkQualityApplicationService.createWorkPackage` performs `authority.require(actor,projectId,"PROJECT_MUTATE")`, and Prompt source digest includes the authorized project's profile, blueprint, WorkPackages and QualityGate evidence. However source verification and WorkPackage creation are distinct reads/writes; **no transactional exact-revision compare-and-swap admission proven**. A narrow server-side review/transaction test is still required for concurrent changing WorkPackages. Do not claim #152's workflow-binding or production concurrent write contract has been implemented in #173.

**Interpretation:** Five source-verified distinct legacy PR capabilities; zero are proven fully superseded by #173. #162 remains the **one code-equivalent 4/4** merged-in-draft source case from C13, yet needs authorized PR disposition.

## 3. Thirteen further application PRs classified from live public GitHub files / selected diffs

**Classification is per exact *candidate PR source*, not accepted Product state.** Different applications preserve their ownership, local databases, human/device and Production gates.

| Product PR (public) | Source-specific evidence | Disposition / prerequisite |
|---|---|---|
| Application Management **#414** `60e3b0c6fb37613bfb10648394f4cef31b389e34` | Only 2 changes: modernization plan + execution ledger, not shipped 21-step source. R0.2 instrumented QA blocked and 20/21 steps unfinished. | **ROADMAP_ONLY / BLOCKED R0.2**; no metrics invented |
| Application Management **#417** `92f7fbf6e3b1664d2431694fc5aeaef5b27df5c6` | 4 files. Extracts one-second clock into `OverviewClock`, separately checks `hasVerifiedAutomationSnapshot` freshness (<=120s) during save; real code and focused tests. | **CODE_CANDIDATE**; R1.1 performance improvement *not* measured p95/paint on real admin at pinned source |
| Application Management **#389** `868e275e605c6145a44bfc57480243b9a276a3bb` | 13 files. Explicitly returns `409 BOI_MANAGER_LEGACY_GRANT_SUPERSEDED` for old device-level grant only when single-review mode enabled. | **PERMISSION_MIGRATION_CANDIDATE**, dependent on canonical BOI account authority and cross-product consent |
| Bơi Ếch AI **#210** `f93e9a760e9a64959c16a2a88648e4ea0ad8bcd1` | 27 files. Training AI profile endpoint requires role/device, feature default OFF, bounded payload/version/consent, D1 schema enforces verified revision and consent. | **GATED_PRIVACY_FEATURE_CANDIDATE**, not activate or migrate on local CI alone |
| Bauman **#370** `e8fe52e1a113de354038be8023273431e994aa06` | 6 files. `nextWeakSelfReviewLine` now retires previous spoken attempt, cancels audio before changing active sentence, plus browser/offline regressions. | **BOUNDED_UI_AUDIO_FIX_CANDIDATE**, independent microphone/browser acceptance remains distinct |
| PC Manager **#53** `06ccb947748eeebd9666309ec82f1559c8a4a8d2` | 9 files; Windows CI pins real PR SHA, builds distinct older and new NSIS sources, inspects executable, rollback and upgrade evidence. | **WINDOWS_NATIVE_CANDIDATE**, not an Authenticode/physical-device Production PASS |
| RU_LIFE **#31** `aecc5848ccafa675825c89fa4f86cd9b4e4a467d` | 7 files; guarded SSO PKCE, short-lived signed HTTP-only cookies, one-time grants, preserves P-256 Device Gate and standalone flow; feature default OFF. | **SSO_OPT_IN_CANDIDATE**, real issuer/audience/managed origin + device acceptance required |
| RU_LIFE **#30** `b8e11f99a83ce2a539a55d6c3bc7c310397102` | 3 files; standalone Preview validation and actual artifact check; distinguishes deploy from skipped workflow. | **PREVIEW_WORKFLOW_REPAIR**, independent of #31 SSO and of Production |
| PriceReport **#133** `d6e910e6c0c7b0cdb1a395381f2be0d65eb7ca3d` | 10 files; D1 Worker **per-isolate** in-flight observer and fail-closed 503 on drain, local Wrangler persistence tests; explicitly no multi-isolate commit guarantee. | **LOCAL_D1_INSTRUMENTED_CANDIDATE**, not a global quiescence/release gate |
| MPC PID **#26** `a1d57b32aa994f5eecec23f9f5414e1e7bf50429` | 6 files; 1.3 source adoption candidate, preserves B3 local-core gates and `MIGRATION_REQUIRED`. | **CONSTITUTION_SOURCE_ADOPTION**, not product approval; main currently reports 1.2 manifest |
| CAD CAM **#16** `d661c4f1e9930e863c6c7eaa369d988df1406a19` | 8 files; B4 1.3 source adoption with independent offline/real-device gates. | **SOURCE_ADOPTION_WITH_LEVEL_CONFLICT**; sealed Hub registry B2 vs app B4 unresolved; no silent edit |
| NC03 Modem **#56** `049c705941310f2ce2c6c308229522886518e627` | 16 files; guarded write preflight/readback/rollback with device firmware constraints; recording lacks original HTTP 409 response body. | **REAL_HARDWARE_BLOCKED**; no unattended WRITE or fake firmware ACK |
| Math Bauman **#72** `2d96583f034ff3c61456d52a0ef550d2c371d248` | 7 files; late-loaded accessibility contrast stylesheet, light/dark and browser contrast regression. | **UI_CONTRAST_CANDIDATE**, requires actual computed color/viewport evidence and app-specific UX review |

**Counts:** exactly **13 public, application-level PRs** inspected in this wave: 3 APP, 1 BOI, 1 Bauman, 1 PC, 2 RU_LIFE, 1 PriceReport, 1 MPC, 1 CAD, 1 NC03, 1 Math. The set is a *sample of the 146 open PRs*, **not 13 fully accepted product WorkPackages or 13 merges**. All PRs remain untouched and have to be checked again on exact HEAD before owner-authorized disposition.

## 4. Real C13 source and regression reuse

No need to re-run the previously PASS source-labeled C13 group. The new C14 actions are only GitHub readback of source, changed-file lists and selected patches, plus this checkpoint; application source code has **not** been changed by this audit. Tests already PASS stay attributed to their own exact trees; user is not required to run CMD/PowerShell.

Original roadmap remains: 2 unfinished Hub Phase 9 WPs (P9-019 and P9-020), 5 unfinished Dual P3/P4 WPs, 20 unfinished App Management #414 steps. **27 is a lower bound over 3 heterogeneous ledgers**, not the full ecosystem unfinished WorkPackage count; **12 portfolio lanes** from C12, not 12 promised turns. A total future turn count remains UNVERIFIED.

## 5. Next safe dependency sequence

1. **Independent authority:** real two-App bridge on authorized protected host, 8 private bridge tests, independent B readback and revision-bound A/B acceptance. No impersonation. Until then PR #173 release remains BLOCKED.
2. **Only if approved by authentic authorities:** narrow end-to-end source/CAS acceptance on canonical WorkPackage PLANNED intake; exact latest code tree no-skip QA; P9-019 human review and P9-020 7-gate Compass receipt. Separate merge/Production thereafter, never implicit.
3. **Independent ready app tracks:** APP #414 R0.2 measured QA before #417 perf claims; BOI #210 privacy data-owner gates; RU_LIFE #30 Preview workflow independent of optional #31 SSO; Bauman audio real browser; PC native Windows; NC03 hardware; Math computed contrast; PriceReport isolated D1 only; CAD constitutional level reconciliation. These are distinct gates, not reasons to rerun Hub source tests.
4. **Portfolio reconciliation:** continue actual per-file semantic inspection, not title-based closure, of remaining public PRs; handle private-repo audit only within approved private workspace. Update existing Issue #159 and original owners rather than create a duplicate control plane.

**ONE STICKY BLOCKER FOR HUB RELEASE:** real independent reviewer/App credential authority (no qualified B review, only one connected App installation); all scoped candidate CI is separate from full Release Gate. **NO release/merge/constitutional amendment/Production approval claimed**.
