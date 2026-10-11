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

**Collision check:** existing draft PR #97 proposes measurable computed contrast UX gate. Treat that proposal as an independent amendment candidate. Do not duplicate its WCAG/contrast authority within 1.3. Coordinate impact and version sequencing at publication time, rebase/renumber candidate as needed. Neither PR is evidence of active 1.3 law.

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

