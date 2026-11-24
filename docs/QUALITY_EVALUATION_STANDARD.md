# Blueprint OS — Two Independent Quality Evaluation Standards (A/B) v1

**Status: DRAFT operational proposal; NOT ACTIVE, NOT RATIFIED.** The ACTIVE 1.3.0 Constitution and the existing WorkPackage / QualityGate / GateEvidence system remain the only normative implementation/release owners. This document specifies **TWO INDEPENDENT RUBRICS**, **NOT two human reviewers**. “A/B” here always refers to two distinct dimensions of what makes a product worth building. A technical engineer or a human user can supply evidence in their domain; nobody's job title substitutes for measurable success.

- **A = Technical Excellence & Century-Scale Design**: Is it correct, cohesive, stable, maintainable, reproducible, safe, recoverable and efficient through upgrades, faults and changing dependencies?
- **B = User Value & Problem Resolution**: Why does it exist? Whose real problem does it solve? Does it actually improve their task, accuracy, time, cost, clarity and experience, based on observed use rather than a developer's assumption?

**Acceptance requires both A and B independently meeting their own standards.** No average of A+B, no “beautiful but broken”, no “perfect engineering but nobody needs it”. The scorecard cannot confer constitutional review, merge or Production authority.

## A — Technical Quality (12 controls; 100 points)

| Criterion | Weight | PASS threshold | Proof required |
|---|---:|---|---|
| Specification and contract coverage | 10 | 100% of in-scope requirements have executable or verifiable checks | Requirement-to-test matrix; versioned SHA |
| Conflicting sources of truth | 8 | 0 active contradictory canonical values/rules | Ownership map; cross-module negative tests |
| Critical regression tests | 12 | 100% pass at candidate SHA | Reproduction + before/after CI; no test suppression |
| Open P0/P1 defects | 12 | 0 | Issue/incident ledger cross-check |
| Open critical security findings | 10 | 0 | Security/negative authorization evidence |
| State consistency, sync/concurrency invariants | 10 | 0 violations | CAS/idempotency/replay/version/conflict tests |
| Restart/crash recovery | 10 | 100% of declared critical recovery journeys pass | Fault -> restart -> recover same state |
| Migration, backup and restore | 10 | 100% of applicable source-critical paths pass | Versioned migration, rollback, restore, corruption cases |
| Fault-injection endurance | 6 | 100% pass across ≥30 trials | Network loss, stale cache, retries, quota, partial failure; no forced manual reset |
| Matched p95 performance regression | 5 | ≤+10% latency, ≥100 matched baseline + ≥100 candidate samples | Repeatable requests/render, same fixture and environment |
| Incident observability | 4 | 100% of critical faults traceable with sanitized logs/status | Actual event/operation log with no secret exposure |
| Offline core journeys **if claimed** | 3 | 100% of in-scope journeys pass disconnected | Genuine offline test; app-specific boundaries |

Total = 100. A must score ≥90; **every critical control also must pass independently**. Missing evidence, false N/A and incorrect SHA block the result even if nominal score ≥90. All percentages use an explicit numerator/denominator; claims without matched baseline or required sample size are unverified. A 100-sample observed correctness fraction is still a descriptive sample estimate, **not a statistical guarantee** of future 99% correctness; uncertain/high-consequence projects must strengthen confidence and sampling through their existing risk-specific QualityGates.

**“100 years without reset” is an architectural direction, not a claim of 100 years of demonstrated uptime.** It means no routine user reset or destructive clean-slate operation to keep functioning: forward-compatible data, schema migrations with reversibility, portable formats and dependency replacement, crash-recoverable writes, backup and integrity checks, observability, bounded retries and reproducible releases. Test faults and migrations regularly; do not invent century-long operating evidence. A bug-free guarantee is not scientifically credible.

## B — User Value & Outcome (10 controls; 100 points)

