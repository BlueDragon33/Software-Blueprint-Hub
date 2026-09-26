# P7-003 — Accessibility hardening

Status: **COMPLETE — RELEASE GATE / HUMAN UX ACCEPTED**

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


## Completion evidence

Reviewed implementation revision before completion-status commits:

`9feaf71a7a05b7133829bb9b1ff6f06b95cf56c4`

Fast CI:

- push run `36220817012`: **SUCCESS**;
- PR run `36220819370`: **SUCCESS**.

Release Gate:

- workflow run `36220819400`: **SUCCESS**.

Full gate passed:

- PostgreSQL migration and migration status;
- generated contract drift and schema compatibility;
- lint and typecheck;
- architecture boundaries;
- unit, contract, authority and PostgreSQL integration tests;
- production build;
- canonical E2E seed;
- Playwright desktop/mobile suites;
- Human UX evidence upload.

Artifact:

- id: `10899162037`;
- digest: `sha256:e20d378ada2b24c3326a93a4ce0919d2ee59309d6f521505ffdd1f8475e55250`.

Browser accessibility evidence:

1. the AppShell skip link is first-focusable on a neutral critical surface;
2. activating the skip link transfers focus to the stable main-content target;
3. no positive `tabindex` exists on the tested critical surfaces;
4. semantic disclosure summaries expose a visible focus outline;
5. Project Workspace navigation retains a named landmark and `aria-current="page"`;
6. critical gate status remains visible as text;
7. existing keyboard guided-setup and semantic disclosure journeys remain green.

Human UX review:

1. the accessibility hardening introduces no persistent visual clutter because the skip link is only revealed on keyboard focus;
2. mobile Quality remains readable without horizontal overflow;
3. active Project Workspace context remains obvious;
4. PASS / candidate / not-ready state remains textually distinguishable rather than color-only;
5. semantic disclosures remain compact and understandable;
6. no blocking P0/P1 accessibility or UX regression was observed.

The initial Release Gate run `36220666557` failed only because the second skip-link assertion assumed a single Tab after a mobile route-navigation focus side effect. The test was corrected to verify the same skip-link behavior without depending on route-restoration focus state. Product semantics were not weakened.

## Result

**P7-003 = COMPLETE**

P7-004 — Runtime resilience and recovery UX is the next dependency Work Package.

Production deployment remains unauthorized.
