# P7-008 — Phase 7 Hardening Gate

Status: **PASS — PHASE 7 HARDENING BASELINE ACCEPTED**

## Purpose

Evaluate the selected Phase 7 hardening baseline as one coherent product and operational system.

P7-008 does not add new domain semantics unless the gate exposes a real defect that must be fixed.

A PASS authorizes Phase 8 / production-candidate work only. It does **not** authorize Production deployment.

## Baseline

Candidate Phase 7 baseline begins from:

`main@6bbe753b6109077a6be78bd069151d1c929261fa`

P7-001 through P7-007 must be COMPLETE before this gate can PASS.

## Hardening dimensions under review

### 1. Mobile Project Workspace context

- far-right active workspace routes remain visible on mobile;
- `aria-current="page"` remains canonical;
- breadcrumbs preserve route context;
- no page-level horizontal overflow is introduced.

### 2. Progressive disclosure

- Quality, Knowledge, Prompt and Releases/Lessons remain scannable on narrow screens;
- critical identity/status/revision/provenance stays visible before expansion;
- native disclosure remains keyboard-operable;
- no canonical data is deleted or replaced by hidden client truth.

### 3. Accessibility

- AppShell skip navigation remains first-focusable and moves focus to main content;
- no positive tabindex is introduced;
- visible focus remains present on critical interactive controls;
- route and status semantics remain textual, not color-only;
- guided setup and disclosure journeys remain keyboard-operable.

### 4. Runtime resilience

- signed-out, forbidden, not-found and unavailable states remain semantically distinct;
- forbidden users do not receive protected project metadata;
- canonical runtime failure never silently substitutes Preview or cached truth;
- transient unavailable states retain same-route retry;
- forbidden state does not misleadingly offer transient retry.

### 5. Performance and data loading

- project-wide Quality/Readiness/Prompt reads use batched gate/evidence loading;
- Prompt history remains bounded per request while provenance remains reachable;
- canonical semantics are unchanged by concurrency/optimization;
- no performance optimization introduces fallback truth.

### 6. Authority and security

- role × action matrix remains exact;
- project-scoped authority fails across project boundaries;
- non-owner roles cannot manage roles;
- unauthenticated enumeration fails closed;
- ProjectProfile identity remains immutable;
- PostgreSQL row/document identity drift remains detectable.

### 7. Release safety and observability

- Release Gate certifies the exact PR head revision;
- checkout is explicit and verified by `git rev-parse HEAD`;
- Release Gate artifact name includes the exact certified SHA;
- evidence manifest records workflow/run/revision provenance;
- `productionDeploymentAuthorized` remains `false`;
- rollbackRevision cannot point to arbitrary, unknown or self revision;
- valid rollback target must be canonical previously released state.

## Cross-hardening contradiction checks

P7-008 must fail if any of the following occurs:

- a P7 work package is COMPLETE in one source-of-truth and still IN PROGRESS/NEXT in another;
- mobile active-route hardening conflicts with accessibility/current-route semantics;
- progressive disclosure hides status or provenance required to interpret canonical truth;
- retry/fallback behavior exposes preview/cached state as canonical;
- performance batching weakens authority or evidence ordering;
- authority hardening permits cross-project or identity-drift access;
- Release Gate certifies a SHA other than the actual checked-out revision;
- Release Gate evidence implies Preview/Production deployment without authorized deployment evidence;
- desktop/mobile evidence shows blocking overflow, inaccessible controls or unusable recovery paths;
- any P0/P1 defect or architecture contradiction remains.

## Exact-revision automated evidence

The final candidate revision must pass:

- Development Fast CI on exact push and PR head;
- Release Gate CI on exact PR head;
- explicit exact-revision checkout verification;
- PostgreSQL migration/status;
- generated contract drift/schema compatibility;
- lint/typecheck;
- architecture boundaries;
- unit/contract/authority/PostgreSQL integration tests;
- production build;
- canonical E2E seed;
- Playwright desktop/mobile;
- Release Gate evidence manifest generation;
- Release Gate artifact upload.

