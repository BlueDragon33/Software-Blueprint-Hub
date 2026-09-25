# Blueprint OS — CI & Test Contract v1

Status: **B0 design contract**

## Purpose

Define the executable evidence expected from Foundation so "CI green" has a precise meaning and still does not replace human UX review.

## Tool baseline

- TypeScript compiler for type correctness.
- ESLint for static rules.
- Vitest for domain/unit/contract tests.
- PostgreSQL integration tests for repository/migration behavior.
- Playwright for browser critical journeys across the supported browser matrix.
- JSON Schema Draft 2020-12 validator for canonical external/runtime contracts.

Exact package versions are locked by the implementation lockfile and dependency review; architecture does not use floating `latest` in CI.

## Required CI stages

### 1. Repository integrity
- lockfile immutable install;
- forbidden secret/file scan;
- generated artifacts are reproducible or checked for drift.

### 2. Static contract
- TypeScript typecheck;
- lint;
- dependency-boundary rule;
- JSON schema self-validation.

### 3. Unit/domain
Vitest:
- Project Profile classification helpers;
- resolver merge/precedence;
- dependency graph closure/cycle detection;
- quality gate evaluation;
- prompt projection normalization/hash.

### 4. Contract fixtures
For every canonical schema:
- valid fixture accepted;
- required-field omission rejected;
- illegal enum rejected;
- unknown top-level property rejected unless extension point allows it;
- previous supported schema fixtures either migrate or receive an explicit compatibility failure.

### 5. PostgreSQL integration
Against an ephemeral/isolated PostgreSQL database:
- clean migration;
- rollback/transaction behavior;
- repository round trip;
- recordVersion conflict;
- foreign-key/integrity checks;
- migration replay/idempotency policy.

### 6. Security/authority integration
- unauthenticated write denied;
- role matrix;
- Owner bootstrap replay denied;
- cross-project authorization boundaries;
- invalid/tampered IDs rejected by policy, not only hidden in UI.

### 7. Web build
- production build;
- route generation/compile;
- no runtime import from forbidden infrastructure layer in client bundle.

### 8. Browser E2E
Playwright critical journey:
`sign in → create project → profile → resolve blueprint → create work package → inspect gate → generate prompt`

Minimum browser gate during Foundation:
- Chromium;
- Firefox;
- WebKit.

Responsive acceptance includes at least one desktop and one mobile viewport.

No arbitrary fixed sleeps may be added to make E2E pass.

### 9. Accessibility automated checks
Critical views must have automated semantic/focus/label/contrast checks where tooling can prove them.

Automation does not close the Human UX Gate.

## Merge policy for Foundation

A PR changing canonical contracts/resolver/persistence/authority must not merge when:
- typecheck/lint fails;
- required tests fail;
- migration test fails;
- a required gate lacks evidence;
- unresolved P0/P1 exists.

## Human UX evidence

Before FND-010/A1 PASS, a reviewer must manually verify:

1. user knows where they are;
2. the next action is evident;
3. conflict/error recovery is understandable;
4. status does not rely only on color;
5. keyboard path is usable;
6. mobile flow does not require desktop assumptions;
7. project/profile/blueprint/work/gate concepts are not exposed as unnecessary technical jargon.

## Failure handling

When a test exposes a defect:

`REPRODUCE → CLASSIFY → ROOT CAUSE → FIX → ADD REGRESSION → RETEST → WHOLE-SYSTEM CHECK`

Do not:
- weaken assertions solely to get green;
- skip failing tests without an accepted issue/decision;
- replace races with arbitrary sleeps;
- swallow errors;
- mark a gate PASS because another unrelated stage passed.

## Evidence identity

CI evidence must record:
- repository revision SHA;
- test stage;
- runtime/browser/database version where material;
- timestamp;
- pass/fail;
- artifact/report reference.

A result from another revision is not release/gate evidence for the current revision.
