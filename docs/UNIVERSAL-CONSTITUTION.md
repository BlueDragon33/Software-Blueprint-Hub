# Blueprint OS — Universal Constitution

Policy ID: `blueprint-os:universal-century-grade`
Policy version: **1.3.0**
Status: **ACTIVE UNIVERSAL LAW**

The constitutions are long-lived engineering laws. Project Profile and Blueprint Level determine their depth; no project is exempt from basic discipline.

## 1. Product Engineering
- Start from problem, users, jobs-to-be-done, constraints and success evidence.
- Every project has a Project Profile before normal feature implementation.
- Scope must be explicit enough to reject attractive but irrelevant features.
- Engineering depth scales with risk, scale, longevity and integration complexity.
- Generated prompts are execution projections, never source-of-truth.

## 2. Architecture
- Architecture defines ownership, dependency direction and change boundaries.
- Contracts precede components that depend on them.
- Prefer stable Core plus adapters/providers/extensions when variation is genuinely external to Core invariants.
- Medium/large systems validate one realistic vertical slice before broad expansion.
- Technology choices are project decisions, not Universal Core assumptions.

## 3. Data
- Persistent data has an explicit owner.
- Durable identity never depends on display text, array index or incidental filename/route.
- Schema version, record/content version and runtime/release revision are distinct.
- Migrations are explicit, testable and preferably additive/idempotent.
- Retention, deletion, export, provenance, backup and restore are designed where applicable.
- UI state and report projections do not silently become authoritative business state.

## 4. UI/UX
Target: calm, precise, coherent, responsive, accessible and task-oriented.
- Information architecture precedes repeated screen/card accumulation.
- User-facing products define a shared shell/design system appropriate to scale.
- Loading, empty, error, permission and recovery states are first-class.
- Responsive behavior is designed, not obtained by shrinking desktop.
- Accessibility and human UX review are acceptance conditions.
- Avoid card-inside-card accumulation, CSS override piles, duplicated navigation and button-for-every-capability interfaces.

## 5. Security
Prime rule: every authority and trust boundary is explicit; UI visibility is never authorization.
- Authentication and authorization are distinct.
- Protected mutations are enforced at trusted boundaries.
- Secret ownership is singular and explicit per control domain.
- Inputs are validated at boundaries.
- External integrations receive only required data/capabilities.
- Destructive actions define confirmation, idempotency and recovery.
- Plugin/extension/AI authority is explicitly granted and bounded.
- Threat-model depth scales with consequence.

## 6. QA + Auto-Fix
`REPRODUCE → CLASSIFY → ROOT CAUSE → FIX → REGRESSION TEST → RETEST → WHOLE-SYSTEM CHECK`
- Quality criteria are measurable where practical.
- CI green never alone means product PASS.
- A fix that hides failure or weakens tests without a requirement change is invalid.
- Critical user journeys require real UX acceptance.
- Gates require evidence.
- Forbidden PASS tactics: disabling tests, arbitrary sleeps, catch-and-ignore, CSS hacks as architecture, unproved gate claims.

## 7. Operations
- "Works locally" is not release readiness.
- Environments and promotion rules are explicit.
- Releases identify exact artifact/revision.
- Rollback/recovery depth scales with consequence.
- Health/telemetry/logs identify revision and failing subsystem without leaking secrets.
- Backup without tested restore is incomplete where restore matters.
- Successful build never implies automatic production mutation.

## 8. Governance & Evolution
- Important decisions live outside chat history.
- Public contracts have deprecation lifecycle.
- Technical debt records reason, risk and removal trigger.
- Work packages exist for real gaps, defects, dependencies, migrations or capabilities — not numbering.
- Case-specific assumptions are not promoted to Universal Core without review.
- Constitutions change rarely; project blueprints may evolve but cannot silently violate active constitutions.

## 9. Century-Grade Construction Standard

Every project inherits seven non-negotiable construction qualities. Their **implementation depth scales with Blueprint Level and real risk**, but no project may opt out of the qualities themselves.

### 9.1 Structural Capacity — foundation for future height
- Architecture must preserve a credible growth path beyond today's feature count, load and team size.
- Build only the capacity justified now, but do not make today's convenience structurally block tomorrow's justified scale.
- Stable Core, canonical contracts, explicit dependency direction and replaceable adapters are preferred over irreversible coupling.
- Scaling mechanisms are introduced from measured need, not speculative complexity.

