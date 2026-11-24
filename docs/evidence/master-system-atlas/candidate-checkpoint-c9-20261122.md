# C9 — Opt-in QA recovered and Graph Intelligence / Next Action integrated

**Date:** 2026-11-22. **Repository:** `BlueDragon33/Software-Blueprint-Hub`.  
**Draft PR:** #173; **exact source HEAD before evidence-only checkpoint:** `6f2b6efe8bb616fbd2fa65e67a9a0486883845fa`.  
**Exact source Git tree:** `9e5f1b0e8ef8f9a19d49509dfedbca875220fbc9`.  
**ACTIVE Constitution:** 1.3.0 (no normative/contract/version/template publication).  
**Mode:** ZERO-SPEND, isolated CI, no Production, no owner secrets, no self-review, no ratification or PR merge.

## Work performed on PR #173

### 1. Recover the 26 previously skipped evidence tests without weakening the release gate

Added an **opt-in, QA-only** job to the existing `.github/workflows/ci.yml`, activated only on a dedicated `foundation/qa-*` branch with exact `[optin-qa]` commit marker. Uses disposable PostgreSQL 16 `blueprint_qa_test`, existing frozen pnpm/Prisma migrations, and the built-in GitHub Actions `contents:read` token. No preview/production DB, no new service/control plane and no unrestricted token.

- **Verified CI run:** https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45018593697
- **QA-only HEAD:** `4a3860ea8714d9e249c7fc7b038c2e827f3e6581`, **Git tree:** `89e0e06ffa7b4b4ff60fec1678c2237c3e882ac2` (PR #173 source at opt-in test time).
- **17/17** immutability/replay/authority PostgreSQL test cases PASS, no failures/skips, on correctly named disposable DB.
- **1/1** publicly authorized pinned GitHub byte-inspection case PASS, no failures/skips, independent read-only source requests.
- Separate job verified JSON evidence test counts and uploaded artifact; full CI run conclusion SUCCESS. **This is an isolated 18-case QA result, not full Product/Release Gate PASS.**
- **8/8 private GitHub App bridge tests remain NOT_RUN**: require two truly distinct scoped execution/QA GitHub App installation tokens with proper access to four repositories and revocation checks. A generic `GITHUB_TOKEN` is not equivalent. Do not silently skip or claim a reviewer approved them.

### 2. Integrate actual Graph Intelligence Studio with Next Action

Reused the **actual source** of open Graph PR #166 `ca498220ee77e259cca8906622ff9432810288fb`: typed federated engine, deterministic domain/edge impact, immutable read-only view, Graph Studio UI, server loader and source fixtures/tests. Preserved source Git blob identity for 12 original Graph source/fixture/test files.

Integration on **the same Hub/PR #173 branch** reuses the existing `ProjectWorkspace` authorization and canonical `WorkQuality` sources: work packages, required QualityGates, evidence and releases. Server Graph loader also reads the existing canonical Prompt source revision and projects the same Next Action via `projectCanonicalNextAction`; Graph page shows the same two-control Workspace component, not a separate dashboard/task registry.

- Updated only the relevant existing application export, project navigation labels and registered workflow read path.
- The Graph Studio does not mutate canonical work/gates, publish, issue execution grants, or claim real Agent telemetry. Source labels `recorded-pass` are observations, not independent certification.
- No second Graph engine/backend; #166 remains an independent **Draft, unmerged**. #161 remains an independent old draft; no destructive blanket cherry-pick.
- Added isolated Graph server authorization/read tests and a three-device real browser integration journey on the existing project route `/projects/{id}/evidence-graph`.

### 3. Exact-tree integrated QA evidence

**QA-only source-equivalent HEAD:** `f20d4c985cccf91787dd3df52fe04a66e6c51419`; **Git tree equals PR #173 source tree** `9e5f1b0e8ef8f9a19d49509dfedbca875220fbc9`.  
**Run:** https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45019128515  
**Artifact:** https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45019128515/artifacts/14753480072  
**Artifact digest:** `sha256:aa14f65fa43e06c4ea112bf9ac2532ca849ecc7c752da9554289ecf5e1c8aecf`.

| Scoped gate | Actual result |
|---|---|
| Repository fast-check | PASS |
| Disposable PostgreSQL migrate + test-only project/role seed | PASS |
| Graph/Workspace TypeScript typecheck | PASS |
| Reused Graph engine + browser components + scoped loader Vitest | **25/25 PASS**, 0 FAIL, 0 SKIP |
| Next.js exact-source production build (not deploy) | PASS |
| Browser Chromium Graph + canonical Next Action | **3/3 PASS**: desktop, tablet and mobile |
| JSON evidence + immutable artifact | PASS |
| App Production, independent reviewer A/B, ratification | NOT RUN / NOT AUTHORIZED |

Earlier **C8 baseline** (source tree `f6dd776627c188c0ffd267566f924715e02fe112`) established 75/75 Playwright App Shell + 413 Vitest PASS / 26 SKIPPED. **Do not transfer all C8 runtime PASS onto this newer exact source tree**: C9 tests the new integrated Graph slice plus exact-source compile/build; it is not a full C8 rerun.

## Still genuine blockers

1. **Private bridge (8 test cases)** — two independently scoped GitHub App installation tokens and permission-bound selected-repository read/revoke evidence are unavailable. No token downgrade, fake success or off-scope repo access.
2. **Human/QA review** — no independent A/B PR review submissions are recorded for #173; authored code/CI is not its own reviewer.
3. **Full Release Gate** — the normal global `release-gate-evidence.mjs` requires no skipped cases. Auxiliary 18-case pass cannot be silently welded to a different exact-tree release report; separate 8 tests/authority plus final exact-tree gate evidence still required.
4. **Real Codex/Agent event transport, production SSE and durable multi-session work intake concurrency** remain outside this Graph+Next Action source QA. No actual Agent runner identity or Production readback has been accepted.
5. **Merge/publish** — #173 and #166 remain Draft; ACTIVE Constitution 1.3.0; the non-normative ChatGPT v2 guidance PR #174 was previously merged, but cannot install ChatGPT-native buttons by Git commit.

## Next legitimate authority gate

Obtain actual independent execution and QA GitHub App identities with least privilege, run the 8 private bridge cases on an isolated exact-source target, secure separate qualified Reviewer A/B readbacks and Owner acceptance, then execute the normal full final release gate on the resulting exact tree and request merge/publish only with applicable human authority.

**FINAL STATUS:** `SCOPED_GRAPH_INTEGRATED`, `REAL_POSTGRES_17_PASS`, `PUBLIC_PINNED_1_PASS`, `GRAPH_UNIT_25_PASS`, `GRAPH_BROWSER_3_PASS`, `EXACT_BUILD_PASS`; **`PRIVATE_BRIDGE_8_BLOCKED`, `INDEPENDENT_REVIEW_BLOCKED`, `GLOBAL_RELEASE_NOT_PASS`, `NOT_MERGED`, `NOT_DEPLOYED`**. No PowerShell action required from Owner at this checkpoint.
