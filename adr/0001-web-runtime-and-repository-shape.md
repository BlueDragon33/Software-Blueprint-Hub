# ADR-0001 — Initial web runtime and repository shape

Status: Accepted for Foundation planning  
Date: 2026-09-25

## Context

Blueprint OS V1 needs one professional web application and shared domain packages, but Gate B0 explicitly rejects premature distributed architecture.

## Decision

Use:

- TypeScript as the implementation language;
- Node.js 24 LTS as the Foundation runtime baseline;
- Next.js App Router for `apps/web`;
- pnpm workspace for repository/package management;
- domain/application logic in reusable packages outside page components;
- a modular-monolith deployment for the first vertical slice.

Node 24 is an LTS line. Runtime patch/minor versions are lockfile/CI concerns; changing Node major requires compatibility review.

Next.js is the delivery shell, not the domain architecture.

Proposed implementation shape:

```
apps/web
packages/core
packages/blueprint-engine
packages/ui
packages/contracts
tests
```

Server Components/route handlers may call application services, but page/layout files must not become repositories, policy engines or canonical schema definitions.

## Alternatives considered

1. Separate SPA + dedicated API service from day one.
2. Multiple microservices.
3. Static-only documentation site.
4. Full-stack Next.js modular monolith.

## Rationale

Option 4 gives one deployable vertical slice with low operational overhead while preserving logical ports/boundaries. Physical service extraction remains possible when independent scaling, security or deployment requirements justify it.

## Consequences

Positive:
- fast path to a real vertical slice;
- TypeScript contracts shared across UI/application packages;
- fewer deployment surfaces during architecture validation.

Cost:
- strong review discipline is needed to stop framework folders from absorbing domain logic.

## Compatibility

No public runtime exists yet, so there is no migration burden.

## Validation

Foundation cannot pass if:
- page components own canonical project state;
- project-type logic is scattered through route/page conditionals;
- integration adapters are imported directly by unrelated UI modules.
