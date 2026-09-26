# P7-003 — Accessibility hardening

Status: **IN PROGRESS**

## Purpose

Harden the canonical Blueprint OS product for keyboard and assistive-technology use without changing canonical data semantics.

## Scope

Critical flows:

- Project Registry;
- canonical Project Workspace;
- Quality;
- Prompt;
- Knowledge;
- Releases & Lessons;
- guided project setup.

## Rules

Accessibility changes must not:

- create a parallel UI source-of-truth;
- hide canonical status/provenance;
- replace native semantics with custom ARIA when native HTML is sufficient;
- add positive tabindex values;
- trap keyboard focus;
- force animation for reduced-motion users.

## Required behavior

### Skip navigation

Every AppShell surface provides a first-focusable **Skip to main content** control.

The target:

- is stable;
- can receive programmatic focus;
- does not add a duplicate main landmark;
- appears visibly when keyboard-focused.

### Focus visibility

Visible keyboard focus applies to:

- links;
- buttons;
- inputs;
- selects;
- textareas;
- semantic disclosure summaries;
- explicit non-negative tabindex elements.

### Landmarks and current context

Critical pages retain:

- one discoverable primary content flow;
- named navigation where navigation is material;
- `aria-current="page"` on the active Project Workspace view;
- meaningful page/section headings.

### Status semantics

Critical state remains explicit in text.

Color alone must not be required to distinguish:

- PASS / FAIL / candidate / not-ready / missing;
- Fresh / Stale;
- Blocked / In progress / Required gates PASS.

### Keyboard

Critical interactions must be operable without pointer input:

- skip link;
- project workspace navigation;
- disclosure controls;
- guided creation flow;
- primary actions.

## Gate

P7-003 may PASS only when:

- Fast CI is green;
- exact-head Release Gate is green;
- E2E verifies skip navigation and focus movement;
- E2E verifies visible focus for native disclosures;
- E2E rejects positive tabindex;
- current-route semantics remain intact;
- critical keyboard flows remain green;
- Human UX review finds no blocking accessibility regression.

Production deployment remains unauthorized.
