# P7-004 — Runtime resilience and recovery UX

Status: **COMPLETE — RELEASE GATE / HUMAN UX ACCEPTED**

## Purpose

Make canonical Blueprint OS failures explicit, retryable and semantically accurate without silently substituting preview, cached or fabricated state.

## Failure taxonomy

Canonical reads distinguish:

- `signed-out` — no trusted identity;
- `forbidden` — authenticated actor lacks authority;
- `not-found` — authorized canonical record does not exist;
- `unavailable` — trusted runtime/canonical read failed;
- unexpected route failure — handled by the route error boundary.

These states must not be collapsed into one generic error.

## Recovery rules

### Forbidden

- do not expose protected metadata;
- do not offer retry as if authorization were a transient outage;
- offer navigation back to readable projects;
- do not fall back to preview.

### Not found

- state that no canonical record exists;
- do not invent a project;
- do not imply runtime outage.

### Runtime unavailable

- preserve identity/context where safe;
- explicitly state canonical data was not replaced by preview or cache;
- offer retry on the same route through `router.refresh()`;
- expose retry progress to assistive technology.

### Unexpected route failure

- show a product-owned error boundary;
- keep canonical/preview distinction explicit;
- offer framework reset on the same route.

## Empty and stale states

Existing truthful states remain valid:

- empty Project Registry remains an authority-filtered empty set;
- empty Quality/Knowledge collections remain explicit;
- Prompt Stale remains a canonical source-revision mismatch, not a runtime error;
- stale Prompt history remains preserved for provenance.

## Gate

P7-004 may PASS only when:

- authorization denial is distinguished from runtime unavailability;
- a no-access E2E actor cannot see protected project metadata;
- no-access UX does not offer a transient retry or preview fallback;
- runtime outage surfaces include same-route retry;
- unexpected route failures have a product-owned reset boundary;
- empty/stale existing flows remain green;
- Fast CI passes;
- exact-head Release Gate passes;
- Human UX review finds no blocking recovery-state regression.

Production deployment remains unauthorized.


## Completion evidence

Reviewed implementation revision before completion-status commits:

`5ec47908d6c7784b9a5fc5fb7e956a72ee0191f4`

Fast CI:

- push run `36221837878`: **SUCCESS**;
- Ready-PR Fast CI for the same implementation lineage: **PASS**.

Release Gate:

- workflow run `36221840393`: **SUCCESS**.

Full gate passed:

- PostgreSQL migration/status;
- contract drift/schema compatibility;
- lint/typecheck/architecture boundaries;
- unit, contract, authority and PostgreSQL integration tests;
- production build;
- canonical E2E seed;
- Playwright desktop/mobile suites;
- Human UX evidence upload.

Artifact:

- id: `10899715300`;
- digest: `sha256:8d5f978b934cd541ba6d58670b65f0ded2447f8da45248f5e9c7d52cde3b242e`.

Runtime resilience evidence:

1. canonical project reads distinguish authorization denial from runtime unavailability;
2. a no-access authenticated actor receives a truthful Authority Protected state;
3. protected project metadata is not rendered to that actor;
4. forbidden state does not offer transient retry and does not fall back to Preview;
5. registry/knowledge/runtime-unavailable states offer same-route canonical retry;
6. retry progress is exposed via an assistive live region;
7. unexpected route failures are handled by a product-owned reset boundary;
8. existing Prompt Stale semantics remain separate from runtime failure;
9. existing empty-state and canonical journeys remain green.

Human UX review:

1. forbidden desktop/mobile views communicate cause and next action without exposing project truth;
2. recovery-state heading hierarchy was reduced after review so the action and explanatory copy are visible sooner;
3. mobile recovery layout has no horizontal overflow;
4. canonical-vs-preview safety language is explicit;
5. the no-access state does not misleadingly suggest retry;
6. no blocking P0/P1 recovery UX defect remains.

## Result

**P7-004 = COMPLETE**

P7-005 — Performance and data-loading hardening is the next dependency Work Package.

Production deployment remains unauthorized.
