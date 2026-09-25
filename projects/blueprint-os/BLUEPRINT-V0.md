# Project 0001 — Blueprint OS / Software-Blueprint-Hub

Status: **A2 VERTICAL SLICE READY — PHASE 6 PRODUCT EXPANSION AUTHORIZED**

## Product Charter

Blueprint OS is a **Software Engineering Control Center** that transforms a software idea into appropriate engineering depth, architecture, data/security/UX direction, dependency-aware work, quality evidence, release discipline and reusable knowledge.

It is not Bauman-specific and is not merely a document website.

### V1 must prove

1. Blueprint OS can blueprint itself.
2. A new project can be registered.
3. Blueprint Level can be selected/resolved.
4. Required design modules and gates can be resolved.
5. Structured blueprint state can be stored.
6. ADRs, Work Packages and Gate Evidence can be represented.
7. Execution Prompts can be generated from structured context.
8. A dashboard can show real blueprint readiness.

### Initial non-goals

- enterprise PM replacement;
- every library/navigation surface at once;
- automatic production deployment by default;
- prompts inventing architecture without stored state;
- Bauman learning semantics in Universal Core.

## System Context

Blueprint OS manages engineering blueprint/execution state; it does not automatically own runtime business data of managed projects.

Conceptual actors:

- Project owner/builder
- Product/architecture designer
- Implementer
- Tester/reviewer
- Release operator
- Template/pattern author

One human may hold several roles, but authority concepts remain distinct.

## Architecture

Primary design baseline:
- `ARCHITECTURE-V1.md`
- `../../docs/UNIVERSAL-CONSTITUTION.v0.md`
- `../../docs/TEMPLATE-RESOLUTION-CONTRACT.v1.md`
- `../../docs/NFR-CAPACITY-BUDGETS.v1.md`

Dependency direction:

```
Presentation → Application Services → Blueprint Domain Core → Ports → Adapters/Infrastructure
```

## Domain Meta-Model

Core concepts:

Project, ProjectProfile, BlueprintLevel, ProjectTypeTemplate, Constitution, BlueprintModule, Pattern, ArchitectureDecision, Roadmap, Wave, WorkPackage, Dependency, QualityGate, GateEvidence, Risk, TechnicalDebt, Release, LessonLearned, PromptTemplate, PromptProjection.

Machine-readable design seeds:
- `../../schemas/blueprint-meta-model.v0.json`
- `../../schemas/vertical-slice.contracts.v1.json`

## Accepted technology ADRs for Foundation

- ADR-0001: Node.js 24 LTS + TypeScript + Next.js App Router + pnpm modular monolith.
- ADR-0002: PostgreSQL behind repository ports, Prisma ORM v7 baseline.
- ADR-0003: Auth.js identity/session with Blueprint-owned Owner/Editor/Reviewer/Viewer authorization.

These are Project 0001 implementation decisions, not Universal Constitution.

## Dependency Roadmap

- Phase 0 — Repository/reference audit: complete.
- Phase 1 — Universal constitutions: complete baseline.
- Phase 2 — Blueprint OS own blueprint: B0-ready baseline complete.
- Phase 3 — Meta-model/schema baseline: sufficient for Foundation; hardening continues through contract tests.
- Phase 4 — Repository/runtime Foundation: complete; A1 PASS.
- Phase 5 — First vertical slice: complete; A2 PASS.
- Phase 6 — Professional Web UI / product expansion: **authorized next**.
- Phase 7 — QA/hardening.
- Phase 8 — Bauman reference import.

## First Vertical Slice

```
Create Project
→ Capture Project Profile
→ Resolve Blueprint Level
→ Resolve Required Modules + Gates
→ View Readiness
→ Create dependency-aware Work Package
→ Inspect Quality Gate
→ Generate Execution Prompt from structured state
```

Must exercise identity, profile, template resolution, structured persistence, dependency model, gate/evidence model, prompt projection, validation/security, coherent UI states and a testable release artifact.

Must not require all libraries, AI autonomy, Bauman-specific concepts, plugin marketplace or advanced analytics.

## Gate state

### B0 — Blueprint OS Design Ready

**PASS — 2026-09-25**

Evidence:
- `B0-REVIEW.md`
- Foundation Work Packages
- CI/Test Contract
- runtime/persistence/auth ADRs
- executable vertical-slice schema
- deterministic resolver contract
- NFR/capacity budgets

### A1 — Foundation Ready

**PASS — 2026-09-25**

Evidence:
- `FND-010-A1-REVIEW.md`
- FND-001 through FND-010 completion evidence
- final A1 PASS revision and CI evidence

### A2 — Vertical Slice Ready

**PASS — 2026-09-25**

Evidence:
- `A2-VERTICAL-SLICE-REVIEW.md`
- canonical Project → Blueprint → Work → Gate → Prompt flow
- PostgreSQL/authority/resolver integration
- Playwright desktop/mobile evidence
- Human UX review

### Next phase

**Phase 6 — Professional Web UI / product expansion**

New work must remain dependency-driven and preserve Preview/Canonical authority, evidence truthfulness and exact-revision quality gates.

A2 PASS does not authorize production deployment.
