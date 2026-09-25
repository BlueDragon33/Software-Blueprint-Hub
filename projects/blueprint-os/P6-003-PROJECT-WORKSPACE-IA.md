# P6-003 — Project Workspace information architecture

Status: **IN PROGRESS**

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