## Human UX evidence

Human review must inspect representative desktop/mobile evidence for at least:

- mobile far-right Project Workspace navigation;
- Quality progressive disclosure and provenance;
- Prompt progressive disclosure/current revision;
- Releases & Lessons exact revision and rollback provenance;
- accessibility-critical navigation/disclosures;
- forbidden/recovery state;
- authenticated Project Workspace baseline.

The review must explicitly assess:

- route/context continuity;
- small-screen scanning cost;
- keyboard/focus affordances visible in product structure;
- status/provenance visibility;
- authority/privacy safety;
- recovery semantics;
- absence of fabricated canonical truth;
- absence of deployment claims not supported by evidence.

## PASS rule

P7-008 = PASS only when:

1. P7-001 through P7-007 source-of-truth status is internally consistent;
2. exact-head Fast CI passes;
3. exact-head Release Gate passes and certifies the same SHA;
4. Release Gate manifest remains deployment-conservative;
5. accumulated hardening regressions remain green;
6. Human UX review finds no blocking contradiction or P0/P1 defect;
7. Production deployment remains a separate explicit authorization decision.

## Gate evidence

Reviewed candidate revision before completion-status commit:

`50e6694c676377a67e19287780ca86e5b8dc8600`

Automated evidence:

- Development Fast CI push run `36230018357`: **SUCCESS**;
- Development Fast CI PR run `36230032674`: **SUCCESS**;
- Release Gate CI PR run `36230034249`: **SUCCESS**;
- exact release checkout verification: PASS;
- PostgreSQL migration/status: PASS;
- generated contract drift/schema compatibility: PASS;
- lint/typecheck/architecture boundaries: PASS;
- unit/contract/authority/PostgreSQL integration tests: PASS;
- production build: PASS;
- canonical E2E seed: PASS;
- Playwright desktop/mobile: PASS;
- Release Gate evidence manifest generation/upload: PASS.

Release Gate artifact:

- artifact id: `10902442482`;
- artifact name: `release-gate-evidence-50e6694c676377a67e19287780ca86e5b8dc8600`;
- digest: `sha256:1882a2949c0ae51058854d4e967ff3ed93499639cb4cbace6c9fdefcc54c94d1`.

Manifest verification:

- certified revision = `50e6694c676377a67e19287780ca86e5b8dc8600`;
- workflow = `Release Gate CI`;
- run id = `36230034249`;
- event = `pull_request`;
- `productionDeploymentAuthorized` = `false`;
- no Preview/Production deployment or live rollback claim is made.

## Human UX review

Representative exact-head evidence reviewed:

- Project Workspace Overview mobile;
- Quality/accessibility mobile;
- progressive-disclosure Releases & Lessons mobile;
- Prompt Workspace mobile;
- forbidden/recovery mobile;
- Release & Lessons desktop/mobile continuity.

Findings:

1. Active Project Workspace route remains visibly contextual on mobile.
2. Overview keeps readiness, blocker and next action hierarchy clear without cosmetic percentage.
3. Progressive disclosure keeps critical status, exact revision and provenance visible before expansion.
4. Quality keeps gate status and evidence source/revision readable and textually distinct.
5. Prompt remains explicitly derived/read-only; Fresh refers to deterministic source revision rather than gate PASS.
6. Forbidden state exposes no protected project metadata and does not offer misleading transient retry or Preview fallback.
7. Release/Lessons retains exact revision, gate evidence and rollback/provenance discoverability.
8. Reviewed mobile surfaces remain single-column without blocking page-level horizontal overflow.
9. No source-of-truth contradiction across P7-001 through P7-007 was observed.
10. No blocking P0/P1 Human UX, authority, resilience or release-safety defect was observed.

## Result

**P7-008 = PASS**

**Phase 7 Hardening baseline = ACCEPTED**

Phase 8 / production-candidate planning may begin.

Production deployment remains separately unauthorized and requires an explicit Release Mode / deployment decision.