### 9.2 Architectural Longevity — designed to age well
- Business/domain meaning must outlive any single framework, hosting provider, UI library or AI vendor where practical.
- Public contracts require versioning, compatibility and deprecation paths.
- Technology replacement must be possible without rewriting canonical product meaning.
- Architecture decisions record the future condition that would justify replacement or expansion.

### 9.3 Product Elegance — timeless rather than trend-bound
- Visual systems favor clarity, proportion, hierarchy, restraint and consistency over short-lived decorative trends.
- Shared design tokens/components prevent local visual drift and override piles.
- Desktop, tablet and mobile are deliberately composed; responsive design is not desktop shrinkage.
- A technically correct screen may still fail acceptance when hierarchy, readability or coherence is poor.

### 9.4 Premium Usability — worthy of user time and money
- Critical tasks minimize unnecessary steps, ambiguity and cognitive load.
- Search, filtering, navigation, forms, tables, feedback and recovery must remain understandable at realistic data sizes.
- Empty, loading, error, permission, offline/degraded and recovery states are first-class product surfaces.
- Human UX acceptance is required for critical journeys; CI green alone never proves commercial-quality usability.

### 9.5 Long-Term Durability — resist software ageing
- Dependency, schema, migration, browser/device and provider evolution must have regression protection.
- Repeated change must not accumulate hidden coupling, CSS patches, stale compatibility paths or unverifiable migrations.
- Upgrade, rollback, restore and representative ageing/regression scenarios are tested at depth appropriate to consequence.
- Maintenance should replace finishes and services without demolishing the structural Core.

### 9.6 Fortress Security & Disaster Resilience — contain damage and recover
- Security is defense-in-depth: perimeter protection never replaces trusted-boundary authorization.
- Least privilege, segmentation and blast-radius containment prevent one compromised user, module, provider, plugin or AI path from becoming system-wide authority.
- Sensitive data and secrets use appropriate encryption, scoped credential ownership and auditable access.
- Canonical mutations, Quality Gate PASS and Production release authority remain separately protected capabilities.
- Important records require tested backup/recovery appropriate to consequence; high-risk systems require immutable/offline or otherwise independently recoverable copies.
- Incidents must be detectable, attributable and containable without leaking secrets.
- No system claims to be impossible to breach; the engineering objective is to resist attack, limit damage, protect authoritative data and recover to a trusted state.

### 9.7 Operational Sovereignty & Dependency Minimization — useful without permanent service lock-in
- Prefer local, browser, desktop or self-controlled execution for core personal workflows when practical and safe.
- Design critical user value to remain usable offline or in a clearly defined degraded mode when the capability itself does not inherently require a network service.
- Prefer free/open/local capabilities when they meet the same correctness, security and usability requirements; cost avoidance never justifies weaker security, fabricated capability or hidden operational debt.
- External providers, paid SaaS, hosting platforms, databases, AI vendors and cloud runtimes are replaceable adapters unless the product charter explicitly makes one provider part of the product itself.
- A provider-specific capability must declare why external execution is required, what data leaves the user-controlled boundary, what happens when the provider is unavailable, and how replacement/export works.
- Canonical user data should remain portable in documented formats with explicit export/backup/restore paths appropriate to consequence.
- Git repositories own source/version history, not mutable end-user runtime data by default.
- Google Drive/Sheets/Apps Script or similar services may provide optional sync, backup, coordination or lightweight remote access, but must not silently become an irreplaceable backend for workflows that can remain local-first.
- AI assistants may enhance analysis, tutoring, automation and authoring, but must not become the sole owner of canonical business/learning state unless the product explicitly requires that authority and accepts the dependency.
- New dependencies require a dependency budget: purpose, owner, cost class, portability, offline/degraded behavior, exit path and removal trigger.

### 9.8 Universal inheritance rule
- These seven qualities apply to every future Blueprint, template and project.
- A lower Blueprint Level may reduce **depth**, never delete the quality.
- Project-specific templates may strengthen these requirements but cannot weaken or bypass them.
- Bootstrap, readiness and acceptance projections must preserve this inheritance.
- New features are incomplete when they work only at initial launch but introduce avoidable structural, visual, operational or security decay.

