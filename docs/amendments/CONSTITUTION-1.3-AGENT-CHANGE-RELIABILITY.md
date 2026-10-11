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

**R7 — Evidence-gated bounded autonomy and finite repair loop.** Every software defect follows one bounded loop: **(1) identify the observable failure and falsifiable root-cause hypothesis -> (2) modify the smallest declared owner/scope -> (3) run focused tests plus directly affected regressions -> (4) evaluate evidence and either close, revert, or re-investigate.** Record baseline/expected behavior, exact base/head SHA, touched files, observed test result and a clear stop predicate. **Never repeat a failed patch or the same hypothesis without materially new evidence**, regardless of available time/credits. On one failed attempt, first examine new logs/diffs and challenge the hypothesis before any second change; a different correction requires a distinct evidence-backed diagnosis. Hard cap: after **three genuinely different attempted remedies of the same root defect**, stop all speculative writes and enter root-cause investigation/review, not an automatic human approval request. Unrelated independent READY work may continue if safe, but **no looping, new documents, dashboards, refactors or broader UI redesign merely to consume steps or simulate progress**. Safe documentation is justified only to record a durable decision/contract or acceptance proof in an existing canonical owner.

**R8 — Continuous traceability.** Record work package, decision, known defects, measured baselines, change/evidence revisions, current blockers and next safe action in durable project-controlled state. Resume long tasks by checking live canonical state and HEAD, not by treating an old chat completion message as fact.

**R9 — Proportional enforcement.** Small localized changes require focused checks; behavioral changes require integration and relevant critical-journey checks; authority, persistent data, schema, privileged devices, destructive actions and Production require stronger established gates. Missing mandatory evidence is UNVERIFIED or BLOCKED as appropriate, never synthetic PASS.

**R10 — Metrics are evidence, not permission.** Optimizing a metric by suppressing defects, skipping tests, minimizing files at the expense of architecture or moving incidents to other Issues is prohibited. Trend metrics guide improvement but may not override an outstanding severe defect or canonical authority boundaries.


**R11 — One ecosystem management entry point.** Every governed application and newly generated application must provide a versioned Application-Management discovery/management contract, publish truthful capabilities, and support enrollment into the existing Dynamic Catalog without per-app edits to the central dashboard, routes or environment-name lists. Application-Management is the shared operational management and orchestration entry point. Sub-apps/modules are managed through an explicit parent delegation contract; do not create independent control services or registries solely to repeat an existing approval function. App registration is not device approval, user login, remote-admin readiness or Production acceptance.

**R12 — Shared device approval and identity, scoped automatic acceptance.** Every protected app must support automatic device enrollment and verification of a current Application-Management-issued approval for its declared app/environment/capabilities. A device already approved under an applicable central policy is accepted without another per-app personal account or manual approval. A new device may be auto-approved only by a configured, authorized central policy after the required identity/proof checks; otherwise it remains pending for review in Application-Management. An app cannot make an unknown, revoked or out-of-scope device trusted by self-declaration. Ordinary app access shares the central identity and approval decision; app-specific entitlements, sensitive operations, session enforcement and audit remain scoped to the owning app. Define secure cross-origin handoff, replay protection, revocation/freshness and offline/degraded behavior before claiming implementation.

**R13 — Coherent presentation and bounded topology.** Application-Management supplies a shared application catalog, navigation vocabulary, permission/status semantics and versioned presentation profile. Clients reuse these conventions and adapt task layout to desktop/tablet/phone and input capabilities without adding parallel dashboards, duplicated approval screens or mandatory login stacks. Viewport, category and visual consistency never grant security authority. Reuse an existing app runtime/adapter for management where practical; a separate backend/origin/provider requires a measured capability/security/offline justification, ownership and exit path, not merely another app name.

