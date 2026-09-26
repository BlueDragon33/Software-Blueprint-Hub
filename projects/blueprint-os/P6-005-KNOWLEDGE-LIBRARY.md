# P6-005 — Knowledge Library

Status: **COMPLETE — CI/E2E/HUMAN UX EVIDENCE ACCEPTED**

## Purpose

Expose reviewed reusable engineering knowledge without mixing reusable
definitions with project-instance state.

Knowledge Library is a **read-only projection over version-controlled reusable
definitions** in this phase.

It is not:

- a project completion dashboard;
- a second Project Profile or Blueprint truth;
- a place where a template can mark a Quality Gate PASS;
- an excuse to invent Pattern, Anti-pattern or Reference Case content.

## Initial sources

Published items are projected from sources that already exist in the repository:

- `docs/UNIVERSAL-CONSTITUTION.v0.md`;
- `docs/TEMPLATE-RESOLUTION-CONTRACT.v1.md`;
- `docs/CI-TEST-CONTRACT.v1.md`;
- `docs/NFR-CAPACITY-BUDGETS.v1.md`;
- `docs/PHASE-0-REFERENCE-AUDIT.md`;
- `adr/0000-template.md`;
- `foundationBlueprintTemplatesV1`.

Template entries are derived from the actual template catalog instead of being
duplicated manually.

## Categories

1. Constitutions
2. Blueprint Templates
3. Patterns
4. Anti-patterns
5. Reference Contracts
6. Reference Cases

If a category has no reviewed canonical reusable item, the product shows an
explicit empty state.

P6-005 does **not** manufacture placeholder knowledge.

## Authority separation

Reusable knowledge may carry:

- stable library id;
- kind/category;
- title and summary;
- definition/template version;
- baseline status;
- source path;
- authority layer;
- tags.

Reusable knowledge must not carry:

- projectId;
- Work Package completion;
- project readiness;
- Quality Gate PASS/FAIL;
- project release status.

A Project may consume reusable definitions through Blueprint resolution, but
the reusable definition remains separate from the project instance.

## Product surface

Global route:

`/knowledge`

The Project Registry links to the library.

The first P6-005 surface is intentionally read-only.

Mutating reusable definitions through the web UI is outside this Work Package
because repository-reviewed version control is the current source-of-truth.

## UX rules

- explain the reusable-vs-project boundary above the catalog;
- expose version, source path and authority layer;
- make empty categories truthful and useful;
- desktop may use a two-column catalog;
- mobile becomes one column;
- category navigation may scroll horizontally;
- no project completion percentage;
- no fake badges implying gate acceptance.

## Acceptance

P6-005 may PASS only when:

- reusable catalog is produced by an application service;
- template items are derived from the existing foundation template catalog;
- source/version provenance is visible;
- empty Pattern / Anti-pattern / Reference Case categories do not fabricate data;
- application tests protect reusable/project authority separation;
- `/knowledge` browser journey passes desktop/mobile;
- Human UX review finds no blocking P0/P1 issue;
- exact-head push and PR CI are green.

Production deployment remains unauthorized.


## Completion evidence

Reviewed implementation revision before completion-status commit:

`6d42a5306afa36212806584c024a70aaf649de94`

Automated evidence:

- push CI run `36204513441`: **SUCCESS**;
- PR CI run `36204515551`: **SUCCESS**;
- application tests confirm reusable items contain no projectId, readiness or gate status;
- browser E2E verifies existing canonical reusable sources are visible;
- browser E2E verifies Pattern / Anti-pattern / Reference Case empty states remain empty;
- browser E2E verifies reusable cards contain no project-instance id/readiness/Gate PASS state;
- desktop/mobile screenshot artifact uploaded.

Human UX artifact:

- artifact id: `10892803075`;
- digest: `sha256:4a737dbf8251ca39953392efd3af4b1ccac2e9b39ed3b42e4ba0362b693f7412`.

Human review findings:

1. Reusable-vs-project authority boundary is explained before the catalog.
2. Source path, version, baseline status and authority layer are scannable.
3. Template definitions remain visually distinct from project completion state.
4. Empty Pattern / Anti-pattern / Reference Case sections are explicit rather than fabricated.
5. Desktop uses a readable two-column template/reference catalog.
6. Mobile becomes a single-column catalog without horizontal page overflow.
7. Category navigation and final actions remain usable on mobile.
8. Mobile catalog is intentionally long because all published items remain visible; density may be optimized later without changing truth semantics.
9. No blocking P0/P1 UX defect was observed.

## Result

**P6-005 = COMPLETE**

P6-006 — Release & Lessons is the next dependency Work Package.

Production deployment remains unauthorized.
