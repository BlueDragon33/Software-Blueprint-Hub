# P6-006 — Release & Lessons

Status: **IN PROGRESS**

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
