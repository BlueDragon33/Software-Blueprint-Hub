# P6-009 — Phase 6 Product UX Gate

Status: **IN PROGRESS**

## Purpose

Evaluate the selected Phase 6 product baseline as one coherent product rather than a sequence of individually passing Work Packages.

P6-009 does not add new domain semantics unless the gate exposes a real defect that must be fixed.

## Baseline

Candidate Phase 6 baseline begins from:

`main@9e97ac47047acdeb2b628f7d9223d23cde3c4b74`

P6-001 through P6-008 are expected to be complete before this gate can PASS.

## Product journeys under review

### 1. Identity and Project Registry

- signed-out users do not see canonical project metadata;
- authenticated System Owner can enumerate readable canonical projects;
- project cards route into one canonical Project Workspace.

### 2. Project Workspace navigation

The workspace must expose stable routes for:

- Overview;
- Profile;
- Blueprint;
- Roadmap;
- Quality;
- Prompt;
- Decisions;
- Risks & Debt;
- Releases & Lessons.

Moving between views must not create a second project truth.

### 3. Readiness and Quality

- readiness is derived from canonical gate/work/evidence state;
- missing required gates fail closed;
- no cosmetic percentage implies product completion;
- evidence source/revision remains visible;
- current-vs-stale wording is conservative unless a trusted source verifies current revision.

### 4. Prompt Projection

- prompt state remains derived and read-only;
- Fresh/Stale is based on deterministic source revision;
- history remains visible;
- copy/export/regenerate actions remain understandable.

### 5. Governance

- Architecture Decisions, Risks and Technical Debt are canonical structured records;
- lifecycle/status/provenance remain visible;
- links to Work Packages remain explicit.

### 6. Release & Lessons

- release revision, evidence, rollback and Lessons Learned are visible as canonical state;
- Product Ready / Release Ready must not be inferred from unrelated work completion.

### 7. Knowledge Library

- reusable knowledge remains separate from project completion state;
- empty reusable categories remain truthfully empty;
- reusable entries keep source/version provenance.

### 8. Guided creation path

- `/projects/new` remains available as the proven guided path;
- preview remains clearly non-canonical;
- keyboard journey remains operable.

## Cross-product contradiction checks

P6-009 must fail if any of the following occurs:

- a completed Work Package is still marked IN PROGRESS in the Phase 6 source-of-truth;
- a route names the same canonical concept differently enough to imply separate state;
- status semantics disagree between Overview, Quality and Prompt views;
- a reusable Knowledge item is presented as project readiness/completion;
- Prompt content appears editable as project truth;
- a release is implied ready without revision-specific evidence;
- signed-out state exposes canonical project names or metadata;
- navigation reaches a dead/nonexistent canonical route;
- desktop/mobile layout has blocking overflow or unusable controls.

## Automated evidence

The exact candidate revision must pass:

- dependency install;
- schema generation/validation;
- PostgreSQL migration/status;
- contract drift/schema compatibility;
- lint;
- typecheck;
- architecture boundaries;
- unit/authority/PostgreSQL integration tests;
- production build;
- canonical E2E seed;
- Playwright desktop/mobile;
- a Phase 6 cross-product traversal.

## Human UX evidence

Human review must inspect at minimum:

- authenticated Registry desktop/mobile;
- Project Overview desktop/mobile;
- Quality desktop/mobile;
- Prompt desktop/mobile;
- Decisions desktop/mobile;
- Risks & Debt desktop/mobile;
- Releases & Lessons desktop/mobile;
- Knowledge desktop/mobile;
- guided flow desktop/mobile.

The review must explicitly assess:

- hierarchy;
- navigation continuity;
- terminology consistency;
- status semantics;
- content density;
- small-screen usability;
- provenance visibility;
- absence of fabricated state.

## PASS rule

P6-009 = PASS only when:

1. source-of-truth status is internally consistent;
2. exact-head push and PR CI pass;
3. cross-product browser traversal passes;
4. Human UX review finds no blocking contradiction or P0/P1 defect;
5. production deployment remains a separate authorization decision.

A PASS here authorizes Phase 7 hardening work. It does **not** authorize production deployment.
