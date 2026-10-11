# Constitution 1.3.0 — Impact, Migration & Adversarial Validation Plan

Related amendment: constitution-amendment:1.3-agent-change-reliability-20261009

Baseline authority: blueprint-os:universal-century-grade@1.2.0 (ACTIVE)
Candidate authority: blueprint-os:universal-century-grade@1.3.0 (NOT ACTIVE)
Preparation baseline: main 6b66e0cf7fdc63f6a790b2cdd2db3102caf271bc
Evidence classification: **DESIGN REVIEW CANDIDATE — NOT IMPLEMENTATION EVIDENCE**
Authority: NONE. No ratification, publication, gate PASS, Production permission, or changes to governed applications.

## A. Impact review: reuse first, no shadow constitution

Existing, verified repository surfaces:

| Existing authority | Relevant existing control | Gap to resolve without duplication |
| --- | --- | --- |
| docs/UNIVERSAL-CONSTITUTION.md @ 1.2.0 | Root cause, regression, exact evidence, long-term durability, UX restraint, protected state | Explicit bounded long-horizon Agent procedure and measurable non-degradation |
| docs/CONSTITUTION-AUTHORITY-PROTOCOL.v1.md | Draft -> impact -> migration -> ratification -> publish -> propagate -> verify; human authenticates exact amendment | Review this candidate; do not self-ratify via chat or PR merge |
| docs/CONSTITUTION-ENFORCEMENT.md | Constitution lock, inherited seven pillars and canonical gates, no automatic Production | Bind execution evidence to existing gates instead of creating a competing approval engine |
| docs/PROMPT-ARCHITECTURE.v2.md | Revision-bound prompts are projections; stale prompt invalidation and precedence | Generate compact invocation only after resolving live canonical state, permissions and exact policy |
| docs/CI-TEST-CONTRACT.v1.md | Exact SHA, component and browser checks; failure triage | Risk-dependent checks during each change set; later observation of reopened defects |
| docs/NFR-CAPACITY-BUDGETS.v1.md | Project-specific p95 performance, UI timings, usability, no missing-data PASS | Compare candidate timings with current project budget and verified baseline rather than one universal latency rule |
| docs/CONSTITUTION-COMPLIANCE-ATTESTATION.v1.md | Adoption != compliance; fail-closed absent/stale attestations | K1–K5 are evidence inputs, not automatic compliance/Production approval |
| control/universal-constitution.contract.json | Policy 1.2.0, seven pillars, existing requirement/gate IDs | Prefer strengthening existing requirements; adding mandatory gate IDs only after overlap analysis |
| scripts/check-constitution-authority-set.mjs | Atomic version parity: document, contract, template, policy source and registry | 1.3 publication must update all parts together and pass exact revision check |
| .github/workflows/ci.yml + release-gate.yml | Fast CI and deeper release evidence | Prevent fast green from being misreported as Human UX/Production PASS; do not force full expensive CI for low-risk edits |
| Application-Management Development Live Mode | Autonomous main deployment with regression; heavier gates reserved for Release Mode | Define what is permitted for live development and when L2/L3 requires integration/real-state verification |

**Collision resolution in final review:** PR #97's computed contrast proposal is incorporated into this single PR #98 candidate, under the existing `gate:ux:commercial-quality`. The preserved proposal file identifies consolidation; #97 must not publish an independent 1.3.0. Neither PR is active law. If another version publishes before ratification, invalidate and rebuild this candidate from the real new baseline.

### Assessment by subsystem

| Surface | Change impact | Primary risk | Recommendation |
| --- | --- | --- | --- |
| Universal policy document | Compatible clarification / strengthening | Inflated wording and duplicated commandments | Targeted sections only; preserve seven pillars |
| Canonical machine contract and resolver | Potential minor-compatible change; schema version only if structure changes | Requirement ID collisions and false compliance | Extend existing durability/evidence schema only if necessary |
| Governance/canonical data | Additional per-change evidence records or reuse existing Gate Evidence | Parallel mutable authority and oversized event log | Reuse project-owned evidence; additive versioned schema only when proven needed |
| Agent prompts | Small envelope/behavior addition | Prompts becoming new canonical business truth | Inject active policy digest, scope, risk, gate and authority limits |
| CI workflows | Targeted pre-acceptance checks | False blocks, runaway GitHub Actions cost | L1/L2/L3 rules; cache, run focused suites first |
| QA and issue tracking | Five evidence metrics | Gaming, weak denominators, misattributed regressions | Strict cohort/window and anti-gaming fixtures |
| Web/dashboard | Subtle review surface | Too many cards, UX drift | Show active task, blockers, verification state; metrics via one expandable detail surface |
| Cloud and desktop deployments | Protected release boundaries | Misreading deploy as accepted change | Preserve explicit release approval and safe rollback |
| Multi-project integration | Adoption and calibrated local rules | Uncontrolled forced rollout to 15 repositories | Pilot then staged migration with per-project truthful evidence |

## B. Explicit non-goals and design decisions

1. No new application, duplicated Constitution store, parallel database or globally mandatory paid CI/SaaS.
2. Do not promote a draft policy into 1.3.0 active merely by editing the README, status badge, GitHub Action or PR title.
3. Do not create a global performance p95 threshold that overwrites existing Blueprint OS budgets.
4. Do not ban new files or define fewer LOC as quality; distinct modules and legitimate fixtures remain allowed.
5. Do not treat K2 First-Pass Fix Rate or K5 Reopen Rate as an automatic individual-PR hard gate.
6. No uncontrolled write, destructive overwrite or silent Production approval.
7. No cross-project business-data source-of-truth. The current Blueprint OS bridge remains metadata-only. R11–R14 propose an explicit, narrowly scoped Application-Management identity/device approval owner; no runtime authority changes occur in this draft. Clients remain authoritative for business data, entitlements and session enforcement.

## C. Complete project-classification proposal — 17 observed repositories

**Identity source:** `control/constitution-governed-repositories.json` contains **15 governed repository/branch/Blueprint Level declarations**; that manifest remains the **only canonical governed set**. GitHub repository discovery also surfaced two foundation-only repositories (`ECAD_Design`, `CAE_Simulation`) outside the manifest. Their rows below are **intake recommendations only**: they must not be represented as enrolled, activated or compliant. Do not add them to the canonical list without normal authorized registration and validated Project Profile.

**Unified scale mapping:** B0–B2 = **COMPACT** (small/medium), B3–B5 = **STRUCTURED** (large). The Blueprint Level remains the authoritative recorded level for existing governed projects. Risk L1–L3 is evaluated **per operation** and can require deeper testing/approval even in COMPACT. Project size affects execution overhead, never data/security protections.

### Existing governed projects — 15/15 classified from canonical declared levels

| Repository | Declared Blueprint Level | Proposed execution profile | Situation / architecture drivers | First economical bounded work slice |
| --- | --- | --- | --- | --- |
| `Software-Blueprint-Hub` | B4 | **STRUCTURED** | Governance / contract / publication | Source-truth checks -> exact authority-set -> human review; no self-ratification |
| `Bauman-master-ai-system` | B4 | **STRUCTURED** | Multi-module curriculum and learner state | One actual learner journey -> offline progress/readback -> integration regression |
| `Application-Management` | B4 | **STRUCTURED** | Central operations, auth and multiple managed apps | Reproduce save/bulk issue -> safe patch -> per-app readback and scoped review |
| `BOIECH_AI` | B3 | **STRUCTURED** | Lessons + progress persistence | One lesson -> progress save/readback -> offline/legacy regression |
| `RU_LIFE` | B3 | **STRUCTURED** | Content packs, local-first state and service worker | One mobile pack journey -> offline reload -> SW/cache state proof |
| `Health_Care` | B5 | **STRUCTURED** | High-sensitivity records and permissions | Access isolation -> restore/recovery on test data -> human authority gates |
| `NC03_Modem` | B4 | **STRUCTURED** | Local network, credentials and device control | One real-device config path -> rollback -> safe device-specific verification |
| `ROS-1-2` | B3 | **STRUCTURED** | ROS2 package/controller integration | One reproducible simulation -> boundary verification -> hardware gate where relevant |
| `Math_Bauman` | B2 | **COMPACT** | Scoped educational calculator/learning tasks | One exercise flow -> correctness unit/regression -> state reload |
| `GrowUP_MyChildren` | B5 | **STRUCTURED** | Sensitive child records and recovery | Privacy boundary -> record restore/readback -> no fake acceptance |
| `Hardware_Simulation` | B2 | **COMPACT** | Numerical simulation and reproducibility | One deterministic fixture -> compare numerical output and runtime |
| `MPC_PID_System` | B3 | **STRUCTURED** | Control algorithm modes and numerical safety | One mode transition -> deterministic control regression and timing |
| `CAD_CAM_3D` | B2 | **COMPACT** | Geometry and export invariants | One geometry edit -> export roundtrip -> mesh and UI regression |
| `PriceReport_Tunggiabao` | B3 | **STRUCTURED** | Quotation workflows and persistent pricing | One quote -> persisted total -> export/readback equality |
| `pc-manager-desktop` | B4 | **STRUCTURED** | Privileged desktop actions, packaging and device approval | One Windows action -> real environment check -> signed packaging/rollback gate |

