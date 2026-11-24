# C13 — Exact-source PR convergence review and real Graph/Dual runtime regression

**Observed:** 2026-11-22, live GitHub. **PUBLIC** evidence-only source on Hub Draft #173.
**Tested source head:** `244f6f5bf053fdf6cdc1f4538cdc7fc000663166`, **Git tree:** `f303e9ac6ac90549b3a14adb3c1e24bf3688d3a2`.  
**QA-only branch head:** `2a75c3099107bcd59a437b483a856f7324c417fd` — **exact same Git tree**, no additional code, Production or reviewer authority.  
**Hub main at audit:** `4e9c30cd718dca5c4cd01eabaa1a728f63ed25d1`; Constitution ACTIVE 1.3.0 unchanged.  
**Scope:** first meaningful code comparison of high-risk overlapped PRs (selected file patches and actual Git blobs), not full semantic review of all 146 cross-repository PRs. No metadata of private repos, keys or unapproved private source appears below.

## 1. Real QA on the actual Graph, not just a mocked graph

Added `tests/application/graph-external-intelligence-real-graph.test.ts` with **three tests against the actual `buildGraphIntelligence(graphFixture())` engine** and registered them in the existing QA-only `graph-next-action-qa` job. They check a scoped read-only Dual metadata reference without canonical mutation, reject another project's trust, and reject a forged Graph release-authority flag. No external private credential or real trust admission was faked.