**R14 — Explicit central-control boundaries.** Central membership/device approval is an authenticated, scoped operational decision, not universal administrator privilege, constitutional ratification, canonical Quality Gate PASS, professional acceptance, payment entitlement or Production release authority. Keep the control-plane operator-device registry distinct from managed end-user device identities and from per-app sessions/entitlements. Centralize the approval decision and orchestration, not all business databases, private user records, client signing keys or provider credentials. Block/revoke updates must invalidate affected grants within an explicit project risk budget; source unavailability cannot silently renew trust. Metadata-only/static/local apps declare their applicable management level honestly and must never advertise a nonexistent approval backend.

**R15 — Prompt-to-product execution contract.** The user's approved objective, current canonical project state and effective Constitution form a versioned execution contract: target repo/branch, exact HEAD, requested end state, acceptance criteria, protected invariants, out-of-scope changes, authority limits and ordered work packages. Resolve conflicts by existing authority precedence; the latest prompt may refine ordinary tasks but cannot silently replace approved goals or grant restricted rights. Treat each meaningful new request as a reviewed scope delta, not a reason to discard unfinished work.

**R16 — One active critical path, bounded work queue.** Reconcile existing implementation and remaining gaps before proposing new modules. Maintain one visible active work package and an ordered, dependency-aware queue (READY / ACTIVE / BLOCKED / VERIFIED / DONE), with one next executable action and an explicit completion predicate per package. Parallelize only genuinely independent changes with non-overlapping ownership and revision-safe integration; do not fork duplicate approaches, dashboards or task logs. Prefer finishing, verifying and retiring obsolete paths to opening more speculative work.

**R17 — Continuous verified execution with an explicit evaluation exit.** Within one authorized interactive or scheduled execution, proceed **diagnose -> one scoped change -> focused test -> assess -> stop/continue only with new evidence**; protect the approved goal, existing critical journeys, canonical state and exact SHA. A PASS completes only the work slice whose acceptance has been evidenced; a FAIL returns to diagnosis, not blind retry. A persistent failure may move to a safe independent package without reopening the failed scope or silently replacing its acceptance condition. Treat added files/UI/tokens/dependencies as cost requiring justification. Checkpoint only facts and one next action; never claim continuous background execution where the environment cannot perform it.

**R18 — Architectural and UX entropy budget.** Every substantive change checks net-new complexity against the existing baseline: canonical ownership, new dependencies, duplicated logic, routes/cards/buttons, dead branches, package/build weight and affected user journeys. New surface/abstraction must have distinct user value, lifecycle owner, retirement/migration plan where relevant and proportional verification. Remove verified obsolete paths in the same bounded change when safe; do not delete useful tests, history or necessary modular boundaries to artificially lower counts. No optional redesign or convenience UI expansion may displace the approved task.

**R19 — Intervention only for a genuine authority or capability boundary.** Distinguish (A) an engineering defect the Agent can diagnose/fix, (B) a recoverable tool/network/quota outage needing a durable checkpoint and later resumption, and (C) a non-delegable decision. Only C requires a human decision: authenticated constitutional ratification, explicit new Production/protected/destructive authority, access/identity the Agent cannot lawfully obtain, a true conflict in product intent with no safe default, or a mandatory qualified human acceptance. After three meaningfully distinct failed remedies, stop speculative patches and re-investigate; this is **not automatically a request to the user**. Do not weaken gates, reroute approvals, or claim success because credits or tools are exhausted.

**R20 — End-to-end finish and clean handoff.** A package is DONE only when its acceptance criteria and affected existing critical journeys are evidenced at the exact revision; product completion additionally requires remaining-scope reconciliation, no unresolved release-blocking defects, verified persistence/security/performance/UX as applicable, dependency cleanup, truthful release/rollback status and post-release observation when authorized. Separate CODE COMPLETE, TEST VERIFIED, MERGED, DEPLOYED and USER ACCEPTED; no status implies the next. Persist the smallest useful restart checkpoint and remaining blockers so a new session resumes without re-auditing the full repository or treating chat as canonical truth.