**Declared-level counts:** 3 COMPACT + 12 STRUCTURED = 15 governed repositories. This is a planning map based on recorded identities and known work direction, **not** a 15-project runtime audit or per-repo enforcement receipt. Existing project levels may be reconsidered only through a reviewed canonical Project Profile change, not by casually editing this table.

### Additional observed foundations — pending Project Profile and enrollment

| Repository | Verified present situation | Proposed target | Why | Minimum safe first work |
| --- | --- | --- | --- | --- |
| `ECAD_Design` | Foundation-only README; no PCB editor capability verified | **B3 / STRUCTURED**, *provisional* | The intended Schematic -> ERC -> PCB -> DRC -> fabrication -> CAD interoperability chain comprises several dependent engineering subsystems | Agree one schematic/netlist contract and test a deterministic ERC slice; no simulated PCB-editor PASS |
| `CAE_Simulation` | Foundation-only README; no real solver capability verified | **B3 / STRUCTURED**, *provisional* | Intended geometry -> material/load -> mesh -> solver -> evidence -> visualization -> CAD feedback requires numerical provenance and interface contracts | Validate one study/mesh input -> actual solver adapter -> reproducible result evidence; no simulated solver PASS |

**Why STRUCTURED for a foundation?** Classify the intended supported system, not its present empty file count. Early implementation still begins with **one vertical slice**, not an expensive all-module scaffold or unnecessary management UI. Review B3 against the actual Project Profile and intended release before making it canonical.

### New-project intake: context first, then proportionate plan

A new request is **not enough by itself** to authenticate a Blueprint Level or grant permission. Before coding an ordinary new product:

1. **Discover/reuse**: inspect the declared user problem, existing managed repos/components, target users, required journeys, current working behavior and budget. If already covered by an existing project/app/module, extend the owning project unless a separate product boundary is justified. No automatic extra repository or separate login/backend.
2. **Capture intended scope**: record the product destination (not just the MVP): number of independent modules and essential journeys, external/cross-app contracts, standalone or shared-platform role, offline/persistent state, privileged hardware, high-sensitivity personal/child/health data, and credible impact of failure. Record unknowns as unknown rather than assuming false. Do not infer from file count, prompt length, agent preference or flashy UI.
3. **Recommend Blueprint Level with short reasons**: B0 one-off/prototype; B1 small utility; B2 standalone product with persistence/multiple journeys; B3 multi-module or interconnected system; B4 shared platform, central management or privileged device control; B5 safety-critical/high-sensitivity software. The flags inform a **candidate** only; authorized Project Profile resolution must confirm the effective level.
4. **Derive exactly one execution profile**: B0/B1/B2 COMPACT or B3/B4/B5 STRUCTURED. Independently assign change risk L1/L2/L3; high-risk writes/security/hardware/destructive operations require L3 checks and non-delegable approvals regardless of scale.
5. **Plan from one verifiable vertical slice**: one user journey, owner, inputs/outputs, expected result, preserved behavior, direct file/test scope and next action. COMPACT keeps one short work queue and focused checks. STRUCTURED identifies contracts, dependencies, recovery and Work Package owners **without generating all planned modules**.
6. **Execute and re-evaluate**: current Chat/connected tools first -> reproduce -> minimal fix/build -> relevant real tests -> readback -> reconcile -> next slice. Work/Cloud Browser or Codex is used only for a specific unavailable capability with scoped SHA-bound handoff. A failed or blocked slice cannot create fake DONE; independently safe tasks may continue.
7. **Material change review, not continuous churn**: reassess the Blueprint Level/profile only if real scope changes introduce new sensitive data, hardware privilege, central identity/control, multi-app integration, critical failure risk or substantially broader subsystem dependencies. Record evidence, migration costs, preserved user data, review decision and version before changing canonical profile. Do not silently downgrade to save CI credit.

**Advisory helper:** `proposeNewProjectBlueprintIntake(situation)` in the existing proposal-only evaluator turns a validated structured situation into a *suggested* B0–B5 and an initial minimal plan. Missing facts yield UNVERIFIED. The helper has no repository/discovery access, owner confirmation or authority to write canonical Project Profiles. Human/approved governance continues to control classification publication and any protected operations.

**Universal activation boundary:** this classification and intake algorithm become binding only through ratification/atomic publication of the Constitution and appropriate per-project verified adoption. Until then the active Constitution is 1.2.0 and this section is a proposed migration plan, **not** a declaration that 17 repositories already obey 1.3.

### Risk-to-depth rule

- B0 MICRO: define metric semantics and safe diff checks; insufficient evidence remains unverified, not FAIL solely due to lack of sample size.
- B1 SMALL: focused regression coverage, lightweight duplicate detection, simple performance baseline where applicable.
- B2 PRODUCT: explicit critical journeys, viewport/device comparison, persistence and QA outcomes.
- B3 SYSTEM: cross-module contracts, request-level trace, compatibility and realistic integration fixtures.
- B4 PLATFORM: cross-project boundaries, canonical owner conflict detection, provider/integration failure, release provenance.
- B5 CRITICAL: stronger authorization, sensitive-data integrity, recovery and independent verification appropriate to high consequence.

Blueprint Level indicates minimum depth. A specific high-risk operation raises the gate even within a lower-level project. Do not demand web LCP on an offline CLI/control loop; define the corresponding workload-relevant latency metric.

## D. Proposed 1.3 rollout — measurable, reversible

**Wave 0 — design-only / current PR**
- Review this impact plan and the proposed amendment for overlaps with current requirements and PR #97.
- Produce a draft negative-test catalogue; do not claim tests have run.
- Record unresolved human decisions and policy publication dependencies.

**Wave 1 — observation pilot**
- After separate implementation approval, use Application-Management as the pilot without making 1.3 globally active.
- Collect an initial 7–14 day baseline from existing GitHub Actions, issue history, performance checks, and targeted Automation roundtrip tests.
- First verify that instrumentation does not mutate client policies, secrets or Production state.
- Track cost per PR, false positives/negatives, number of gate bypass attempts, missed defects and real operator time.

**Wave 2 — staged enforcement on pilot**
- L1: static diff + relevant checks.
- L2: critical journey, readback after write, regression; no progression if affected behavior remains unverified.
- L3: existing protected release/security/restore/human gates; no implicit permission.
- K2 and K5 remain rolling decision-support metrics, not blind per-change blockers.

**Wave 3 — Constitutional ratification / publication**
- Prepare one exact candidate version set: normative law, control contract/version manifest, universal template, policy authority, validator and tests.
- Verify compatibility, negative fixtures, exact release revision, and designated authenticated human constitutional ratification.
- Record published evidence; never rewrite old authority history in place.
- If PR #97 or another constitutional candidate publishes first, rebase and revise intended version before ratification, do not assume 1.3.0 remains available.

**Wave 4 — project propagation**
- Confirm new authoritative policy revision.
- Propagate level-specific obligations in batches, not a sweeping code rewrite.
- For each project: update adoption manifest, test changed canonical paths, record precise blockers and verified evidence, retain actual runtime authority.
- Keep governed repos with missing evidence UNVERIFIED/NON-COMPLIANT as appropriate; Production promotion is a separate action.

**Wave 5 — trend governance**
- Review 14-/30-day cohorts and compare changes in escaped regression, first-pass fixes, duplicate owner growth, performance and reopen.
- When alerts do not correlate with real bugs, review instrumentation rather than weakening mandatory safety gates.
- Suspend broad propagation if pilot results show unacceptably high false blocking or hidden regression escapes.

### Rollback and containment

Rollback application code by reverting the exact change via normal protected workflows where authorized, **not** by erasing audit evidence, migrating production DB backwards without plan, or force-pushing canonical history. Observation-only KPI logic should be disableable independently of the real protected quality gates; disabling a required gate needs valid governance approval. Policy 1.2.0 remains the active authority until a valid publication.

## E. Adversarial acceptance test catalogue (specification only)

The IDs below are **planned future tests**, not executable tests already implemented. Expected outcomes are the minimum behavioral proof before a mature change-enforcement claim.

