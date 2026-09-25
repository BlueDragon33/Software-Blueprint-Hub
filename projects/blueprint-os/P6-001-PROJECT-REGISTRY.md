# P6-001 — Project Registry & Primary Entry Surface

Status: **IN PROGRESS**

## Problem

The A2 vertical slice proves the architecture, but the current root experience is still a single project workbench.

A professional Blueprint OS must first answer:

1. Which projects can this actor access?
2. What Blueprint Level / canonical profile identifies each project?
3. What should the user open next?
4. What happens when there are no projects or the user is not authenticated?

## Authority model

The UI must never query all projects and hide unauthorized rows client-side.

Required flow:

```
Web
 ↓
ProjectRegistryApplicationService
 ↓
AuthorityService accessible-project contract
 + ProjectProfileRepository registry query
 ↓
PostgreSQL adapters
```

Rules:

- unauthenticated registry access returns an authentication failure;
- System Owner can enumerate all project profiles;
- non-owner actors can enumerate only project IDs for which they hold a project role;
- application service resolves profiles for the authorized ID set;
- persistence adapters may execute efficient bulk queries, but authority remains Core-owned;
- registry output is read-only summary projection, not a second canonical Project model.

## Registry projection

Each row/card contains:

- projectId;
- profileId;
- project name;
- project type;
- Blueprint Level;
- recordVersion;
- updatedAt;
- actor role / System Owner indicator where useful to explain authority.

No readiness percentage is introduced in P6-001 because gate aggregation belongs to P6-002.

## Web information architecture

Root `/` becomes the Projects entry surface.

The proven A2 workbench moves to a dedicated project-oriented path without changing its authority semantics.

Initial routing target:

- `/` → Project Registry;
- `/projects/new` → guided create/preview/canonical flow;
- `/projects/[projectId]` → canonical project workspace entry.

P6-001 may keep the existing guided workbench component internally, but route ownership and project identity must become explicit.

## Error and empty states

Must include:

- signed-out state with clear sign-in action;
- zero-project state with create-project action;
- permission-safe empty state;
- database/runtime failure state without leaking implementation details;
- stale/missing project route state.

## Test matrix

Core:
- System Owner access enumeration.
- Project role assignment enumeration.
- No role means project absent.

Persistence:
- list all profiles.
- list profiles by authorized IDs.
- stable ordering.

Application:
- unauthenticated list denied.
- System Owner sees all.
- Viewer sees assigned project.
- unrelated project hidden.

Web:
- signed-out registry.
- empty authenticated registry.
- multi-project list.
- open project route.
- desktop/mobile layout.
- existing create → blueprint → work → gate → prompt journey remains intact.