**R21 — Universal execution law, two implementation scales.** Every governed project, including newly generated projects, inherits the **same** constitutional obligation to preserve the approved objective, reconcile real state, complete safe work continuously, repair root causes, verify existing critical journeys, minimize complexity/cost, truthfully report evidence and stop only at a genuine capability or human-authority boundary. This is binding constitutional behavior **only after valid ratification/publication**, not an optional per-project prompt or a quota-based completion promise. Use exactly two proportionate execution profiles mapped from the existing Blueprint Levels: **COMPACT (small/medium: B0–B2)** and **STRUCTURED (large: B3–B5)**. Project risk can increase required verification and approval but never reduce these shared invariants. No new Constitution product, project registry, management dashboard, mandatory model/provider or extra source of truth.

**R22 — Do maximum eligible work in the current connected environment.** For both profiles, the executing Chat/Agent should finish analysis, precise repository edits, scoped tests, CI diagnosis, regression fixes, reviews and truthful project bookkeeping through its **already authorized, connected capabilities** before delegating. Work/Cloud Browser is justified only by a real authenticated GUI/cross-app workflow or tool capability boundary; Codex/full local environment only by a concrete native build, complex localized refactor or environment-specific test not feasible with the current tools. Escalation is **capability-based and minimal**, not a fixed percentage of work, an automatic phase, or a replacement for engineering judgement. The handoff must include only exact HEAD/policy, accepted goal, minimal affected paths, failing evidence, permitted action, next bounded task and clear return criteria. Reuse the same project state; do not trigger a full repository/network scan or duplicate work unless evidence requires it.

**R23 — Situational intake and context-aware task planning for all new projects.** Before generating a repository, UI, schema, prompt, or sprint plan, the executing Agent must inspect whether the new request belongs in an existing governed project, and capture enough of the **intended supported product** (not just a foundation scaffold) to justify a Project Profile: primary users and job-to-be-done, critical workflows, module and integration boundaries, ownership, persistence/offline constraints, high-sensitivity data, privileged devices, consequences of failure, resource and provider budget, and acceptance evidence. Unknown high-consequence facts remain UNVERIFIED; they cannot be defaulted to false in order to assign a smaller project. Propose a documented B0–B5 Blueprint Level and inherit COMPACT/STRUCTURED under R21 only after confirming against the existing canonical Project Profile process. Work direction starts with **one validated user journey / vertical slice** with explicit non-goals, verification, current-state reuse and the smallest dependency path, not a complete speculative module scaffold. Plan subsequent slices from observed evidence and evolving constraints, not from an unbounded mega-prompt.

**R24 — Portfolio inheritance, scale review and safe reclassification.** Existing governed repositories inherit their execution profile solely from their recorded canonical Blueprint Level; project-specific category labels, chat notes, rollout tables or a suggested new-project level are **not authority**. A repository discovered outside the governed manifest is an enrollment **candidate** until its Project Profile, ownership and authorized registry entry are established; never represent its status as adopted/compliant merely because it exists on GitHub. Re-evaluate scale only on material changes to scope, sensitivity, privileged capabilities, shared identity/control plane, cross-project dependencies or failure severity; record before/after levels, reasons, migration costs, affected gates, release/rollback impact and approved owner. No quiet downclassification to reduce testing. The common safeguards, verification and human-authority floor remain mandatory for both scales. Automatic future classification is **recommendation plus confirmation**, not a new self-approving registry or a new management app.

Detailed candidate rules, compatibility constraints and acceptance cases are in [the single-control-plane annex](CONSTITUTION-1.3-SINGLE-CONTROL-PLANE.md). These requirements extend the existing seven pillars; they do not add an eighth pillar or activate federation at runtime.

**R25 — Independent ecosystem reference axis.** A large application and an ecosystem of many independently evolving applications are distinct architectural kinds. Retain B0–B5 for **per-project engineering depth** and COMPACT/STRUCTURED for **per-project execution overhead**. Add a strictly orthogonal **E0–E3 ecosystem topology classification** to guide cross-project coordination, not to redefine a repository's Blueprint Level or create a third project execution mode. E0 = standalone project; E1 = coordinated product suite with concrete shared contracts; E2 = managed multi-domain ecosystem with separately scoped constitutional governance and operational orchestration; E3 = federation of multiple independently governed ecosystems with an explicit cross-trust protocol. Assess intended topology and verified runtime links separately: a list of repositories or a shared name alone never proves integrated SSO, production federation or ecosystem readiness. A project's E-level cannot self-grant any requirement/gate PASS.

