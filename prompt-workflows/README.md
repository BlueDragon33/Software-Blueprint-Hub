# Central Prompt Workflow System — v1 foundation

Status: DESIGN CANDIDATE. This directory is not a ratified Constitution, a deployed orchestrator, or Production authorization.

## Why it exists

Blueprint OS already owns constitutional governance, canonical project plans, Quality Gates, Prompt Projection and Prompt history. This addition lets Blueprint OS own *versioned, project-specific prompt workflow definitions* as connected nodes rather than scattering long-lived orchestration instructions across application repositories.

The reference analogy is a node-based creative production workflow: each step receives explicit material, transforms it into an inspectable output, and hands off only when its acceptance criteria and dependencies are satisfied. Nodes may branch and converge; attractive output cannot substitute for evidence.

## Authority and placement

1. Universal Constitution 1.3.0 remains the highest engineering law; amendments follow the existing authenticated ratification and publication path.
2. Canonical Project Profile, Resolved Blueprint, Work Packages, Quality Gates and source evidence retain their existing owners. A repository's implementation code, build logs, real product data and test evidence remain in that repository or its trusted evidence store.
3. This Hub owns reviewed workflow manifests and reusable prompt templates. Project-specific scope, roles, handoffs and acceptance contracts live here, NOT copied into each app repository.
4. Existing Prompt Projection remains the generated read-only execution text. A workflow node is a controlled input to a future composite projection, not an alternative source-of-truth or a bypass around PromptProjectionApplicationService.
5. Application Management observes registration and lifecycle metadata. It never becomes the unilateral owner of constitutional authority, canonical project truth, Quality Gate PASS, or Production release.
6. A workflow manifest is versioned policy *for orchestration*, not proof that source repositories have already implemented its steps. Never infer completed work from presence of a manifest.

## Source of truth versus prompt recipe

- Source app repository: executable code, configuration, domain contracts, real test evidence, actual HEAD and PR states.
- Blueprint canonical state: project identity, architecture level, accepted Work Packages, Quality Gates and evidence references.
- Central workflow registry: stage sequence/graph, task prompts, specialty overlays, inputs/outputs, bounded budgets, required review.
- Generated projection: disposable, stamped instruction payload bound to exact canonical source revision, Constitution version and template/workflow versions.

Keep only a thin reference to the selected workflow version in an app handoff if necessary; no duplicate prompt library and no independent app-level prompt authority.

## Product pipeline (nonlinear DAG)

- DISCOVER: examine only relevant HEAD, diff, failing logs and user journey; verify real project scope.
- SPECIFY: turn user intent into falsifiable constraints, real use cases and measurable acceptance.
- DESIGN: select correct architecture, components, data ownership, failure/degraded behavior and UX contract.
- PLAN: split work into bounded dependency-aware tasks, establish rollback and stopping conditions.
- IMPLEMENT: smallest cohesive change, explicit files, no new incidental subsystems or documentation dumps.
- TEST: reproduce baseline failure, prove fix, regression, integration and realistic journey.
- REVIEW: professional UX/architecture/security/accessibility audit; unresolved critical findings block onward promotion.
- RELEASE: verify exact SHA, gates, authority and approval; do not infer Production readiness from green CI.
- LEARN: record source-linked failure modes and promote generic reusable patterns only through existing review.

Each node MUST declare stable ID, stage, template, goal, dependency IDs, authoritative inputs, verifiable outputs, acceptance checks, evidence, allowable actions, prohibited actions, retry/file/credit budget, explicit failure behavior and human gate requirement. The companion validator checks shape, broken dependencies, cycles, unbounded work and release gates.

## Specialized depth profiles

The existing Century-Grade Construction Standard covers every product; domain overlays govern *what to inspect*, never rewrite the Constitution. A 100-storey architecture target for normal products and a 200-storey learning depth target for Russian are product-depth aspirations, NOT permission to generate 100/200 arbitrary prompt nodes or claim 100/200 completed features. Meaningful dependency closure and validation outrank decorative counts.

Suggested domain overlays: educational curriculum/rubric; Russian phonetics and scaffolded learning; visa forms and identity validation; Windows desktop lifecycle and signed packaging; robotics/AI hardware; security and legal/privacy. Only attach overlays to a matching project.

## Projection execution contract (planned integration)

A trusted project adapter supplies: authenticated project ID, exact application HEAD, canonical Blueprint/Work Package/evidence revision, Constitution policy version and trusted evidence pointers. Runtime assembles the selected node's template, overlay and bounded context; produces a SHA-256-stamped read-only Prompt Projection; stores append-only history; invalidates projection when source/workflow/template revisions change. For each outcome it records proposal, evidence reference, blockers and explicit handoff state.

If the trusted adapter is unavailable, continue in read-only planning mode or block. Do not invent input, report PASS or use guessed HEAD. Secrets and untrusted repository prose must not become higher-priority instructions.

## Governance gates

- A candidate manifest may be reviewed/tested without activating it.
- Activating a workflow for a real app requires exact project mapping, canonical adoption review, security boundary review and a tested resolver/renderer.
- Do not modify ratified Constitution 1.3.0 to implement this candidate.
- Auto-fix loop: reproduce -> root cause -> smallest fix -> regression -> retest. Each node has a bounded attempt count; stop on repeated failure without new evidence.
- No default action merges, publishes or approves Production. Human-dependent review gates cannot be auto-PASSed by a prompt.
- Restrict external tools/providers by explicit scoped permission, cost and resilience budget.

## Phase 3: multi-project registry integration

A centralized manifest is selectable only if its `project.id` and `project.repo` match an entry in `control/constitution-governed-repositories.json`. The registry covers governed projects *even when no prompt workflow has been authored*. Such a project displays **not assigned**, not a fabricated default. One or several manifests may belong to a project; IDs must be globally unambiguous. The Next.js build uses a deterministic generated static-import list; whenever central workflow manifests change, regenerate with `pnpm generate:prompts`. `pnpm check:prompts` catches stale generated imports during CI. Application repositories do not receive copied prompt bundles.

A governed repository entry does not mean the corresponding Project Profile exists in the canonical Blueprint OS database, the user is authorized to read it, or it has a verified workflow adoption receipt. The Project Workspace enforces `PROJECT_READ` *before* describing a project's workflows. Workflow candidate preview checks the real branch HEAD and refuses successor nodes/human gates. The registry is metadata: it grants neither project access nor workflow execution, Gate PASS or Production release.

## Next integration milestones (NOT implemented by this foundation)

A. Expose typed workflow registry and validation in Blueprint OS.
B. Extend Prompt Projection to resolve one validated node + canonical project context, with stale detection over workflow/template versions.
C. Build a compact workflow canvas with node-level status from actual evidence, keyboard access and no ornamental UI clutter.
D. Add project onboarding for all governed repositories; migrate duplicate prompt materials only after reviewing each application's true owner.
E. Prove end-to-end behavior against Preview and real projects, then separately consider activation.

See: docs/PROMPT-ARCHITECTURE.v2.md, projects/blueprint-os/P6-007-PROMPT-WORKSPACE.md and the Phase 9 Compass construction map.
