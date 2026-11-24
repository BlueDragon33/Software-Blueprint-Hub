# Blueprint OS — Evidence Quality Scorecard v1 (Cross-Project)

**Status:** PROPOSED operational quality evaluator on a Draft PR. **Constitution ACTIVE 1.3.0 remains normative**. This is a measurable supplement to the existing canonical **WorkPackage → QualityGate → GateEvidence** chain, not a new constitution, review authority, quality database or second governance ledger. The portfolio journal remains [Hub Issue #159](https://github.com/BlueDragon33/Software-Blueprint-Hub/issues/159). Source: \`control/quality-evaluation-standard.v1.json\`.

## Objective: progressively fewer real defects, stronger proof — not easier green labels

The user's engineering goal is increasingly reliable, fast, comprehensible and offline-capable applications. A candidate must be measured, not judged by vague appearance or a model saying "looks fine". Evidence belongs to an exact SHA, defined scope, reproducible run and truthful unresolved blockers. Each project has its own features and risks, but shared rules must not be quietly relaxed.

### 13 measurable controls (100 baseline points)

| Criterion | Weight | Passing threshold | Applicability |
|---|---:|---|---|
| Evidence with identifiable source & test coverage | 10 | 100% | All |
| Required CI checks successful | 12 | 100% | All |
| Open P0/P1 defects | 12 | 0 | All |
| Open critical security findings | 12 | 0 | All |
| Regression test failures | 12 | 0 | All |
| Newly duplicated business logic | 6 | 0 | All |
| Unhandled browser errors | 6 | 0 | Browser |
| Critical user journeys verified | 6 | 100% | Browser |
| Critical accessibility failures | 5 | 0 | Browser |
| p95 latency change versus matched baseline | 5 | <= +10%, >=10 comparable samples each | Performance-affected |
| Real disconnected cold-start journey | 5 | 100% | Full-offline claim |
| Local save + restart + restore | 5 | 100% | Persistence claim |
| Rollback/recovery drill | 4 | 100% | Release candidate |

**Score:** \`100 × sum(weight of applicable passed criteria) / sum(applicable weights)\`; passing candidate threshold **>=90**. All applicable **critical criteria must independently pass**; a 96-point score *never* cancels a P0, security finding, accessibility failure, unknown provenance or skipped gate. Insufficient sample, missing criterion, invalid SHA, untraceable evidence or unjustified N/A = **BLOCKED**. The scoring engine does not query GitHub links or attest that submitter evidence is real: its output is explicitly **SELF_REPORTED_CRITERIA_MET**, not independently verified QualityGate PASS.

**Scope choices:** \`source\`, \`browser_local\`, \`offline_full\`, \`release_candidate\`. A project supplies truthful applicability flags and a specific reason for each nonapplicable metric. Scope \`browser_local\` requires browser tests. \`offline_full\` requires browser, offline cold-start and persistence tests; localhost-with-server PASS cannot fill them. Online-by-design parts such as remote identity, server-issued authority and the existing BOIECH_AI online exception are declared by feature, not faked as offline. Desktop/robotics/hardware use relevant native tests; this policy does not impose identical app architecture.

### Example usage (GitHub or Node24, no external service)

The evaluator is dependency-free and reads a JSON evidence bundle with:
- \`schemaVersion\`, \`repository\`, \`scope\`, \`sourceRevision\` (full Git SHA).
- \`features\`: explicit boolean flags \`browser\`, \`performance\`, \`offlineFull\`, \`persistence\`, \`releaseCandidate\`.
- \`metrics\`: keyed metric IDs, each with numeric \`value\`, source-bound \`sourceRevision\`, \`sourceUrl\` (GitHub run/artifact/PR/issue), and \`evidenceKind\`. For performance measurements also \`sampleCount\`, \`baselineSampleCount\` (>=10 each).
- \`notApplicable\`: meaningful reason for every feature-disabled metric, not an empty waiver.

Run:

\`\`\`sh
node scripts/evaluate-quality-evidence.mjs assess path/to/qa-evidence.json --expected-sha FULL_40_CHAR_HEAD
\`\`\`

Exit 0 means *declared criteria met*; exit 2 means blocked/untrusted input. The expected SHA must be supplied from the actual PR head, **never** the synthetic GitHub PR merge checkout. A self-supplied GitHub URL is a pointer for a separate verifier; it cannot serve as cryptographic issuer identity, human reviewer signature, authority proof or release permission.

**Authority separation:** score = engineering triage; preexisting QualityGate = canonical evidence authority; genuinely distinct independent reviewer = separate gate; human Owner approval = separate protected gate; Production publish = separate exact-SHA release authority. No gate is automatically approved by any number.

## Feedback learning — calibrated by completed defects, not secret self-modification

Keep the underlying original findings, SHA, test runs and decisions in the existing source project and canonical Hub ledger. Export structured **non-sensitive** feedback observations to a temporary input JSON file as needed; do not create another parallel ledger. Each observation has \`id\`, \`repository\`, \`revision\`, \`date\`, \`category\`, \`evidenceUrl\`, \`closed\`, \`firstAttemptFixed\`, \`reopened\`, \`regressionIntroduced\`. Draft PR fixes are **not** marked closed just because CI is green.

\`\`\`sh
node scripts/evaluate-quality-evidence.mjs learn path/to/feedback.json --at 2026-11-24
\`\`\`

- Rolling **90-day** window. Do not invent events or mark outcomes closed without actual source/QA evidence.
- **Recurring pattern trigger:** at least 3 issue observations across at least 2 different repositories. Emit source-linked proposal: add a scoped regression test and inspect root cause. Do not write source code, reweight the rubric, weaken thresholds or grant PASS.
- **Measured trends:** first-attempt fix rate (target >=85%, minimum 20 closed), reopened rate (target <=5%, minimum 20 closed), regressions per 100 closed changes (target <=2%, minimum 30 closed). Under the minimum sample report **INSUFFICIENT_SAMPLE**, not a percent masquerading as confidence.
- Compare real p50/p95, memory/CPU, online request volume and accessibility before/after in applicable project-specific QA. The p95 gate requires matched baseline/candidate samples; don't claim online load reduction without counted requests.
- Reviewer can accept/reject proposed regression patterns. After bounded verified fixes, update the canonical incident, add tests in its correct owning repo and record the versioned revision. Evaluate each proposal's *future* false-negative/reopen rate before adopting any threshold change through the existing Constitution/QualityGate change process.

**This is deterministic experience-based improvement**, not model-weight retraining, automatic threshold drift or a claim that software can become error-free. Zero defects is a goal, never a guarantee.

## Bauman #372 example — limit cannot be overridden

[Bauman PR #372](https://github.com/BlueDragon33/Bauman-master-ai-system/pull/372) at exact \`1e0cb233f4fef2be6f759c175acaa7aa7a394762\` has 4/4 source/Chromium CI success and 16/16 tested local-only routes, no recorded browser page errors; those **do not by themselves supply accessibility, security, performance or independent reviewer proof**. Therefore a complete high-confidence scorecard must mark missing controls **BLOCKED** until documented, not fabricate 100 points. Independent review identity remains \`REVIEWER_IDENTITY_BLOCKED\`. [Offline plan #373](https://github.com/BlueDragon33/Bauman-master-ai-system/issues/373) stays separately \`NOT_RUN\`; true PWA cold-start without a local server and save/restart/restore aren't inherited from localhost tests.

**Promotion rule:** proposed evaluation standard can be adopted only through an explicitly authorized, scoped, exact-head reviewed change. No review/merge/ratification/Production follows from creating this document or CI.