**R26 — Ecosystem architecture, sovereignty and dependency discipline.** At E2/E3, describe **roles and trust boundaries** within the existing platforms: constitutional authority and Blueprint engineering guidance remain with Software-Blueprint-Hub; day-to-day app catalog, scoped device enrollment and coordination belong with Application-Management when correctly authorized; each managed application owns its business data, user journey, app-specific permissions, runtime health and release evidence. Cross-app interaction is contract/version-based and least-privilege with explicit failure/degraded modes. Define identity, policy, shared UI vocabulary, interoperability, observability, security blast radius, backup and exit paths **without** creating a second canonical registry, universal user-data database, shadow constitution, duplicate dashboard, common superadmin, mandatory paid dependency or single shared release switch. Ecosystem success requires user-facing interoperability and independently verified cross-product critical journeys, not simply a high repository count, CI percentage or prestigious brand analogy.

**R27 — Ecosystem-first situational planning and bounded evolution.** Before creating a new app or upgrading a platform, ask whether the feature belongs in an existing product, a shared contract, a management-plane service or a new independent bounded context. Assess domain ownership, product autonomy, actual cross-product journeys, core/adapter boundaries, compatibility/version migrations, identity/security domains, organizational/technical cost and planned failure isolation. Determine each project's B-level and execution mode **and** its proposed ecosystem position, including E-level at the relevant portfolio root. Work from one end-to-end vertical slice across only the minimum necessary participants; expand one dependency edge at a time, test interoperation and independent rollback before deeper federation. Ecosystem E-level promotion/demotion must be reviewed against topology and real integration evidence, not automatic from project creation or from one Agent's claimed readiness. Future ecosystems must inherit the same decision logic, preserve separate Production/human gates and avoid reimplementing central capabilities per client.

**R28 — Content-bearing software must have instructional architecture and real learning acceptance.** A learning app, course satellite or educational ecosystem must preserve one curriculum source of truth and an **explicit provenance boundary** between official institutional study-plan facts, independently verified external materials, and AI-authored supplemental learning content. Structure material as **program -> subject -> prerequisite/semester -> module -> lesson -> practice -> feedback/assessment -> durable evidence -> review**, with a dependency-aware and learner-readable route; subject-specific variations are legitimate, indiscriminate fixed ten-tab shells are not. Before declaring a lesson READY, verify real learning objectives, prerequisite correctness, substantive explanations and worked examples, discipline-appropriate assessment with checked answers, actionable error feedback, meaningful resource references, accessibility and stable learning-state readback. Generic rephrased templates, repeated boilerplate tasks, fabricated citations, empty simulations, aspirational features and synthetic mastery **must be flagged as DRAFT/UNVERIFIED**, not promoted by JSON validity or green code CI. Refactor existing subject owners in bounded, risk-prioritized vertical slices, preserve user progress and prior credible content, retire obsolete duplicate tabs/overrides only after parity testing, and require representative professional pedagogical review before broad rollout. UI legibility additionally inherits the computed-contrast obligations consolidated into this same amendment when ratified, but this R28 does **not** create duplicate contrast thresholds, runtime authority or a new content CMS.

### Ecosystem topology is a second dimension, not a third project execution mode

