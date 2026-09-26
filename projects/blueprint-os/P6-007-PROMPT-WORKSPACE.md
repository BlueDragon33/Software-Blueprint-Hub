# P6-007 — Prompt Workspace ergonomics

Status: **IN PROGRESS**

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
