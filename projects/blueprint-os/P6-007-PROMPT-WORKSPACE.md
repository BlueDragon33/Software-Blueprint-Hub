# P6-007 — Prompt Workspace ergonomics

Status: **COMPLETE — CI/E2E/HUMAN UX EVIDENCE ACCEPTED**

## Purpose

Make Prompt Projection practical to inspect, copy, export, regenerate and audit without ever promoting generated prompt text into project source-of-truth.

## Non-authority rule

Prompt Projection is derived output.

Canonical source remains:

- Project Profile;
- resolved Blueprint;
- Work Packages;
- Quality Gates;
- linked Gate Evidence.

A Prompt snapshot may be deleted or regenerated without changing canonical project truth.

The Prompt Workspace must never provide an editor that writes arbitrary prompt text back into canonical project state.

## Source revision and staleness

Prompt Projection already carries:

- sourceRevision;
- templateVersion;
- generatedAt;
- contentHash;
- content.

Freshness is determined only by:

`projection.sourceRevision === current canonical promptSourceRevision`

Age alone never determines Fresh/Stale.

Fresh does not mean all Quality Gates PASS. It only means the projection matches the current canonical source revision.

## History

Prompt history is append-only derived snapshot storage.

Persistence record:

`PromptProjectionSnapshot`

It stores a validated PromptProjection document plus query columns.

Rules:

- generation records a new snapshot;
- previous snapshots are not edited to match new canonical state;
- history is readable only through PROJECT_READ authority;
- history is ordered newest-first;
- same prompt content may appear multiple times if explicitly regenerated at different timestamps;
- history is provenance, not authority.

## Ergonomics

Stable workspace route:

`/projects/:projectId/prompt`

Capabilities:

- show current canonical source revision;
- show latest snapshot Fresh/Stale state;
- regenerate from trusted canonical state;
- copy read-only content;
- export Markdown client-side;
- inspect snapshot metadata;
- inspect history and each snapshot's current/stale relationship.

## Security / authority

- Prompt generation requires PROJECT_READ because generation is a projection, not mutation of canonical project truth.
- Recording a derived snapshot occurs only after authorized generation.
- Browser never submits editable Prompt content to the server.

## Acceptance

P6-007 may PASS only when:

- append-only Prompt history persistence is migration-safe;
- PostgreSQL integration proves multiple snapshots and canonical staleness;
- authority remains enforced by PromptProjectionApplicationService;
- Prompt Workspace renders stale fixture state;
- Regenerate records a new canonical projection and becomes Fresh;
- Copy and Export are available only for a projection;
- browser E2E proves stale → regenerate → fresh + history growth;
- Human UX review has no blocking P0/P1;
- exact-head push and PR CI are green.

Production deployment remains unauthorized.


## Completion evidence

Reviewed implementation revision before completion-status commit:

`93062f0e73d7886b983dcbdfa599d9d2a613ee79`

Automated evidence:

- push CI run `36210073724`: **SUCCESS**;
- PR CI run `36210076344`: **SUCCESS**;
- migration-safe PromptProjectionSnapshot persistence passed;
- PostgreSQL prompt history regression passed;
- production build passed;
- browser E2E passed;
- desktop stateful stale → regenerate → fresh flow passed;
- mobile read-only/responsive Prompt surface passed without mutating shared fixture state.

Race-condition fix:

- earlier CI failure was caused by desktop and mobile Playwright projects mutating the same Prompt history fixture;
- canonical product behavior was correct;
- stateful regeneration is now owned by the desktop browser project only;
- mobile validates the same Prompt Workspace without introducing shared-database mutation;
- no assertion was weakened for the desktop stale → fresh acceptance path.

Human UX artifact:

- artifact id: `10895406253`;
- digest: `sha256:a59cd6e47f3d6f4c28cd90e3a9995079982133ab5d439d87bd52495472c66665`.

Human review findings:

1. Prompt Workspace clearly labels the projection as derived/read-only.
2. Fresh/Stale describes source-revision alignment only and does not imply Quality Gate PASS.
3. Regenerate, Copy and Export are visible and logically grouped.
4. Current source revision, projection metadata and history provenance are distinguishable.
5. Desktop history shows the new Current snapshot and preserved Stale predecessor.
6. Mobile controls stack cleanly, prompt content remains readable and history remains inspectable.
7. Project workspace navigation remains horizontally scrollable on mobile as established by P6-003.
8. No blocking P0/P1 UX defect was observed.

## Result

**P6-007 = COMPLETE**

P6-008 — Professional Design System hardening is the next active dependency work package.

Production deployment remains unauthorized.