| Criterion | Weight | PASS threshold | Proof required |
|---|---:|---|---|
| Real user problem and baseline validated | 10 | 100% of stated top problems traceable to real user observations; ≥5 | Actual target audience, current workaround and pain, before-building evidence |
| Essential user task completion | 20 | ≥95% success; ≥40 observed task attempts | Realistic task scripts; observed results, not only buttons rendering |
| User time/effort improvement | 15 | ≥20% improvement from matched baseline; ≥20 before & after | Time, steps, rework or error effort measured on the same representative task |
| Output solves task correctly | 15 | ≥99% correctness; ≥100 observations | Useful result checked against trusted task oracle |
| First use without instructions | 10 | ≥90% unassisted success; ≥10 sessions | Fresh-user onboarding and first task |
| Accessible user task completion | 8 | ≥95%; ≥15 sessions | Keyboard, screen reader and appropriate assistive pathways |
| User-visible task error rate | 8 | ≤2%; ≥100 observed attempts | Errors blocking or misleading a user, separate from console errors |
| Repeat-use usefulness | 7 | ≥65% continuing value; ≥20 observations | Actual repeat sessions/returning useful outcomes, not vanity views |
| Truthful status comprehension | 5 | ≥95%; ≥15 user tests | Can users distinguish “saved locally”, “pending sync”, “offline”, “done”, “error”? |
| Cost/friction regression | 2 | ≤0% worse vs matched baseline; ≥20 before & after | Cost, permissions, clicks, unwanted network use or support burden |

