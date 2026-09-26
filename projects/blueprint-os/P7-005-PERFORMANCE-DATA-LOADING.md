# P7-005 — Performance and data-loading hardening

Status: **IN PROGRESS**

## Purpose

Reduce avoidable server/database work and long-view loading cost without weakening canonical read, authority or provenance semantics.

Performance work must not introduce cached/fabricated fallback truth.

## Baseline findings

### Gate evidence N+1

Before P7-005, three canonical read paths loaded Quality Gates and then issued one Gate Evidence query per gate:

- Quality workspace view;
- Project Readiness aggregation;
- Prompt Projection source collection.

For a project with N Quality Gates this produced:

- one gate list query;
- N evidence queries.

Prompt source collection also waited for the Profile read before starting Work/Quality reads.

## P7-005 data-loading contract

### Batched Quality Gate evidence

Persistence exposes one project-scoped read that returns:

- each canonical QualityGate;
- its canonical GateEvidence records;
- evidence ordered newest-first within each gate.

Quality, Readiness and Prompt Projection must consume this batch path.

The per-gate evidence read remains available for mutation validation and targeted lookups; it must not be used in project-wide list/read projections.

### Parallel independent reads

After authority is established, independent canonical reads may run concurrently when they do not change semantics.

Prompt Projection source collection loads:

- Project Profile resolution;
- Work Packages;
- Quality Gate + Evidence bundles;

concurrently, then performs deterministic normalization exactly as before.

### Truth rules

Optimization must preserve:

- PROJECT_READ authority enforcement;
- canonical PostgreSQL state;
- deterministic Prompt source revision;
- explicit missing evidence behavior;
- exact evidence provenance;
- no cache/preview substitution on failure.

## Regression evidence

P7-005 must add tests proving:

1. project-wide Quality read uses the batch gate/evidence contract;
2. Readiness aggregation uses the batch contract;
3. Prompt source collection uses the batch contract;
4. batch persistence ordering returns newest evidence first;
5. result semantics remain equivalent to the pre-optimization canonical state.

## Further review

After eliminating the proven N+1 path, review:

- Prompt history loading size;
- long canonical list rendering;
- repeated static Knowledge Library construction.

Only make additional changes when benefit is concrete and semantics remain clear.

## Gate

P7-005 may PASS only when:

- no project-wide gate/evidence N+1 remains in Quality, Readiness or Prompt;
- compile/tests include performance-path regression;
- PostgreSQL integration proves batch correctness;
- deterministic Prompt revision tests remain green;
- Fast CI passes;
- exact-head Release Gate passes;
- Human UX review shows no loading-state or content regression.

Production deployment remains unauthorized.


## Implemented so far

- PostgreSQL batch read returns QualityGate + GateEvidence in one project-scoped query.
- Evidence inside each gate is ordered newest-first.
- Quality workspace consumes the batch read directly.
- Readiness consumes Work Packages + gate/evidence bundles concurrently.
- Prompt source collection loads Profile resolution, Work Packages and gate/evidence bundles concurrently.
- Application regression asserts Quality, Readiness and Prompt perform zero per-gate evidence list reads.
- PostgreSQL regression asserts batch evidence ordering.


### Long-view and repeated-read hardening

- Prompt history is page-bounded to 20 snapshots per request, with one look-ahead row for Next-page detection.
- Full Prompt provenance remains reachable through Previous/Next history pages; no snapshot is deleted or hidden permanently.
- The global latest Prompt snapshot remains correct even while browsing older history pages.
- Prompt Workspace reuses the already-authorized Project Profile resolution from the workspace loader when computing current source revision.
- Static Knowledge Library sections and ID lookup are precomputed once instead of filter/sort reconstruction on every request.