| Case | Injection / setup | Required expected result | Layer |
| --- | --- | --- | --- |
| NEG-01 | Code builds while a previously passing critical test now fails | BLOCK affected change; cannot claim integration PASS | L2 |
| NEG-02 | Submitted test evidence SHA differs from head SHA | UNVERIFIED/BLOCK; reject mismatched artifact | All |
| NEG-03 | Agent sets skipped test/weakens assertion to turn red CI green | Flag suspicious diff; require justification and genuine check | All |
| NEG-04 | New module creates second writable owner of canonical automation policy | Blocking single-source-of-truth conflict | L2/L3 |
| NEG-05 | Save returns HTTP 200 but readback differs from intended value | Fail persistence acceptance; no 'saved' success | L2 |
| NEG-06 | One bulk write succeeds, another fails | Distinct per-app/per-field result; no cross-app reset or fake all-PASS | L2 |
| NEG-07 | Agent writes to a file or record outside declared scope | Reject or require scope review before protected mutation | L2/L3 |
| NEG-08 | Stale record version writes user data | Reject conflict; preserve canonical user data | L3 |
| NEG-09 | One noisy performance sample worsens by 20% | Re-measure comparably; do not auto-block from single sample | L2 |
| NEG-10 | Repeated confirmed critical p95 degradation versus identical baseline | BLOCK when project limit or confirmed guardrail violated | L2 |
| NEG-11 | Fourteen-day reopen report includes same-root-cause bug under a new Issue ID | Attribute to original fix; update K5 and K2 appropriately | Trend |
| NEG-12 | Cohort has fewer than 20 verified fixes/closed defects | INSUFFICIENT DATA; no fake 0% reopen PASS or 100% first fix | Trend |
| NEG-13 | Agent tries repeated speculative patches after three distinct failed attempts | STOP/re-investigate, preserve evidence, do not spin indefinitely | All |
| NEG-14 | An isolated typo-only change is incorrectly forced through full E2E/database suite | L1 fast evidence is sufficient if truly low risk | L1 |
| NEG-15 | A successful CI deploy is reported as an authorized Production release | Must fail authority assertion: only exact approved production gate grants permission | L3 |
| NEG-16 | Adversarial PR removes files solely to reduce duplication score but deletes meaningful tests | Anti-gaming detects weakened coverage; false improvement rejected | All |
| NEG-17 | A CLI control app has no browser metrics | Mark web LCP/INP/CLS N/A with reason, require relevant timing tests | All |
| NEG-18 | A source-specific feature fix creates redundant UI cards | UX critical-journey review flags layout accumulation; no synthetic UX PASS | L2 |
| NEG-19 | Two independent cross-app fixes run in parallel and report unrelated green artifacts | Each artifact must match its respective repository, scope, SHA and gate | L2/L3 |
| NEG-20 | Existing issue is reopened after 30 days | Preserve reopen history and 30-day view; 14-day mature cohort remains historically traceable | Trend |

| NEG-21 | Agent resumes an old chat prompt after main HEAD and canonical policy changed | Resolve live HEAD/active policy and rebase remaining queue; stale checkpoint cannot authorize mutation | All |
| NEG-22 | New prompt suggests redesign while an approved critical defect is unfinished | Preserve active approved goal; record scope delta and re-order only by authority/dependency | All |
| NEG-23 | Two Agents plan a new approval service while canonical Application-Management owner exists | Choose existing owner; reject duplicative service/authority and conflicting parallel writes | L2/L3 |
| NEG-24 | A unit test passes but a legacy critical journey fails after UI/save change | Keep package OPEN/BLOCKED and return to diagnosis, never advance to next dependent task | L2 |
| NEG-25 | An in-scope engineering fix fails three genuinely different attempts | Re-investigate root cause; may switch to safe independent READY package without demanding user approval | All |
| NEG-26 | Cloud Browser credit/quota ends during Preview readback | Record PAUSED_RESOURCE and exact evidence gap; no DONE/UX PASS; resume from concise checkpoint on next authorized session | L2/L3 |
| NEG-27 | GitHub required checks pass but independent human ratification or Production authority is absent | Continue safe unrelated work; protected publish/release remains BLOCKED with precise human action | L3 |
| NEG-28 | Successful merge at SHA A is followed by a new main commit SHA B | Reconcile exact HEAD and rerun affected acceptance; never reuse stale release evidence | L2/L3 |
| NEG-29 | A change adds duplicated page/cards, an orphaned route and heavyweight library despite no user need | Require architectural/UX entropy review, remove unnecessary changes and re-run affected tests | L1/L2 |
| NEG-30 | All issues marked resolved while prompt acceptance, rollback or real persistence readback is missing | Product stays UNVERIFIED/BLOCKED; original goal and required critical journeys must be proven | L2/L3 |

Every eventual implemented test must have isolated deterministic fixture, required input state, assertion, cleanup, evidence SHA/run ID, and no privileged Production write side effects.

## F. Measurement implementation design — no double authority

Prefer **existing** unit/contract/test infrastructure and GitHub Actions artifacts. Required evidence envelope can reuse canonical Gate Evidence or be designed as a backward-compatible projection:

- Identity: repository, projectId, branch, base SHA, head SHA, work package, risk level, active Constitution ID/version/digest.
- Provenance: verifier/tool version, run ID, timestamp, relevant fixture and environment, CI artifact link.
- Stage: CODED / STATIC-TESTED / INTEGRATION-VERIFIED / REAL-UX-VERIFIED / DEPLOYED / OBSERVED, with no level inferred from another.
- Metrics K1–K5: numerator, denominator, eligible samples, scope, confidence/limitations, observation window, baseline, result and blockers; allow N/A and INSUFFICIENT DATA.
- Security: no secrets or sensitive runtime data in stored evidence; per-project ownership.
- UX: default compact status with drilldown; do not create a separate metric-heavy dashboard for every project.

Avoid a single quality score that could conceal a confirmed severe regression. Gate states and aggregate KPI trends are independent surfaces; a 100% score never grants merge, compliance or release authority.

## G. Impact/risk register and mitigation

| Risk | Impact | Mitigation | Acceptance |
| --- | --- | --- | --- |
| False-positive blocking | Agent stalled despite good code | L1 fast path, deterministic focused tests, repeated performance comparisons | Known benign fixture passes without manual workaround |
| False-negative green | Regression escapes despite passes | Known failure fixtures, critical journey coverage, post-merge observation | NEG-01/05/08/10 fail closed |
| Test gaming | KPI improved by hidden skipped tests | Assertion/skip change diff analysis + named owners | NEG-03/16 detect evasion |
| Expensive CI | Workflow time and credit growth | Risk-tier orchestration, reuse artifacts, cached deps | Measured run-cost baseline before enforcement |
| Authority leak | AI/portal reports fake PASS/production | Existing authenticated and exact-SHA protected gate | NEG-02/15 reject |
| UX entropy | More dashboards/cards obscure real work | Progressive disclosure, human critical-journey check | NEG-18 reviewer confirms clarity |
| Migration fatigue | 15 repos falsely declared compliant | Canary pilot, phased truthful adoption | No repo marked PASS without local evidence |
| Amendment collision | PR #97 and #98 both assume '1.3' | Sequence by actual publication and rebase/version intentionally | Reviewed amendment ordering and exact candidate SHA |

## H. Evidence checklist before ratification request

- [x] Draft proposal created in PR #98 without touching active 1.2 authority.
- [x] Mapped existing 1.2 authorities, repo scope, risk and planned negative tests.
- [ ] Resolve PR #97 amendment ordering and any requirement collisions.
- [ ] Review impact on canonical schemas/templates/authority code with exact diff.
- [ ] Produce implementation-ready candidate contract and verification tests on review branch.
- [ ] Demonstrate adversarial checks executing against a real baseline (not merely checklist).
- [ ] Obtain actual Actions/quality evidence at the exact candidate SHA.
- [ ] Complete authenticated Human Constitutional Ratification per governing protocol.
- [ ] Publish/propagate separately; do not conflate with Production.

- [ ] Implement and execute NEG-21–30 as real, scoped continuity tests and perform at least one truthful interrupted/resumed pilot; design-only rows are not PASS.

Current review disposition: **IMPACT ANALYSIS PREPARED, MIGRATION AND TEST DESIGN PREPARED; NOT IMPACT APPROVED, NOT MIGRATION COMPLETED, NOT RATIFICATION READY.**

## I. Practical user command (after real integration only)

"Tiếp tục [công việc] trong [repo] theo hiến pháp Blueprint OS hiện hành; kiểm tra HEAD, phạm vi, rủi ro, test, KPI và bằng chứng đúng SHA. Tự sửa và tiếp tục khi đạt gate; không ghi đè ngoài phạm vi, không sinh logic trùng, không tự cấp quyền phát hành."

"Tiếp tục theo hiến pháp" is valid shorthand only when repo/project, policy, stage and tools have already been resolved in the execution environment. Otherwise the Agent must recover or ask for genuinely missing information. It must never claim code or CI was verified merely because this phrase appeared in chat.

