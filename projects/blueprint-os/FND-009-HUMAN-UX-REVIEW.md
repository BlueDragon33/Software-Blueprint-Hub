# FND-009 — Human UX Review

Review date: 2026-09-25  
Reviewed runtime revision: `d024a1f7b3225666d1f51b82a8f4a45ec5e09c62`  
CI run: `36138249525`  
Artifact: `fnd009-human-ux-d024a1f7b3225666d1f51b82a8f4a45ec5e09c62`  
Artifact digest: `sha256:ccce1b58d27e76da8b9e4ab305d329ae461eeea7cb597a30492e3e8409f7bfcd`

Status: **PASS**

## Scope reviewed

The review covers the FND-009 critical vertical-slice presentation and interaction model:

`Project → Blueprint → Work Package → Quality Gate → Execution Prompt`

Evidence includes:
- desktop Chromium rendered full-page screenshot;
- mobile Chromium rendered full-page screenshot;
- Playwright interaction through the complete preview journey;
- complete keyboard-operated journey;
- canonical PostgreSQL integration proof for Project/Profile → Work/Gate → Prompt;
- exact-revision production build and architecture-boundary checks.

## Human acceptance findings

### User knows where they are — PASS

The shell exposes:
- current project identity;
- five-step journey;
- current step;
- readiness count;
- workspace context.

Desktop additionally exposes persistent navigation and context. Mobile preserves the project identity and journey hierarchy without duplicating desktop navigation.

### Next action is evident — PASS

The active journey step is visually and textually identified. Primary actions remain explicit:
- Resolve blueprint;
- Continue;
- Persist work/gate when canonical;
- Generate preview/canonical prompt.

The workflow does not require the user to infer hidden state from color.

### Preview vs canonical authority is understandable — PASS

Preview mode explicitly says it is read-only and cannot create project truth.

Canonical writes are routed through trusted Server Actions/application services. The UI no longer manufactures Human UX Gate Evidence from a client toggle.

The Quality Gate explains that Human UX evidence requires an authorized reviewer and exact revision.

### Loading, permission, conflict and error recovery — PASS FOR FND-009

Server Actions expose typed user-facing failure categories:
- authentication;
- permission;
- conflict;
- validation;
- runtime.

Canonical action failures do not silently fall through into preview state.

### Status is not color-only — PASS

Journey items, readiness state, Preview/Canonical status and gate state include text labels and/or icons in addition to color.

### Keyboard critical journey — PASS

Playwright proves the preview journey is operable by keyboard through:
- Project Profile editing;
- Blueprint Level selection with Space;
- Resolve with Enter;
- Blueprint → Work transition;
- Work Package editing;
- Work → Gate transition;
- Prompt generation with Enter.

The final prompt contains the keyboard-entered work package title.

### Mobile hierarchy — PASS AFTER FIX

Initial human review found the sticky project topbar visually overlaying prompt content in a full mobile journey.

Root-cause fix:
- under 850px the topbar now returns to normal document flow;
- mobile keeps project identity at the top without covering later content.

The corrected exact-revision screenshot confirms the overlay is gone.

### Navigation coherence — PASS

Desktop uses one sidebar plus one project workspace journey.

Mobile removes the desktop sidebar rather than duplicating it in a second competing navigation system.

### Information density — PASS WITH NON-BLOCKING FOLLOW-UP

The Execution Prompt is intentionally dense because it is an executable handoff artifact.

On mobile it remains contained inside the prompt surface and the surrounding hierarchy remains understandable. A later product wave may add copy/export/collapse affordances, but this is not a blocker for the first vertical slice.

## Defects found and closed during review

1. Client UI could manufacture fake Human UX evidence.
   - Fixed by removing the toggle and separating Preview from Canonical state.

2. Canonical App Shell path was not persisted end-to-end.
   - Fixed with trusted server/application-service orchestration and PostgreSQL integration coverage.

3. Web presentation imported Core directly for error classes.
   - Fixed by respecting runtime/application boundaries and classifying stable error codes.

4. Vitest accidentally discovered Playwright test files.
   - Fixed with dedicated `*.pw.ts` convention and Playwright `testMatch`.

5. Playwright strict locators matched project text as well as status labels.
   - Fixed with exact semantic locators; assertions were not weakened.

6. Mobile sticky topbar overlaid prompt content.
   - Fixed with responsive normal-flow topbar behavior.

## Decision

**FND-009 Human UX Gate: PASS**

This does not imply Foundation/A1 Ready.

The next authorized work is FND-010, which must independently assemble exact-revision CI, PostgreSQL migration/integration, resolver, authority, browser E2E, Human UX and P0/P1 evidence before A1 can pass.
