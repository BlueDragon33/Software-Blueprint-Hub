# P7-002 — Dense canonical view progressive disclosure

Status: **COMPLETE — RELEASE GATE / HUMAN UX ACCEPTED**

## Problem

Phase 6 Product UX Gate accepted the canonical mobile views as usable but recorded a P2 hardening issue:

- Knowledge Library;
- Prompt Workspace;
- Quality;
- Releases & Lessons

can become long and expensive to scan on narrow screens.

The problem is density, not missing truth.

## Rule

Progressive disclosure may hide secondary detail from the first scan, but it must never hide the identity or status needed to interpret canonical state.

Always visible:

- record title / canonical ID where material;
- lifecycle or gate status;
- exact release revision where material;
- evidence count and latest/source revision where material;
- Prompt Fresh/Stale state and current source revision;
- Knowledge item source/version authority summary.

May be disclosed:

- full requirement lists;
- full linked-evidence lists when a compact provenance preview remains visible;
- secondary metadata;
- long tags lists;
- rollback detail;
- older Prompt history rows;
- verbose learning/provenance detail.

## Interaction contract

Use semantic native disclosure where possible:

`<details><summary>…</summary>…</details>`

Requirements:

- keyboard native;
- no custom hidden-state source-of-truth;
- summary text explains what will be revealed;
- content remains present in the document and can be expanded without network reload;
- disclosure does not change canonical data;
- critical provenance is not available only behind disclosure.

## Target surfaces

### Quality

Each gate keeps name/status and compact evidence provenance visible.

Requirements, linked IDs and the full evidence register may be expanded.

### Knowledge

Each item keeps title/version/summary visible.

Source/authority/status/tags move into a semantic “Provenance & tags” disclosure.

### Prompt

Current source revision, Fresh/Stale state, actions and current execution prompt remain primary.

Older Prompt history may use progressive disclosure if history becomes dense.

### Releases & Lessons

Version/status/exact revision/evidence identity stay visible.

Rollback/provenance/long secondary detail and verbose lesson context may be disclosed.

## Gate

P7-002 may PASS only when:

- existing canonical E2E remains green;
- new disclosure controls are keyboard-operable;
- critical revision/evidence/status assertions remain visible without expansion;
- mobile screenshots show materially improved scanning hierarchy;
- no provenance is deleted;
- exact-head CI + Human UX review PASS.

Production deployment remains unauthorized.


## CI execution model

Phase 7 uses two evidence cadences:

- **Development Fast CI** runs on development pushes and pull-request synchronization to catch repository/configuration regressions quickly.
- **Release Gate CI** runs for Ready pull requests and subsequent Ready-PR synchronizations. It executes the full PostgreSQL migration, contracts, lint/typecheck, architecture, unit/integration, production build and Playwright/Human UX evidence path.

P7-002 completion requires the Release Gate result for the exact completion revision; Fast CI alone is not completion evidence.


## Completion evidence

Reviewed implementation revision before completion-status commits:

`bb19b0bf479e1a21e46363d992caf7946ed82fb1`

Release Gate run:

- workflow run `36218814766`: **SUCCESS**;
- Fast CI: **PASS**;
- full release-gate job: **PASS**.

Full exact-revision checks passed:

- frozen dependency installation;
- Prisma generation and validation;
- empty PostgreSQL migration and migration status;
- generated contract drift and schema compatibility;
- lint and typecheck;
- architecture boundaries;
- unit, contract, authority and PostgreSQL integration tests;
- production build;
- canonical E2E seed;
- Playwright desktop/mobile suites;
- Human UX evidence upload.

Artifact:

- id: `10897364912`;
- digest: `sha256:85776604281b588311d1f534f54214d7094b938e08e80536531f8f14f593508a`.

Human UX review findings:

1. Quality keeps gate identity/status and compact source/revision/date provenance visible before expansion.
2. Quality mobile provenance hierarchy is separated cleanly after the final polish; no text collision or stretched status badge remains.
3. Knowledge keeps title/version/summary primary while provenance and tags are available through native disclosure.
4. Prompt keeps Fresh/Stale state, current canonical source revision, actions and the execution prompt primary; older history/metadata are secondary.
5. Releases keep version/status/environment, exact revision and gate evidence primary; rollback/provenance detail is secondary.
6. Lessons keep title/category/action primary while observation, impact and provenance can be expanded.
7. Native `details/summary` controls are keyboard-operable in browser E2E.
8. No canonical provenance was deleted and no disclosure requires a network reload.
9. No blocking P0/P1/P2 issue remains in P7-002 scope.

CI hardening performed while completing P7-002:

- disabled premature setup-node package-manager cache in Fast CI;
- corrected monorepo sanity paths for `apps/` and canonical Prisma files;
- added an opt-in exact-head full release gate for development branches;
- added a durable Ready-PR/manual Release Gate workflow for future work once merged to `main`.

## Result

**P7-002 = COMPLETE**

P7-003 — Accessibility hardening is the next dependency Work Package.

Production deployment remains unauthorized.
