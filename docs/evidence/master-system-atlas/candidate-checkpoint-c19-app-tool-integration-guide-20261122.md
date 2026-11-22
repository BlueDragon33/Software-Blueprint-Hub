# C19 — Application Management R0 Tool integration and mandatory Hướng dẫn checkpoint

**Date:** 2026-11-22. **Canonical portfolio source:** Hub [Issue #159](https://github.com/BlueDragon33/Software-Blueprint-Hub/issues/159). **Constitution:** ACTIVE 1.3.0, `productionReleaseAuthority=false`, main law blob `aa7986feeb6027fa52b88751a078c2ba5e8cd0fa`. **Hub Draft #173 previous HEAD:** `cdfd71df47fe2863c1c5d9e097e4907a1fd3fe72`. This document is **non-normative evidence only** and is not a second WorkPackage ledger.

## Actual engineering work (not a future plan)
- Application Management [new **Draft PR #418**](https://github.com/BlueDragon33/Application-Management/pull/418) at exact source HEAD `1500389db38dc862bcc37b3a235230bcdde0937f`, from `main@89a89ce2d3d8ed634ee9562c52744a99223a2b2a`; compare shows **20 changed files**, **ahead 25 / behind 0** at that moment and no production/workers/migrations or Constitution changes. New integration PR is based on main because earlier [APP Draft #376](https://github.com/BlueDragon33/Application-Management/pull/376) is **203 commits behind** main. No duplicate Tool route: reuse `/tools/blueprint-compass`; #376 remains open as historical exact-code source, not merged/closed.
- Reuse existing #376 authenticated read-only GitHub API and core with `UNSIGNED_GITHUB_METADATA_ONLY`, `qaPassed=false`, `productionAuthorized=false`, bounded PR/Issue enumeration, source HEAD separation and project/SSO fail-closed checks. No private bridges, no writes.
- Implement **mandatory permanent visible `❔ Hướng dẫn` button** in Tool sticky header, keyboard/disclosure region `#blueprint-tool-guide` mounted even when hidden, instructions for source/gates/Next Action, real Constitution link, no false QA or autonomous runtime. Existing APP and legacy dashboard expose the same Tool once; old Blueprint app URL redirects with authentication; original backend application metadata and policy remain intact.
- Introduce a first visually layered and curved **semantic Registry Neural Atlas** L0/L1, using only existing `projectRepositories.group` and `state`: group → project → state; two semantic classification edges per project. Labels explicitly state that lines are **NOT validated Hub dependency, Graph #173 live, Agent events, QA, or throughput**. Desktop/mobile scroll/reduced-motion and selected project highlighting. Full dense reference-video dynamic L0–L3 fidelity remains a future R1 gate.
- Add/port six targeted tests (API/core/stale UI/integration/Tool/guide) and adapt the two original tests for authenticated legacy redirect/catalog. Connector readback **11 selected source files, 37/37 source predicates** found; this is **SOURCE-ONLY verification**, not executed Node, authenticated browser, Playwright, mobile, performance or full regression QA.
- [Exact APP C19 engineering evidence](https://github.com/BlueDragon33/Application-Management/blob/1500389db38dc862bcc37b3a235230bcdde0937f/docs/evidence/blueprint-os-neural-tool-c19-20261122.md).

## Still blocked / not fabricated
- **App R0 real CI/access/mobile gates**: NOT_RUN. GitHub commit-workflow query for #418 HEAD reported zero pull-request runs when checked; no manual Actions launched. No full typecheck/build or R0.2 10/50/200 instrumented benchmarking. Prior #376 847/847 belongs to an old tree and does not attest #418.
- **Actual Hub Graph integration:** not wired to APP read-only API; existing Atlas canvas uses directory classification only. Hub #173 global CAS C15-ANA-CAS-01 still OPEN, no canonical WorkPackage mutation exposed by R0.
- **Multi-Agent always-on:** not implemented or verified. Real Worker identity, heartbeat, scoped execution and Reviewer A/B 8 protected bridge cases remain gated. P9-019/P9-020 release/ratify authority not assumed.
- **Production:** #418 OPEN/DRAFT, NO MERGE, NO RELEASE. Zero spend, no new website, repo, data ledger, duplicated Constitution or unapproved remote provider.

## Dependency order (all within existing 12 Workstreams)
1. C19 S1: on exact SHA #418, run typecheck/build/full-regression + six focused source/runtime suites; fix only evidenced defects.
2. C19 S2: actual APP authorized browser and phone/keyboard Guide E2E, stale cross-project request and expired/unauthorized negative tests, validate accurate source status and old link.
3. C19 S3: versioned source-authenticated, **read-only** Hub Graph projection contract and exact timestamp/revision to APP; verify no private data leaks, no spoofed graph; replace registry-only Neural panel only after source truth admitted.
4. C19 S4: measure dense full graph L0–L3 rendering/accessibility/performance (against both original user videos); retain permanent Guide button with usability and WCAG validation.
5. C19 S5: independent human/owner release gates for separately releasable R0, then later safe CAS-gated work continuation and bounded worker orchestration.

**Current outcome:** one real public APP draft code PR, one true single Tool entrypoint, mandatory guide button coded, candidate registry neural overview coded, source verified; not deployed.
