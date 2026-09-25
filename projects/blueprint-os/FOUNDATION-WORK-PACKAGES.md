# Blueprint OS — Foundation Work Packages

Status: **PLANNED / architecture work only until B0 PASS**

The packages below close design ambiguity and define the authorized order after B0. IDs are dependency-driven, not a promise to implement everything in one batch.

## FND-001 — Workspace and architecture boundaries

Dependencies: none.

Purpose:
Establish pnpm workspace, `apps/web`, contract/core/engine/ui package boundaries and dependency rules from ADR-0001.

Acceptance:
- TypeScript build works from clean checkout.
- UI cannot import persistence adapter directly.
- Core package has no Next.js dependency.
- dependency-boundary check is executable in CI.

Gate evidence:
architecture boundary tests + clean build.

## FND-002 — Executable contracts

Dependencies: FND-001.

Purpose:
Turn `vertical-slice.contracts.v1.json` into runtime validation and typed contract generation without making framework DTOs canonical.

Acceptance:
- valid ProjectProfile passes;
- invalid BlueprintLevel fails;
- unknown top-level fields fail except explicit `extensions`;
- contract fixtures are versioned;
- breaking schema change test requires migration/compatibility evidence.

## FND-003 — Persistence and migration foundation

Dependencies: FND-001, FND-002.

Purpose:
Implement ADR-0002 through repository ports and PostgreSQL.

Acceptance:
- empty DB migrates reproducibly;
- project/profile records round-trip;
- recordVersion conflict is rejected;
- transaction rollback leaves no partial canonical state;
- migration integration test uses PostgreSQL.

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
