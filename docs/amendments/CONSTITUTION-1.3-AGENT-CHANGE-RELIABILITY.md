# Proposed Constitution 1.3.0 — Agent Change Reliability & Evidence-Driven Progress

Amendment ID: **constitution-amendment:1.3-agent-change-reliability-20261009**

Base authority: **blueprint-os:universal-century-grade@1.2.0** (ACTIVE)

Candidate authority: **blueprint-os:universal-century-grade@1.3.0** (PROPOSED, NOT ACTIVE)

Stage: **DRAFT / IMPACT REVIEW REQUIRED / HUMAN RATIFICATION REQUIRED**

Proposal source: Software-Blueprint-Hub main, SHA **6b66e0cf7fdc63f6a790b2cdd2db3102caf271bc** at proposal creation.

This proposal carries **no** Constitutional ratification, Quality Gate PASS, project mutation authority, Production authority, release consent, or permission to change another repository. It must never be represented as an effective 1.3.0 law before completing the canonical amendment lifecycle.

## 1. Problem and purpose

The 1.2.0 Constitution already mandates root-cause analysis, source-of-truth discipline, regression tests, human UX acceptance, exact evidence and operational sovereignty. The gap to close is **operational enforcement during long-horizon Agent execution**: successive locally plausible edits can introduce regressions, duplicate business logic, UI accumulation, unauthorized overwrites, and unverified completion assertions despite a compliant adoption manifest.

**Prime outcome:** Each accepted change preserves proven product invariants and produces verified value, not more architecture, files, dependencies, prompts or paperwork.

Do **not** create a separate Constitution product, an eighth pillar by default, a second source of truth, or a requirement that all changes run the entire expensive release suite. Blueprint OS remains the canonical engineering compass for every governed project.

## 2. Proposed constitutional strengthening (normative candidate)

The following requirements should strengthen the existing Product Engineering, Architecture, Data, UI/UX, QA + Auto-Fix, Operations, Governance and Long-Term Durability sections. They are proposed text, not effective law until ratification.

**R1 — Bounded, evidence-anchored changes.** Every substantive Agent change has a target repository, exact base/head revision, user goal, allowed scope, known baseline, risk tier, applicable checks, observed result and explicit unresolved blockers. Prompt text and chat memory never become source-of-truth.

**R2 — Preserve before extending.** Prefer modifying the correct existing module and retiring verified obsolete paths over parallel files, adapters, UI surfaces and state stores. New modules are valid only with distinct ownership, justified responsibility and tested integration. No unconditional ban on new files or simplistic line-count/complexity score.

**R3 — No unverified success.** A change may be called verified only for the checks actually run at its exact revision. Distinguish CODED, STATIC-TESTED, INTEGRATION-VERIFIED, REAL-UX-VERIFIED, DEPLOYED and OBSERVED. Successful CI/build/adoption checks do not confer Product PASS, Constitutional compliance or Production authority.

**R4 — Root-cause and regression discipline.** Reproduce a defect where practical; identify the first divergence from expected canonical behavior; implement the smallest coherent fix; add regression protection; compare affected existing critical journeys. Never bypass a failing check, weaken assertions, hide errors, add arbitrary sleeps or relabel failing evidence to PASS.

**R5 — Safe overwrites, idempotency and recovery.** No Agent may silently overwrite unrelated files, user data, canonical records, settings, devices, secrets, migration history or deployed state. Enforce version/concurrency checks, operation scope, explicit authority and recovery appropriate to risk. A source-file replacement is not equivalent to permission for destructive runtime mutation.

**R6 — Performance and UX non-degradation.** Risk-appropriate automated measurements must compare important interactive journeys with an identified baseline, using reproducible environments and uncertainty controls. A numerically green benchmark never substitutes for critical human UX review.