| Reference | Meaning | Minimum architectural question | Required evidence to claim *operational* maturity |
| --- | --- | --- | --- |
| **E0 — Standalone** | One bounded product, possibly complex B5 | Can it work without ecosystem assumptions? | Product-level acceptance and dependency truth |
| **E1 — Product Suite** | Multiple related products sharing explicit conventions/contracts | Are responsibilities and reuse real, without data-owner duplication? | Versioned shared contract and verified representative interaction |
| **E2 — Managed Ecosystem** | Multiple autonomous products in different domains under scoped engineering/governance and operations planes | Can products interoperate while retaining independent authority and safe failure isolation? | Authenticated management and contract checks, cross-app readback, audited device/identity boundaries, project-by-project release provenance |
| **E3 — Federated Ecosystems** | Multiple **independently governed** ecosystems connected through negotiated federation/trust | Can one ecosystem fail or revoke trust without collapsing another? | Real cross-authority authentication, revocation/failover, contract interoperability, observed isolation and recovery |

E2 is the **proposed target architecture** for the BlueDragon/Bauman Hub portfolio: Blueprint OS is the policy/engineering compass, Application-Management is the operational app coordination surface, and individual education/health/industrial/desktop apps are independently bounded products. Its current **verified maturity is partial**, not automatically E2 operational: the registered repository list establishes governance membership, **not** universally tested SSO, production cross-app workflows or 100-storey performance. E3 is a future optional horizon **only if separate ecosystems with separate trust authorities actually exist**. The Apple/Samsung/Huawei comparison describes the *type of ambition*, not an observed parity of features, scale or resources.

A project's Blueprint Level and execution profile remain unchanged by E-level. A COMPACT B2 app may participate in E2; an isolated B5 app need not be an ecosystem. An ecosystem-wide change triggers scoped cross-project contract, security and migration checks; a local L1 edit need not run all projects' E2 test suites.

### Two inherited execution profiles — one Constitution, different overhead

| Dimension | COMPACT — small/medium (B0, B1, B2) | STRUCTURED — large (B3, B4, B5) |
| --- | --- | --- |
| Single objective and source of truth | One small approved-goal / acceptance record with one active bounded work slice | Canonical project goal, dependency-aware Work Packages, owner per slice and structured restart checkpoint |
| Investigation | Read the relevant HEAD/diff/file/check only; repair within existing owner | Same targeted inspection, plus dependency, contract and architecture-boundary impact when affected |
| Execution | Short inspect → fix → focused test → verified result; add queue/checkpoint only as work requires | Ordered critical path, exact-SHA checkpoints at package transitions, independent slices when safe |
| Verification | Fast relevant static/unit/regression and affected UX/readback as needed | Focused tests first; cross-module/integration and full relevant release/critical-journey gates as risk requires |
| Anti-rubbish rule | Avoid speculative modules, new UI and duplicated trackers; only justified minimal additions | Same rule, plus owner/topology, compatibility, duplicate-state and latency/capacity reconciliation |
| Escalation | Work/Codex only for a specifically proven environment/tool limitation | Same rule with concise scope/SHA handoff, no delegated unlimited codebase scan |
| Closure | Evidence against original goal and preserved existing functionality | Same evidence plus package reconciliation, integration/rollback and authorized release/observation where applicable |

**Uniform, non-negotiable floor:** exact source/version truth, authorization, no destructive/out-of-scope writes, unchanged-user-data safety, relevant regression/UX checks, stop-on-unsafe-gate and no fabricated PASS apply equally to both sizes. A B0–B2 application performing an L3 operation (secrets, sensitive data, identity, privileged device, schema migration, destructive mutation, Production) inherits the stronger **L3 checks and human authority boundaries** for that operation without forcing permanent large-project bureaucracy. Conversely a B3–B5 project may use a light scoped test for a genuinely L1 localized edit; its canonical project traceability is still maintained.

**Scale cannot be gamed:** classify from the existing project Blueprint Level and real affected boundaries, not from a prompt, agent preference, filename count or expected CI cost. Raising the required evidence from operation risk is mandatory; reducing it needs a documented authorized change to scope or risk. Unknown Blueprint Level remains UNVERIFIED, not silently COMPACT.

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

### Continuous execution protocol — proposal only

The operational behavior below strengthens R7/R8/R9/R15–R20; it is **not** a new authority engine, separate tracking app, mandatory global CI pipeline or permission to bypass existing review gates.

