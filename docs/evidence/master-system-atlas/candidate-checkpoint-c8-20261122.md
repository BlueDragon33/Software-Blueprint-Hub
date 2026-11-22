# MASTER SYSTEM ATLAS — C8 exact-tree runtime QA and truthful release blocker

**Date:** 2026-11-22. **Repository:** `BlueDragon33/Software-Blueprint-Hub`.  
**Draft PR:** #173. **PR source HEAD before checkpoint:** `c7e64716bca7f49f2536091150e38873d8cff61f`.  
**Source Git tree:** `f6dd776627c188c0ffd267566f924715e02fe112`.  
**QA-only head:** `2fbce997e3437c89a17f5c89c17abcbdf9eb946e` on `foundation/qa-pr173-source-20261122` with **identical Git tree**.  
**QA run:** https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45016819447  
**Immutable evidence artifact:** https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45016819447/artifacts/14752196577  
**Constitution:** 1.3.0 remains ACTIVE; PR #174 merged only non-normative ChatGPT guidance. No constitutional ratification, Production deployment or paid service.

## Scoped improvements implemented on PR #173

- Read-only `projectCanonicalNextAction` projects actual project-bound WorkPackage statuses/dependencies, mandatory QualityGates and evidence IDs into truthful READY/BLOCKED/UNVERIFIED. No Agent execution rights, gate mutation or bogus running state.
- Reuses existing authenticated `workQuality` and `prompts` services; persists explicitly reviewed additional tasks as `PLANNED` under existing PROJECT_MUTATE, no duplicate server/store.
- One immediate authenticated **navigation** button and a separate visible optional **view plan / add task** button within Blueprint Hub. No compulsory checkbox or fake host ChatGPT message send. Live Codex event adapter remains read-only candidate without connected runner.
- Added 14 negative/fail-closed canonical projection tests, React SSR tests, four visual-surface contract checks, and Playwright three-device Next Action journey showing both controls and two streams.
- Merged already proven catalog and lint baseline repairs from PR #162 at their actual Git blob IDs; did not reduce lint thresholds.
- Repaired stale English-only Playwright selectors based on real VI/EN frontend source; stable semantic href/aria-current, real disclosure navigation, scoped unique H1 and source-grounded Vietnamese blueprint heading. Did not remove security/accessibility/journey assertions.

## Actual independent CI outcomes on exact Git tree

1. **Development Fast CI:** PASS; the candidate Node24 Atlas/Next Action suite reported **84 PASS** in the prior fixed-source CI and subsequent fast-check runs succeeded.
2. **Central Prompt Workflow Integration CI:** PASS at source HEAD `c7e64716bca7f49f2536091150e38873d8cff61f`.
3. **P2 Provider-Neutral Scoped Integration:** PASS at source HEAD `c7e64716bca7f49f2536091150e38873d8cff61f`.
4. **Disposable PostgreSQL 16 release-gate job:** Prisma generate/validate, migrations, source-truth checks, Constitution authority-set verification, lint, typecheck, architecture boundaries, Node/JUnit and PostgreSQL/Vitest integration all PASS.
5. **Next.js production BUILD:** PASS (source build only, no deploy).
6. **Playwright App Shell:** **75 PASS, 0 FAIL, 0 SKIPPED, 0 FLAKY** on desktop/tablet/mobile. Includes the new Next Action v2 two-control blocked-state E2E on all three devices; source screenshots present in the pinned artifact.
7. **Vitest JSON evidence:** 201 test suites PASSED; **413 test cases PASS, 0 FAIL, 26 SKIPPED** out of 439. Node JUnit: `constitution-node-tests.xml` 121 PASS and `source-truth-tests.xml` 4 PASS, no failures/skips.
8. **Whole release-gate conclusion: FAIL/BLOCKED (intentionally).** `scripts/release-gate-evidence.mjs` rejects any failed or skipped evidence. It threw `Release Gate reports failures/skips or missing test evidence`. **Do not suppress skipped tests or weaken evidence gate.**

### 26 genuinely unrun Vitest cases

| Group | Skipped | Scope and gating requirement |
|---|---:|---|
| `prompt-workflow-qa-pg-integration.test.ts` | 13 | Requires `BLUEPRINT_QA_DB_INTEGRATION=true` and separate disposable DB URL ending `/blueprint_qa_test`; normal release gate uses `/blueprint_test`. |
| `prompt-workflow-authority-pg-integration.test.ts` | 4 | Requires opt-in disposable PostgreSQL QA integration mode; cannot infer execution from general Postgres PASS. |
| `prompt-workflow-live-private-bridge.test.ts` | 8 | Requires distinct permitted read-only GitHub App execution/QA tokens, exact selected repository HEADs, and real revocation checks. |
| `prompt-workflow-live-inspection.test.ts` | 1 | Requires opt-in live pinned GitHub read-only token and exact source SHA. |
| **TOTAL** | **26** | No silent PASS: manual/private bridge/QA gating remains independent of new Next Action UI. |

## Known remaining limits and user intent

- Browser source evidence **does not equal Human UX acceptance**. Owner screenshot in separate ChatGPT conversation showed only one host-rendered button; PR #174's guidance cannot install a permanent ChatGPT UI control.
- Native Hub Next Action E2E checks navigation and read-only canonical projection; **real multi-device persisted task intake with simultaneous writes/transactional freshness CAS** is not covered by this E2E slice. Current intake is coded but not independently proven across concurrent authenticated sessions.
- Graph Intelligence Studio #166 remains an independent Draft; GitHub reported mergeability TRUE at the final readback, but semantic integration and its own independent acceptance remain UNVERIFIED. Full integrated Graph live view and authorized Codex realtime runner are NOT VERIFIED. Do not cherry-pick 65 files blindly or announce live Agent operation.
- Independent Reviewer A/B identity/verdict, authenticated constitutional ratification and Production authority remain separate human/security gates. Do not merge/publish #173 based merely on ordinary CI checks.
- `main` currently has only merged non-normative v2 ChatGPT guidance from #174; ACTIVE normative/version/contract/template remains 1.3.0.

## Current work package and next gate

**NEXT ACTION:** Close exactly the missing opt-in test/identity groups via disposable correctly scoped QA environment and independent GitHub App credentials, then complete Reviewer A/B and exact-revision product UX/release review. Continue PR #166 Graph conflict reconciliation separately within its existing boundaries; do not duplicate its control plane. **NO further PowerShell roundtrip needed** for the Node/Next.js/PostgreSQL/Playwright evidence already collected. Stop for real authenticated human/credential gate, not generic progress input.

**Status:** `SOURCE_CODED_AND_NODE_BUILD_POSTGRES_PLAYWRIGHT_VERIFIED` for scoped source tree; `RELEASE_GATE_BLOCKED_26_SKIPPED`; `PR173_DRAFT`; `NOT_MERGED`; `NOT_DEPLOYED`; `CONSTITUTION_1.3.0_ACTIVE`.
