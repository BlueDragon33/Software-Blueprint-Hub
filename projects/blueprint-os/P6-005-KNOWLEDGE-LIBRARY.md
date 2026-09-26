# P6-005 — Knowledge Library

Status: **IN PROGRESS**

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