## Scalable Blueprint Levels — initial model
- **B0 MICRO**: purpose, I/O, errors, basic security, tests, release definition.
- **B1 SMALL**: add user flow, UI/data structure, deployment, regression.
- **B2 PRODUCT**: add product charter, system context, domain/API/security/design-system/QA/operations.
- **B3 SYSTEM**: add bounded contexts, trust model, integration, observability, migration, ADR.
- **B4 PLATFORM**: add plugin/capability/package compatibility and advanced governance.
- **B5 CRITICAL**: add deep threat modeling, audit, DR, strict change control and independent verification.

These levels are proposals to be validated in Phase 2/3, not permanently hard-coded.

## 10. Universal execution and ecosystem discipline

Federated identity behavior in R11–R14 is migration-gated. Immediately require accurate capability declarations, explicit owners, least privilege, revocation/freshness design and no invented approval. Existing account/authentication and offline protections remain until an authorized, compatible implementation passes CP-01–CP-13 and the relevant project gates. Unsupported federation is UNVERIFIED, not exempt or compliant. No device is silently bulk-approved; central grants never imply constitutional, privileged business-data or Production authority. E2 is an architectural target until authenticated interoperability and isolation are evidenced; E3 requires independent ecosystem authorities.

### 10.R1

**R1 — Bounded, evidence-anchored changes.** Every substantive Agent change has a target repository, exact base/head revision, user goal, allowed scope, known baseline, risk tier, applicable checks, observed result and explicit unresolved blockers. Prompt text and chat memory never become source-of-truth.

### 10.R2

**R2 — Preserve before extending.** Prefer modifying the correct existing module and retiring verified obsolete paths over parallel files, adapters, UI surfaces and state stores. New modules are valid only with distinct ownership, justified responsibility and tested integration. No unconditional ban on new files or simplistic line-count/complexity score.

### 10.R3

**R3 — No unverified success.** A change may be called verified only for the checks actually run at its exact revision. Distinguish CODED, STATIC-TESTED, INTEGRATION-VERIFIED, REAL-UX-VERIFIED, DEPLOYED and OBSERVED. Successful CI/build/adoption checks do not confer Product PASS, Constitutional compliance or Production authority.

### 10.R4

**R4 — Root-cause and regression discipline.** Reproduce a defect where practical; identify the first divergence from expected canonical behavior; implement the smallest coherent fix; add regression protection; compare affected existing critical journeys. Never bypass a failing check, weaken assertions, hide errors, add arbitrary sleeps or relabel failing evidence to PASS.

### 10.R5

**R5 — Safe overwrites, idempotency and recovery.** No Agent may silently overwrite unrelated files, user data, canonical records, settings, devices, secrets, migration history or deployed state. Enforce version/concurrency checks, operation scope, explicit authority and recovery appropriate to risk. A source-file replacement is not equivalent to permission for destructive runtime mutation.

### 10.R6

**R6 — Performance and UX non-degradation.** Risk-appropriate automated measurements must compare important interactive journeys with an identified baseline, using reproducible environments and uncertainty controls. A numerically green benchmark never substitutes for critical human UX review.

### 10.R7

**R7 — Evidence-gated bounded autonomy and finite repair loop.** Every software defect follows one bounded loop: **(1) identify the observable failure and falsifiable root-cause hypothesis -> (2) modify the smallest declared owner/scope -> (3) run focused tests plus directly affected regressions -> (4) evaluate evidence and either close, revert, or re-investigate.** Record baseline/expected behavior, exact base/head SHA, touched files, observed test result and a clear stop predicate. **Never repeat a failed patch or the same hypothesis without materially new evidence**, regardless of available time/credits. On one failed attempt, first examine new logs/diffs and challenge the hypothesis before any second change; a different correction requires a distinct evidence-backed diagnosis. Hard cap: after **three genuinely different attempted remedies of the same root defect**, stop all speculative writes and enter root-cause investigation/review, not an automatic human approval request. Unrelated independent READY work may continue if safe, but **no looping, new documents, dashboards, refactors or broader UI redesign merely to consume steps or simulate progress**. Safe documentation is justified only to record a durable decision/contract or acceptance proof in an existing canonical owner.

### 10.R8

**R8 — Continuous traceability.** Record work package, decision, known defects, measured baselines, change/evidence revisions, current blockers and next safe action in durable project-controlled state. Resume long tasks by checking live canonical state and HEAD, not by treating an old chat completion message as fact.

