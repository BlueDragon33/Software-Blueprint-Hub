# P8-007 — Phase 8 Reference Import Gate

Status: **DEVELOPMENT GATE CANDIDATE**

This gate decides whether Blueprint OS has demonstrated safe import and inspection of a complex external reference architecture without converting external project semantics into Universal Core authority or canonical project completion state.

## Scope

Evidence is restricted to the exact Blueprint OS revision evaluated by this gate. Passing this gate does **not** authorize Production deployment and does not claim the current Bauman application runtime equals the imported architecture snapshot.

## Required conditions

- no P0/P1 defect observed in the Phase 8 implementation path;
- no source-of-truth contradiction between the Reference Case, import manifest, Knowledge projection and Phase 8 roadmap;
- no provenance loss: source repository, source ref, pull request, exact source revision, manifest revision and local paths remain explicit;
- no Bauman-specific coupling in Universal Core authority surfaces;
- Reference Import carries no project, quality-gate, release or access authority;
- unrelated canonical Project, Prompt and Quality state remains unchanged by Reference Import reads;
- Development Fast CI must pass on the exact PR head;
- Release Mode evidence remains separate and manual.

## Evidence baseline

- P8-001 normalized Reference Case: `docs/reference-cases/BAUMAN-NEXTGEN-v1.md`
- P8-002 semantic mapping: `docs/reference-cases/BAUMAN-NEXTGEN-MAPPING-v1.md`
- P8-003 universality analysis: `docs/reference-cases/BAUMAN-NEXTGEN-GAP-ANALYSIS-v1.md`
- P8-004 Reference Case inspection UX
- P8-005 machine-readable manifest: `schemas/reference-import-manifest.v1.json`
- P8-005 validated local payload: `packages/application/src/reference-imports/bauman-nextgen-v1.json`
- P8-006 cross-boundary regression: `tests/application/bauman-reference-regression.test.ts`
- P8-007 Core-coupling regression: `tests/architecture/reference-core-coupling.test.ts`

## Decision rule

The gate may be recorded as **PASS — DEVELOPMENT BASELINE** only after the exact PR head passes Development Fast CI and the PR remains clean/mergeable.

A Development PASS means the Reference Import architecture is accepted as a development baseline. It does not imply Production deployment, hosted release verification, PostgreSQL release migration validation, or Playwright Release Mode completion.
