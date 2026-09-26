# P7-004 — Runtime resilience and recovery UX

Status: **IN PROGRESS**

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