### 10.R9

**R9 — Proportional enforcement.** Small localized changes require focused checks; behavioral changes require integration and relevant critical-journey checks; authority, persistent data, schema, privileged devices, destructive actions and Production require stronger established gates. Missing mandatory evidence is UNVERIFIED or BLOCKED as appropriate, never synthetic PASS.

### 10.R10

**R10 — Metrics are evidence, not permission.** Optimizing a metric by suppressing defects, skipping tests, minimizing files at the expense of architecture or moving incidents to other Issues is prohibited. Trend metrics guide improvement but may not override an outstanding severe defect or canonical authority boundaries.

### 10.R11

**R11 — One ecosystem management entry point.** Every governed application and newly generated application must provide a versioned Application-Management discovery/management contract, publish truthful capabilities, and support enrollment into the existing Dynamic Catalog without per-app edits to the central dashboard, routes or environment-name lists. Application-Management is the shared operational management and orchestration entry point. Sub-apps/modules are managed through an explicit parent delegation contract; do not create independent control services or registries solely to repeat an existing approval function. App registration is not device approval, user login, remote-admin readiness or Production acceptance.

### 10.R12

**R12 — Shared device approval and identity, scoped automatic acceptance.** Every protected app must support automatic device enrollment and verification of a current Application-Management-issued approval for its declared app/environment/capabilities. A device already approved under an applicable central policy is accepted without another per-app personal account or manual approval. A new device may be auto-approved only by a configured, authorized central policy after the required identity/proof checks; otherwise it remains pending for review in Application-Management. An app cannot make an unknown, revoked or out-of-scope device trusted by self-declaration. Ordinary app access shares the central identity and approval decision; app-specific entitlements, sensitive operations, session enforcement and audit remain scoped to the owning app. Define secure cross-origin handoff, replay protection, revocation/freshness and offline/degraded behavior before claiming implementation.

### 10.R13

**R13 — Coherent presentation and bounded topology.** Application-Management supplies a shared application catalog, navigation vocabulary, permission/status semantics and versioned presentation profile. Clients reuse these conventions and adapt task layout to desktop/tablet/phone and input capabilities without adding parallel dashboards, duplicated approval screens or mandatory login stacks. Viewport, category and visual consistency never grant security authority. Reuse an existing app runtime/adapter for management where practical; a separate backend/origin/provider requires a measured capability/security/offline justification, ownership and exit path, not merely another app name.

### 10.R14

**R14 — Explicit central-control boundaries.** Central membership/device approval is an authenticated, scoped operational decision, not universal administrator privilege, constitutional ratification, canonical Quality Gate PASS, professional acceptance, payment entitlement or Production release authority. Keep the control-plane operator-device registry distinct from managed end-user device identities and from per-app sessions/entitlements. Centralize the approval decision and orchestration, not all business databases, private user records, client signing keys or provider credentials. Block/revoke updates must invalidate affected grants within an explicit project risk budget; source unavailability cannot silently renew trust. Metadata-only/static/local apps declare their applicable management level honestly and must never advertise a nonexistent approval backend.

### 10.R15

**R15 — Prompt-to-product execution contract.** The user's approved objective, current canonical project state and effective Constitution form a versioned execution contract: target repo/branch, exact HEAD, requested end state, acceptance criteria, protected invariants, out-of-scope changes, authority limits and ordered work packages. Resolve conflicts by existing authority precedence; the latest prompt may refine ordinary tasks but cannot silently replace approved goals or grant restricted rights. Treat each meaningful new request as a reviewed scope delta, not a reason to discard unfinished work.

### 10.R16

**R16 — One active critical path, bounded work queue.** Reconcile existing implementation and remaining gaps before proposing new modules. Maintain one visible active work package and an ordered, dependency-aware queue (READY / ACTIVE / BLOCKED / VERIFIED / DONE), with one next executable action and an explicit completion predicate per package. Parallelize only genuinely independent changes with non-overlapping ownership and revision-safe integration; do not fork duplicate approaches, dashboards or task logs. Prefer finishing, verifying and retiring obsolete paths to opening more speculative work.

### 10.R17