**R7 — Bounded autonomy.** Agent may continue autonomously while exact evidence meets the relevant gate and approved scope. After repeated failed attempts on the same unresolved criterion (initial trial setting: three meaningfully distinct fix attempts), stop speculative patching; re-investigate, provide current evidence, and escalate only when necessary. Count attempts per defect rather than per commit to prevent gaming.

**R8 — Continuous traceability.** Record work package, decision, known defects, measured baselines, change/evidence revisions, current blockers and next safe action in durable project-controlled state. Resume long tasks by checking live canonical state and HEAD, not by treating an old chat completion message as fact.

**R9 — Proportional enforcement.** Small localized changes require focused checks; behavioral changes require integration and relevant critical-journey checks; authority, persistent data, schema, privileged devices, destructive actions and Production require stronger established gates. Missing mandatory evidence is UNVERIFIED or BLOCKED as appropriate, never synthetic PASS.

**R10 — Metrics are evidence, not permission.** Optimizing a metric by suppressing defects, skipping tests, minimizing files at the expense of architecture or moving incidents to other Issues is prohibited. Trend metrics guide improvement but may not override an outstanding severe defect or canonical authority boundaries.

## 3. Five standard measured quality indicators

These are an initial **policy design**. Targets must be calibrated after a real baseline and by Blueprint Level, risk and project type. Do not assert current performance from this proposal.

| ID | Metric / denominator | Target | Warning | Escalation | Enforcement type |
| --- | --- | --- | --- | --- | --- |
| K1 | Unique newly introduced defects attributable to a change set, deduplicated by root cause; distinguish detected-and-fixed vs escaped defects | 0 unresolved new regression defects at acceptance | 1 confirmed P3 | Any attributable unresolved P0–P2, or failed required regression gate | Hard change gate by severity; rolling trend separately |
| K2 | First-attempt accepted fixes / eligible fully verified defect fixes, with the first coherent patch counting as one attempt | >=80% over a mature cohort | 65% to <80% | <65% triggers engineering review, **not** automatic PR block | Rolling trend, minimum 20 mature fixes |
| K3 | Confirmed new duplicate production logic/source-of-truth groups vs baseline, excluding necessary generated code/migrations/fixtures/adapters | 0 confirmed new groups | 1 ordinary group for review | >=2 confirmed groups without remediation, or any confirmed conflicting canonical owner | Architecture review; hard gate for source-of-truth conflicts |
| K4 | p75 browser LCP/INP/CLS, plus project-defined server p95 and comparable change-vs-baseline timings | Meet project budgets and no material regression | Reproducible +10% to <20% latency regression | >=20% confirmed on critical journey or breach of a mandatory project limit | Risk-scoped performance gate |
| K5 | Confirmed same-root-cause reopened/recurrent defects / all eligible resolved defects whose observation window matured | <=5% | >5% to 10% | >10% triggers quality recovery plan, **not** blanket PR block | Rolling trend, 14-day mature cohort, 30-day secondary view, min 20 |

### Counting rules

- **Change set**: an atomic reviewable change or PR, with exact base SHA/head SHA, owned work package, tested scope and impact inventory. If one issue is split into multiple PRs, link them so measurements cannot be gamed.
- **K1**: count unique defects, not failed assertions; exclude unrelated pre-existing failures but retain them as known blockers. Confirm escaped regression only with traceable post-merge evidence and attributable revision; mark the 14-day window PENDING until mature.
- **K2**: an attempt is a coherent proposed remedy followed by a meaningful verification; multiple commits before first test still count as one attempt. A recurrence of the same root cause within 14 days revises the earlier success classification. Comparisons must segment severity/complexity and not penalize exploratory new-feature work as a failed defect fix.
- **K3**: token/AST duplication is a *candidate*, not automatically semantic duplication. Review duplicate authority/ownership separately. Measure net **new confirmed** duplicate groups, do not reward deleting useful tests or consolidating legitimately separate modules.
- **K4**: use representative desktop/mobile, browser, data/load, runtime, cache/network and repeated runs. Browser interaction latency should use actual interactions; synthetic lab data cannot be labeled field INP. Candidate initial web budgets: LCP p75 <=2.5 s; INP p75 <=200 ms; CLS p75 <=0.1. Preserve stricter existing project budgets, e.g., Blueprint OS NFR p95 service targets. Treat measurement noise and uncertainty honestly.
- **K5**: link reopened Issues and new Issues reporting the same confirmed underlying defect. New feature requests are not reopen events. Denominator includes only defects sufficiently observed after closure. Before 20 eligible cases, show COUNTS + INSUFFICIENT DATA, not PASS.