## J. Executable proposal-only evidence (2026-10-09)

**Scope**: non-authoritative candidate evaluator only; no change to active policy, Constitution contract, canonical gate source, project state, or Production.

- Candidate evaluator: `scripts/agent-change-evidence-candidate.mjs`.
- Executable negative fixtures: `tests/source-truth/agent-change-evidence-candidate.test.mjs`.
- CI hook: `.github/workflows/ci.yml`, single `Agent change evidence candidate adversarial self-tests (proposal only)` step inside Fast CI. A duplicate invocation detected during concurrent proposal edits was removed from the draft branch; only one invocation should remain.
- Verified PR head: `ea0e2d0f13c4a0dc9ae6671a63f77346346ab0fa`.
- GitHub Actions Development Fast CI run: [37864240383](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/37864240383); fast-check **PASS**, 33 unit tests run, 33 passed, 0 failed. Existing 1.2 Constitution checks, authority-set check and source-of-truth checks also passed.
- Full release-gate job on this PR run was **SKIPPED by existing workflow trigger**, not PASS. No PostgreSQL/Playwright/Human UX evidence is asserted for this change.
- Follow-up expanded **proposal-only** fixtures add synthetic reopened-root-cause cohort and UI-entropy checks. At draft SHA `411e3ec6e47f3367f3eb8ec32becc07b0a2f9826`, [CI run 37864332475](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/37864332475) passed **39/39 synthetic checks per invocation**; this draft run had the same test invocation twice, which has subsequently been deduplicated. This is not live end-to-end validation.
- The 33 tests verify **synthetic candidate-policy decisions**, including NEG-01/02/03/04/05/06/07/08/09/10/12/13/14/15/16/17/19/20 **at the evidence-evaluator layer only**. They DO NOT prove backend operations, live automation readback, semantic code-clone detection, real user performance, re-open aggregation or UX visual regression.
- NEG-11 (real same-root-cause reopened issues), NEG-18 (real-world UX accumulation), GitHub evidence signature/trust verification, authenticating runId, and end-to-end persistence/privileged-action enforcement **remain not implemented/not verified**.
- In the evaluator, a positive status is strictly `READY_FOR_REVIEW`, not canonical Quality Gate PASS and not release authority; a declared runId alone is **not independently authenticated** and must not be trusted for future canonical attestation.

**Current disposition**: proposal implementation slice verified in Fast CI; **DRAFT, impact prepared but not human-reviewed; migration not executed; policy publication/human ratification gate remains CLOSED**.

**Next prerequisite**: owner/authorized constitutional review of overlap with open draft PR #97, design approval for the implementation-ready candidate authority-set changes, and project-local real-world validation in a separate authorized phase. No merge, publication or propagation is implied by this experimental run.

## K. Single control plane / shared device approval extension (2026-10-11)

User requested one Application-Management entry point for device approval, management, orchestration and coherent UI, avoiding duplicated accounts and management endpoints. R11–R14 and [CONSTITUTION-1.3-SINGLE-CONTROL-PLANE.md](CONSTITUTION-1.3-SINGLE-CONTROL-PLANE.md) record that requirement as candidate law.

Read-only source baseline:
- Hub main: `6b66e0cf7fdc63f6a790b2cdd2db3102caf271bc`, active Constitution 1.2.0.
- Existing PR #98 before this extension: `1b2cc9af2dccaca6b738210ad42660541786f7a0`.
- Application-Management main: `c2fed811a47a63a5050ec806e8b3e4fd843480fd`.
- Existing topology explicitly gives clients their own runtime, registry and audit, and separates operator devices from client devices. Its "no shared device registry" rule requires deliberate migration/clarification: one central approval owner with scoped client identity/session projections, not one shared unscoped table.
- Universal Management Contract already supports Dynamic Catalog, guarded capabilities and zero-code app onboarding. Metadata connection is not authenticated shared identity or remote-admin readiness.
- The live-readback/automation audit is historical evidence of app-owned policy paths; it does not prove a central identity broker exists today.

| Impact surface | Proposed change | Required evidence before rollout |
| --- | --- | --- |
| Application-Management catalog and enrollment | Generic registration and a single operational approval owner | Verified app/environment registration, authenticated policy writes and matched readback |
| Client device gates and login | Accept valid central scoped grants without another account/manual approval | Correct audience/issuer/device proof, session/nonce/expiry and permission tests |
| Cross-origin browser and desktop paths | Reuse central identity without copying private signing keys or cookies | Real origin handoff and replay/CSRF/substitution tests; hardware/desktop checks where applicable |
| Sub-clients | Explicit parent delegation instead of automatic new control heads | Parent/app scope isolation and approved sub-client mapping |
| UI/presentation | Shared tokens, navigation/status conventions and device profile | Desktop/tablet/phone critical tasks and appropriate accessibility/human UX review |
| Offline/local core | Provisioned bounded local verification/degraded behavior | Outage, expiry, revocation freshness and recovery tests without a mandatory new SaaS |
| Adoption/template and contracts | Future management declaration and versioned federation seam | Old/new contract compatibility, staged adoption and truthful missing-capability states |

**Version/compatibility decision remains open:** candidate label 1.3.0 is provisional. Review whether mandatory shared-approval semantics introduce a breaking governance/contract change; resolve PR #97 ordering and any required major/schema version before ratification. Do not silently change existing v1 contract semantics.

Rollout: design/threat review → isolated Preview pilot → explicit central authority/scoped contract integration → one low-risk client → parent/sub-client → staged governed-repository migration. Keep high-sensitivity health/child-data and privileged desktop clients behind their stronger existing gates. Preserve old login/registry paths only as bounded migration adapters; retire them after verified parity, never after a manifest-only check.