**R17 — Continuous verified execution with an explicit evaluation exit.** Within one authorized interactive or scheduled execution, proceed **diagnose -> one scoped change -> focused test -> assess -> stop/continue only with new evidence**; protect the approved goal, existing critical journeys, canonical state and exact SHA. A PASS completes only the work slice whose acceptance has been evidenced; a FAIL returns to diagnosis, not blind retry. A persistent failure may move to a safe independent package without reopening the failed scope or silently replacing its acceptance condition. Treat added files/UI/tokens/dependencies as cost requiring justification. Checkpoint only facts and one next action; never claim continuous background execution where the environment cannot perform it.

### 10.R18

**R18 — Architectural and UX entropy budget.** Every substantive change checks net-new complexity against the existing baseline: canonical ownership, new dependencies, duplicated logic, routes/cards/buttons, dead branches, package/build weight and affected user journeys. New surface/abstraction must have distinct user value, lifecycle owner, retirement/migration plan where relevant and proportional verification. Remove verified obsolete paths in the same bounded change when safe; do not delete useful tests, history or necessary modular boundaries to artificially lower counts. No optional redesign or convenience UI expansion may displace the approved task.

### 10.R19

**R19 — Intervention only for a genuine authority or capability boundary.** Distinguish (A) an engineering defect the Agent can diagnose/fix, (B) a recoverable tool/network/quota outage needing a durable checkpoint and later resumption, and (C) a non-delegable decision. Only C requires a human decision: authenticated constitutional ratification, explicit new Production/protected/destructive authority, access/identity the Agent cannot lawfully obtain, a true conflict in product intent with no safe default, or a mandatory qualified human acceptance. After three meaningfully distinct failed remedies, stop speculative patches and re-investigate; this is **not automatically a request to the user**. Do not weaken gates, reroute approvals, or claim success because credits or tools are exhausted.

### 10.R20

**R20 — End-to-end finish and clean handoff.** A package is DONE only when its acceptance criteria and affected existing critical journeys are evidenced at the exact revision; product completion additionally requires remaining-scope reconciliation, no unresolved release-blocking defects, verified persistence/security/performance/UX as applicable, dependency cleanup, truthful release/rollback status and post-release observation when authorized. Separate CODE COMPLETE, TEST VERIFIED, MERGED, DEPLOYED and USER ACCEPTED; no status implies the next. Persist the smallest useful restart checkpoint and remaining blockers so a new session resumes without re-auditing the full repository or treating chat as canonical truth.

### 10.R21

**R21 — Universal execution law, two implementation scales.** Every governed project, including newly generated projects, inherits the **same** constitutional obligation to preserve the approved objective, reconcile real state, complete safe work continuously, repair root causes, verify existing critical journeys, minimize complexity/cost, truthfully report evidence and stop only at a genuine capability or human-authority boundary. This is binding constitutional behavior **only after valid ratification/publication**, not an optional per-project prompt or a quota-based completion promise. Use exactly two proportionate execution profiles mapped from the existing Blueprint Levels: **COMPACT (small/medium: B0–B2)** and **STRUCTURED (large: B3–B5)**. Project risk can increase required verification and approval but never reduce these shared invariants. No new Constitution product, project registry, management dashboard, mandatory model/provider or extra source of truth.

### 10.R22

**R22 — Do maximum eligible work in the current connected environment.** For both profiles, the executing Chat/Agent should finish analysis, precise repository edits, scoped tests, CI diagnosis, regression fixes, reviews and truthful project bookkeeping through its **already authorized, connected capabilities** before delegating. Work/Cloud Browser is justified only by a real authenticated GUI/cross-app workflow or tool capability boundary; Codex/full local environment only by a concrete native build, complex localized refactor or environment-specific test not feasible with the current tools. Escalation is **capability-based and minimal**, not a fixed percentage of work, an automatic phase, or a replacement for engineering judgement. The handoff must include only exact HEAD/policy, accepted goal, minimal affected paths, failing evidence, permitted action, next bounded task and clear return criteria. Reuse the same project state; do not trigger a full repository/network scan or duplicate work unless evidence requires it.

### 10.R23