Each KPI carries units, measurement source, eligible population/sample size, collection window, baseline revision, tested revision, tool/runtime version, acceptance result, confidence/limitations and artifact reference. Historical KPI trends may be recalculated when a defect is reclassified, with revisioned audit history.

## 4. Gate policy, avoiding over-enforcement

| Risk | Examples | Minimum evidence | Effect |
| --- | --- | --- | --- |
| L1 LOW | text, isolated style, documentation | scoped diff, relevant static/test checks and visual sanity where material | continue autonomously if scoped evidence passes |
| L2 MODERATE | UI behavior, save/readback, cross-app automation, APIs | L1 + focused integration/contract, real workflow regression and state persistence checks where relevant | fail-closed for changed critical behavior; no silent next task |
| L3 HIGH | authority, sensitive data, schema/migrations, privileged device actions, architecture Core, Production | L2 + appropriate existing security/data/migration/restore/release and human approval gates | no authority inference; explicit qualified human consent remains necessary |

Risk can only be raised by actual evidence; downgrades require justification. Do not add mandatory global pipelines for every CSS edit or infer that all B0–B5 projects need identical tooling.

A serious confirmed regression or unsafe overwrite blocks the affected change even if aggregate scores look good. K2 and K5 rolling percentages are advisory, not standalone release authority.

## 5. Anti-gaming and safe-stop checks

- Reject evidence from different SHA, stale policies, unverifiable runners or altered test fixtures used to disguise failure.
- Track deleted/skipped tests, weakened assertions, new dependencies, clone candidates, output bundle growth and unexpected changed-file reach.
- Detect and flag surprising file writes outside declared scope. Preserve genuine artifacts, migration history, schema records, user data and audit trails; Git history alone is not a substitute for runtime backup.
- Stop and record BLOCKED/UNVERIFIED when mandatory readback, integration credentials, runtime UX evidence or protected environment access is unavailable; do not fabricate success.
- For a blocked fix, retain the smallest useful diagnosis and a precise next action, avoiding endless unproductive Agent loops.
- Project-specific approval matrices and security restrictions outrank convenience commands in chat.

## 6. Canonical Blueprint OS integration model

**Blueprint OS is the ecosystem compass and constitutional authority, not the remote executor or owner of every app's business state.**

The intended operational path is:

1. Universal Constitution authority publishes exactly one active version after valid ratification.
2. Each project has a versioned Constitution adoption manifest and canonical Project Profile / Blueprint / Work Package / Quality Gate state.
3. A session/project execution prompt is **generated** from that state, bound to an exact revision and permitted operations.
4. The executing Agent verifies repository HEAD and the effective policy before edits and revalidates evidence after changes.
5. Automated quality evidence is submitted through the project's trusted Quality Gate paths; the Blueprint UI shows status and blockers as projections.
6. Application Management may read safe readiness metadata but cannot approve constitutional changes, forge PASS or obtain Production authority.

**Minimal user-facing command after integration:**

> Tiếp tục [nhiệm vụ] trong [repo] theo Hiến pháp Blueprint OS hiện hành. Tự kiểm tra, sửa lỗi và chỉ báo hoàn thành khi có bằng chứng; không làm hỏng tính năng cũ, tạo logic rác hoặc ghi đè ngoài phạm vi. Giữ nguyên các cổng phê duyệt quan trọng.

