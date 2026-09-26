# P6-006 — Release & Lessons

Status: **COMPLETE — CI/E2E/HUMAN UX EVIDENCE ACCEPTED**

## Purpose

Represent releases, exact revision evidence, rollback history and Lessons Learned as canonical project state.

P6-006 replaces the P6-003 placeholder Releases & Lessons view only after trusted structured state exists.

## Canonical entities

### ReleaseRecord

Required release identity:

- stable id;
- projectId;
- version;
- exact revision;
- environment;
- artifact source;
- lifecycle status;
- linked GateEvidence IDs;
- rollback plan;
- optional releasedAt / rollbackRevision / notes;
- RecordMeta.

Lifecycle:

- planned;
- candidate;
- released;
- rolled-back;
- superseded.

Rules:

- released / rolled-back / superseded artifacts require revision-specific GateEvidence;
- evidence must belong to this project;
- evidence must be linked by a canonical QualityGate at **PASS**;
- evidence revision must equal the ReleaseRecord revision;
- released / rolled-back records require releasedAt;
- rolled-back records require rollbackRevision;
- released artifact identity and evidence cannot be silently rewritten;
- a different artifact or revision requires a new ReleaseRecord.

### LessonLearned

Required fields:

- stable id;
- projectId;
- title;
- category;
- observation;
- impact;
- action;
- source + sourceRevision;
- optional releaseId;
- linked Work Package IDs;
- RecordMeta.

Rules:

- release links must point to a canonical ReleaseRecord in the same project;
- Work Package links must be canonical in the same project;
- learning remains separate structured state rather than free-form release notes.

## Authority

Reads require `PROJECT_READ`.

Release creation/update requires `PROJECT_REVIEW`.

Lesson creation/update requires `PROJECT_MUTATE`.

## Persistence

PostgreSQL is canonical.

Tables:

- `ReleaseRecord`;
- `LessonLearned`.

Repositories sit behind Core ports.

Optimistic recordVersion checks are required for updates.

Project deletion cascades project-owned release/lesson records. Deleting a release sets a linked lesson releaseId to null rather than deleting historical learning.

## UX

The stable route remains:

`/projects/:projectId/releases-lessons`

The view must show:

- version and lifecycle status;
- exact revision;
- environment;
- artifact source;
- release timestamp;
- rollback plan / rollback revision;
- linked GateEvidence IDs;
- canonical Lessons Learned;
- linked release and Work Packages;
- provenance and record version.

No release readiness percentage is permitted.

## Acceptance

P6-006 may PASS only when:

- additive contracts and generated types are in sync;
- Prisma migration is green from an empty database;
- PostgreSQL repository CRUD/list and optimistic conflicts are tested;
- application authority is tested;
- released artifact evidence is PASS-linked and exact-revision matched;
- rollback lifecycle invariants are tested;
- lesson release/work links are validated;
- Releases & Lessons renders canonical PostgreSQL fixture state;
- browser E2E confirms exact revision/evidence/lesson provenance;
- Human UX review finds no blocking P0/P1 issue;
- exact-head push and PR CI are green.

Production deployment remains unauthorized.


## Completion evidence

Reviewed implementation revision before completion-status commit:

`47c2a2e6a25cff1cc7cfcb60fd962c6b1896fa5d`

Automated evidence:

- push CI run `36207646907`: **SUCCESS**;
- PR CI run `36207655339`: **SUCCESS**;
- exact revision passed:
  - Prisma generation, validation, empty-database migration and migration status;
  - generated contract drift and additive schema compatibility;
  - lint, typecheck and architecture boundaries;
  - unit / authority / PostgreSQL integration tests;
  - production build;
  - canonical Project Registry + P6-006 E2E seed;
  - Playwright workspace journey and screenshot artifact upload.

Release invariants proven by integration coverage:

- released artifacts require project-canonical GateEvidence;
- evidence must be linked by a canonical QualityGate at PASS;
- evidence revision must equal the ReleaseRecord exact revision;
- rolled-back records require rollbackRevision;
- released artifact identity/evidence cannot be silently rewritten;
- stale optimistic writes fail;
- LessonLearned release / Work Package links must remain project-canonical;
- read-only actors may read but may not create release state.

Browser evidence proves canonical PostgreSQL state renders:

- release version `v1.0.0`;
- exact revision `revision-p6-006-e2e`;
- evidence id `evidence:p6-006-release`;
- production environment and artifact source;
- explicit rollback plan;
- Lesson Learned `Release evidence must match the shipped revision`;
- linked release and Work Package provenance.

Human UX artifact:

- artifact id: `10894521387`;
- digest: `sha256:48206bda10daa4bbfb829db0a76f747ebb4171b79ad5104a3bf2456ca8d905a5`;
- desktop Releases & Lessons screenshot reviewed;
- mobile Releases & Lessons screenshot reviewed.

Human review findings:

1. Release and Lesson Learned registers are visually distinct and easy to scan.
2. Exact revision, environment, artifact source and release timestamp are prominent.
3. Rollback plan/revision are explicit rather than hidden in free-form notes.
4. Linked GateEvidence IDs are visible without implying a readiness percentage.
5. Lessons Learned preserve observation, impact and action as separate fields.
6. Release/work links and source revision remain traceable.
7. Desktop layout is compact; mobile becomes one column without blocking overflow.
8. Mobile project navigation does not auto-scroll the active Releases & Lessons tab into the initial visible segment. Breadcrumb and content identify the active view, so this remains a non-blocking P6-008 navigation-polish item.
9. No blocking P0/P1 UX defect was observed.

## Result

**P6-006 = COMPLETE**

P6-007 — Prompt Workspace ergonomics is the next dependency Work Package.

Production deployment remains unauthorized.
