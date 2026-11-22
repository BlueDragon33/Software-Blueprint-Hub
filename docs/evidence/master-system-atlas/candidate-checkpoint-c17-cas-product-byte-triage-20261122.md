# C17 — Canonical CAS design boundary, verified cross-PR byte overlaps and scoped product repair

**Observation:** 2026-11-22. **LIVE AUTHORITY:** Hub main `control/universal-constitution-version.json` blob `aa7986feeb6027fa52b88751a078c2ba5e8cd0fa`: Constitution **1.3.0 ACTIVE**, `productionReleaseAuthority=false`. Hub Draft #173 **PRE-CHECKPOINT HEAD** `be27a8a82fda505e6f843c5e86d0cb80d6b95e28`, OPEN/DRAFT; zero submitted independent reviews. This checkpoint is evidence-only, written into the **existing #173 Draft and central Issue #159**; it is **not** a second WorkPackage ledger, approval, ratification, or release.

## 1. CAS source-root finding and implementation boundary

C15's [real disposable PostgreSQL QA #45028913970](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45028913970) reported 8/8 tests SUCCESS at source tree `04d90339e35eedaffec72b4992e5d3b5cc2fc7f5`. One explicitly demonstrates **two different Next Action requests based on the same original canonical Prompt source revision both commit distinct PLANNED records**. This is **C15-ANA-CAS-01 OPEN, security requirement NOT_ACCEPTED**. It does **not** mean 8/8 proof of project-wide CAS.

Additional exact Git source reads:
- `apps/web/app/projects/[projectId]/prompt/actions.ts` blob `46c4330e831140c65f577d5891820998e1942393`: the action obtains `currentSourceRevisionFromProfile` + work list *before* calling `WorkQualityApplicationService.createWorkPackage`.
- `packages/application/src/prompt-projection.ts` blob `67c38fd2d1c1821a596d6bedfe7350f1e5cc4f0a`: source revision hashes canonical **Profile, ResolvedBlueprint, template versions, all WorkPackages, QualityGates and GateEvidence**; `collectSource` uses separate read operations.
- `packages/application/src/work-quality-service.ts` blob `e772eb03da1f348c159fceb5d67b292327247fc0`: `PROJECT_MUTATE` is enforced and dependencies checked before repository creation, but there is no project-wide transactional source revision condition.
- `packages/persistence/src/work-quality-repository.ts` blob `6ecb0c8602d80c157f408cf99312a1b3b3647852`: unique WorkPackage ID on create, per-record `recordVersion` CAS on update.
- `packages/persistence/prisma/schema.prisma` blob `1bfcf231d1308e17239d6217c8b31347d4aa6049`: existing `Project`, `ProjectProfile`, `WorkPackage`, `QualityGate`, `GateEvidence` tables. **No extra ledger or schema proposed in this checkpoint.**

**Implementation-ready design constraints, NOT IMPLEMENTED OR APPROVED AS A TRANSACTIONAL FIX:** align the *existing* canonical source collectors and writers behind one authenticated per-project atomic admission operation. Concurrent callers cannot rely on ID uniqueness or a second unprotected source reread. Select/verify one transaction coordination mechanism in the current PostgreSQL ownership (e.g., project row locks plus writer participation and carefully isolated source snapshot, or an explicitly authorized shared revision protocol); include **every existing writer** affecting Profile/Blueprint/Work/Gate/Evidence, not just the Next Action route. Re-evaluate authority inside the trust boundary, preserve existing WorkQuality service validation, only commit `PLANNED`, return stale/conflict to UI, no side effects on rejection. A lock acquired only by Next Action while other writers ignore it is **not a global CAS guarantee**. Do not introduce schema or change production data without a separately authorized bounded implementation plan and read-only conflict review of #152.

**Required real QA after implementation:** (1) two distinct request IDs same source -> one commit + one stale; (2) 8-way same ID idempotent replay; (3) same ID different contents conflict; (4) Profile update racing intake -> stale; (5) Gate/evidence mutation racing intake -> stale; (6) WorkPackage record update racing intake -> stale; (7) other project can progress independently; (8) failed/timeout transaction leaves no partial WorkPackage and never changes a Gate. Include real OWNER/EDITOR/VIEWER/REVIEWER authority and revocation readback at exact source SHA. These are **planned acceptance criteria, 0/8 new atomic QA executed**.