**R23 — Situational intake and context-aware task planning for all new projects.** Before generating a repository, UI, schema, prompt, or sprint plan, the executing Agent must inspect whether the new request belongs in an existing governed project, and capture enough of the **intended supported product** (not just a foundation scaffold) to justify a Project Profile: primary users and job-to-be-done, critical workflows, module and integration boundaries, ownership, persistence/offline constraints, high-sensitivity data, privileged devices, consequences of failure, resource and provider budget, and acceptance evidence. Unknown high-consequence facts remain UNVERIFIED; they cannot be defaulted to false in order to assign a smaller project. Propose a documented B0–B5 Blueprint Level and inherit COMPACT/STRUCTURED under R21 only after confirming against the existing canonical Project Profile process. Work direction starts with **one validated user journey / vertical slice** with explicit non-goals, verification, current-state reuse and the smallest dependency path, not a complete speculative module scaffold. Plan subsequent slices from observed evidence and evolving constraints, not from an unbounded mega-prompt.

### 10.R24

**R24 — Portfolio inheritance, scale review and safe reclassification.** Existing governed repositories inherit their execution profile solely from their recorded canonical Blueprint Level; project-specific category labels, chat notes, rollout tables or a suggested new-project level are **not authority**. A repository discovered outside the governed manifest is an enrollment **candidate** until its Project Profile, ownership and authorized registry entry are established; never represent its status as adopted/compliant merely because it exists on GitHub. Re-evaluate scale only on material changes to scope, sensitivity, privileged capabilities, shared identity/control plane, cross-project dependencies or failure severity; record before/after levels, reasons, migration costs, affected gates, release/rollback impact and approved owner. No quiet downclassification to reduce testing. The common safeguards, verification and human-authority floor remain mandatory for both scales. Automatic future classification is **recommendation plus confirmation**, not a new self-approving registry or a new management app.

### 10.R25

**R25 — Independent ecosystem reference axis.** A large application and an ecosystem of many independently evolving applications are distinct architectural kinds. Retain B0–B5 for **per-project engineering depth** and COMPACT/STRUCTURED for **per-project execution overhead**. Add a strictly orthogonal **E0–E3 ecosystem topology classification** to guide cross-project coordination, not to redefine a repository's Blueprint Level or create a third project execution mode. E0 = standalone project; E1 = coordinated product suite with concrete shared contracts; E2 = managed multi-domain ecosystem with separately scoped constitutional governance and operational orchestration; E3 = federation of multiple independently governed ecosystems with an explicit cross-trust protocol. Assess intended topology and verified runtime links separately: a list of repositories or a shared name alone never proves integrated SSO, production federation or ecosystem readiness. A project's E-level cannot self-grant any requirement/gate PASS.

### 10.R26

**R26 — Ecosystem architecture, sovereignty and dependency discipline.** At E2/E3, describe **roles and trust boundaries** within the existing platforms: constitutional authority and Blueprint engineering guidance remain with Software-Blueprint-Hub; day-to-day app catalog, scoped device enrollment and coordination belong with Application-Management when correctly authorized; each managed application owns its business data, user journey, app-specific permissions, runtime health and release evidence. Cross-app interaction is contract/version-based and least-privilege with explicit failure/degraded modes. Define identity, policy, shared UI vocabulary, interoperability, observability, security blast radius, backup and exit paths **without** creating a second canonical registry, universal user-data database, shadow constitution, duplicate dashboard, common superadmin, mandatory paid dependency or single shared release switch. Ecosystem success requires user-facing interoperability and independently verified cross-product critical journeys, not simply a high repository count, CI percentage or prestigious brand analogy.

### 10.R27

**R27 — Ecosystem-first situational planning and bounded evolution.** Before creating a new app or upgrading a platform, ask whether the feature belongs in an existing product, a shared contract, a management-plane service or a new independent bounded context. Assess domain ownership, product autonomy, actual cross-product journeys, core/adapter boundaries, compatibility/version migrations, identity/security domains, organizational/technical cost and planned failure isolation. Determine each project's B-level and execution mode **and** its proposed ecosystem position, including E-level at the relevant portfolio root. Work from one end-to-end vertical slice across only the minimum necessary participants; expand one dependency edge at a time, test interoperation and independent rollback before deeper federation. Ecosystem E-level promotion/demotion must be reviewed against topology and real integration evidence, not automatic from project creation or from one Agent's claimed readiness. Future ecosystems must inherit the same decision logic, preserve separate Production/human gates and avoid reimplementing central capabilities per client.

### 10.R28

