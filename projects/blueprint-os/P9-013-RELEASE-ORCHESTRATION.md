# P9-013 — Release Orchestration

Status: **DEVELOPMENT CANDIDATE**

## Purpose

Prepare exact-revision promotion evidence and environment/provider state without treating merge, CI or a ReleaseRecord as deployment.

## Laws

1. A promotion plan is project-scoped and starts from one canonical ReleaseRecord in `candidate` state.
2. Every cited GateEvidence must exist, belong to a canonical PASS gate in the same project and target the exact release revision.
3. Promotion planning may inspect a deployment provider boundary, but the provider never gains Blueprint, Quality Gate or Production release authority.
4. Missing real deployment provider/capability produces a visible blocker, not a synthetic deployment.
5. A ready plan still requires explicit external execution; it never marks deployment as observed.
6. Merge, green CI and Release Gate PASS remain evidence, not deployment.

## Acceptance

P9-013 may complete only when:

- exact-revision evidence mismatch fails closed;
- non-PASS gate evidence fails closed;
- wrong provider scope/capability fails closed;
- missing provider becomes an explicit blocker;
- a valid provider boundary produces a deterministic ready-for-explicit-execution plan;
- the project workspace can inspect release promotion state without a fake Deploy success;
- full Release Gate + Playwright evidence pass on the exact merged revision.