## 2. One real scoped product code/test repair: APP #341

[APP PR #341](https://github.com/BlueDragon33/Application-Management/pull/341) originally HEAD `fdfc90f2c897a97aeb14e05628a077bd50b81e8c`. [Development CI #38562339141](https://github.com/BlueDragon33/Application-Management/actions/runs/38562339141) had **713 PASS, 3 FAIL** (tests 356, 357, 385), with failed static assertions tied to old 2-form implementation / incorrectly targeting a Telex expression in admin `tool` instead of the actual standalone public worker.

Exact source readback independently confirmed:
- Admin persists distinct `student/general/electronic` `formType`, with student-only defaults;
- Tool `createIntakeLink`: Link 3 selects electronic academic visa parameters while leaving *Link 1 Telex, organization, issue/expiry dates* unseeded; Link 1 is still student-specific;
- Public API electronic requires invitation number, issuing authority and inviting organization;
- Standalone Worker uses `const d = student ? withStudentFallbacks(rawDefaults) : rawDefaults`, renders electronic-required invitation fields, and Telex is required only for student.

**Actual branch repair already committed**: `64be03adc91b7274fa4ad00862116127ec90edb6` on existing #341 branch, modifies **only `tests/kd-mid-visa-intake.test.mjs`** from blob `4f90ec8ad33370bc947f5fcf30061ec6f1434d2d` to `77a15c7585400a14ddb1b828e2609d734d6555ab`. Replaced three stale assertions with checked three-form selection, unseeded Link 3 student-only fields and actual worker Telex/required-field handling. Verified exact blob by GitHub readback; 8/8 selected source-matching predicates checked before commit. **New GitHub CI run not observed at checkpoint**; status `CODE_PATCHED_SOURCE_READBACK_ONLY`, not "3 tests PASS" and not Product QA/merge approval. No Production, D1, API or user records modified.

## 3. Fifteen additional PUBLIC application PRs: actual HEAD, filenames and one selected source patch each

This wave adds **15 distinct public product PRs** not in C14 (13), C15 (9), or C16 (5), for **42 distinct public application PRs receiving first-pass file-list + focused actual patch review**. This is not 42 complete semantic audits or QA acceptances. No private repo code/name disclosed below.

| Public PR | Exact HEAD observed | Source-backed scope; disposition and required gate |
|---|---|---|
| APP [#360](https://github.com/BlueDragon33/Application-Management/pull/360) | `5ead88f03b709aa093140f7513551b8b5c64949a` | 92 files, local ops cold pull checks canonical workspace and 12-port idle state before each ff-only update; cross-process barrier expressly best effort, runtime Docker/Windows and live D1 unverified. **KEEP_LOCAL_OPS_RUNTIME_GATE** |
| APP [#371](https://github.com/BlueDragon33/Application-Management/pull/371) | `9ea0d4ac85f00dfc47198d4cadcf2f9edbdaf6ca` | 5 files, RSA-OAEP/AES-256-GCM owner-encrypted production snapshot path and local restore; five historic CI runs SUCCESS at exact SHA but no actual Production export/restore approval. **KEEP_RECOVERY_DEPENDENCY** |
| APP [#376](https://github.com/BlueDragon33/Application-Management/pull/376) | `13840deaf3ba5dc8ed3e09af5134c2b12fa763f2` | 24 files, allowlisted GitHub metadata-only Blueprint Compass, authenticated read, no evidence signing or production publish. Isolated local smoke is not live GitHub adapter acceptance. **READ_ONLY_TOOL_CANDIDATE** |
| APP [#403](https://github.com/BlueDragon33/Application-Management/pull/403) | `3fae324a2eea055f927648cb9700b9cda3e334f5` | 8 files, protected roster cleanup/owner renewal; exact three account identifiers are sensitive and intentionally **not reproduced**. Real destructive data-owner approval + safe restore/role gates mandatory. **HIGH_IMPACT_OWNER_GATE** |
| APP [#377](https://github.com/BlueDragon33/Application-Management/pull/377) | `da5d3049bc39f85410d6762c19be894991720e69` | 8 files, separates P-256 proofDeviceId from selected manager's target; prior deployment is a PR description claim, not current live runtime readback. **KEEP_OWNED_AUTH_FIX / HUMAN_E2E_PENDING** |
| APP [#341](https://github.com/BlueDragon33/Application-Management/pull/341) | `fdfc90f2c897a97aeb14e05628a077bd50b81e8c` → **new `64be03adc91b7274fa4ad00862116127ec90edb6`** | 6 original changed files + 1 amended test file. Link 3 electronic invitation distinct from Telex, old 713 PASS/3 FAIL tracked; new code-only test repair read back, CI NEW NOT_RUN. **RETEST_PENDING** |
| APP [#363](https://github.com/BlueDragon33/Application-Management/pull/363) | `e57da52172f1dca34d3512e567623d5cf82800b3` | 3 files, one developing project-directory item, **no launcher/control/claimed connected**. **PORTFOLIO_CATALOG_CANDIDATE** |
| APP [#362](https://github.com/BlueDragon33/Application-Management/pull/362) | `d7fe79d431f9e0cee2a0ab480acfbfa0e02abfaf` | 6 files, separate developing iOS project-directory item, no fake launcher/physical install proof. **PORTFOLIO_CATALOG_CANDIDATE** |
| BOI [#207](https://github.com/BlueDragon33/BOIECH_AI/pull/207) | `ecdde3bd9ace79d8eabdf137e42047300313ca4e` | 6 files, consent/profile opt-in disabled by default, CAS withdrawal and empty D1 migration; owner retention/privacy + isolated D1 still gates. **PARTIALLY SUPERSEDED CODE BY #210; NO CLOSE** |
| BOI [#208](https://github.com/BlueDragon33/BOIECH_AI/pull/208) | `52f5f4030987fc317bc294d7b28a61981fa687e5` | 9 files, teacher-only signed video inbox, replay/CAS and D1 migration; isolated D1 + role/device acceptance remains. **PARTIALLY REUSED IN #210; ADAPTED FILES** |
| BOI [#203](https://github.com/BlueDragon33/BOIECH_AI/pull/203) | `62aa2eda053d6ec105a199a431d5eb72e4bba4a7` | 6 files, human-confirmed teacher video coaching draft only; confidence/capture quality abstention. **DISTINCT_TEACHER_UX_CANDIDATE** |
| BOI [#200](https://github.com/BlueDragon33/BOIECH_AI/pull/200) | `d5e1c7f983187936ec703bf7bdd7cea228d8ca05` | 6 files, incomplete/truncated top-N manager evidence explicitly blocks false "zero incident" conclusion. **DISTINCT_AI_EVIDENCE_GUARD** |
| Bauman [#365](https://github.com/BlueDragon33/Bauman-master-ai-system/pull/365) | `0c67fbbfbfcf3ac725405a09432f5170c0e93044` | 1 browser test file, genuine offline cold-tab resume of learner search with local persistence; historical CI SUCCESS at exact SHA, no language-mastery/release certification. **BOUNDED_OFFLINE_QA** |
| Bauman [#363](https://github.com/BlueDragon33/Bauman-master-ai-system/pull/363) | `0ba2dabe2c5420812f97fb30385737c1240be857` | 7 files, rights/reviewer-bound RU03 read-only Widget Deck export; CI workflows SUCCESS but no approved RU03 human source/physical iPhone acceptance. **COPYRIGHT_AND_REVIEW_BLOCKED** |
| Bauman [#354](https://github.com/BlueDragon33/Bauman-master-ai-system/pull/354) | `d9abfc733647f734597cd91f76a98b953105f739` | 6 files, metadata-only RU03 linguistic sources, forbid rehosting/forged item approval, no corpus downloaded or protected content promoted. **SOURCE_POINTERS_ONLY** |

**New byte-overlap cross-check, exact Git blobs** of BOI #207/#208 against integrated [#210](https://github.com/BlueDragon33/BOIECH_AI/pull/210) `f93e9a760e9a64959c16a2a88648e4ea0ad8bcd1`:
- **#207: 6/6 changed paths EXACT blob carried into #210**. This proves code bytes for those six sources, NOT feature runtime/D1 consent/role acceptance nor permission to close the PR.
- **#208: 6/9 EXACT blob; 3/9 intentionally changed**. In `teacher-video-inbox.server.ts`, #210 extends source receipt read with `learnerCode` and `lessonNumber`; two associated test blobs differ. Preserve explicit change scope/role/privacy tests, do not blindly overwrite.
- BOI #207/#208 CI source SUCCESS at their own exact HEAD; "paired Preview" run's jobs were anonymous production readback and paired preflight, not full private role/consent D1 acceptance. No safe Production launch authorized.

**Confirmed cross-branch catalog collision** in APP source: default `app/project-registry.ts` blob `d716b39e032a839001334a43e8e3ba19b3019f30` contains **14** current project entries. APP #363 branch version blob `6ba290e4150d2ab0b38c3ed5428345f1c5e009e0` has 15 with one separate candidate; APP #362 blob `adac9fb5bd273a54e1a338afb0aacedade7294bb` has 15 with *another* candidate. Both are additive distinct entries, NOT mutually substitutable; if both are authorized in the same catalog, resulting count must be **16**, with source-derived tests and no invented launch URL. APP #314 is a separate ECAD/CAE proposal and must not be silently incorporated by these two historical counters.

## 4. Dependency/status checkpoint by all 12 existing lanes

1. Constitutional authority 1.3.0 ACTIVE; no proposed 1.4/direct Production/UX ratification.
2. Independent A/B 8 private bridge cases **0 VERIFIED / NOT_RUN**; one App installation and no independent B #173 review.
3. Hub Phase 9 P9-019 human and P9-020 7 gates pending; no approval or release.
4. UANA #173 DRAFT; **project CAS defect OPEN**, older host/prompt/work binding semantics still separate.
5. Graph + DUAL C13 earlier scoped QA remains pinned to earlier Git tree; no full signed admission.
6. APP R0.2 10/50/200 clean D1/Playwright candidate p50/p95 **NOT_MEASURED**; APP #341 test fix is a separate safe task, not R0.2 benchmark.
7. BOI #207 6/6 and #208 6/9 blob overlap in #210, without private D1/teacher/learner acceptance or data-owner gate.
8. Bauman/RU03 and iOS: offline/widget/reference candidates source-verified, human language rights pending.
9. PC native installer/Authenticator/rollback gate unchanged, no physical Windows QA on this wave.
10. Domain/robotics release gates remain per-app; no arbitrary global PASS.
11. CAD/ECAD/CAE B2/B4 authority discrepancy unresolved; APP #362/#363 catalog count collision separately proven.
12. One portfolio Issue #159 remains source of public reconciliation and one existing #173 evidence tree; no second work ledger.

**Counts in scope:** 26 Hub OPEN PRs previously inspected for changed-file list; 42 **distinct** public app PRs with some real diff/file patch triage across C14–C17, not 68 complete audits. C12's **26 accessible repositories/146 open PRs** and **27 heterogeneously tracked unfinished steps** are historical observation bounds, not freshly recounted. C17 executed **one safe test-file source patch** (APP #341) and additional read-only cross-app byte/CI verification. No PostgreSQL writes, protected private-bridge tests, APP R0.2 browser benchmark, human reviews, code merge, Production, ratification, paid work or branch closure.

**Next permitted sequence:** obtain exact-head CI for APP #341 and real form role/Telex browser acceptance; submit bounded CAS transaction plan for authenticated authority and implement/test atomically only in approved QA branch; continue APP R0.2 when clean isolated Windows/CI checkout exists; preserve BOI #210 adapted functionality when reconciling #207/#208; when real independent B/App identity is verified, run 8 private bridge cases and only then prepare P9-019/P9-020 approval flow.
