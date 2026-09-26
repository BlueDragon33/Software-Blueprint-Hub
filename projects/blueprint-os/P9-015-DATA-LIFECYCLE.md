# P9-015 — Data Lifecycle & Archive

Status: **DEVELOPMENT CANDIDATE**

## Purpose

Define retention, archive, deletion, export and migration semantics for long-lived Blueprint OS engineering records without allowing implicit destructive mutation.

## Laws

1. Every supported record class has an explicit lifecycle rule.
2. Canonical project state, Quality evidence, Release provenance, audit records, reference snapshots and derived projections have distinct retention semantics.
3. Legal/operational holds block destructive lifecycle operations.
4. Destructive deletion requires explicit confirmation and verified backup; record classes that require provenance export also require verified export.
5. Quality evidence and Release provenance cannot be independently deleted.
6. Cross-project migration is forbidden by default.
7. Lifecycle planning is non-mutating; actual archive/delete/migrate execution requires a separately authorized audited path.
8. No automatic expiry may mutate canonical engineering truth.

## Acceptance

P9-015 completes only after lifecycle policy/plan tests, exact PR-head Fast CI, full Release Gate and UX evidence pass.
