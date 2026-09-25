# ADR-0002 — PostgreSQL persistence behind repository ports

Status: Accepted for Foundation planning  
Date: 2026-09-25

## Context

Blueprint OS stores relational, versioned, queryable engineering state: projects, profiles, modules, dependencies, gates, evidence, decisions, risks and releases.

## Decision

Use PostgreSQL as the canonical V1 production persistence technology behind repository/application ports.

Use Prisma ORM **v7 baseline** for schema/migration/client integration during the first implementation wave. Do not adopt an RC major merely because it is newer. Re-evaluate a newer stable major through dependency review when implementation starts.

Rules:

- domain contracts do not import Prisma types;
- database row shape is not the public/domain contract;
- migrations are checked into source control;
- optimistic revision/conflict rules are enforced for editable canonical records;
- tests may use isolated PostgreSQL databases/transactions, not a semantically different storage engine as proof of production behavior.

## Alternatives considered

1. SQLite as both development and production canonical store.
2. Document database.
3. PostgreSQL + Drizzle.
4. PostgreSQL + Prisma.
5. Provider-specific database APIs in domain code.

## Rationale

The meta-model is strongly relational and benefits from foreign keys, transactions and explicit migrations. A repository boundary preserves portability. Prisma v7 is currently fully supported while its newer major is in release-candidate status, making v7 the more conservative baseline for this design decision.

## Consequences

Positive:
- strong relational integrity;
- mature migration path;
- provider-neutral PostgreSQL deployment options.

Cost:
- database infrastructure is required for integration tests and development;
- ORM updates require compatibility review.

## Security

Database credentials are environment/provider secrets and never stored in Blueprint project records.

## Validation

Foundation tests must prove:
- migration from empty database;
- schema constraints;
- transactional write behavior;
- revision conflict rejection;
- export before destructive project deletion.
