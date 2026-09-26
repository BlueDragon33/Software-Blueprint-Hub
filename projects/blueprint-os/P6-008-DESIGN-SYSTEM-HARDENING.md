# P6-008 — Professional Design System hardening

Status: **IN PROGRESS**

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