**R28 — Content-bearing software must have instructional architecture and real learning acceptance.** A learning app, course satellite or educational ecosystem must preserve one curriculum source of truth and an **explicit provenance boundary** between official institutional study-plan facts, independently verified external materials, and AI-authored supplemental learning content. Structure material as **program -> subject -> prerequisite/semester -> module -> lesson -> practice -> feedback/assessment -> durable evidence -> review**, with a dependency-aware and learner-readable route; subject-specific variations are legitimate, indiscriminate fixed ten-tab shells are not. Before declaring a lesson READY, verify real learning objectives, prerequisite correctness, substantive explanations and worked examples, discipline-appropriate assessment with checked answers, actionable error feedback, meaningful resource references, accessibility and stable learning-state readback. Generic rephrased templates, repeated boilerplate tasks, fabricated citations, empty simulations, aspirational features and synthetic mastery **must be flagged as DRAFT/UNVERIFIED**, not promoted by JSON validity or green code CI. Refactor existing subject owners in bounded, risk-prioritized vertical slices, preserve user progress and prior credible content, retire obsolete duplicate tabs/overrides only after parity testing, and require representative professional pedagogical review before broad rollout. UI legibility additionally inherits the computed-contrast obligations consolidated into this same amendment when ratified, but this R28 does **not** create duplicate contrast thresholds, runtime authority or a new content CMS.

### 10.R29

**R29 — Satellite identity, shared minimum and subject-specific pedagogy.** Each academic satellite in a governed learning ecosystem must inherit the **same universal Constitution, seven Century-Grade construction qualities, canonical authority and data/UX/security/provenance floor**. It must also declare **one distinct subject-specific learning identity**: audience and entry knowledge, core disciplinary questions, authentic kinds of worked examples, suitable modes of practice or simulation (including “not applicable”), assessment/feedback criteria, specialist vocabulary, source classifications and an accessible presentation suited to the subject. Consistency means identical reliability, truthfulness and navigation semantics, **not identical lesson scripts, ten-tab dashboards, cloned subject engines, arbitrary theme palettes or synthetic simulations**. A shared platform owns stable cross-subject primitives and interoperability contracts; a subject owns its syllabus mapping, pedagogy, evidence and specialist presentation. Every subject’s unique components must justify their instructional value, reuse shared accessibility/color controls and preserve learner state. A proposed satellite cannot be marked professionally accepted merely for existing in the catalog, passing JSON validation or rendering a common shell.

### 10.R30

**R30 — Century-Grade S100 architectural capacity for every satellite.** Interpret the requested **“100 floors” (S100)** as a *long-horizon capacity and evolution reference*, **not** a requirement to implement 100 literal layers, screens, files, services, tests, abilities or milestones. Every satellite Project Profile shall describe a credible future extension path across ten stable bands: **S01–10** product ownership and source truth; **S11–20** audience/competencies and outcomes; **S21–30** curriculum alignment and prerequisite sequencing; **S31–40** disciplinary concepts, explanation and worked examples; **S41–50** appropriate interactions/practice; **S51–60** assessment and actionable feedback; **S61–70** authentic labs/simulations/artifacts when applicable; **S71–80** individual learning state, evidence and safe resume; **S81–90** inclusive UX/contrast, performance, device and offline constraints; **S91–100** security, provenance, interoperability, maintainability and measured evolution. The bands are a **governance mapping for future capabilities**, not mandatory 10 subsystems or feature quota. At adoption, capture *one concise ten-band applicability/owner/gap map using the existing Project Profile or review record*, not a hundred empty records or new dashboards. Build only demonstrated learner value, use B0–B5 COMPACT/STRUCTURED proportional engineering, and verify each delivered vertical slice at exact SHA. Status per applicable capability stays **PLANNED / IMPLEMENTED / VERIFIED / NOT_APPLICABLE / UNVERIFIED**, with NOT_APPLICABLE justified; unknown future functions cannot be counted as built or tested.

### 10.R31

