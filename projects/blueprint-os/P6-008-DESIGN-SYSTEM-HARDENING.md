# P6-008 — Professional Design System hardening

Status: **COMPLETE — DESIGN SYSTEM / CI / HUMAN UX EVIDENCE ACCEPTED**

## Purpose

Stabilize the visual and interaction language already proven in Phase 6 so new product surfaces stop inventing one-off cards, chips, headings and action layouts.

P6-008 is a refactor/hardening work package, not a visual rebrand.

## Non-goals

- do not change canonical product semantics;
- do not change authority rules;
- do not collapse distinct project modules into generic cards;
- do not perform a big-bang rewrite of all CSS;
- do not replace proven responsive behavior with a new framework;
- do not create decorative progress indicators that imply readiness.

## Design tokens

Shared UI styling must use Blueprint-prefixed custom properties for:

- foreground/background hierarchy;
- border colors;
- primary/accent/success/warning/danger tones;
- radii;
- shadows;
- spacing rhythm;
- content widths;
- focus ring.

Raw values may remain in legacy CSS during incremental migration, but newly extracted primitives use tokens.

## Stable primitives

`@blueprint-os/ui` will own reusable presentation contracts for active Phase 6 patterns:

- `AppShell`
- `StatusChip`
- `Surface`
- `SectionHeading`
- `MetricCard`
- `EmptyState`
- `ActionGroup`

The primitives are presentation-only. They must not import application/domain/runtime code.

## Migration scope

P6-008 migrates representative high-frequency surfaces first:

1. Project Registry
2. Project Workspace frame / view headings
3. Knowledge Library
4. Prompt Workspace status/actions where safe

Existing feature-specific structures remain feature-owned.

## CSS rule

New primitives use `bp-*` design-system classes.

Feature CSS may compose those classes, but must not depend on DOM internals of another feature module.

## Accessibility

- interactive controls retain visible focus;
- status meaning is always textual, not color-only;
- action groups wrap on narrow viewports;
- empty states remain semantic content, not decorative placeholders;
- reduced-motion behavior remains preserved.

## Regression gate

P6-008 may PASS only when:

- UI package typecheck passes;
- migrated surfaces still pass existing browser E2E;
- desktop/mobile screenshots show no layout regression;
- no canonical semantics or authority path changes;
- Human UX review finds no blocking P0/P1;
- exact-head push + PR CI pass.

## Incremental rule

P6-008 does not require deleting every legacy CSS rule.

It requires a stable design-system foundation, representative migration, and a documented path that prevents further uncontrolled UI divergence.

Production deployment remains unauthorized.


## Completion evidence

Reviewed implementation revision before completion-status commit:

`7ab1b499c32f1702db145c7e0fd0a031bb5f48c1`

Automated evidence:

- push CI run `36211105325`: **SUCCESS**;
- PR CI run `36211095584`: **SUCCESS**;
- UI package typecheck passed;
- application/runtime/web typecheck passed;
- architecture-boundary tests passed;
- PostgreSQL integration and production build passed;
- all active browser E2E journeys passed;
- Human UX artifact upload passed.

Human UX artifact:

- artifact id: `10895233438`;
- digest: `sha256:d3734d768e9e84508a8a79ec7b85d66132ad15960f3e48526d0bf8b6e3b751f5`.

Representative Human UX review:

1. Project Registry keeps a clear action hierarchy and uses the shared status/action primitives without changing authority semantics.
2. Project Workspace preserves the stable left navigation on desktop and horizontal project navigation on mobile.
3. Readiness cards preserve textual status, blocker detail and conservative evidence wording after primitive migration.
4. Knowledge Library retains category hierarchy and read-only authority messaging despite its intentionally dense catalog content.
5. Prompt Workspace keeps Fresh/Stale semantics, action grouping, provenance and read-only prompt presentation intact.
6. Shared `bp-*` primitives do not introduce horizontal overflow in reviewed mobile screenshots.
7. Status meaning remains textual rather than color-only.
8. Focus/reduced-motion contracts remain present in the global design-system CSS.
9. No canonical domain, authority, persistence or release semantics changed.
10. No blocking P0/P1 Human UX defect was observed.

## Stable foundation delivered

- Blueprint-prefixed design tokens;
- `StatusChip`;
- `Surface`;
- `SectionHeading`;
- `MetricCard`;
- `EmptyState`;
- `ActionGroup`;
- representative migration across Registry, Workspace, Knowledge and Prompt surfaces;
- incremental compatibility with feature-owned CSS.

## Result

**P6-008 = COMPLETE**

P6-009 — Phase 6 Product UX Gate is the next dependency Work Package.

Production deployment remains unauthorized.
