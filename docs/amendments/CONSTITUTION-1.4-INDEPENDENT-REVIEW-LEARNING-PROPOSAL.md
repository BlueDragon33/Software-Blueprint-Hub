# Proposed Constitution 1.4.0 — Independent A/B Review and Evidence-Grounded Learning

**Amendment ID:** `constitution-amendment:independent-review-learning-20261121`  
**Source of authority:** `blueprint-os:universal-century-grade@1.3.0` (**ACTIVE**, Hub `main` 0d0d0bece3afa82aaf5792a64c0d4bab56dc9825 at proposal creation)  
**Candidate:** `blueprint-os:universal-century-grade@1.4.0` (**DRAFT; NOT RATIFIED OR ACTIVE**)  
**Protocol:** `docs/CONSTITUTION-AUTHORITY-PROTOCOL.v1.md`  
**Scope:** Strengthen existing QA + Auto-Fix, Security, Data, Governance & Evolution, and R7–R10/R15–R22. No additional pillar, repository, deployment, persistent store, orchestration control plane, or automatic reviewer authority.

> A/B review must be an independent, source-verifiable technical quality system, **not** two agreeing prompts and not a constitutional human approval. Learning means accumulating versioned, evaluated, retrievable case knowledge; it does **not** mean silently training or changing model weights, self-signing reviews, publishing universal law, or promoting case-specific observations into unverified truth.

## 1. Problem and evidence baseline

