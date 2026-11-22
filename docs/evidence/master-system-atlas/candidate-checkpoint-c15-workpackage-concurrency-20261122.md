# C15 — Exact-tree PostgreSQL WorkPackage concurrency + APP R0.2 alternative audit + nine more PRs

**Observed:** 2026-11-22. **PUBLIC Hub Draft PR #173**, exact source HEAD before evidence-only commit `b905806affafe9642a63888bb52dd295c1ade7b7`; `main@4e9c30cd718dca5c4cd01eabaa1a728f63ed25d1`. Constitution ACTIVE `1.3.0`. No Production, merge, ratify, reviewer approval or new state store.

## 1. Real PostgreSQL concurrency: safety boundary identified, not hidden

**Code path inspected:** `apps/web/app/projects/[projectId]/prompt/actions.ts` calls `prepareNextActionIntake`, reads canonical `runtime.prompts.currentSourceRevisionFromProfile` and canonical project WorkPackages, then calls `runtime.workQuality.createWorkPackage`. `WorkQualityApplicationService` enforces authenticated `PROJECT_MUTATE`; `PostgresWorkQualityRepository` uses Prisma `workPackage.create` with primary-key `id`, and `updateMany where {id,projectId,recordVersion}` to enforce *per-record* CAS on updates.

**New test-only code** on #173:
- `tests/persistence/work-quality-postgres.test.ts`: four actual PostgreSQL cases added to the existing four (8 total), *no application source behavior changed*: 8 concurrent **same request ID** creates → exactly one success, seven DB conflicts, one persisted canonical PLANNED record and safe idempotent readback; two **different contents with same ID** → one winner, conflicting loser rejected at canonical intake; **two different request IDs from same initial Prompt revision** → both persisted PLANNED (observed gap); two concurrent **same WorkPackage old version** updates → exactly one wins, one rejected and recordVersion increments once.
- `.github/workflows/ci.yml`: a scoped `work-intake-concurrency-qa` job, only triggered on separately owned `foundation/qa-*` branch with exact `[work-intake-qa]` marker; disposable PostgreSQL 16, frozen deps, migrations, Prisma, typecheck, real Vitest, JSON evidence, zero Production secrets.
- **Tested source code HEAD** `b905806affafe9642a63888bb52dd295c1ade7b7`, source Git tree `04d90339e35eedaffec72b4992e5d3b5cc2fc7f5`; **QA-only HEAD** `863eb3ac64fb2701a8761418c023707e70ee3f41` has **the exact same Git tree**.
- **[Actions #45028913970](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45028913970): SUCCESS**. Fast CI SUCCESS; scoped PostgreSQL job **8/8 PASS**, no fail/skip; Prisma/migration/typecheck SUCCESS; whole release-gate step is SKIPPED by design, not PASS.
- **[Evidence artifact](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45028913970/artifacts/14757275631)**, digest `sha256:89ce33ab5a17de87ea96ef78faeae498415940915a394a1b13e51c817ebbd053`, ephemeral CI data only.

**Security finding C15-ANA-CAS-01 (OPEN):** WorkPackage ID uniqueness + record-level optimistic CAS **does not guarantee project-wide Prompt source-revision atomicity**. Two independent PLANNED creations can pass checks based on the same prior revision. The third regression intentionally observes this current behavior; **a green regression report is NOT a PASS for cross-request source CAS**. A real fix requires an approved transaction/isolation design covering all mutations contributing to canonical Prompt source revision (profiles, WorkPackages, gates, evidence, blueprint), not an unrelated second registry or client-only timer. Do not weaken tests, add an unapproved migration or claim fraudulently that a second source read constitutes atomic CAS.

## 2. Application Management R0.2 — exact real prerequisite, no borrowed production metric

Original APP Draft #414 `60e3b0c6fb37613bfb10648394f4cef31b389e34`, machine ledger blob `94a7eb0ec5ff7f6071e5a5200c79c1d9ff76a51e`:
- R0.1 completed **SOURCE_ONLY**; R0.2 stays `BLOCKED_INSTRUMENTED_QA` on the ledger's source candidate `02165d2c4e4b47dac5c0b0b32ae1f7a3be874067` (historical, not current PR HEAD).
- Windows preflight proved owned temporary `127.0.0.1` HTTP 200 and Playwright Chromium navigation; subsequently **failed to obtain write permission to create a separate exact-SHA checkout** under `E:\BaumanWeb\_qa`. Local Center PID/served source SHA, isolated fixture D1, 10/50/200 apps, p50/p95/React commits/memory/CSS coverage/computed contrast remain **UNVERIFIED**.
- Read `Application-Management` main current `89a89ce2d3d8ed634ee9562c52744a99223a2b2a` and the actual `scripts/automation-fixture-browser-check.mjs` (blob `bded30e674d45b607ade19427f267e40e0b2a168`): existing CI fixture exercises **nine** dynamic catalog clients alongside fixed mock clients on fixed ports, real local Vite + D1 and authorized UI actions. It **does not deliver the required independently instrumented 10/50/200 sample series**. Current `application-management-ci.yml` only runs this under its separate Preview/browser job and is not a qualified R0.2 measurement plan. Do not reuse CI test counts as latency p95.
- Current browser connector exposed a **Production URL tab only**, no candidate isolated local tab; it cannot measure R0.2 safely, and Production must not be used as a synthetic write/benchmark target.
- APP #417's clock isolation/freshness code is a distinct **CODED candidate**, not measured R1.1 improvement under original R0.2 baseline. APP's 7-round/21-step plan remains **1 DONE, 20 not completed** with 12 relevant gates unresolved. No app or APP ledger change was made during C15.

**Required APP READY gate:** an authorized isolated QA checkout (Windows `E:\BaumanWeb\_qa` or a clearly equivalent approved clean CI workspace) with current exact source/build/PID, separate disposable local D1 and real 10/50/200 browser instrumentation; only then update R0.2 ledger/G05. No Owner PowerShell scripts needed at this checkpoint; no honest p95 value exists yet.

## 3. Nine additional public application PRs read at their actual HEAD

This is **per-PR changed-file and source scope triage**, not full test/review/merge authority. Combined with C14's 13 distinct app PRs: **22 public application PRs** have a first bounded source classification; plus **26 Hub PRs** previously inspected for changed files = **48 distinct publicly named PR records with some first-pass source review**. Do **not** call that 48 full code audits out of 146.

| Public app PR | Exact inspected HEAD | Meaningful source scope and decision |
|---|---|---|
| Health_Care #22 | `fa9ccde503bb05ee08747d01649f25c2c89b554d` | 11 changed files, patient-entered symptom episode lifecycle. Preserve legacy daily record, no automated diagnosis; separate personal data/privacy and real UI acceptance required. **KEEP_DOMAIN_OWNED** |
| Health_Care #49 | `a677f31c6e8eca6f99aa6ddadaa828890102d3d1` | 3 files, contextual Today quick-action wording across ages, not medical diagnosis. **UI_DOMAIN_CANDIDATE** |
| GrowUP #25 | `d5cc8ad4e59085c9660ade5de6b8958dbb00ebc6` | 8 files, read-only premium dashboard, local persistence, responsive/PWA semantics and child privacy. **UI_CANDIDATE_NO_CROSS_APP_DB** |
| RU_LIFE #20 | `da6af7de9fda75c5d5b47eb72ae8cbdde95788c8` | 24 files, content intelligence wave with its own unfinished Task 6. Preserve offline source provenance and education content. **DISTINCT_CONTENT_PROGRAM** |
| NC03 #62 | `3c92085c01f604691d1836f4026f598ae6f569db` | 9 files, source-only Constitution 1.3 B4 inheritance, local modem auth/session. **SOURCE_ADOPTION_NOT_REAL_HARDWARE_ACCEPTANCE** |
| PriceReport #106 | `266ec54e1c1f4c0c5011ae182a6c4a7d08ac1feb` | 11 files, primary navigation only routes to true destinations; no business data write. **UI_NAVIGATION_CANDIDATE** |
| Bauman #366 | `a67e049440900e00672e55a17b0baf133b79d7b6` | 10 files, per-isolate local D1 instrumentation and fail-closed drain, not a multi-isolate global quiescence guarantee. **QA_SOURCE_CANDIDATE** |
| MPC PID #5 | `135f43712cb300133a543b6f26eede726ddb728f` | 24 files, UGV kinematic bicycle + EKF/LTV-QP controls; remains Gate 5A research, no full closed-loop/hardware PASS. **DISTINCT_ROBOTICS_RESEARCH** |
| CAD CAM #14 | `1d821b854b89651ec7976235f710dd7c177e46aa` | 3 files, independent browser STEP/3MF exported structural conformance. Distinct from B2/B4 Constitution conflict and serializing model itself. **INDEPENDENT_ARTIFACT_ACCEPTANCE** |

Neither these PRs nor C14's 13 are automatically superseded by #173, and their cross-app owner/data/device/reviewer gates remain separate. Private-repo metadata does not appear in this public checkpoint.

## 4. Authority and canonical phase counts — unchanged

- **Hub #173/#166:** OPEN/DRAFT, no independent submitted review on #173. One visible GitHub App installation, not two verified independent bridge identities; protected eight private GitHub App bridge tests **NOT_RUN**. Reviewer A implementation self-review does not become independent B. No P9-019 professional Owner signoff, P9-020 seven-gate acceptance, PR merge, Constitution ratification or Production deploy.
- **Earlier source evidence remains scoped:** C13 Graph+DUAL `28/28 Vitest + 3/3 Chromium` PASS on its earlier exact Git tree; C15 `8/8 PostgreSQL` PASS on its own exact tree. They cannot be summed into a new full Release PASS on a later tree.
- **Portfolio status:** 26 accessible repos / 146 PR records as of C12, 12 planning lanes, 2 Hub Phase 9 + 5 Dual + 20 APP R0 steps = 27 unfinished **heterogeneous planning units**, not total global canonical WorkPackage count. C15 does not alter those ledgers.
- **NEXT:** keep this exact-source CAS gap OPEN, obtain explicit owner-approved atomic concurrency design before changing schema/data; real APP isolated 10/50/200 measurement on eligible host; protected independent reviewer/App bridge and exact-tree no-skip release gate when actual identities exist. Do not force production or ask for shell commands to paper over authorization.
