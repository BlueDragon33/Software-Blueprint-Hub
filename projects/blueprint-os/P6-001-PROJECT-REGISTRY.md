# P6-001 — Project Registry & Primary Entry Surface

Status: **COMPLETE — UX/CI EVIDENCE ACCEPTED**

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


## Completion evidence

Exact implementation revision reviewed before the completion-status commit:

`0861a3ac51c7d03a7134747d7f30302692a6b797`

Automated evidence:

- push CI run `36151834559`: PASS;
- PR CI run `36151840724`: PASS;
- authenticated multi-project registry tested;
- signed-out registry tested;
- canonical project open route tested;
- previous A2 guided preview journey retained;
- keyboard journey retained;
- PostgreSQL-backed canonical registry seed used in browser E2E.

Human UX artifact:

- artifact id: `10871738205`;
- artifact digest: `sha256:2f1825cf3db2002da3c7615e5fa70df20588a8ca2a68e59a62e2ab2dbab9a160`;
- desktop authenticated registry screenshot reviewed;
- mobile authenticated registry screenshot reviewed;
- desktop signed-out registry screenshot reviewed;
- mobile signed-out registry screenshot reviewed.

Human review findings:

1. Project Registry is visually and semantically the primary entry surface.
2. Canonical vs preview intent is distinguishable.
3. Signed-out state does not expose canonical project names or metadata.
4. Authority status is visible without being confused with readiness.
5. Desktop registry keeps the primary action and project list easy to scan.
6. Mobile layout becomes a single-column flow with large, clear actions and no horizontal overflow.
7. Existing guided vertical-slice journey remains separate and understandable.
8. No blocking P0/P1 UX defect was observed in the reviewed evidence.

## Result

**P6-001 = COMPLETE**

P6-002 — Readiness Dashboard is the next dependency work package.

Production deployment remains unauthorized.