The current A/B engineering candidates are valuable, but verification is not deployment:
- Reviewer A [Draft #6](https://github.com/BlueDragon33/Software-Blueprint-Reviewer-A/pull/6) HEAD `266d07ac32fcd00b62179ea142a5395de795e088` — source self-readback, WorkOrder-bound unsigned handoff, local tests; no authenticated independent A execution.
- Reviewer B [Draft #10](https://github.com/BlueDragon33/Software-Blueprint-QA-Worker/pull/10) HEAD `a8affe87a2adeb40d0e0cfd9be6564f59fc6c626` — issuer/CAS freshness and distinct run checks; no authenticated semantic B verdict.
- Hub [Draft #167](https://github.com/BlueDragon33/Software-Blueprint-Hub/pull/167) HEAD `fa6fc33a71a8ba09652fc73cd4a0d2f5f1e8291c`, stacked on [#163](https://github.com/BlueDragon33/Software-Blueprint-Hub/pull/163) — source admission, authority recheck and P3 workflow entry; no joint signed real A/B/authorized journal pilot.
- The Hub already owns `packages/application/src/pattern-governance.ts`, `knowledge-library.ts` and `quality-evidence-graph.ts`; reuse these before designing another reviewer memory store. `createPatternPromotionProposal` already requires distinct projects and explicit publication review. Current tests prove the proposal logic only, **not** the independent authenticity of its source observations.
- Runtime, owner binding and journal access still block real Reviewer B attestation. A reviewer workflow outage must not masquerade as a technical acceptance.

This document is a proposed strengthening, **not an implementation-complete declaration**.

## 2. Proposed normative rules (candidate, NOT ACTIVE)

### IR-01 — Meaningful separation of reviewer duties
Reviewer A owns bounded engineering implementation, self-QA, reproducible tests, and immutable evidence handoff. Reviewer B independently retrieves the target PR and complete changed file scope, verifies exact revision and bytes, conducts adversarial/semantic review appropriate to risk, and returns distinct evidence. Hub alone owns canonical WorkPackage, Prompt Workflow, issuer/authorization, CAS, journal, mandatory Quality Gates and Owner handoff. Same author, same credential, same execution run, copied findings or a green shared CI run can never count as independent A/B review. Agent outputs cannot grant GitHub approval, Constitution ratification, Production or protected mutation.

### IR-02 — Authenticated end-to-end trust chain
Before independence is claimed, verify distinct A/B principals, least-privilege credentials, issuer grant and live revocation, adopted workflow digest, pinned PR number/base/head and source SHA, canonical WorkPackage `meta.recordVersion`, signed scope/TTL, deduplicated journal claim, exact GitHub byte hashes and run evidence. Recheck issuer, source, CAS and expiry **after asynchronous inspection** and before any advisory status is promoted. Missing or stale proof is `BLOCKED/UNVERIFIED`, never PASS. The existing Hub and Reviewer B v1/v2/v3 signed pipelines are the contracts; no competing registry or issuer.

### IR-03 — Depth and coverage by consequence
A Reviewer B assessment must evaluate, as applicable to the concrete change: user requirements and acceptance; correctness/edge cases; architecture ownership and dependency boundaries; security/privacy/threat model and least privilege; persistence/data migrations/idempotency; accessibility and UX critical journeys; performance/resource bounds; test sufficiency including negative and regression tests; operations, observability, backup/restore/rollback and supply-chain implications. Each category is `CHECKED`, `NOT_APPLICABLE` with rationale, `NOT_RUN`, or `BLOCKED`, referenced to test/source evidence. Risk tier (especially B3–B5 and privileged/data/Production changes) determines minimum mandatory coverage. A checklist with no inspection is not a review.

### IR-04 — Findings, fix/re-review and release gating
Report severity P0–P3, exact `path:line` or explicit non-line-based runtime evidence, reproducible hypothesis, affected invariant, test/reproduction and recommended safe correction. Reviewer A may repair only in authorized scope; every new HEAD invalidates prior B acceptance and requires a new B independent readback. P0/P1 unresolved findings block technical acceptance; B's `ACCEPT` is an **advisory** input, never a Quality Gate PASS. Unavailable Reviewer B blocks only the genuinely dependent review/merge/release gates; unaffected, separately authorized work may continue. No A/B outage is permission to waive mandatory safety gates. Use the active R7 cap of three distinct remedies before root-cause re-investigation, not blind loops.

### IR-05 — Project experience becomes traceable learning candidates
After an actual defect, review or successful repair, capture a **candidate case** linking: project ID, WorkPackage, repository and exact SHA, source paths, failure mode/counterexample, root-cause hypothesis, review evidence, tests before/after, fix revision, reviewer identities and scope, outcome, date and risk/domain tags. Distinguish self-reported, mock, local CI and independently verified results. Record confidence and open contradictions; redact secrets, personal information and unrelated proprietary code. Store only permitted metadata and references under existing Hub project/knowledge ownership. Raw chats, model assertions, copied A analysis and unsigned imported articles are not automatically trusted training facts.

### IR-06 — Evidence-gated learning and human curation
Reuse `PatternGovernance` / `KnowledgeLibrary` and canonical provenance rather than a separate model-memory DB. One verified project can support a **project-local advisory lesson**. Promotion to an ecosystem-wide pattern or anti-pattern requires independent attestation and corroboration from **at least two truly distinct projects**, plus explicit authorized human review; project-count alone or forged source strings are insufficient. The curator must not be the sole producer of the reviewed case. Approval produces a versioned, reversible knowledge publication; original case observations remain immutable. Contradictions, regression, security disclosures and staleness require review, downgrade or withdrawal with a traceable record. Only independently validated, scoped facts may be used in future recommendations; knowledge candidates never mutate the Constitution themselves.

### IR-07 — Retrieval is learning, not self-modification
For future WorkOrders, retrieve applicable published/project-local knowledge by technical domain, risk, language/framework, affected component and observed failure class; show source revision, confidence, approval state, applicability/expiry and counterexamples. Reviewers must **revalidate** every recalled pattern against the current source and environment before recommending a fix; do not cargo-cult a previous solution or override present user constraints. A reviewer may propose additions/corrections, but cannot approve its own learning record, alter model weights or increase its authority. Semantic model-backed review is `NOT_RUN` unless an authorized, budget-verified inference capability really executed.

### IR-08 — Measure whether the reviewers are improving
Use a versioned set of human-labeled real review cases, including deliberately injected/known bugs, unseen projects and previous false positives. Track: confirmed defect recall by severity, precision/false positives, P0/P1 escape rate, repeat/reopen rate, first-pass fix verification, independent-source verification rate, stale/forged proof rejection rate, review latency/cost and regressions introduced by suggested fixes. Compare baseline and changes on **held-out** cases; publish denominators, scope, CI vs runtime distinctions and confidence limitations. Re-running the same demonstration case, optimizing only passing tests or reporting an undefined score cannot be called learning progress. No metric overrides an unresolved security blocker.

### IR-09 — Bounded autonomy and honest resource use
Use existing Prompt Workflow and Hub journal for dependency-aware A→B→A repair handoff with finite retries. No self-triggered paid Private Actions, external model or secret provisioning. Verify included runner quota/usage-block settings or actual pre-existing no-cost runner before dispatch; shared owner GitHub connection is not proof of B App independence. If authentic A/B runtime, Owner entry or canonical journal is unavailable, checkpoint **one** blocker and continue other eligible work without inventing another dashboard/orchestrator.

### IR-10 — Owner authority and release policy remain separate
Constitutional ratification/publication/propagation, canonical Quality Gate decisions, GitHub merge approval and Production release remain distinct authorities. This amendment proposal cannot activate itself. Existing 1.3.0 safeguards and separate [DIRECT-PRODUCTION-OWNER-001 proposal](https://github.com/BlueDragon33/Software-Blueprint-Hub/pull/170) are not weakened: optional release Preview is unrelated to the isolated P3 reviewer QA proof. No A/B agent may grant Production, auto-merge or silently waive a mandatory check.

## 3. Migration / implementation dependencies

| Slice | Existing owner | Deliverable and evidence | Exit |
| --- | --- | --- | --- |
| M0 — baseline | Hub governance, existing PR #167 | Readback of current ACTIVE Constitution, exact A/B/Hub heads, reproducible blocker and zero-spend authority | Evidence matrix, no invented PASS |
| M1 — A/B identity | Hub authority + existing A/B repos | Distinct credentials/actor/run, signed scope, independent B Git transport, cross-signature negative suite | Live authentic actor/credential proof |
| M2 — isolated signed pilot | Hub P3 WorkPackage/CAS/journal + current QA scripts | One Owner-bound pilot with exact SHA readback, journal replay denial, B-authored findings/receipt | One full real run; missing authority => BLOCKED |
| M3 — semantic QA | Reviewer B current expert reviewer pipeline | Versioned domain-specific review coverage + reproducible defect eval set, P0/P1 rules and fix/recheck | Held-out labelled results and no critical escapes |
| M4 — learning loop | Existing Hub PatternGovernance + KnowledgeLibrary | Case intake → provenance/consent → B verification → authorized human curation → versioned publication → retrieval → drift/retraction | 2 distinct projects for universal promotion; negative/poisoning tests |
| M5 — propagation | Existing Hub constitutional authority | Impact analysis and project compatibility matrix; Owner ratification; atomic normative/machine/template publication; adoption | Published exact authority set and verified adopter acknowledgements |

**No stage inherits PASS from a previous stage merely because its source code or mock tests exist.**

## 4. Operational acceptance scenarios

1. B uses the same owner token as A, reproduces A's digest, or reuses A's check run → **DENY independent B**.
2. Issuer revoked or WorkPackage CAS/HEAD changes during asynchronous B review → **DENY** on final readback.
3. Two superficially distinct repositories refer to duplicated/unverified observations → **DENY universal knowledge promotion**.
4. Candidate lesson derives from unsigned CI-only evidence or repeats a false positive → **REVIEW_CANDIDATE only**, no automatic knowledge publication.
5. An approved lesson conflicts with current source, becomes outdated, leaks a secret, or causes a regression → **suspend/retract with audit**, no quiet overwrite.
6. A repairs a P1 finding with a new commit → invalidate old B verdict; independent B recheck exact updated HEAD.
7. B is unavailable while unrelated authorized tasks are READY → continue independent tasks, keep dependent Quality Gate/Owner release **BLOCKED**.
8. Current PR has no privilege/data risk → focused coverage with documented N/A; high-risk migration/permission change → mandatory threat/data/recovery checks.
9. Semantic model call unavailable or paid quota cannot be proven zero → **NOT_RUN/BLOCKED**, never fake reviewer intelligence.
10. A/B technical reviews are complete → still require canonical mandatory gates and Owner release/ratification decisions.

## 5. Impact and constitutional ratification plan

- **Architecture:** reuse canonical Hub Prompt Workflow, existing signed Reviewer A/B protocols, Postgres authority/journal, PatternGovernance, KnowledgeLibrary and QualityEvidenceGraph. Do not copy project databases or install a second universal memory store.
- **Security/privacy:** distinct principals, short-lived scoped tokens, anti-poisoning, redaction, provenance and approval separation. No raw secrets/tokens or private source copies into public Hub documents.
- **Reliability/operations:** safe fail-closed at authority boundary; allow unrelated READY work to progress; replay/staleness negative tests; no hidden paid runner assumptions.
- **Compatibility:** compatible strengthening for projects at B0–B5, risk-proportional test depth; no automatic legacy PR re-approval or grandfathered PASS. Proposed **minor version 1.4.0** because this introduces substantive shared obligations; actual versioning/classification is subject to constitutional impact review.
- **Current statuses:** source preparation/review tests may be CODED/TESTED; authenticated A/B pilot, learning transfer and semantic improvement remain NOT_RUN until evidenced.
- **Review:** independent A and B path:line examination of this amendment and of the affected existing policies; enumerate overlaps with #163/#167 and other pending amendments. Owner must separately ratify after migration and evidence readiness. Until then `control/universal-constitution-version.json`, `docs/UNIVERSAL-CONSTITUTION.md`, machine contract and production authority are **untouched**.

## 6. Owner decision requested later

`PROPOSED → IMPACT_REVIEWED → MIGRATION_READY → RATIFICATION_READY → HUMAN_RATIFIED → PUBLISHED → PROPAGATING → VERIFIED`.

**This document is DRAFT only.** The immediate goal is to implement the smallest credible A/B live pilot and evidence-grounded learning slice; it is not permissible to call a policy active merely because the document or a GitHub PR exists.

**Một câu ngắn:** Reviewer phải **tự kiểm chứng mã nguồn, phản biện sâu, sửa lỗi có bằng chứng và tích lũy bài học đã được kiểm định**, nhưng không được tự phong quyền phê duyệt hoặc biến kết luận chưa xác thực thành kiến thức chung.


## 7. Hub-first constitutional control plane and managed branches

The Owner's desired "Hub as brain" is a **hierarchy of governing authority and evidence**, not a new super-application with remote shell or unrestricted central access. Reuse existing Constitution 1.3.0 R11–R14 and R25–R27, the governed repository manifest, and Application-Management contracts:

| Layer | Responsibility | Must NOT do |
| --- | --- | --- |
| Blueprint OS Hub | Own immutable Constitution versions; canonical rule definitions, Project Profile/WorkPackage, exact-source adoption requirements, Quality Gates, provenance and versioned knowledge promotion; generate scoped, project-specific policy/advice | Run a second app catalog, pool all user data/secrets, bypass Owner decisions or self-publish |
| Reviewer A / B | A implements within delegated scope; B independently checks exact Git source, security/data/UX/tests and learns from verified cases | Self-approve, share credentials as independent evidence, edit constitutional authority, merge/deploy |
| Application-Management | Existing operational application catalog, enrollment/identity delegation and task coordination under published Hub policy | Independently ratify rules, change a project's business state without its scoped authority, issue universal super-admin privileges |
| Governed app (branch/project) | Adopt a pinned policy version and project-specific obligations; own business data, user UX, runtime quality evidence and separate release decisions | Declare itself constitutionally compliant from a badge, ignore stale/revoked policies, override Core or central Owner gates |

### Versioned policy distribution (candidate requirement)

1. Hub releases one **atomic, signed/provenance-verifiable policy version set**: normative document, machine-readable contract, universal template and source-authority version. A PR, Git commit or package alone is not a constitutional publication.
2. Each governed repository declares \`policyId\`, exact \`policyVersion\`, \`projectId\`, Blueprint Level, relevant scope, governance evidence and source SHA. Existing adoption checks must fetch the authoritative published Hub state; a stale local manifest is \`NON_COMPLIANT/UNVERIFIED\`, not auto-upgraded.
3. Translate universal law into **proportional project review requirements** (B0–B5 and E0–E3 topology, without creating a third execution mode). App-specific decisions remain in their owning app; delegated operations use the existing management entry point.
4. After verified publication, propagate through the existing dependency/registration ledger. Every adopter returns exact revision, tests and migration blockers; Hub exposes a read-only portfolio view and mandatory gate statuses, not an invented shared mutable database.
5. When a policy update, issuer revoke or critical source revision changes, dependent acceptance becomes stale and must be reverified. Healthy unrelated work may continue on isolated branches, but no blocked review/constitutional/release gate can be silently waived.
6. A/B verified experience produces **KnowledgeLibrary/PatternGovernance candidates** only; neither project history nor a machine learning model can autonomously rewrite the Constitution or grant privileges.

### Recorded baseline/impact audit required before ratification

- The canonical governed-repositories manifest currently seals 15 baseline repositories, while separate onboarding and observed coverage may record further pending/admitted entries. Reconcile live project registration individually; **do not** infer a new project's adoption by repository discovery.
- The ecosystem snapshot still includes historical policy 1.2.0 adoption records in its observed data. Distinguish that historical snapshot from the currently ACTIVE policy 1.3.0. Do not silently rewrite observation history or claim all 15 have migrated.
- Create a minimal **impact matrix** for each real governed app including exact target policy, owner, Blueprint Level, applicable independent-review critical path, knowledge/privacy constraints, tests, migration action and truthful adoption status.
- Keep \`DIRECT-PRODUCTION-OWNER-001\` separate: Owner-requested direct Production may omit an optional promotion Preview, but cannot omit mandatory source/authenticity, QA, data safety, rollback and release authorization evidence.
- Treat an archived or unavailable canonical database/journal as an operational dependency to re-authorize, not as a reviewer finding that can be solved by changing a validation regex.

This topology is a **constitutional proposal**. No repo is governed by proposed 1.4 rules until the authenticated lifecycle completes and the published authority set is atomically verified.