| Phase | Required behavior | Safe progression check |
| --- | --- | --- |
| 0. RESUME | Read the short project checkpoint, active policy, repository HEAD, changed files, open PR/check status and current blockers; fetch only relevant paths | Stale evidence and obsolete plans identified before edit |
| 1. LOCK INTENT | Resolve prompt objective, protected existing behavior, done criteria, authorization and scope delta | No hidden goal substitution or unauthorized work |
| 2. RECONCILE | Compare shipped vs implemented-unverified vs missing vs failed; inspect current ownership | No duplicate implementation mistaken for new requirement |
| 3. ORDER | Build a bounded dependency/critical-path work queue; choose one executable slice | Each slice has testable output and risk tier |
| 4. BASELINE | Reproduce defect or capture affected journey/behavior before change where practical | Root-cause hypothesis or explicit uncertainty recorded |
| 5. CHANGE | Minimal coherent patch on existing owner, safe-write/version checks; preserve rollback route | Diff stays scoped; added complexity justified |
| 6. VERIFY | Run risk-scaled static, regression, contract, persistence/UX/security/performance checks | Exact-SHA evidence; failures return to phase 4 |
| 7. INTEGRATE | Independent review and CI; merge only with existing policy/authority and green required checks | Recheck target HEAD, no stale PR or false PASS |
| 8. RELEASE | If separately authorized, run exact-revision release gates and deploy; otherwise mark release BLOCKED, not DONE | No automatic Production authority |
| 9. OBSERVE | Read back durable state, inspect deployed critical journeys and regression/incident evidence when possible | No completion by response-code/build result alone |
| 10. RECONCILE AGAIN | Recompute remaining queue, retire safely replaced paths, hand off checkpoint or take next READY item | Zero unknown required items before product closure |

**Restart checkpoint** (append/update in the existing project work record, not a new dashboard): project/repository/branch; active Constitution ID/version; approved goal and acceptance criteria; exact current HEAD and last verified SHA; active work package and next action; ordered remaining/blocked work; failing test/incident and attempt count; evidence links/status; scoped authority boundaries; resource/capability blockers; safe rollback/recovery note. Never store credentials or sensitive user data in this record. Write at work-package transitions, significant blocker changes, and before a session/resource interruption; do not append noisy logs for every command.

**Failure handling:** three distinct remedies without resolving a defect trigger an engineering diagnosis reset (re-examine hypothesis, tests, contract and root cause; optionally switch to an independent READY task), not an automatic human gate. Quota exhaustion, disconnected browser or unavailable external service is `PAUSED_RESOURCE / UNVERIFIED` with next safe action, not a DONE state. Request one concise human decision only when a genuine non-delegable decision cannot be avoided. Multiple safely independent packages may progress while the blocked one remains explicitly tracked.

**Completion safeguard:** require closure against the original prompt, including mandatory negative/regression cases and preserved legacy user journeys. A product cannot be labeled complete solely because all PRs merged, all tasks were moved to DONE, CI passed or a deployment URL exists.

## 7. Impact analysis scope

- **Architecture**: reuse seven existing pillars and gate architecture; avoid speculative eighth pillar. Consider strengthening existing durability/quality gates instead of multiplying global gate IDs. Any new canonical contract is reviewed for schema compatibility.
- **Data/authority**: one owner per decision: Application-Management owns proposed ecosystem approval/delegation, clients own business state and app-scoped enforcement projections. No duplicate approval authority or cross-project business-data store; evidence identity includes SHA/run IDs, actor authority and non-sensitive artifact references.
- **UX**: use calm progressive disclosure — active policy, current work, evidence, blockers and next permitted action; do not expose all metrics in every ordinary task screen.
- **Security**: no implicit authority for AI or providers. Proposed Application-Management device/identity delegation is explicit, scoped and subject to impact review and authenticated implementation; it does not convey constitutional, Quality Gate or Production authority. Preserve strict protected-write boundaries.
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