Total = 100. B must score ≥90 with all critical criteria passed. **B evidence must come from actual or structured user-oriented observation**: \`user-study\`, \`field-observation\` or \`structured-user-feedback\`, linked to a source record at the same candidate SHA. A green build, CI screenshot, engineer assertion or hypothetical persona **cannot** stand in for a real user outcome. Personal details must remain private; only anonymized aggregated measures and safe evidence references may appear in GitHub.

**A pilot / prelaunch product may have an A technical score but B remains NOT VERIFIED**, not automatically 100 or “not applicable”. User validation may be staged with few people, then expand; the published criteria must not be bypassed by choosing an empty sample. When representative users are not yet available, record the precise unmet condition and collect data later. Avoid turning “user-value” into opinions about colors or visual beauty.

## Independent completion and impact

A candidate passes these *declared threshold checks* only when both separate axis scores reach ≥90 and all mandatory applicable criteria have exact-source traceable evidence. The evaluator returns \`technicalScore\`, \`userValueScore\` and \`aggregateScore=null\`. Each axis carries its **own blockers**; the combined result can only be \`BOTH_AXES_DECLARED_MET_ONLY\` or \`BLOCKED\`. A failed axis cannot be rescued by a higher score in the other one.

**Authority and truthful verification limits:** the deterministic CLI checks numeric values, evidence type, URL format, minimum sample and the expected 40-character source SHA. It does **not** automatically fetch and verify that a linked CI run or user study actually proves the asserted number. This must be checked through the canonical QualityGate evidence process. It does not produce a reviewer identity, automatic GitHub APPROVE, merge, ratification or publish. This separates *what success means* from *who can authorize release*, without requiring two people merely to have two sets of criteria.

Apps are diverse: web, local desktop, hardware controller, learning software, personal health data and online-specific service have different critical journeys. Offline applicability is **declared honestly** (\`context.offlineClaim\`), not forced into identical technology. Every app must demonstrate its real stated capability and its real nonapplicable boundaries.

## GitHub-first deterministic scoring

The source policy is \`control/quality-evaluation-standard.v1.json\`. The evaluator is \`scripts/evaluate-quality-evidence.mjs\` (Node24, no external service). A candidate JSON has:

- \`schemaVersion: "2.0.0"\`, \`repository\`, full \`sourceRevision\`, \`context: {offlineClaim: boolean}\`;
- \`axes.technical.metrics\` and \`axes.user_value.metrics\` keyed by the published metric IDs. Each record supplies numeric \`value\`, exact \`sourceRevision\`, \`sourceUrl\` in the same GitHub repository, appropriate \`evidenceKind\`, \`sampleCount\` and \`baselineSampleCount\` where relevant;
- \`axes.*.notApplicable\` with a truthful reason of 20+ characters for metrics *explicitly conditional* on the capability not claimed. Core A and all B metrics are never waived by N/A.

Run against the actual GitHub PR head, NOT a synthetic merge commit:

\`\`\`sh
node scripts/evaluate-quality-evidence.mjs assess path/to/evidence.json --expected-sha EXACT_40_CHAR_PR_HEAD
\`\`\`

Exit 2 means invalid or blocked evidence; exit 0 means merely **declared thresholds met**, not verified independent QualityGate or authorization. This tool **must not** be fed fabricated perfect scores just to turn CI green. Automated unit tests use intentionally synthetic fixtures strictly to test evaluator logic; those fixtures are not product evidence.

## Continuous improvement — each axis learns separately

The durable source of learning is the existing [canonical Hub Issue #159](https://github.com/BlueDragon33/Software-Blueprint-Hub/issues/159), not another reviewer repo or new approval ledger. Each recorded error/observation has a project, exact SHA, date, **axis** (\`technical\` or \`user_value\`), category, evidence link and truthful closed / first-attempt-fixed / reopened / regression flags. Previously observed four technical incidents are tagged **technical**, remain \`closed=false\` until merged/accepted and do not inflate first-fix completion.

The read-only \`scripts/collect-quality-feedback-from-github.mjs\` extracts explicitly marked \`BLUEPRINT_QUALITY_FEEDBACK_V1\` JSON blocks from Issue #159. The GitHub Action may recalculate when such comments are submitted after adoption, or on a PR for proof of behavior; read-only \`issues\` and \`contents\` permissions, no mutation. The assessor's \`learn\` function groups observations into two separate feedback channels and only proposes a targeted improvement once ≥3 similar, evidence-linked incidents occur across ≥2 repositories **within the same axis** in a rolling 90-day window. A technical incident suggests a missing regression/invariant test; a B failure suggests a missing realistic user-task or outcome experiment. Mixed A+B signals **are not falsely conflated**.

Trends (per axis) include first-attempt correct fix target ≥85%, reopened rate ≤5%, introduced regressions ≤2 per 100 closed changes, with a minimum of 20 closed events before trend percentage is interpreted. Additional per-project before/after outcome metrics can be added via versioned QualityGate proposals, not automatic changes to this policy. Every accepted lesson should be tested on subsequent projects and revised if it causes false positives or misses real defects.

**Self-training ≠ model weight retraining.** This is evidence-based feedback calibration: keep a history of error modes, improve checks, run new negative cases, compare later defects and update proposals only after a review. **No automatic threshold relaxation, zero-defect guarantee, source-code patching, silent data collection, or Product PASS.**

Run:
\`\`\`sh
node scripts/evaluate-quality-evidence.mjs learn path/to/structured-feedback.json --at 2026-11-24
node scripts/collect-quality-feedback-from-github.mjs --at 2026-11-24
\`\`\`

Example marker format (synthetic illustration, **do not post as a real incident**):

\`\`\`text
<!-- BLUEPRINT_QUALITY_FEEDBACK_V1
{"id":"example-001","axis":"user_value","repository":"BlueDragon33/Bauman-master-ai-system","revision":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","date":"2026-11-24","category":"unhelpful-task","evidenceUrl":"https://github.com/BlueDragon33/Bauman-master-ai-system/issues/373","closed":false,"firstAttemptFixed":false,"reopened":false,"regressionIntroduced":false}
-->
\`\`\`

## PR #372 example — two axes tell the truth

[Bauman #372](https://github.com/BlueDragon33/Bauman-master-ai-system/pull/372) candidate \`1e0cb233f4fef2be6f759c175acaa7aa7a394762\` has 4/4 CI and 16/16 tested localhost-only browser routes, 0 observed uncaught browser exceptions. **A has partial real technical evidence**; crash recovery and full data migration/restore for the entire app, security, p95 and fault-injection evidence remain separate. **B has no representative end-user task-outcome dataset in this scoped PR**, so B remains NOT VERIFIED. These are not the same kind of quality, and no reviewer disagreement can turn these missing metrics into PASS. Full disconnected cold-start and backup/restore remain in [Bauman Plan #373](https://github.com/BlueDragon33/Bauman-master-ai-system/issues/373).

**Release and amendment boundary:** Constitution ACTIVE 1.3.0 unchanged. This Dual-Axis Quality Evaluation is proposed as an operational adjunct to existing gates, not a new independent human-review mandate nor a grant to remove existing ones. PR #177 stays Draft until approved through existing governance. No merge, ratification, paid service, PowerShell/Work or Production change from this proposal.
