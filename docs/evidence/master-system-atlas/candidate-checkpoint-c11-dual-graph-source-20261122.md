# C11 — Reuse Dual Intelligence reference contract; source-only P3-02 candidate

**Observed:** 2026-11-22. **Repo:** `BlueDragon33/Software-Blueprint-Hub`.  
**PR:** #173 DRAFT; **tested source HEAD:** `6ea84955967c8b13a9d693819452145de70fc455`; **tested Git tree:** `d1f249f9ea4325db15c397d79656949c4526711a`.  
**main:** `4e9c30cd718dca5c4cd01eabaa1a728f63ed25d1`. **Constitution ACTIVE:** 1.3.0.  
**Not:** canonical WorkPackage status write, authenticated private integration, human approval, PR merge, constitutional ratification or Production.

## 1. What changed

After C10 identified Dual P3-02 as a code-level dependency and C9 Graph Studio integration as CODED, performed **one bounded source-only slice** on the existing #173 development branch.

Reused five **exact Git blobs** from Dual draft #168 (`b94f7385bd7656167edad98fcf85ff4314acf4bc`) without copying ad-hoc alternatives:

| Path | Source Git blob |
|---|---|
| `packages/contracts/src/intelligence-exchange.mjs` | `afc51d540cc369f748a8e7acddfcaa859ea961e5` |
| `schemas/intelligence-exchange-manifest.v1.json` | `dbd480e5c1151a06de00ea1d4b2dfe5df68c74e7` |
| `packages/application/src/intelligence-reference.mjs` | `688620de20cad7a01a374be7b1860c0951235610` |
| `tests/contracts/intelligence-exchange.test.mjs` | `2ea13cc704a4f38a7f4e30246a61d5e587e85f0f` |
| `tests/governance/intelligence-reference.test.mjs` | `f83a91ca58d5b572f3e011f861b1e78da51f2ab3` |

New narrow **Graph read-only advisory projection** `packages/application/src/graph-external-intelligence.candidate.mjs` reuses `prepareIntelligenceReference` exactly, requires caller-supplied scoped `readTrust`, exact project identity and finite observed clock, caps a batch at 32 references, rejects malformed/foreign/revoked/stale/conflicting/duplicate references, and emits only allowlisted redacted metadata. It **does not** add canonical Graph nodes, mutate Work/Quality Gates, verify external bytes on its own, or claim runtime federation. It requires an authenticated Graph loader before it can be exposed. No new DB, API route, runner, cloud resource or second canonical graph.

New regression `tests/application/graph-external-intelligence.candidate.test.mjs`: **12/12** negative and projection tests (project binding, no trust, duplicate, bad wire, expiry, rejected pin, caller outage, no QA/Owner authority, frozen output). The two reused original test suites contribute 11 additional test cases.

## 2. Exact-source CI

- **[Development Fast CI #45022642721](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45022642721) — SUCCESS** on `6ea84955967c8b13a9d693819452145de70fc455`.
- Native **Node 24: 23/23 PASS, 0 FAIL, 0 SKIP** in the dedicated Dual-Graph source group (12 candidate + 11 original). No V8 substitute.
- **[Central Prompt Workflow Integration CI #45022642790](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45022642790) — SUCCESS** on the same exact commit.
- **[P2 Provider-Neutral Scoped Integration CI #45022642697](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/45022642697) — SUCCESS** on the same exact commit.
- This source-scoped CI does **not** constitute P3-02 authenticated production/reference admission PASS, independent reviewer B, full Release Gate or post-merge QA. Previous C9 QA covers its prior exact tree; do not silently carry it to this modified tree.

## 3. Unfinished canonical Work Package counts unchanged

Original Phase 9 source ledger: P9-001…P9-018 historical COMPLETE; **P9-019 ACTIVE human review; P9-020 PLANNED final acceptance**.  
Original Dual ledger on #168 (Git blob `26fb19e38f6a41e0c234ac623040a1025627d801`): **P3-01 runtime trust**, **P3-02 actual authorized Graph reference admission**, **P3-03 private catalog**, **P3-04 independent cross-project auth/gate**, **P4 federation adversarial/performance** remain incomplete.

Thus **7 named unfinished Work Packages across the two ledgers**. The candidate code here completes *only the source-candidate slice inside P3-02*, **not** P3-02 as a whole. C10's 14 bounded execution stages are still a useful planning decomposition, **not** a promise of 14 ChatGPT turns. The main Hub has 26 open PRs but they are overlapping proposals, not 26 distinct READY items.

## 4. Current one true nondelegable boundary

Eight private GitHub App bridge cases still need two authentic, independent, scoped App identities with live read/revoke verification; #173/#166 have **0 submitted independent GitHub reviews**; A and B repos remain foundation/not attested. No Owner professional-review P9-019 decision, seven-gate P9-020 acceptance receipt or protected Production decision is recorded here. Private DUAL metadata discovery and trusted runtime source pin cannot be supplied by an unverified fixture.

**NEXT SAFE ACTION:** trusted operator supplies an approved, independent, least-privilege Preview/bridge and independent B review; perform genuine pinned 8-case QA, full exact-tree Release Gate, P9-019 then P9-020 in their existing authenticated controls. Independently, where approved runtime trust and private App-Management catalog access exist, bind this *already coded* source adapter and test real P3-01/P3-02/P3-03/P3-04 before Dual P4.

**STOP at nondelegable identity boundary.** No PowerShell needed from Owner now. Do not re-run prior PASS tests, create paid resources, initiate merge/publish, bypass gate or inflate completion count.
