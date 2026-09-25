# Blueprint OS — Architecture V1

Status: **IMPLEMENTATION BASELINE — A2 VERTICAL SLICE READY**

## Architectural style

A modular product with a stable domain core, explicit application services, versioned contracts, declarative project-type templates and provider adapters.

Blueprint OS is not a microservice program by default. Initial deployment may be a modular monolith if that best preserves boundaries with lower operational cost.

Dependency direction:

```
Presentation → Application Services → Blueprint Domain Core → Ports → Adapters/Infrastructure
```

## Bounded contexts

1. **Project Registry** — project identity and lifecycle.
2. **Profile & Classification** — Project Profile, Blueprint Level and rationale.
3. **Blueprint Resolution** — required modules/gates/templates.
4. **Knowledge Library** — constitutions, patterns, anti-patterns and references.
5. **Decisions** — ADR lifecycle.
6. **Planning** — roadmap, waves, work packages and dependency graph.
7. **Quality** — gate definitions, evidence and evaluation records.
8. **Risk & Debt** — risk and technical-debt registers.
9. **Release & Learning** — releases and lessons learned.
10. **Prompt Projection** — generated execution prompts from canonical state.

Generated prompt text is never source-of-truth.

## Data architecture

Authoritative project state is structured, versioned data.

- Markdown is a human-readable projection/reference layer.
- Web UI is an editor/presentation layer.
- Generated prompts are execution projections.

Durable IDs must be stable and independent from display text, routes or array position.

Version concepts are distinct:

- `schemaVersion` — contract compatibility.
- `recordVersion` — record evolution/concurrency.
- `templateVersion` — reusable template release.
- `releaseRevision` — application artifact/deployment identity.

Mutations require schema validation and explicit authority. Retryable writes must be idempotent or conflict-protected. Migrations are explicit and additive-first; destructive global reset is not a normal migration strategy.

## Trust and security model

Trust zones:

1. User/browser — untrusted input surface.
2. Blueprint application/API — policy enforcement boundary.
3. Canonical data store — authoritative structured state.
4. External integrations — explicitly scoped providers.
5. Generated output — projection, not authority.

Conceptual V1 roles:

- Owner
- Editor
- Reviewer
- Viewer

Single-user deployment may map one human to several roles, but contracts must not assume this forever.

Security laws:

- UI visibility is never authorization.
- Secrets never live in committed project records.
- Provider credentials remain provider-managed.
- External AI receives only explicitly selected project context.
- Generated prompts cannot grant themselves elevated authority.
- Destructive actions require explicit scope and conflict checks.

## UI information architecture

V1 global shell:

- Projects
- Project Workspace
- Knowledge Library
- Settings

Do not expose every future library as top-level navigation.

Project Workspace:

1. Overview — readiness, active gate, blocked dependencies, current work.
2. Profile — classification inputs and Blueprint Level rationale.
3. Blueprint — required modules and evidence state.
4. Roadmap — dependency-aware work packages.
5. Quality — gates, evidence and defects.
6. Decisions — ADRs.
7. Risks & Debt.
8. Releases & Lessons.

UX rules:

- one obvious primary action per view;
- status color is never the only signal;
- loading/empty/error/permission/conflict states are designed;
- keyboard access for critical flows;
- mobile rearranges hierarchy rather than shrinking desktop;
- progressive disclosure instead of dashboard-card sprawl.

## Operations

Environments:

- Local/development
- Preview
- Production

Promotion:

`commit/revision → CI → preview artifact → exact revision verification → manual production promotion → smoke → observation`

Merging or CI success never implies production publish.

Observability must identify release revision, operation correlation ID, bounded context and structured error category without logging secrets.

Before persistent production data, backup and restore procedures must be defined and restore-tested.

## NFR baseline

These are design budgets to validate during implementation, not marketing claims.

### Reliability
- no known P0/P1 defect at release;
- conflict-protected/idempotent write retry behavior;
- no silent state loss on refresh/retry.

### Accessibility
Critical V1 journeys target WCAG 2.2 AA behavior for keyboard access, focus, labels, contrast and reduced motion.

### Data integrity
- canonical writes are schema validated;
- concurrent edits receive revision/conflict protection;
- core blueprint state is exportable before destructive deletion.

### Maintainability
Project-type behavior must not require scattered name-based switch statements across unrelated Core modules.

## Template extensibility

A project-type template may declare:

- profile additions;
- activated blueprint modules;
- gate additions;
- default patterns/checklists;
- prompt fragments/projections.

A template cannot:

- override Universal Constitution;
- bypass authorization;
- mutate unrelated project state;
- introduce unversioned Core schema ad hoc.

## Current evolution constraint

Foundation and the first end-to-end vertical slice have passed A1 and A2.

Broader product/UI expansion is now permitted only when:
- work is decomposed into dependency-aware Work Packages;
- existing contract, authority, migration and source-of-truth boundaries remain intact;
- critical journeys preserve loading/error/permission/conflict handling;
- Human UX acceptance and exact-revision CI evidence remain gate conditions.

A2 does not authorize production release by itself.
