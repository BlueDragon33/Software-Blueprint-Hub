# P6-004 — Decisions / Risks / Technical Debt

Status: **IN PROGRESS**

## Purpose

Promote ArchitectureDecision, Risk and TechnicalDebt from Blueprint OS meta-model concepts into canonical, versioned project state.

P6-004 replaces the P6-003 placeholder views only after trusted structured state exists.

## Canonical entities

### ArchitectureDecision

Required fields:

- stable id;
- projectId;
- title;
- context;
- decision;
- consequences;
- status: proposed / accepted / superseded / deprecated;
- optional supersedesId;
- source and optional sourceRevision provenance;
- RecordMeta.

Rules:

- accepted decisions are not silently mutated into a different decision;
- supersession is explicit through status + supersedesId;
- UI projection is not source-of-truth.

### Risk

Required fields:

- stable id;
- projectId;
- title;
- description;
- likelihood: low / medium / high;
- impact: low / medium / high / critical;
- status: open / mitigating / accepted / closed;
- mitigation;
- optional owner;
- linked Work Package IDs;
- source and optional sourceRevision provenance;
- RecordMeta.

Rules:

- risk status is independent from Work Package and Quality Gate status;
- closed risk does not imply associated work is completed.

### TechnicalDebt

Required fields:

- stable id;
- projectId;
- title;
- description;
- severity: low / medium / high / critical;
- status: open / planned / in-progress / resolved / accepted;
- remediation;
- linked Work Package IDs;
- source and optional sourceRevision provenance;
- RecordMeta.

Rules:

- accepted debt remains visible;
- resolved debt is historical canonical state, not deleted UI state.

## Authority

Reads require `PROJECT_READ`.

Creates and ordinary updates require `PROJECT_MUTATE`.

Decision lifecycle changes that materially alter accepted architectural direction must be auditable through the existing Blueprint-owned authority/audit boundary.

## Persistence

PostgreSQL is canonical.

Repositories sit behind Core ports.

Optimistic recordVersion checks are required for updates.

Project deletion cascades project-owned decision/risk/debt records.

## UX

- Decisions view becomes a real register once canonical records exist.
- Risks & Debt view separates Risk from Technical Debt.
- empty states explain that the register is empty, not unavailable;
- statuses use text plus visual treatment;
- record provenance/version is visible;
- no fake severity score or readiness percentage.

## Acceptance

P6-004 may PASS only when:

- additive contracts exist and generated types are in sync;
- Prisma migration is reversible by clean rebuild and migration status is green;
- repository CRUD/list operations are integration-tested against PostgreSQL;
- application reads/writes enforce authority;
- optimistic recordVersion conflicts are tested;
- Decisions and Risks & Debt routes render canonical state;
- browser E2E proves records come from PostgreSQL fixture state;
- Human UX review finds no blocking P0/P1 issue;
- exact-head push and PR CI are green.

Production deployment remains unauthorized.
