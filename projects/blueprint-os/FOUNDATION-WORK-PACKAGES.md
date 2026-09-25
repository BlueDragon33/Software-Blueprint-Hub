# Blueprint OS — Foundation Work Packages

Status: **FOUNDATION IN PROGRESS — FND-001/002/003 COMPLETE / FND-004 NEXT**

The packages below are dependency-driven. Completion means acceptance evidence exists; it does not imply A1/Foundation Ready until FND-010 passes.

## FND-001 — Workspace and architecture boundaries

Status: **COMPLETE**

Dependencies: none.

Purpose:
Establish pnpm workspace, `apps/web`, contract/core/engine/ui package boundaries and dependency rules from ADR-0001.

Acceptance:
- [x] TypeScript build works from clean CI checkout.
- [x] UI cannot import persistence adapter directly.
- [x] Core package has no Next.js dependency.
- [x] dependency-boundary check is executable in CI.
- [x] pnpm lockfile is committed and frozen installs are enforced.
- [x] production Next.js build succeeds under Node 24.

Gate evidence:
- GitHub Actions CI executes frozen install → lint → typecheck → architecture boundary → tests → production build.
- Initial missing-lockfile failure was reproduced and root-caused.
- Lockfile bootstrap was validated, committed, then CI returned to frozen-lockfile mode.
- GitHub core actions were moved to Node 24-based action runtimes before completion.
- Final PR-head CI must remain green before merge; a later red revision reopens this package.

## FND-002 — Executable contracts

Status: **COMPLETE**

Dependencies: FND-001.

Purpose:
Turn `vertical-slice.contracts.v1.json` into runtime validation and typed contract generation without making framework DTOs canonical.

Acceptance:
- [x] valid ProjectProfile passes;
- [x] invalid BlueprintLevel fails;
- [x] unknown top-level fields fail except explicit `extensions`;
- [x] contract fixtures are versioned;
- [x] breaking schema change test requires migration/compatibility evidence;
- [x] generated TypeScript is committed and protected by drift detection;
- [x] canonical writes can use strict Draft 2020-12 runtime validation with full date-time formats.

Gate evidence:
- Ajv 2020 runtime validator compiles the canonical schema in strict mode.
- Versioned fixtures cover valid, invalid level, unknown property, and explicit extension cases.
- Compatibility regression tests prove newly required fields and removed enum values are breaking.
- Exact-hash migration evidence is required when the compatibility guard detects a breaking change.
- CI enforces frozen dependencies, generated-contract drift, schema compatibility, lint, typecheck, architecture boundaries, tests, and production build.
- A later red revision reopens this package.

## FND-003 — Persistence and migration foundation

Status: **COMPLETE**

Dependencies: FND-001, FND-002.

Purpose:
Implement ADR-0002 through repository ports and PostgreSQL.

Acceptance:
- [x] empty DB migrates reproducibly;
- [x] project/profile records round-trip;
- [x] recordVersion conflict is rejected;
- [x] transaction rollback leaves no partial canonical state;
- [x] migration integration test uses PostgreSQL;
- [x] Prisma runtime remains behind repository ports;
- [x] generated Prisma Client is ephemeral and regenerated in CI;
- [x] dependency install is frozen with explicit allow-list for Prisma build scripts.

Gate evidence:
- PostgreSQL 16 service initializes cleanly in CI.
- Prisma 7.10.0 schema validation, client generation, migrate deploy, and migrate status pass.
- Integration tests prove canonical ProjectProfile round-trip, stale recordVersion rejection, and transaction rollback on profile insertion failure.
- pnpm supply-chain policy allows only the required Prisma install scripts rather than enabling all dependency builds.
- Exact-head CI includes production build after PostgreSQL integration tests.
- A later red revision reopens this package.

## FND-004 — Identity and authority foundation

Dependencies: FND-001, FND-003.

Purpose:
Implement ADR-0003 identity/session and Blueprint-owned authorization.

Acceptance:
- unauthenticated persistent mutation denied;
- role checks are server-side/application-service-side;
- Owner bootstrap is one-time and conflict-protected;
- Viewer/Editor/Reviewer/Owner matrix is tested;
- secrets do not enter canonical project records.

## FND-005 — Template resolver

Dependencies: FND-002.

Purpose:
Implement `TEMPLATE-RESOLUTION-CONTRACT.v1.md`.

Acceptance:
- deterministic result/fingerprint;
- authority-layer merge rules implemented;
- incompatible values fail with RESOLUTION_CONFLICT;
- dependency closure and cycle detection tested;
- rationale/provenance emitted per required module/gate.

## FND-006 — Project Profile application service

Dependencies: FND-003, FND-004, FND-005.

Purpose:
Create/update Project Profile and produce a versioned resolved blueprint.

Acceptance:
- profile write validates schema and authority;
- resolution references exact profile recordVersion/template versions;
- concurrent stale update fails cleanly;
- change of relevant profile dimension re-resolves blueprint;
- unrelated UI state cannot alter resolution.

## FND-007 — Work Package + Quality Gate core

Dependencies: FND-003, FND-004, FND-006.

Purpose:
Represent dependency-aware work, gates and evidence without conflating work completion with gate PASS.

Acceptance:
- WorkPackage dependency validation;
- gate PASS impossible without required evidence;
- work status does not auto-pass gate;
- evidence includes source/revision;
- blocked dependency state is explainable.

## FND-008 — Prompt Projection

Dependencies: FND-006, FND-007.

Purpose:
Generate one execution prompt from canonical project/profile/resolution/work/gate state.

Acceptance:
- projection records sourceRevision + templateVersion + contentHash;
- prompt generation is deterministic for normalized source state;
- generated text cannot mutate source state;
- stale projection is visibly detectable after source revision changes.

## FND-009 — V1 App Shell vertical slice

Dependencies: FND-004, FND-006, FND-007, FND-008.

Purpose:
Expose the first end-to-end UI:

`Create Project → Profile → Resolved Blueprint → Work Package → Gate → Execution Prompt`

Acceptance:
- loading/empty/error/permission/conflict states exist;
- keyboard path works for critical flow;
- mobile hierarchy remains usable;
- no duplicated navigation shell;
- human UX review completed.

## FND-010 — Foundation Gate A1 evidence

Dependencies: FND-001 through FND-009.

Purpose:
Run the complete quality contract and decide Foundation Ready from evidence.

Acceptance:
- CI contract green at exact revision;
- PostgreSQL migration/integration suite green;
- resolver contract matrix green;
- authorization matrix green;
- Playwright critical flow green;
- human UX review records no blocking issue;
- no unresolved P0/P1.

Only FND-010 PASS permits broader vertical-slice expansion.
