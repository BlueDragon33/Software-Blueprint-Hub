# C27 — Hub internal Graph read interoperability, security and scoped real Node QA

**2026-11-23 · NON-NORMATIVE SOURCE CHECKPOINT · NOT RATIFIED · NOT DEPLOYED**

**Single portfolio ledger:** [Hub Issue #159](https://github.com/BlueDragon33/Software-Blueprint-Hub/issues/159). This is an evidence attachment to the existing Hub Draft [PR #173](https://github.com/BlueDragon33/Software-Blueprint-Hub/pull/173), not a second ledger or an amendment.

## Live baselines & authority

- Hub #173 started at `a349542e450bc0e9d31bc02f85d113f37163fadc`; C27 **code HEAD** `709c5d899774492bf42448ca788ccd22a4203333` (10 commits ahead, 5 source/test/contract candidate paths changed).
- Application Management Draft [#418](https://github.com/BlueDragon33/Application-Management/pull/418) unchanged: `dd0b7103ac0468647e9450dbf16524ac475eeae7`. Original real **❔ Hướng dẫn** Tool button preserved, blob `fc5202683232e846383385fa0202b57bad15bc70`. Its browser click acceptance remains NOT_RUN.
- Hub `main@4e9c30cd718dca5c4cd01eabaa1a728f63ed25d1`; ACTIVE Constitution 1.3.0, blob `aa7986feeb6027fa52b88751a078c2ba5e8cd0fa`, `productionReleaseAuthority=false`.
- **ACTIVE** `control/application-management.contract.json` Git blob `7525dc3333c51c2b94d83ee353a62719ce15f87c`, `metadataOnly=true`, `endpoints={}`. **No canonical Graph HTTP endpoint, signed consumer identity or private cross-project bridge exists.** This file and the Constitution have **not been modified**.

## Real implementation, not a fake Graph API

New **internal-only**, versioned Hub Graph projection candidate:
- `packages/application/src/graph-read-wire.candidate.mjs` (Git blob `a8a799c9988cf8341cf477e13070655225220e10`), typed declaration `.d.mts` (blob `f547616472cdc3e79cf2f6898a8684fc3bbbebb0`).
- `docs/contracts/graph-read-interop-v0.candidate.json` (blob `c1b65a45a566e12060ac44dee3ccf9e4d2069ba6`) has **`status=DRAFT_NOT_AUTHORIZED`, `enabled=false`, `publicEndpoint=null`, `transport=internal-server-shape-check-only`**. Requires Hub project-scoped PROJECT_READ, independently signed App consumer identity, same-project audience and human approval *before* an external read route may be designed. Identity verifier and redaction review remain NOT_IMPLEMENTED / NOT_ACCEPTED.
- Never imports an App project registry as canonical Hub truth, never writes WorkPackage, QualityGate, release, Agent dispatch or Constitution; accepts only an already authenticated **Hub internal** graph projection *supplied by an appropriately authorized server caller*, not a browser input.
- Validates exact project scope, schema version, semver policy, SHA-256 fingerprint and individual source digests, 40-hex source revision, exact allowed node kind, typed source records, allowed provenance, unique IDs, all edges reference present nodes. **Edge-kind to relation mapping is checked against the actual `packages/application/src/graph-intelligence-view.ts` canonical contracts** (e.g., `depends-on → dependency`, `requires-gate → control`). Caps to 256 nodes / 1,024 edges, rejects overflow rather than silently truncating.
- Copies only bounded, allowlisted non-execution node/edge fields and freezes the result. Even for valid inputs the output **always** says `transportEnabled=false`, `canReadGraphExternally=false`, `canonicalMutationAllowed=false`, `gateMutationAllowed=false`, `releaseAuthority=false`, `agentDispatchAllowed=false`. `recorded-pass` is a stored record value, **not newly attested QA PASS**.
- No HTTP route, deployment config, ACTIVE contract change, cross-project credentials, automatic workflow or Production URL is created by C27.

## Actual tests and defects corrected before acceptance

**Local reconstruction used only public, exact-GitHub-blob bytes:** six paths below were reconstructed and verified `SHA1("blob " + len + NUL + bytes)` equals their GitHub `fetch_file` SHA.
1. Candidate JS module `a8a799c9988cf8341cf477e13070655225220e10`.
2. Candidate test `76c18a6420895df44be626919d4874e87b2c6e49`.
3. Candidate type declaration `f547616472cdc3e79cf2f6898a8684fc3bbbebb0`.
4. Candidate JSON `c1b65a45a566e12060ac44dee3ccf9e4d2069ba6`.
5. Contract guard test `8f7ace20c387c2eee312e45688eac64ee1ebbb37`.
6. Unchanged ACTIVE contract `7525dc3333c51c2b94d83ee353a62719ce15f87c`.

**Real executed command:** `node --test tests/graph-intelligence/*.test.mjs` under **Node 22.16.0** in that independently rebuilt **six-file subset**, **14 tests / 14 PASS / 0 FAIL / 0 SKIP / exit 0**. TAP SHA-256 `371840d441c7e91b9d0f8d434ac72141d0a0149242b189d568be98073b2dda7a`. Strict scoped `tsc --noEmit` on declaration only **exit 0**. Initial source tests found and led to fixes of an ID regex edge case with trailing newline, a `read(undefined)` default-fixture test error, and a missing canonical edge-kind→relation consistency constraint; final source and test blobs reflect all corrections. These are not full Hub CI/TypeScript/Next/Prisma/PostgreSQL/browser QA. No GitHub Actions was triggered.

**Reproducibility:** `c27_hub_qa_verified.zip` in the conversation contains all six exact bytes, a SHA manifest and Node TAP. `c27_hub_node_tap.txt` and `c27_hub_qa_manifest.json` are individual artifacts.

## Blockers & next dependency

**One runtime acceptance dependency:** no authorized full APP #418 checkout with real React/Next/JSDOM dependencies **and** authenticated candidate app session; this environment cannot clone GitHub by DNS. Consequently no full App build, React interaction or Chromium desktop/mobile/Guide/role/reload/performance acceptance. Hub full Node 24 / monorepo CI is also NOT_RUN; the scoped Node22 tests cannot certify Hub production.

For Graph external admission, two further **feature/security gates** remain intentionally CLOSED: an approved signed App consumer identity and a Hub-owned project-scoped read endpoint enforcing existing real actor/PROJECT_READ (with privacy review, audit, negative role tests). The module alone **does not** satisfy these. Real canonical Graph L2/L3 / agent observability and two-video fidelity remain NOT_ACCEPTED; CAS C15-ANA-CAS-01 and independent reviewer 8-case bridge remain OPEN/NOT_RUN.

**Decision:** maintain #418 and #173 OPEN/DRAFT. ZERO-SPEND, no merge, publish, ratify, autonomous execution or new ledger. C28 should prioritize true authorized full-checkout/browser QA; only after identity and project-access gates are engineered and reviewed may an external Graph adapter be added. Keep the actual App **❔ Hướng dẫn** button and the separate **ChatGPT Active Next Action** continuation control.

## C28 — Real Hub PROJECT_READ loader composition, negative scope verification, no external Graph (2026-11-23)

**Source control and human gates:** C28 started at Hub Draft #173 HEAD `e5b391c844ee64393d2424a0cc1456ed655be7d8`; latest C28 **code HEAD** `c121ce1c9740deb5ecde237f08cf76501969b234` has **8 commits, six changed paths** versus that baseline. APP Draft #418 remains `dd0b7103ac0468647e9450dbf16524ac475eeae7` (NO APP source modifications). Hub main ACTIVE Constitution 1.3.0 blob `aa7986feeb6027fa52b88751a078c2ba5e8cd0fa`, `productionReleaseAuthority=false`; ACTIVE Hub→APP contract v1 blob `7525dc3333c51c2b94d83ee353a62719ce15f87c` is unchanged `metadataOnly=true,endpoints={}`. No new public endpoint, merge, ratification, paid Actions, Production or Agent dispatch.

**Concrete internal implementation on the same Hub branch:**

1. `apps/web/src/server/graph-read-admission.candidate.mjs`, blob `a4c07a441e7cdb3ac4389c49521343dddf5570f7`: source-only async admission adapter accepts a loader function **ONLY intended to be Hub's pre-existing** `loadGraphIntelligence`. It canonically decodes an encoded project ID, rejects malformed, double-encoded, control-char and path-like IDs before calling the loader. For the trusted `ready` result it requires **requested projectId == actual Hub profile.projectId == actual Hub Graph.projectId**; rejects missing project, signed-out, forbidden, unavailable, thrown loader, foreign project or forged permissions uniformly, with no project existence/secret leak. It feeds the exact real Graph into C27 `prepareGraphReadWireCandidate`; output still denies every external transport, WorkPackage, Gate, release or Agent authority.
2. `apps/web/src/server/graph-read-handoff.candidate.ts`, blob `2a95299f7b6157938f85d430810f147fff3cac0a`: a **server-only source integration seam** directly imports the existing `loadGraphIntelligence` from `./graph-intelligence` (loader source blob `275d0d34d38ef301c272b82194946580ad3d1104`), where `loadProjectWorkspace` already resolves an actor and performs canonical PROJECT_READ. **No route consumes this seam yet.** The binding itself is not an identity token, an independently accepted external consumer, or evidence of an authenticated runtime call.
3. `apps/web/src/server/graph-read-admission.candidate.d.mts`, blob `8721f2486b80d69847f3faf192802404eec4a3a2`: typed internal scope/loader return union. New original nine-case test source `tests/graph-intelligence/graph-read-admission.candidate.test.mjs`, blob `2011bf681fd9ff871a0710809904da7d1211491e`. The internal schema document `docs/contracts/graph-read-interop-v0.candidate.json`, blob `99d40db41865d6c90c1e80da9f7287197d4e4739`, now records `internalComposition.status=SOURCE_PRESENT_RUNTIME_NOT_VERIFIED`, signed App consumer `NOT_VERIFIED`, full runtime `NOT_RUN`, transport `false`; it remains `DRAFT_NOT_AUTHORIZED,enabled=false,publicEndpoint=null`. The contract guard test blob `13fbb0385d252f81da42f042c2ad589fd6d42364` enforces those exact negative statuses.

**Actual C28 evidence (do not inflate):**

- **Nine GitHub source/declaration/contract/test files** reconstructed into a limited Node QA directory, each verified by `SHA1("blob " + byte_length + NUL + exact bytes)` against its GitHub `fetch_file` SHA: **9/9 byte-identical**. Manifest `c28_hub_qa_manifest.json` in conversation lists per-file blob SHA, bytes and SHA-256.
- **Actual built-in Node v22.16.0 `node --test` on that limited QA directory: 24/24 PASS, 0 FAIL, 0 SKIP, exit 0.** It includes the 14 prior exact C27 tests (10 wire + 4 contract), **one newly changed contract guard test**, and **nine C28 independently authored local Node tests** against the exact new GitHub admission adapter: no external transport, all-denied auth states, scope mismatch, exception/no leak, bad encoding and concurrent project reads. This is **not** 24 new tests, not complete Hub Node24 monorepo or APP Next QA. TAP SHA256 `ddf4f6aeee796d113390a0446cfc10a5eacce9b7188fa490f9090159693bbacf`; `c28_hub_combined_node_tap.txt` and `c28_hub_qa_verified.zip` are attached to this conversation.
- Separately, the **nine original GitHub test callbacks** from `graph-read-admission.candidate.test.mjs` were executed in isolated strict V8 using exact GitHub bytes: **9/9 PASS**. They are not counted among the 24 Node tests and **not** presented as a real Node runner execution.
- TypeScript 5.9 `tsc --strict --noEmit` for the *exact* candidate handoff TS and declaration files exited **0** with an **explicit QA-only stub** for `graph-intelligence.ts`. The actual Hub runtime loader source was inspected on GitHub but was **not** compiled/executed as part of this scoped test. Hub `package.json` requires Node `>=24 <25`, while isolated tests used Node 22; do not claim full Node24 compatibility.
- An initial negative test exposed **double-encoded project IDs** passing source canonicalization; patched by excluding percent and path separators. Another failed due to a test helper's default argument masking explicit `undefined`; patched the test, not the product. Both retested.
- No GitHub Actions were manually invoked; existing cross-project CAS defect C15-ANA-CAS-01 and independent Reviewer A/B eight private bridge cases remain OPEN/NOT_RUN.

**Blocked runtime/release acceptance:** Still no authorized full APP #418 checkout with authentic React/Next/JSDOM dependencies and authenticated candidate browser session, nor full Hub Node24 workspace; full build/typecheck/Node/React/JSDOM/Chromium desktop/mobile/❔ Hướng dẫn click/keyboard/role/reload/legacy redirect/WCAG/10-50-200 timings are NOT_RUN. There is **no signed App consumer identity** and **no approved external Hub read route** even though a safe internal source seam exists. The APP UI must continue showing `HUB_GRAPH_NOT_EXPOSED`, never connected, while the existing APP mandatory ❔ Hướng dẫn remains a wired native button (source blob `fc5202683232e846383385fa0202b57bad15bc70`, browser acceptance still pending). High-density true Hub L0–L3 and observed Agent orchestration from the two source videos remain VISUAL_FIDELITY_PENDING, not substituted by registry classification.

**Safe decision:** Keep Hub #173 and APP #418 both OPEN/DRAFT; Hub Issue #159 is the **single portfolio ledger**. No merge/ratify/publish/new site/paid resource, ZERO-SPEND. **C29 next action:** use an authorized full real checkout and authenticated browser candidate for actual Node24/Next/full Playwright QA; confirm real inter-app signed identity, project audience and negative reviewer-approved authorization before enabling any externally callable read-only Graph API; then evaluate Owner-gated R0/R0.1 release. The ChatGPT Active Next Action remains a real click-to-submit control, not an app executor.
