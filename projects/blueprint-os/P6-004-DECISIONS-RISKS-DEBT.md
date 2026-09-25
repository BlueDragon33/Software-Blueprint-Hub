# P6-004 — Decisions / Risks / Technical Debt

Status: **COMPLETE — CI/E2E/HUMAN UX EVIDENCE ACCEPTED**

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


## Completion evidence

Reviewed implementation revision before completion-status commit:

`8f2f1092adcebff993bf10606c963b003a53a280`

Automated evidence:

- push CI run `36202551991`: **SUCCESS**;
- PR CI run `36202665108`: **SUCCESS**;
- additive schema compatibility: PASS;
- generated contract drift: PASS;
- Prisma generate/validate/migrate/status: PASS;
- lint/typecheck/architecture boundaries: PASS;
- unit/authority/PostgreSQL integration tests: PASS;
- production build: PASS;
- canonical PostgreSQL E2E governance fixture: PASS;
- Decisions / Risks & Debt Playwright journey: PASS;
- Human UX artifact upload: PASS.

Regression fixed during P6-004:

- earlier browser E2E used an over-strict exact-text locator for ADR revision provenance;
- rendered UI correctly showed `Revision revision-p6-004-e2e`;
- test was corrected to assert the rendered provenance semantics instead of a nonexistent isolated text node;
- exact implementation head then passed both push and PR CI.

Human UX artifact:

- artifact id: `10893025370`;
- digest: `sha256:e642c84fe2ad942834ca279ae71364acbd94eec16c6d37e77d3ba9de3ab3d00f`;
- desktop/mobile Decisions screenshots reviewed;
- desktop/mobile Risks & Debt screenshots reviewed.

Human review findings:

1. Architecture Decision lifecycle, consequences and provenance are readable without mixing ADR status with Quality Gate state.
2. Accepted ADR content is presented as immutable canonical history; supersession remains explicit.
3. Risk and Technical Debt are clearly separated into distinct registers.
4. Risk likelihood/impact and debt severity/status use text as well as visual treatment.
5. Linked Work Package IDs are visible and traceable.
6. Source, source revision and record version are visible on canonical records.
7. Desktop layout is compact and scannable; mobile layout becomes one column without blocking horizontal overflow.
8. Mobile project navigation remains horizontally scrollable; the breadcrumb continues to identify the active view even when that tab begins outside the visible nav segment. This is a non-blocking polish item for P6-008 Design System hardening.
9. No blocking P0/P1 UX defect was observed.

## Result

**P6-004 = COMPLETE**

P6-005 — Knowledge Library is the next dependency Work Package.

Production deployment remains unauthorized.