**[QA run #45024916467](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45024916467)**: SUCCESS.
- Fast-check job SUCCESS.
- Disposable Postgres migration + TS typecheck + Next.js build: SUCCESS (scoped QA job).
- **Vitest: 4 files / 28 tests PASS**, no failed cases. Previous 25 now includes 3 real Graph adapter cases; `tests/application/graph-external-intelligence-real-graph.test.ts` specifically **3/3 PASS**.
- **Chromium: 3/3 PASS** on desktop/tablet/mobile for Graph Studio + Next Action.
- Evidence upload and QA-only proof generator SUCCESS.
- [Exact QA artifact](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45024916467/artifacts/14755426705); SHA-256 of ZIP: `eb92cd0dd3596d4d4c61da7df94639d481debbee6dda9427ff813b131bf3af81`.
- **Release-gate job in this QA-only run SKIPPED by design**, not PASS. This is NOT authorization for merge/Production and does not discharge the 8 protected private-bridge tests or qualified Reviewer B.

## 2. File-by-file convergence readback for three large overlaps

Source ref #162 `33b74c43fbe07bebde67a0de5c89e5d2a64213af`: all **4/4 changed files** have the same Git blob on #173. They are:
- `apps/web/app/ecosystem/ecosystem-directory.tsx` `e46872d291aa805500d2159362358b8cb58ca7f4`
- `apps/web/src/lib/hub-app-directory.ts` `c067c8815658c9da158ebf090dc8b4ebf9a748db`
- `scripts/ci-p2-cross-service-smoke.mjs` `72260fda58e239fd4eb8beb508b1b6ace2b639c6`
- `tests/application/hub-app-directory.test.ts` `d1a5b075e09f41b77a08efbcc53bd59e50fa9bd0`

**Disposition #162 = EXACT_SOURCE_EQUIVALENT_4_OF_4_IN_DRAFT_173**. This **does not** mean code on `main`, review authority, a merged state, or permission to close #162; preserve its original evidence and finish successor review.

Source ref #168 `b94f7385bd7656167edad98fcf85ff4314acf4bc`: exact Git blobs in #173 for **5/11** original changed paths:
- `packages/contracts/src/intelligence-exchange.mjs` `afc51d540cc369f748a8e7acddfcaa859ea961e5`
- `schemas/intelligence-exchange-manifest.v1.json` `dbd480e5c1151a06de00ea1d4b2dfe5df68c74e7`
- `packages/application/src/intelligence-reference.mjs` `688620de20cad7a01a374be7b1860c0951235610`
- `tests/contracts/intelligence-exchange.test.mjs` `2ea13cc704a4f38a7f4e30246a61d5e587e85f0f`
- `tests/governance/intelligence-reference.test.mjs` `f83a91ca58d5b572f3e011f861b1e78da51f2ab3`

The remaining #168 architecture, ledger, profiles and offline verifier are not byte-carried by #173. The new Graph external read-only adapter is an **additional candidate**, not authenticated P3 trust or complete P4. **Disposition #168 = PARTIAL_EXACT_SOURCE_REUSE_5_OF_11 / KEEP_DRAFT**.

Source ref #166 `ca498220ee77e259cca8906622ff9432810288fb`: **9/12 deliberately ported source/fixture/test files** are byte-identical, including engine, view, Studio UI/CSS, error/loading and core fixtures/component tests. The three intentionally adapted files are `apps/web/src/server/graph-intelligence.ts`, `apps/web/app/projects/[projectId]/evidence-graph/page.tsx`, and `tests/web/graph-intelligence-server.test.ts`: they now read canonical Next Action from the same authorized project. The original #166 comprises **65 changed files**, including separate browser harness, runtime input artifacts and original evidence not automatically carried by #173. **Disposition #166 = PARTIAL_EXACT_SOURCE_REUSE_9_OF_65_FULL_CHANGED_PATHS / 9_OF_12_PORTED_BYTE_EXACT; KEEP_DRAFT / NEED_EVIDENCE_RECONCILIATION**.

## 3. Real semantic differences discovered in active Next Action lineage

| Older PR | Concrete distinct code/contract at its real PR diff | Correspondence with #173 | Disposition |
|---|---|---|---|
| #147 | Signed *continuous* project execution offer and distinct canonical preflight, not a generic navigation button | #173 has only PROJECT_READ projection and PROJECT_MUTATE PLANNED intake; does **not** grant a runner | KEEP_SEPARATE_AUTHORITY_CANDIDATE |
| #151 | Global offline landing CTA that navigates for any admitted/tracked project, explicitly non-executable | #173 is authenticated project Workspace with two controls, not an equivalent global landing feature | RECONCILE_ENTRY_POINT |
| #152 | Separate append-only `NextActionWorkBindingDecision` Prisma migration + workflow binding decisions | #173 writes PLANNED via existing canonical WorkQuality; **does not implement this append-only workflow-binding contract** | NO_BLIND_SCHEMA_PORT |
| #153 | Fixed read-only CMD allowlist, pasted-output unverifiable evidence and source-bound guided plan; R33/R34 draft authority | #173 has neither allowlisted CMD execution nor the same R33/R34 constitutional proposal | DISTINCT_CAPABILITY_NOT_SUPERSEDED |
| #155 | ChatGPT in-conversation button proposal, editable user submission and explicit host constraints | #173 is Blueprint web-app UI. Neither GitHub PR can install a persistent native ChatGPT button | KEEP_HOST_UI_BOUNDARY_SEPARATE |
| #156 | Project-aware autonomous execution constitutional proposal with human/host gates | Existing ACTIVE 1.3 does not automatically ratify this addition | KEEP_PROPOSAL_NOT_ACTIVE |
| #161 | `verifyUanaSourceForCopyAction` re-reads PROJECT_READ, exact current Prompt source and latest projection before **clipboard copy** | #173 uses navigation + PLANNED intake, not clipboard-copy workflow; cannot claim feature parity | DISTINCT_COPY_FRESHNESS_GUARD |
| #173 | Project-scoped two-control UI, read-only Graph+ANA, existing canonical WorkPackage persistence, fail-closed no Agent dispatch | Tested here only for Graph integration and earlier scoped Next Action E2E | PRIMARY_INTEGRATION_DRAFT |

**Critical:** a similar button label is not semantic equivalence. #173 lacks a native ChatGPT host toolbar (none can be installed by GitHub); separate #161 clipboard freshness guard and #152 workflow-binding table are **not** silently implemented or granted to #173. Reviewer shall explicitly decide whether these capabilities are needed before merging any one lineage.

## 4. Reviewer, policy and legacy source distinctions (selected actual patches)

- **Reviewer #163→#167:** #167 changes the work-order digest from `review-ab:1` to `review-ab:2` and binds issuer grant, ordered path scope, TTL, budgets and canonical CAS. It blocks ACCEPT with P0/P1 findings and rechecks authority across async callbacks. This is **security-significant** and must not be replaced by a successful generic CI. Separate #154 implements signed v2 PR review identity and a durable replay-claim contract; #172 is advisory PatternGovernance learning only, not B identity/approval. Proposed #171 needs ratification.
- **Constitution proposals #158/#164/#165/#170:** conditional L1/L2 identity, WCAG content-first, spatial-resource UX and direct Owner Production policy each have *different applicability/authority*. #164 inherits existing Section 11 thresholds (4.5/3); #165 explicitly forbids mandatory 3D; #170 keeps Preview optional but NOT auto deploy. These proposals remain unratified, with 1.3.0 ACTIVE. No forced single mega-amendment.
- **Legacy #101:** moves Compass preflight ahead of the absence of human decision to show truthful constitutional blockers; not a copy of #173 graph. #141 owns R33 recovery/12-department tester candidate, not covered by Graph Studio. #94's statement that ECAD/CAE repositories do not yet exist is now obsolete; its engineering interoperability contracts must be reconciled with live independent products before adoption.
- **Governance #150:** its changed derive script adds a source-proof requirement for a specialist onboarding entry; current `main` bytes of all four changed paths differ, so this is **not** proven merged or superseded. Do not paste private-source identifiers from its patch into public reports.
- **Catalog #157:** targeted one-product display mapping and test differ from current `main`; no proof of equivalent current App Management launcher. Preserve privacy and ownership.
- **Original C12 groups:** all **26 distinct open Hub PRs** remain assigned to 6 first-pass groups. This C13 adds source-grounded distinction for their overlapping contract/security/UX paths; it **does not claim complete line-by-line audits of every diff** and confers no merge, close or ratify authorization.

## 5. ONE source-of-truth next action and blockers

**Eligible work completed:** exact-source parity proof for #162 4/4, #168 5/11, #166 9 original unchanged source blobs, selected semantic patch review of UANA, reviewer and policy lineages, and **new exact-tree 28/28 Vitest + 3/3 real Chromium QA**.

**Genuine external blocker:** current connector exposes one GitHub installation and **zero submitted PR reviews on #173/#166**. Eight private GitHub App bridge tests require two independent scope-bound identities and real revocation/byte readback, not generic connector scope or self-declared reviewer role. P9-019 real human signoff, P9-020 seven QualityGates and Release Gate, DUAL P3 private catalog/trust and P4 remain not accepted. App Management R0.2 needs instrumented real browser metrics; the C13 Graph tests cannot satisfy it.

**Next READY when independent authority is supplied:** real two-installation protected bridge+8 tests, independent A/B exact-HEAD review, reconcile the unique Next Action migration/copy/host capabilities in one approved existing Workspace, full exact-tree release gate, human P9-019→P9-020. Keep APP, BOIECH and product-specific releases separate.

**No private repository identifiers/SHAs are published here. No Production, no merge, no ratify, no paid resources, no command-line request to Owner.**
