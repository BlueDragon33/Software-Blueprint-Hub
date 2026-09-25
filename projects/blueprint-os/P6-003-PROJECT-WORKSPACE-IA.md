# P6-003 — Project Workspace information architecture

Status: **COMPLETE — CI/E2E/HUMAN UX EVIDENCE ACCEPTED**

## Purpose

Replace the long canonical project page with a stable, professional project workspace without splitting or duplicating source-of-truth.

The workspace is a projection over the existing canonical Project Profile, Resolved Blueprint, Work Packages, Quality Gates and Gate Evidence.

## Stable views

1. **Overview**
   - readiness headline;
   - blockers;
   - next engineering action;
   - concise project facts.

2. **Profile**
   - canonical Project Profile fields;
   - users / jobs-to-be-done;
   - data / trust / deployment constraints;
   - record metadata.

3. **Blueprint**
   - resolved required modules;
   - required Quality Gates;
   - exact template versions;
   - resolver warnings and provenance.

4. **Roadmap**
   - canonical Work Packages;
   - dependency state;
   - acceptance criteria;
   - linked Quality Gates.

5. **Quality**
   - canonical Quality Gates;
   - explicit status;
   - requirements;
   - linked evidence IDs;
   - evidence source, revision and timestamp.

6. **Decisions**
   - reserved route only until P6-004 creates canonical ADR state.

7. **Risks & Debt**
   - reserved route only until P6-004 creates canonical Risk and TechnicalDebt state.

8. **Releases & Lessons**
   - reserved route only until P6-006 creates canonical Release and Lessons Learned state.

## Source-of-truth rule

No workspace view may:

- query Prisma directly;
- invent local completion state;
- duplicate canonical records;
- infer PASS from Work Package completion;
- fabricate ADR, Risk, TechnicalDebt, Release or Lessons Learned records.

Roadmap and Quality reads are exposed through authority-safe application services.

## Navigation rule

The route root remains:

`/projects/:projectId`

Stable child routes:

- `/profile`
- `/blueprint`
- `/roadmap`
- `/quality`
- `/decisions`
- `/risks-debt`
- `/releases-lessons`

The guided project setup flow remains available at:

`/projects/new`

It is a guided creation path and does not replace the canonical workspace.

## UX rule

Desktop:

- project header remains stable;
- project navigation is persistent at the left;
- main content is wide enough for dense engineering state;
- only the active view owns the primary content area.

Mobile:

- navigation becomes horizontally scrollable;
- content becomes one column;
- cards and record rows must not overflow;
- future-module states must remain explicit and readable.

## P6-003 acceptance

P6-003 may PASS only when:

- all stable routes exist;
- Overview/Profile/Blueprint/Roadmap/Quality render canonical data;
- future-module routes explicitly say canonical data is not available yet;
- authority-safe application reads back Roadmap/Quality;
- signed-out / not-found / unavailable states stay protected;
- guided `/projects/new` flow remains functional;
- desktop/mobile browser navigation passes;
- Human UX review finds no blocking P0/P1 issue;
- exact-head push and PR CI are green.

Production deployment remains unauthorized.


## Completion evidence

Reviewed implementation revision before the completion-status commit:

`e9b6ceba42fad333488416bf022308f89227e95a`

Automated evidence:

- push CI run `36162507523`: **SUCCESS**;
- PR CI run `36162535826`: **SUCCESS**;
- exact revision passed PostgreSQL migration/status, schema compatibility, lint, typecheck, architecture boundaries, unit/authority/PostgreSQL integration tests, production build and Playwright E2E;
- workspace browser journey traversed Overview → Profile → Blueprint → Roadmap → Quality → Decisions → Risks & Debt → Releases & Lessons → Overview;
- guided `/projects/new` journey remained functional.

Human UX artifact:

- artifact id: `10876187214`;
- digest: `sha256:557e262ab26390508d3ebce0ba67474a8156d1fc27d214ee26b8bbc95be1e322`;
- desktop/mobile Overview screenshots reviewed;
- desktop/mobile Quality screenshots reviewed.

Human review findings:

1. Desktop project navigation is stable and clearly separates workspace views.
2. Overview is concise: readiness, blockers, next action and project facts are visible without the old long-page requirement dump.
3. Quality owns gate/evidence detail and preserves source/revision provenance.
4. Mobile navigation is horizontally scrollable rather than stacking a long sidebar.
5. Mobile content is one column with no blocking horizontal overflow.
6. Guided project setup remains visually separate from canonical workspace navigation.
7. Reserved Decisions/Risks/Releases routes truthfully state that canonical modules are not available yet.
8. No blocking P0/P1 UX defect was observed.

## Result

**P6-003 = COMPLETE**

P6-004 — Decisions / Risks / Technical Debt is the next dependency Work Package.

Production deployment remains unauthorized.
