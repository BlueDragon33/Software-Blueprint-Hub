# P9-012 — Quality Evidence Graph

Status: **DEVELOPMENT CANDIDATE**

## Purpose

Make Work Package → Quality Gate → Gate Evidence → Release provenance inspectable as an explainable graph without manufacturing readiness or changing canonical state.

## Graph semantics

Nodes:

- Work Package;
- Quality Gate;
- Gate Evidence;
- Release Record.

Edges:

- Work Package → Work Package: dependency;
- Work Package → Quality Gate: required gate;
- Quality Gate → Gate Evidence: canonical evidence link;
- Release Record → Gate Evidence: release evidence citation.

## Laws

1. Graph input is project-scoped canonical data already authorized for read.
2. Cross-project records fail closed.
3. Orphan or contradictory graph links fail closed.
4. Evidence source and exact revision stay visible.
5. Graph is a projection only: no canonical mutation, Gate mutation or release authority.
6. No graph metric is converted into a readiness score or PASS claim.

## Acceptance

P9-012 may complete only when:

- graph ordering is deterministic;
- cross-project records and orphan links fail closed;
- evidence revision/source provenance stays inspectable;
- Work/Gate/Evidence/Release edges are explainable;
- project Quality UX can open the graph without losing canonical boundary;
- full Release Gate and Playwright evidence pass on the exact merged revision.
