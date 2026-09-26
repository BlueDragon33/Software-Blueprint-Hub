# P7-001 — Mobile Project Workspace navigation context

Status: **COMPLETE — CI/E2E/HUMAN UX EVIDENCE ACCEPTED**

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


## Completion evidence

Reviewed implementation revision:

`f44b578205778a35d3c3b45994a87c3632e20fbc`

Automated evidence:

- CI run `36214559209`: **SUCCESS**;
- typecheck / architecture boundaries / integration / build: PASS;
- desktop/mobile Playwright: PASS;
- mobile far-right active-tab visibility assertion: PASS.

Human UX artifact:

- artifact id: `10896833180`;
- digest: `sha256:a2365a0829d0e56326fa5973410cb05e33f9c9f77c874363aa148b446638040c`;
- workflow head: `f44b578205778a35d3c3b45994a87c3632e20fbc`.

Human review:

1. `Releases & Lessons` is automatically brought into the visible mobile tab strip.
2. The active tab remains textual and retains `aria-current="page"`.
3. Neighboring far-right tabs remain visible enough to preserve navigation continuity.
4. Breadcrumbs still provide canonical route context.
5. No page-level horizontal overflow was introduced.
6. Desktop sidebar behavior is unchanged.
7. Non-animated reveal avoids adding forced motion.
8. No blocking P0/P1 regression was observed.

## Result

**P7-001 = COMPLETE**

P7-002 — Dense canonical view progressive disclosure is next.

Production deployment remains unauthorized.