For an already selected project inside Blueprint OS, the compact command **“Tiếp tục theo hiến pháp.”** can resolve to the canonical project context, active work package and current effective law, *only when a real integration has supplied this context*.

The application should eventually offer one clear **Execute under Constitution** or equivalent action that produces a trusted, source-revision-bound prompt projection; do not add duplicate buttons or a separate Constitution app. A generic external chat or unconnected Agent cannot magically enforce this phrase: it must have access to the repo/policy/check runners, otherwise report its capability boundary.

No command alone grants merge, Quality Gate PASS, destructive operation, constitutional ratification or Production release authority.

## 7. Impact analysis scope

- **Architecture**: reuse seven existing pillars and gate architecture; avoid speculative eighth pillar. Consider strengthening existing durability/quality gates instead of multiplying global gate IDs. Any new canonical contract is reviewed for schema compatibility.
- **Data/authority**: no extra mutable cross-project source-of-truth; evidence identity includes SHA/run IDs, actor authority and non-sensitive artifact references.
- **UX**: use calm progressive disclosure — active policy, current work, evidence, blockers and next permitted action; do not expose all metrics in every ordinary task screen.
- **Security**: no new authority for AI, providers or Application Management; strict scope on protected writes and release operations.
- **Operations/cost**: primarily reuse GitHub Actions, existing Node/Vitest/Playwright suites and measured runtime observability. L1 lightweight; expensive full release checks only when required by risk.
- **Compatibility**: current projects stay on 1.2.0 until approved publication; no silent policy-version update or retroactive PASS.
- **Evidence**: establish K1–K5 baseline first; test metrics on known defects and deliberate failure fixtures; distinguish false positives, false negatives and insufficient data.

## 8. Implementation and ratification stages

- **DRAFT (this document)**: candidate 1.3.0 requirements, definitions, risks, operational command.
- **IMPACT REVIEW**: inventory affected normative law, contract, canonical template, policy authority, quality workflows and project-level risk; compare against existing gates to avoid duplicates.
- **MIGRATION READY**: prepare per-level deployment matrix (B0–B5) and specifically pilot Application-Management in observation-only mode, without broad policy update.
- **RATIFICATION READY**: collect exact version-set candidate, compatibility tests, adversarial anti-gaming tests, CI release gate and impact evidence.
- **HUMAN RATIFIED**: authenticated human constitutional authority ratifies the exact candidate, separately from AI/chat and production rights.
- **PUBLISHED**: atomically version normative document, machine contract, universal template, policy source, validator/tests and registry; never rewrite historical authority.
- **PROPAGATING**: each repo adopts and implements its own depth-appropriate checks, keeping incomplete gates honest.
- **VERIFIED**: exact source/evidence snapshot proves compliance; production requires separate release authority.

### Initial acceptance criteria for implementation

1. Inject a deliberate failing regression fixture: a change cannot be marked verified despite a successful build.
2. Inject a stale baseline/evidence SHA: fail as UNVERIFIED/BLOCKED, never PASS.
3. Inject a duplicate canonical state owner: flag a blocking conflict, not just duplicate line count.
4. Inject an out-of-scope write and attempted overwrite: block affected operation without corrupting data.
5. Inject unstable performance data: avoid premature block from a single noisy measurement; require repeatability.
6. Inject missing KPI cohort/sample: show INSUFFICIENT DATA, not a zero-rate PASS.
7. Verify an L1 safe change can proceed with fast checks rather than forcing full release suite.
8. Verify that even complete project quality evidence does not authorize Human UX acceptance, constitutional publication or Production deployment.

## 9. Current action and authority statement

**This file is a reviewable proposal only, created on an isolated branch.** The active policy stays 1.2.0; no application code, canonical constitutional contract, Quality Gate state, other repository or deployment is modified by the proposal. The final candidate version and any binding governance changes require explicit impact review and authenticated human ratification under the existing protocol.