**R31 — Russian R200 specialized capacity and non-interchangeable educational gates.** A comprehensive Russian-language learning satellite of Bauman Hub shall target **R200**: **inherits all S100 common architectural bands unchanged** and **adds specialist extension bands R101–200**, not 200 literal code layers or 100 compulsory extra widgets. **R101–110** Cyrillic recognition and printed/handwritten forms; **R111–120** articulation, phonemes and listening discrimination; **R121–130** stress, vowel reduction, rhythm and intonation; **R131–140** graded listening comprehension; **R141–150** speaking, role-play and intelligible interaction; **R151–160** contextual core vocabulary, retrieval and spaced review; **R161–170** grammar in meaningful utterances; **R171–180** authentic graded reading and terminology; **R181–190** writing, dictation, handwriting and communicative texts; **R191–200** functional life-in-Russia/technical and academic Russian, assessments, adaptation and trustworthy proficiency evidence. The learning progression is **adaptive and user-goal-led**, including listen/speak-first routes with parallel Cyrillic print/handwriting acquisition when useful; it must not rigidly postpone one skill or falsify teacher-level proficiency. Russian-specific gates require **real native-quality audio/reference provenance, stress correctness, listen/speak interaction, Cyrillic usability, handwriting feedback where supported, learning-science-consistent review, responsive/offline continuity and independent linguistic/pedagogical validation**. Speech recognition confidence or simulated rubric scores are **not authenticated pronunciation mastery**; absent recordings/providers stay UNVERIFIED with honest alternatives. A short Russian phrase widget or a general Russia-life app does **not** automatically become R200; comprehensive Russian curricula must declare this profile and justify actual coverage.

### 10.R32

**R32 — One ecosystem academic inheritance contract, no proliferating constitutions.** The **universal normative law** remains in Software-Blueprint-Hub; **Bauman Hub E2 target architecture** derives a **non-sovereign learning ecosystem application profile** from it; satellites inherit S100 and declare their own specialty; Russian declares R200 **as an extension of S100**, never an independent constitution or authority. Resolve precedence as: effective universal law and authenticated authority → reviewed ecosystem Project Profile and existing study-plan ownership → satellite-specific instructional profile and canonical records → scoped work package. Subject design decisions can specialize pedagogy and presentation but cannot weaken source provenance, real QA, accessibility, user-data isolation, secured identity, cross-app contract or human review. For new satellites, evaluate reuse vs new module, academic evidence, S100/R200 applicability, B level, current risk and bounded first learning vertical slice **before** generating code. Any disputed official syllabus/credential or non-delegable language/content acceptance remains PENDING/UNVERIFIED until qualified review; do not silently promote generated content as institutional fact. The ecosystem may measure verified user capability, navigation clarity, reuse, lack of duplicated shells and cost; it shall **never** represent nominal floor count, number of generated lessons or a green CI badge as learning quality. Constitutional publication, adoption and Production promotion retain separate established gates.

## 11. Computed contrast and legibility

1. A component's foreground and background form one inseparable semantic contrast contract. Light text on dark/gradient/media surfaces, dark text on light surfaces; any reverse pairing must first prove sufficient contrast.
2. At minimum **WCAG 2.2 AA**: normal text **4.5:1**; large text (>=24px normal or >=14pt (56/3 CSS px) bold) **3:1**; meaningful non-text UI boundaries and state indicators **3:1**. Correctly disabled controls use the applicable WCAG exemption, but avoid illegible disabled text where feasible.
3. The requirement covers page titles, body text, descriptions, counters, KPI numbers, labels/captions, hint text, buttons, tabs, active/hover/focus/selected states, responsive layouts and supported themes.
4. For gradients, images, overlays and transparency, prove the **rendered foreground against the final composited background** at representative and worst-case positions. Require an appropriate scrim/opaque text panel if adequate contrast cannot be guaranteed throughout the surface.
5. A component must not inherit a visually incompatible global color rule. Prefer shared semantic tokens and scoped surface variants; do not accumulate indiscriminate `!important` overrides. Resolve cascade conflicts at the canonical design-system owner.
6. Browser acceptance must measure `getComputedStyle` values and rendered background/surface colors after all CSS and theme overrides load. Check desktop and mobile. CI cannot be declared PASS from static token existence alone, nor by changing test thresholds instead of repairing the defect.
7. Contrast is a **release-blocking UX gate** for newly changed user-facing UI. For existing deployments, report PASS/FAIL/UNVERIFIED truthfully, prioritize inaccessible surfaces and migrate via scoped work packages. Do not claim blanket compliance without verification.

Contrast strengthens gate:ux:commercial-quality and never replaces human UX acceptance. Existing deployments retain truthful FAIL/UNVERIFIED until scoped remediation and measured verification.
