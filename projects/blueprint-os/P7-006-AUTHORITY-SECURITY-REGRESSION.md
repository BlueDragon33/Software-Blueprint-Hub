# P7-006 — Authority and security regression hardening

Status: **IN PROGRESS**

## Purpose

Expand negative-path and cross-project regression coverage for Blueprint-owned authority and canonical object identity.

P7-006 hardens existing authority boundaries; it does not introduce a second permission system.

## Authority matrix under test

Actions:

- `PROJECT_READ`
- `PROJECT_MUTATE`
- `PROJECT_REVIEW`
- `PROJECT_ADMIN`
- `ROLE_MANAGE`

Roles:

- OWNER: all project actions;
- EDITOR: read + mutate only;
- REVIEWER: read + review only;
- VIEWER: read only;
- System Owner: global authority;
- unauthenticated/no-role actors: fail closed.

## Cross-project rule

A role assignment in Project A must never authorize any action in Project B.

This applies even when an actor has the strongest project-scoped role (OWNER) in Project A.

## Object identity rule

Authority on Project A must not permit an actor to smuggle another canonical object identity into Project A state.

ProjectProfile identity is immutable after creation:

- `projectId` determines project scope;
- `profile.id` remains the stable identity of that project's canonical profile;
- update may change versioned profile dimensions but not replace `profile.id`;
- persistence read validates row id/project/version metadata against the JSON document.

This closes identity-drift paths that can confuse Registry and downstream projections without actually modifying another project row.

## Regression evidence required

P7-006 must prove:

1. exhaustive role × action permissions match the documented matrix;
2. all project-scoped actions fail across project boundaries;
3. non-owner project roles cannot grant roles;
4. unauthenticated project enumeration fails closed;
5. System Owner remains global without materializing project-role rows;
6. ProjectProfile update rejects identity mutation before persistence;
7. PostgreSQL read detects row/document profile identity drift;
8. existing governance, release, work-quality, prompt and registry authority regressions remain green;
9. exact-head Fast CI and Release Gate pass;
10. Human UX shows no regression in unauthorized/unavailable states.

## Gate

P7-006 may PASS only when no P0/P1 authority contradiction remains and all exact-revision automated evidence is green.

Production deployment remains unauthorized.
