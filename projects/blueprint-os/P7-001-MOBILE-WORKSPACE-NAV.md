# P7-001 — Mobile Project Workspace navigation context

Status: **IN PROGRESS**

## Problem

Phase 6 Product UX Gate accepted the mobile workspace as usable, but recorded a P2 hardening issue:

The Project Workspace navigation is horizontally scrollable on narrow screens, yet a far-right active route may load while the scroll container remains positioned at the first tabs.

Breadcrumbs preserve route context, so this is not a Phase 6 blocker. However, the navigation itself should reveal the active destination.

## Design rule

The active navigation item remains canonical through:

`aria-current="page"`

P7-001 may add presentation behavior that reveals that active item.

It must not:
- reorder workspace routes;
- change route semantics;
- infer current route from browser text;
- mutate project state;
- introduce animated motion for reduced-motion users.

## Implementation shape

A small client-side navigation presenter may:

1. render the existing route list;
2. keep the active link ref;
3. on active-route mount/change, call `scrollIntoView` using:
   - `block: "nearest"`;
   - `inline: "center"`;
   - non-animated behavior;
4. keep desktop layout unchanged.

The project page itself remains server-rendered and canonical.

## Acceptance

- Overview still loads with Overview active;
- far-right Decisions / Risks & Debt / Releases & Lessons routes reveal the active tab on mobile;
- desktop sidebar remains fixed and unaffected;
- mobile tab strip remains horizontally scrollable;
- active item retains textual label and `aria-current`;
- no page-level horizontal overflow;
- exact-head desktop/mobile E2E PASS;
- Human UX review has no blocking regression.

Production deployment remains unauthorized.