The observation-only K1–K5 pilot [Application-Management #337](https://github.com/BlueDragon33/Application-Management/issues/337) continues at its frozen Day-0 evidence revision. It does not test or activate R11–R14. Historical CI references in section J apply only to their named old revisions. This source extension requires fresh checks at its new head; none of the planned federation cases is marked implemented or PASS.

Current extension status: **DRAFT / DESIGN ADDED / FEDERATION NOT IMPLEMENTED / NO CLIENT OR PRODUCTION CHANGE / NO RATIFICATION**.

## L. Prompt-to-product continuity, guarded autonomy and entropy control (2026-10-11)

Candidate R15–R20 in [the Agent reliability amendment](CONSTITUTION-1.3-AGENT-CHANGE-RELIABILITY.md) add a **single continuous work protocol** to existing prompt projection, Work Package, Quality Gate, Release Gate and project-owned audit records. It is a disciplined way to execute the approved prompt, **not** a new platform, app, tracker, constitutional authority or perpetual background service.

### Integration and migration requirements

- **Projection**: augment the existing Prompt Architecture v2 projection, only when implementing the ratified rule, with project/branch, active policy digest, immutable approved objective, risk/scoped operations, current work package and original acceptance criteria. An Agent must explicitly re-resolve state after HEAD/policy drift.
- **Reconciliation**: derive shipped, merged-unverified, missing and blocked work from existing canonical Work Package/evidence sources. Do not convert chat notes or unverified PR descriptions into a second source of truth. One active owner per work slice, deduplicated critical-path queue, bounded independent parallelism.
- **Checkpoint**: reuse the current project work package/runbook or canonical execution metadata. Persist only milestone state and sufficient restart pointers (HEAD, risk, next action, attempts, blockers, evidence, release boundary). No new always-on database or noisy activity feed solely for this amendment.
- **Loop**: inspect -> align intent -> select READY slice -> baseline/root cause -> minimal patch -> risk-scaled tests -> verification -> permitted integration -> readback/UX observation -> remaining-work reconciliation. Failure does not silently advance dependencies; safe independent work can proceed.
- **Entropy**: compare owned logic, route/UI surface, dependency/build output and feature/task flow against the exact baseline. Preserve useful modularity; justify new abstractions by durable responsibility. An entropy candidate is investigated, not blindly counted as a defect.
- **Stop classes**: `ENGINEERING_REINVESTIGATE` is handled by the Agent; `PAUSED_RESOURCE` writes checkpoint without claiming background progress; `HUMAN_DECISION_REQUIRED` names exactly the authenticated non-delegable decision. Existing fail-closed gates remain authoritative in every class.
- **Definition of Done**: separate CODE COMPLETE, TEST VERIFIED, MERGED, DEPLOYED and PRODUCT ACCEPTED. Project finish requires original prompt acceptance + critical-journey regression, release evidence if applicable, retained data/recovery, observed runtime when required, no undisclosed blocking gaps.
- **Cost/UX**: check diff/HEAD/CI before rereading many files; fetch precise paths and reuse trusted evidence. Keep the default UI to current action, blocker and verified progress, with drilldown for detailed metrics. Avoid a newly mandatory full-repo scan, new frequent global CI run or another dashboard.

### Phased enforcement proof before publication

| Stage | Evidence needed | What it **does not** prove |
| --- | --- | --- |
| Design/contract review | Conflict-free mapping R15–R20 to Prompt Architecture v2 and canonical project model, risk/authority review | No runtime automation |
| Deterministic test pilot | Implement NEG-21–30 with fail-safe fixtures for drift, scope, legacy regressions, resource pause and approval boundary | No real browser/Production proof |
| One live low-risk pilot | Genuine project checkpoint -> task -> failing case -> fix -> exact-SHA checks -> resume after deliberate interruption | No universal cross-repo readiness |
| Multi-slice pilot | One blocked package, one safe independent package, genuine unchanged data and preserved legacy journeys | No authority to bypass protected gates |
| Staged adoption | Per-project verified constraints, measured overhead/UX entropy and rollback plan | No immediate 15-repo compliance or Production permission |

**Acceptance guardrail:** introducing R15–R20 must measurably reduce task drift, rework and duplicate surfaces without unacceptable CI/credit/time overhead. Calibrate with real task samples before hard enforcement. A proposal-only green evaluator cannot be called runtime continuity proof. Resolve the simultaneous draft PR #97 before any exact constitutional publication decision; active policy remains **1.2.0** until authenticated ratification and publication.


## M. Universal execution principle — two scales, capability-based delegation (2026-10-11)

**Proposed constitutional obligation, not an optional productivity target:** every governed repository follows a shared goal → scoped change → verification → truthful handoff/closure discipline. Use authorized **current Chat and connected engineering tools first** for everything they can verify and safely change; only escalate the smallest blocked slice to Work/Cloud Browser or Codex when a **specific capability** requires that environment. There is **no percentage quota** for Chat versus Work/Codex and no automatic handoff after a fixed milestone. The executing environment does not gain authority by being more capable. The active Constitution remains 1.2.0 until valid human ratification and atomic publication.

**Exactly two operational profiles, inherited by every project after publication:** `COMPACT` covers **B0–B2 (small/medium)**; `STRUCTURED` covers **B3–B5 (large)**. Existing Blueprint Levels remain intact; the execution profile adds no eighth pillar and no new control plane. Risk `L3` (identity, destructive operation, sensitive data, privileged device, Production, migration) elevates required **checks/authority for that operation** regardless of profile. A low-risk localized edit in a large project still uses proportionate tests.

| Requirement | COMPACT B0–B2 | STRUCTURED B3–B5 |
| --- | --- | --- |
| Execution overhead | One approved goal, direct scoped file/test, one concise checkpoint only when necessary | Ordered canonical Work Packages, dependencies and checkpoint per meaningful transition |
| Test strategy | Fast scoped static/unit/regression and relevant state/UI readback | Focused tests first, add affected contracts/integration, architecture and release checks where warranted |
| Entropy restraint | Prevent unnecessary files, modules, dashboards and repeated user steps | Same prevention plus explicit ownership/dependency/UX/performance reconciliation |
| Continuity | Next safe operation; preserve progress on interruption | Same plus safe parallel independent tasks and exact-SHA dependency reconciliation |
| Human intervention | Only non-delegable authority/intent decision | Exactly the same boundary |

**Mandatory floor for both profiles:** constitutional precedence, authenticated authority, original acceptance criteria, no regression or out-of-scope writes, real evidence, preserved data/legacy journeys and an honest terminal state. `COMPACT` means less bureaucracy, **not** weaker safety. `STRUCTURED` means stronger coordination, **not** permission to create redundant systems.

### Checked-in candidate implementation

- `scripts/agent-change-evidence-candidate.mjs`: pure `resolveExecutionScaleProfile({ blueprintLevel, operationRisk, protectedOperation })` maps B0–B2 to COMPACT and B3–B5 to STRUCTURED; explicit operation risk raises required checks for both without conferring authority. `evaluateExecutionContinuity` requires scale/risk and **scoped test evidence at the exact revision**, rejects missing/failed/stale checks in both sizes, requires declared human review and L3 security/recovery tests on protected operations, and requires structured Work Packages for large projects while permitting a minimal single-goal compact workflow. Unknown scale remains UNVERIFIED. These are candidate-only decisions; real Blueprint source binding remains future integration work.
- `scripts/agent-change-evidence-candidate.mjs`: pure `evaluateExecutionContinuity(snapshot)` detects stale HEAD/policy/goal checkpoint, unknown or cyclic dependencies, competing active packages, architectural/UX entropy, legacy regression, stale evidence, three failed remedies, resource exhaustion, missing original-goal acceptance, non-delegable review/release and absent deployment readback. It returns a **next action only**, not an autonomous executor.
- The same existing file exports `buildMinimalWorkHandoff(snapshot)`, which uses named repo/branch/HEAD/goal ID/work slice/path hints and omits raw chat, secrets and arbitrary project data. It is **untrusted prompt projection**; the recipient MUST re-resolve live canonical permissions/evidence.
- `tests/source-truth/agent-change-evidence-candidate.test.mjs`: synthetic deterministic NEG-21–30 and positive DAG/interrupt/resource/authority/handoff fixtures. These test the pure function, **not** persistent checkpoint storage, live browser, authenticated operator identity, real cross-app integration or Production.
- Exact code/test draft head before this documentation update: `221aab4735fe9c50b9c1f9632e7e4459333ba097`. [Fast CI 38147029150](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/38147029150) PASS: **76/76** proposal evaluator tests and **4/4** source-of-truth detector tests, with no failures or skipped tests inside those suites; the protected Release Gate job was **SKIPPED**. These are unit-level candidate outcomes, **not** authenticated runtime orchestration, constitutional compliance, human ratification or Production approval. Active law remains **1.2.0**.

### Bounded escalation matrix

| Stay in Chat (default) | Work only if unavoidable | Codex only if unavoidable |
| --- | --- | --- |
| Targeted GitHub HEAD/PR/diff/log checks, root cause, minimal code patch, contract/unit/regression tests and CI, scoped docs, PR review, routine authorized merges | Real logged-in multi-screen Preview journey, blocked OAuth/cloud-browser-only UI and device UX evidence that a connector cannot obtain | High-complexity local refactor or platform-specific build/test requiring a full working tree or native environment not available to Chat/GitHub |
| Publish truthful checkpoint at resource boundary and continue independent ready tasks | Use the existing app URL/session, not a fresh parallel site or account | Operate on bounded paths and explicit failing tests, not a broad redesign |

Never use either tool merely because Fast CI is red: first inspect failing job/line and attempt a minimal repair through Chat. Neither Work nor Codex receives authority to ratify policy, approve Human UX, bypass security gates or release to Production.

### One-turn compact handoff contract

Supply **only** project/repo and branch, currently observed exact HEAD, active policy version, approved goal ID + acceptance tests, active Work Package, list of relevant files and failing check/run, scoped permitted actions, remaining blockers, and one concrete next operation. Include a reminder to check for HEAD drift and use the exact live repository/canonical state as truth. **Do not** paste full chat transcripts, old code dumps, entire repo trees, credentials or 15-repository status scans.

A receiving Agent should:

1. Inspect `HEAD`, targeted `git diff`, failing CI job log, relevant test/file and authority state; explicitly invalidate stale evidence.
2. Confirm intended unchanged behavior; reproduce the failure; fix only the owned code path; add focused regression test; rerun relevant CI once for the final coherent patch.
3. Return one short outcome: exact SHA, affected paths, checks that passed/failed, user-facing behavior genuinely verified, remaining blockers, rollback note and next action.
4. If blocked by tools/credits, record `PAUSED_RESOURCE` and exit without simulated deployment or user approval; keep safe independent tasks available for Chat.

### Two-scale adversarial acceptance checks

- **SCALE-01:** All B0/B1/B2 profiles select COMPACT; all B3/B4/B5 select STRUCTURED at the same exact policy/HEAD.
- **SCALE-02:** Missing/forged Blueprint Level, unknown risk and mismatched policy refuse automatic COMPACT fallback.
- **SCALE-03:** Compact may close a genuinely scoped small task without an invented multi-package plan, but must meet the original acceptance criteria and relevant regression checks.
- **SCALE-04:** Structured cannot claim finish with an empty dependency-aware work queue.
- **SCALE-05:** B1 handling a protected L3 operation still requires security/recovery/human-review evidence; B5 handling an L1 typo need not rerun every expensive gate.
- **SCALE-06:** Handoff identifies the profile, exact SHA and minimally required files, includes no percentage target or credentials and grants no authority.
- **SCALE-07:** Project generation/templates and app adoption reflect this common law **only after publication**; an adoption manifest alone never certifies enforcement.

The candidate code tests SCALE-01–06 with synthetic inputs; end-to-end implementation of universal inheritance/generation and real runtime continuation (SCALE-07) remains pending.

### Universal invocation after real integration

"Tiếp tục [nhiệm vụ] trong [dự án] theo Hiến pháp chung hiện hành. Xác định COMPACT hoặc STRUCTURED từ Blueprint Level đã xác minh, giữ nguyên mục tiêu gốc, xử lý tối đa bằng công cụ hiện có, sửa–test–tiếp tục qua các nhiệm vụ an toàn; chỉ bàn giao phần không thể tự làm cho Work/Codex với SHA, bằng chứng, file và phạm vi tối thiểu. Không tự cấp quyền hoặc báo hoàn thành khi thiếu chứng cứ."

This is only a **convenience prompt**. A project must actually resolve its active law, Project Profile, allowed operations, Work Package and current evidence before execution; a chat sentence or generated prompt never substitutes for the authoritative record.

### Remaining proof before Constitutional activation

- Real app-owned checkpoint persistence/readback and interruption-resume pilot for one low-risk project, followed by one multi-package scenario, using authentic project evidence.
- Review compatibility and conflict with PR #97; prepare the exact authority set and honest Release Gate evidence.
- Human constitutional ratification, atomic publication and staged per-project adoption through the existing governance protocol. Production release remains separately authorized.

This proposal does not assert that those activities have already succeeded.

## N. Ecosystem reference model — architecture above project scale (proposal, 2026-10-11)

**User need:** A portfolio of many long-lived, independently deployable products resembles a campus of high-rise buildings, not one taller building. B0–B5 measure the rigor/complexity of each *building*, while E0–E3 describe the **topology and governance of the campus**. The aspirational 100-storey metaphor stands for structural longevity, not a literal count of implemented stories, a quality score, or parity with Apple/Samsung/Huawei.

### Two axes and the current Bauman/BlueDragon Hub

| Dimension | This ecosystem's proposed role | Evidence available / limitation |
| --- | --- | --- |
| Project-level B0–B5 | `Software-Blueprint-Hub` B4 authority-engineering hub; `Application-Management` B4 scoped operational management plane; 13 other registered repositories retain their respective B2–B5 levels | Canonical governed manifest has **15 registered repositories total**, not 15 managed apps plus the Hub. Individual B-levels remain valid |
| Portfolio topology E0–E3 | **E2 Managed Multi-Domain Ecosystem — proposed target** | Registered diverse projects and separate governance/operations roles establish architectural intent. They **do not** prove authenticated interoperation or uniform runtime E2 maturity |
| E3 federation | **Not currently justified**; future horizon only for 2+ independent ecosystem authorities with a verified cross-trust agreement | No E3 federation is established by the repository list or the Bauman Hub product name |
| Newly discovered portfolio seeds | `ECAD_Design` / `CAE_Simulation` provisionally B3 STRUCTURED and potential future E2 members | They are not on the 15-repository canonical membership list and their README describes foundation-only capability; verify Profile/enrollment before counting them as governed |

An application can be B5 yet E0 when standalone, or B1/B2 yet belong inside E2 through a **scoped** contract. This keeps **two project execution modes** (COMPACT/STRUCTURED) unchanged. Ecosystem work coordinates them at the portfolio root, rather than generating a third CI/test regime for every app edit.

### Required ecosystem dimensions (assess individually; do not compress into one fake score)

1. **Architecture and boundaries:** product/domain ownership, core/adapters, contracts and anti-corruption boundaries; no duplicate writable owner of app business state.
2. **Governance and operational sovereignty:** Constitution authority vs app-management authority vs per-app privileges and user data; authenticated delegation, revocation, exact policy versions and clear rollback.
3. **Interoperability/identity:** actual versioned app registration, proven device grant scope, session handoff where permitted, compatibility, traceability and offline degraded behavior. A directory link is **not** integration.
4. **Product experience:** consistent discoverability, navigation vocabulary and account UX **without** identical bloated UIs or unnecessary per-app personal accounts; product independence remains.
5. **Reliability and scale:** blast-radius containment, failure isolation, independent deployments, real cross-app journey verification, capacity observations and backups/recovery appropriate to each boundary.
6. **Economy and ownership:** credit/CI/runtime/provider budgets, dependency minimization, exit paths and proof that shared modules really reduce duplication rather than add operational burden.
7. **Portfolio evidence and growth:** which apps are enrolled, covered by exact-sha tests, actually compatible and verified in the field; unknown/missing evidence stays UNVERIFIED. Metrics must show *verified* integrated surfaces separately from *listed* products.

**Central platform principle:** Blueprint OS owns constitutional engineering governance, not user accounts or product records; Application-Management manages a scoped app/device coordination contract only after real authorization; each managed product owns sensitive business data, domain rules, entitlements, UX and independent release gate. Neither central plane should become an all-powerful Production deployer or a mandatory single shared data store.

### Proportionate implementation for present and future ecosystems

| Decision stage | Action (minimal sufficient work) | Mandatory stop condition |
| --- | --- | --- |
| Portfolio discovery | Read canonical manifest, exact branches/HEADs and app contracts; identify actual product domains and declared governance/operations owners | Missing ownership, contradictory membership or inferred privileges |
| Situational classification | Recommend E0/E1/E2/E3 based on **topology/roles**; separately classify each project B0–B5 and each work item L1/L2/L3 | E2/E3 asserted from app counts, branding or untested integration alone |
| One vertical interoperability slice | Select two necessary participants and one real end-to-end user journey, with shared versioned contracts and owner-scoped test data | New dashboard, duplicated registry/login, out-of-scope write, cross-tenant data leak |
| Contract + identity safety | Test grant scope, expired/revoked approval, compatibility, failure mode and independent recovery (as applicable) | No real authenticated evidence for high-privilege integration |
| Staged expansion | Enroll next app only after existing slice readback/rollback passes, preserving local-first/offline users and separate releases | False PASS, uncontrolled batch migration or unbounded all-repo scan |
| E3 graduation | Prove two independent ecosystems and real cross-trust: identity, revocation, failover and data sovereignty | A single centrally owned 15-app portfolio pretending to be a federation |

**Proposal-only algorithm:** `proposeEcosystemReference(context)` returns a topology suggestion and explicitly `operationalMaturity: UNVERIFIED` with no authority or mutation. Its inputs are situational claims, not authenticated evidence. Unknown, invalid or disconnected portfolio relationships cannot silently claim E2; the same-governance/same-operations-owner case calls for authority-separation review. To declare real E2 operations, separately verify current access/identity, end-to-end flows and cross-app isolation using the authorized tools and gates.

**Migration without disruption:** Leave `control/constitution-governed-repositories.json` and existing B-levels untouched in this proposal; this E-level is a portfolio-level overlay to be ratified and added through the existing canonical Profile / law / registry authority set. Do **not** create a second portfolio ledger, all-app shared DB, a global rewrite or an always-on workflow. A future app inherits the active Constitution and is proposed for the ecosystem only after membership, boundaries, scope and evidence are checked.

**Validation plan:** exact-manifest composition fixture, E0 standalone high-risk app, E1 contract suite, E2 management with independent owners, E3 independent federation, stale/missing topology, false-federation prevention and fail-closed authority. Pure function tests are not an integration pilot. Actual E2 maturity needs one cross-app authenticated test, scoped revoke/failover demonstration, truthful release/rollback matrix and independent human/governance review where required. Active Constitution remains 1.2.0 pending ratification/publication.

## O. Constitutional 1.3 final-review, ratification and release checklist — bounded Work handoff (2026-10-11)

**Status on preparation:** DRAFT; active law **1.2.0**. This is an actionable release-readiness brief, not an authorization to ratify or publish. User preference to finalize is not itself the protocol-required authenticated, append-only ratification record. The Work operator must read the live state again and verify exact current HEAD before any action.

### Concrete pre-publication findings

| Review item | Status at drafting | Required resolution |
| --- | --- | --- |
| Two competing 1.3.0 drafts | PR #98 (R1–R27) and PR #97 (computed contrast UX) are both unratified and target **the same version** | Review once; consolidate coherent constitutional scope or sequence them under explicitly distinct version identifiers. Never publish incompatible dual 1.3.0 authority sets |
| Candidate vs enforceable law | R15–R27 have candidate prose and synthetic unit tests; R11–R14 centralized identity/device federation are **design-only** | Derive one implementable normative set and exact mandatory vs migration-gated obligations; prove the existing canonical template/contract/resolver can enforce it. Do not imply federated account/device approval is live |
| Cross-repo adoption | 15 repositories are listed with B-levels; two engineering foundations are not enrolled | Revalidate latest list; do not mark any app as 1.3-compliant without exact per-project evidence. Record per-app compatibility owners, staged rollout and fallback |
| E2 ecosystem maturity | Intent, distinct planes and a membership list are known; live cross-app identity/isolation is not proven | Verify one scoped cross-app journey including onboarding, permission/revocation and isolated failure/readback. Treat E2 as architectural target until evidence passes |
| Release provenance | Draft Fast CI is green, protected full Release Gate was SKIPPED | After coherent atomic authority-set assembly, run full exact-SHA checks and inspect evidence, not only console status |
| Ratification authority | No authenticated/append-only exact-revision human ratification recorded in PR | Obtain human constitutional decision through the existing authorized path, bind decision to candidate digest/SHA, and keep it separate from Production permission |
| Recovery and supportability | Migration/rollback principles documented, not tested across 15 applications | Preserve published 1.2.0 history, verify restore/forward corrective-release plan, required app compatibility and clear error/reporting on non-adopted projects |

### Work/Codex execution route with minimum credit

1. **REVALIDATE STATE:** Check GitHub PR #98, PR #97, current `main`, existing 1.2.0 authority manifest and `docs/CONSTITUTION-AUTHORITY-PROTOCOL.v1.md`. Read the PR diff, this Section O and targeted tests first. No full repository scan and no repeated 15-repo sweep unless a detected drift justifies it.
2. **INDEPENDENT REVIEW:** Identify contradictions between PR #97 WCAG contrast and PR #98 R1–R27, whether the 1.3 changes are compatible or need a different version class, unchecked security/privacy/release implications, missing test evidence and unnecessary UI/code layers. Document decisions with exact SHA; fix only detected defects, not unrelated app interfaces.
3. **CONSOLIDATE ONE CANDIDATE:** Determine how computed contrast enters the same authorized constitutional version or a sequential later version. Define R11–R14 enforceable capability declarations vs separate future central identity implementation. Bind B0–B5, COMPACT/STRUCTURED and E0–E3 to existing Project Profile, template and governance contracts **without another registry or policy engine**.
4. **PILOT AND VERIFY:** Minimum authentic implementation: one low-risk interrupted/resumed work package and one authorized scoped cross-app enrollment/revoke/readback where available. Fail closed if no authenticated Preview/device identity is accessible; report precisely unverified surfaces. Run focused checks, then once coherent run exact-revision Full Release Gate and independent review of security/UX/contracts.
5. **AUTHENTICATED HUMAN RATIFICATION GATE:** Show exact candidate diff/version/digest and unresolved blockers in the existing authorized ratification interface to the designated constitutional authority. If no authenticated ratification can be recorded, output `RATIFICATION_READY` or `BLOCKED` **without** publication. An ordinary chat authorization or this handoff is not ratification.
6. **ATOMIC PUBLICATION, IF AUTHORIZED:** Publish only after actual authenticated human approval for this exact version. Update normative document, machine contract, universal template, policy source, version manifest, validator/tests and immutable authority record together. Read back canonical digest and policy version. Do not convert a PR merge into implied constitutional publication.
7. **STAGED PROPAGATION:** Roll out per B-level/risk/E-boundary in batches, starting with the already scoped pilot; report per-app adoption separately from compliance. Do not promote or redeploy Production without separately granted Production authority.
8. **FINAL ONE-PAGE RESULT:** Exact branch/HEAD, amendment ID/version/digest, what passed and failed, authenticated ratification record reference if it exists, atomic publication evidence if it exists, per-repository adoption status and **one** next blocker/operation. Never say fully published if the active manifest and runtime law still show 1.2.0.

**Stop behavior:** Continue autonomous, reversible engineering fixes within allowed scope. A missing login/authentication, unsafe trust boundary, disputed amendment/version precedence or required human acceptance is a genuine authority stop, not a reason to invent evidence. If Work quota or browser access is unavailable, leave a minimal checkpoint and return unchanged authority state. No unattended/background-work promise.


## P. Priority intervention — Bauman satellites and computed UX contrast (2026-10-11)

**Scope truth:** This is a **high-priority bounded recovery plan**, not completed product remediation, a curriculum reapproval, a new knowledge database or permission to redesign 18 subjects in one PR. Existing Bauman main used for scoped source inspection: `427dcc14c775890ce422417c6500b2e47c42f2e2`; verify exact HEAD again before Work or any write.

### Source-backed findings (not inferred from a UI screenshot)

- Bauman Main `index.html` loads **22 independent stylesheet links**, in addition to the `platform/ui/bauman-ui.css` aggregate. Old Canva/r1–r4, safe/redesign/reference and readability contrast layers remain active; multiple `!important` layers compete rather than being removed after verified replacement. This demonstrates cascade/ownership complexity; exact visible defect locations still need authenticated browser-computed measurements and screenshot evidence.
- Satellite apps `subjects/ai`, `subjects/research`, `subjects/systems`, `subjects/foundation` include **byte-identical 48,167-character** separate runtime JS blobs, Git blob SHA `3b97b85625c6305132957403e8130dee5bf1709e`. This proves architectural **duplication**, not that each subject's content is identical.
- Representative satellite `index.html` pages expose nearly the same ten-section navigation (dashboard, roadmap, lessons, formulas, exercises, tests, simulations, simulationPractice, assistant, data), irrespective of verified material/real capability. The component system should derive *visible* navigation from trusted subject capability rather than advertise unavailable interactions.
- `subjects/ai/data/lessons.json` and `subjects/research/data/lessons.json` contain repetitive generic exercise instructions and sourceBasis descriptions. `subjects/ergonomics/data/lessons.json` is a richer subject-specific comparison, but its source note itself carefully distinguishes official course metadata from assistant-authored learning sequence. JSON validity, a long lesson and a simulated widget **do not prove** pedagogical quality or official syllabus provenance.
- **Concrete CSS root cause:** Shared `platform/ui/contrast-system.css` uses `--bui-text-on-accent` with `!important` on primary buttons, overriding an earlier correct white foreground. The declared `#101827` text against primary `#2563eb` and `#1d4ed8` returned WCAG contrasts **3.44:1 and 2.65:1**, below 4.5:1 normal-text AA. A bounded Bauman PR `#329` proposes only the shared token correction to `#ffffff` plus arithmetic regression assertions, with no new stylesheet or UI redesign. Verify its exact CI and real computed style before claiming product fix.

### Remediation priority and stopping conditions — do not generate another massive prompt hierarchy

| Priority | One bounded work slice | Measurable acceptance | No-go / stop |
| --- | --- | --- | --- |
| **P0: stop quality regression** | Hold speculative satellite feature/UI additions; reconcile active app and personal progress owners, snapshot current navigation/lesson routes and release/evidence state | Baseline routes, state roundtrip, affected screenshot/selector set and one prioritized defect owner recorded | No bulk deletion, synthetic data reset or overwrite merely to reduce file count |
| **P1: real accessibility defect** | Review Bauman PR #329; compute CSS foreground/background on actual primary buttons, hero, subject cards, selected nav and controls in academic/paper/night/mint at phone/tablet/desktop sizes | All material text/action pairs measured against appropriate WCAG threshold; no unreadable interaction in affected sample; no old regression. Test exact deployed Preview, not tokens alone | If an element fails, isolate its actual winning selector/paint background; don't append another global `!important` or rename a token without new evidence |
| **P2: academic source truth** | Sample official and support content for AI, Research and Ergonomics; label each as `OFFICIAL_VERIFIED`, `EXTERNAL_VERIFIED`, `SUPPLEMENTARY_DRAFT` or `UNVERIFIED`, using real provenance, no fabricated school attribution | Each module has traceable curricular source boundary and reviewable learning outcome; unknown sources show unknown | Do not replace verified student progress or imply AI content is an official Bauman lecturer syllabus |
| **P3: one pedagogical vertical slice** | Rebuild *one* lowest-quality AI module through prerequisite -> concepts -> one genuinely worked example -> realistic practice -> checked assessment/error feedback -> resume/review | Tested correctness, link to module/semester, answer and misconception review, learner readback; qualified content review as appropriate | No mass template rewrite, cloned five-step tasks or UI feature inflation before pilot passes |
| **P4: shared engine with rollback** | Prove four cloned JS blobs have identical behavior, introduce one canonical runtime owner with per-subject configuration/data and migration-compatible entry path; migrate **one** subject first | Independent entry, route, browser state, personal progress, asset and mobile regression match baseline; delete redundant copies only when verified safe | No all-at-once 18-subject replacement or deleting history/data tests as a shortcut |
| **P5: progressive course navigation** | Derive learner-facing tabs from real supported capabilities. Default to what learner actually needs: Resume -> Course Plan -> Learn -> Practice -> Check -> Resources; preserve specialty simulations when verified | One representative module has predictable lesson order, no empty/fake functionality, no duplicated nav and accessible responsive interaction | No new ten-tab shell for every course, no ungrounded 100%-ready badge |
| **P6: UI consolidation** | Only after browser-parity, progressively retire superseded CSS owners from the existing loaded chain into existing token/components/surface owner | Monotonic reduction in proven duplicate overrides, stable real screenshots and computed contrast, layout and performance baseline | No extra `safe-final-vN` CSS layer, blanket redesign or "CSS file count down" with regressions |

### Reusable finite agent loop (R7/R17)

**Failure → evidence → one falsifiable root-cause hypothesis → one bounded diff → focused tests + relevant regression → assess → (PASS/REVERT/REINVESTIGATE)**. Record defect ID, exact touched owner, base/head SHA, before/after observables and next authorized action. At the first failed attempt, **no blind replay**: obtain materially new evidence and revise the hypothesis or stop edits. At three genuinely distinct unsuccessful remedies, halt speculative writes for that defect, preserve checkpoint and obtain deeper root-cause review. No new reports/prompt collections/UIs unless they are the smallest durable evidence needed for an existing authoritative work item. Work/Codex receives only a scoped branch/SHA/failed selector/affected files and acceptance, not a request to "fix all Bauman subjects" in one session.

**Current verified status:** academic source/file inspection and candidate code/test patch on PR #329 are *not* whole-course UX or pedagogy acceptance. Publication of 1.3 itself remains separately governed by authenticated human ratification and full Release Gate. The PR #97 contrast proposal must be reconciled with 1.3 rather than copied as another conflicting WCAG law.

## Q. Final review implementation plan and restart ledger (2026-10-11)

**Goal:** produce one sealed, inactive 1.3.0 publication candidate and exact-revision evidence, preserving active 1.2.0 until authenticated ratification and publication.
**Architecture:** reuse canonical authority paths, validator, locked template/resolver and append-only amendment evidence. A generated publication patch is an inactive review artifact, not a second Constitution or registry. Its temporary overlay is validated with the existing authority-set checker; it never changes the current runtime policy.
**Spec:** Section O and `docs/CONSTITUTION-AUTHORITY-PROTOCOL.v1.md`; implementation is authorized by the final-review work request.

### Task 1 — exact ratification binding
- [ ] Add regression tests: another SHA, another authority digest, missing/malformed candidate evidence and mismatched human decision cannot publish.
- [ ] Use the existing immutable impact/migration evidence IDs as the seal: both reviews refer to the candidate SHA; migration evidence digest is the generated authority-set digest. Opening approval validates this seal; publication compares the exact trusted attestation to it and to the human-approved record version. No new database or approval ledger.
- [ ] Show the existing review evidence in the existing ratification form; no new dashboard.
- [ ] Run application and PostgreSQL authority tests; preserve historical append-only records.

### Task 2 — one complete inactive authority set
- [ ] Consolidate #97 contrast text into #98; keep R1–R28 and seven existing pillars.
- [ ] Explicit immediate obligations: bounded evidence, profiles, ownership/security declarations, accurate capability/status reporting and applicable contrast verification. Central federation functionality remains implementation/migration gated; missing implementation is UNVERIFIED, never exempt/compliant by design.
- [ ] Generate one patch from existing draft text into the canonical normative document, contract, locked template, policy constant and version manifest. Reuse existing requirement IDs, bind each R rule to owners, preserve schema compatibility and all seven pillars.
- [ ] Validate the generated overlay with the existing checker and Blueprint resolver; exercise negative computed-style contrast fixtures on desktop/mobile. Preserve current 1.2.0 files and actual adoption snapshots.

### Task 3 — exact evidence and authority handoff
- [ ] Include the candidate and new negative tests in both Fast and Full Gate paths; run Full Gate once the reviewed candidate is coherent, inspect jobs/artifacts and SHA.
- [ ] Demonstrate durable interrupted/resumed scoped work. Attempt authenticated cross-app journey only on available authorized Preview; no synthetic human approval or invented federation.
- [ ] Obtain independent review; fix identified material defects. Prepare canonical review evidence values and an authenticated approval handoff. No merge/publish/propagation before valid ratification; Production remains separately gated.

**Review focus:** substituted publication SHA/digest; stale evidence/decision versions; malformed contrast colors; profile/risk downclassification; draft federation mistaken for runtime capability.
**Recovery checkpoint:** initial PR #98 SHA `dc67f39ea8337a4bea4b13be0322013747ed06a7`; main advanced to `2952ba75567162b496dc3d007ff260c9b55db6b8` and was merged into the isolated review checkout. Initial 105 candidate tests and 11 focused application/CLI tests passed. Preview showed Policy 1.2.0 and System Owner authentication required. No ratification or publication performed.

## R. Consolidated compatibility decision, evidence seal and remaining authority boundary

**Version class:** 1.3.0 is a compatible minor strengthening of evidence, ownership, execution and accessibility obligations. No existing v1 federation contract or login/session semantics are changed by this review. R11–R14's immediate duties are truthful readiness, explicit authority/ownership and fail-closed trust; the federated access experience is separately migration-gated until CP-01–CP-13 and the affected app acceptance criteria are proven. A later breaking federation implementation requires its own reviewed protocol/schema version. No unsupported app is marked compliant by this distinction.

**Single candidate:** the retained #97 proposal supplies computed contrast law once to #98. `scripts/check-constitution-1.3-candidate.mjs` derives a bounded inactive `CONSTITUTION-1.3-PUBLICATION.patch` from the existing draft and active four-component set, applies it in a temporary overlay with canonical paths and runs the existing atomicity checker. The overlay includes all R1–R28, seven unchanged pillars, two execution scales, independent E0–E3 topology, scoped control-plane migration and computed contrast. Machine rules map to existing locked requirements; the actual Blueprint resolver proves inheritance without inventing gate PASS. Active document, contract, template, policy and version/adoption manifests remain 1.2.0.

**Seal and human workflow:** GitHub CI records `artifacts/constitution-1.3-authority-set.json`, `constitution-1.3-candidate.json` and `release-gate-evidence.json`. Review their exact source revision, four-component digest and full publication-patch digest. Record impact evidence at that Git SHA and migration evidence at the same SHA with the generated authority-set digest; include the reviewed patch digest and Full Gate artifact/run reference in the append-only evidence note. The existing authenticated service verifies this seal before opening/approving ratification and rejects publication with another SHA/digest or another amendment/version decision. The existing form displays the sealed review values; an AI/CI fixture is never a human approval.

**Publication activation remains separate:** the current live runtime intentionally has no configured trusted publication/lifecycle attestation verifier and no publication action. Do not mistake a unit-test verifier or generated JSON for that infrastructure. After the authenticated boundary is available, publication execution must use a real configured verifier and apply the exact approved patch, atomically synchronize the self-adoption/runtime snapshot projections without rewriting other apps' observations, then read back all canonical digests. A PostgreSQL publication record alone does not activate repository/runtime law. No automatic merge, propagation or Production permission is granted here.

**Local verification limitations:** 125 Node adversarial/source tests passed, and typecheck passed after generating Prisma. The first complete local Vitest attempt ran 240 passing tests but could not evaluate the database workspace suite because no DATABASE_URL/PostgreSQL was available (32 integration tests skipped); it is not Full Gate PASS. Local browser installation also returned a truncated download. Exact GitHub Full Gate with its real isolated PostgreSQL and Chromium is required; do not weaken/skip those checks to compensate.

**Restart pilot:** work was resumed after main drift by rechecking live GitHub refs and merging only the current main changes, then reading this checkpoint and rerunning the affected evidence suites. A future resume must recheck HEAD, active 1.2.0, candidate-patch regeneration and current CI; changed source invalidates the sealed candidate. This is a real scoped repository-work recovery, not CP federation proof. Authenticated Preview cross-app enrollment/revoke/readback remains UNVERIFIED until the actual owner session and implemented compatible client boundary are available.


**Independent final review corrections:** pre-publication checks now reconstruct the exact sealed 1.2 baseline after 1.3 activation and verify the regenerated patch against active canonical bytes; they do not require unreviewed follow-on edits. The same patch includes local self-adoption and target-version projection headers, while preserving every historical app observation and attestation unchanged. Runtime activation still requires authenticated publication. Unsupported filters, blending, backdrop filters and text-fill overrides return UNVERIFIED in computed-style contrast fixtures. Ratification SHA/digest values wrap in the existing mobile form. Regression tests reproduced the activation and false-contrast failures before these fixes.

**Concurrent HEAD recovery:** PR #98 advanced to `9035f7961fb5f792daeff0abb54e989192db081e` during final review. Its strengthened R7/R17 and new R28, plus the existing Bauman intervention Section P, were preserved and integrated rather than overwritten. R28 binds to the existing product-purpose requirement and professional learning acceptance; no Bauman product changes, new CMS or pedagogy approval are performed here. Its contrast reference is consolidated into Section 11 of the same candidate, not a competing version.
