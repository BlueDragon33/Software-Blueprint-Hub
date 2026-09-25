# Blueprint OS — Foundation Work Packages

Status: **FOUNDATION IN PROGRESS — FND-001/002/003/004/005/006/007 COMPLETE / FND-008 NEXT**

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

Status: **COMPLETE**

Dependencies: FND-001, FND-003.

Purpose:
Implement ADR-0003 identity/session and Blueprint-owned authorization.

Acceptance:
- [x] unauthenticated persistent mutation denied;
- [x] role checks are server-side/application-service-side;
- [x] Owner bootstrap is one-time and conflict-protected;
- [x] Viewer/Editor/Reviewer/Owner matrix is tested;
- [x] Editor authority is project-scoped;
- [x] Reviewer cannot perform Owner administration;
- [x] role mutations are audit-recorded;
- [x] OAuth/provider secrets do not enter Blueprint authority records;
- [x] Auth.js is isolated to identity configuration and does not own Blueprint roles.

Gate evidence:
- Auth.js Core 0.41.3 config uses JWT sessions and fails closed on missing secrets.
- Blueprint Core owns the authorization matrix and policy checks.
- PostgreSQL models persist Principal, one-time SystemBootstrap, ProjectAuthority, and AuthorityAuditEvent.
- Owner bootstrap is protected by transaction + unique constraints and replay tests.
- Unit role-matrix tests cover unauthenticated, Viewer, Editor, Reviewer, and Owner behavior.
- PostgreSQL integration tests prove bootstrap replay rejection, scoped role persistence, audit events, and absence of provider token/secret fields.
- Integration fixtures are namespace-isolated so PostgreSQL test files may run in parallel without deleting each other's state.
- Exact-head CI run 36122611028 passed frozen install, migrations, 19 tests, and production build on revision 236ff341e604e081e853c6dbcddd8d16bc76452d.
- A later red revision reopens this package.

## FND-005 — Template resolver

Status: **COMPLETE**

Dependencies: FND-002.

Purpose:
Implement `TEMPLATE-RESOLUTION-CONTRACT.v1.md`.

Acceptance:
- [x] deterministic result/fingerprint;
- [x] authority-layer merge rules implemented;
- [x] compatible tags/dependencies union with stable ordering;
- [x] stricter required/depth rules cannot be weakened by lower authority layers;
- [x] incompatible scalar values fail closed with RESOLUTION_CONFLICT;
- [x] dependency closure promotes required dependencies;
- [x] missing dependencies fail closed;
- [x] dependency cycles fail closed;
- [x] rationale/provenance emitted per required module/gate;
- [x] exact template version participates in the fingerprint;
- [x] template input order does not change normalized output;
- [x] successful output validates against the ResolvedBlueprint schema.

Gate evidence:
- Pure TypeScript resolver implements the B0 Template Resolution Contract without provider/framework coupling.
- Templates are sorted by authority layer → canonical ID → semantic version.
- Canonical SHA-256 fingerprint covers normalized Project Profile, resolver version, template versions, activation and requirements.
- Activation predicates read only immutable Project Profile fields.
- 10 resolver tests cover determinism, B0/B4 activation, compatible merge, scalar conflict, anti-weakening, missing dependency, cycle detection, version fingerprint, input-order invariance and schema-valid dependency closure.
- Initial type-boundary defects (Node crypto types and tuple semver indexing) were root-caused and fixed without changing resolver semantics.
- Fingerprint regression assertion was corrected to read the successful ResolvedBlueprint boundary rather than a nonexistent wrapper field.
- Exact-head CI run 36123549650 passed migrations, contract drift, schema compatibility, lint, typecheck, boundaries, all tests and production build on revision 0c1567e3e9ead6173d976ac04aca3092c36dd057.
- A later red revision reopens this package.

## FND-006 — Project Profile application service

Status: **COMPLETE**

Dependencies: FND-003, FND-004, FND-005.

Purpose:
Create/update Project Profile and produce a versioned resolved blueprint.

Acceptance:
- [x] profile write validates schema and authority;
- [x] unauthenticated mutation is rejected before persistence;
- [x] invalid schema is rejected before persistence;
- [x] resolution references exact profile recordVersion/template versions;
- [x] concurrent stale update fails cleanly without overwriting canonical state;
- [x] change of relevant profile dimension re-resolves blueprint;
- [x] unrelated UI state cannot alter resolution fingerprint;
- [x] application service depends on repository/authority/template contracts rather than Prisma or Next.js;
- [x] frozen dependency graph is enforced in CI.

Gate evidence:
- Application layer composes FND-002 validation, FND-004 authority, FND-005 resolver, and FND-003 repository ports.
- Unit tests prove unauthenticated denial, invalid-profile rejection before persistence, exact version/template references, and UI-state isolation.
- PostgreSQL integration tests prove create/resolve, relevant-dimension re-resolution, and stale recordVersion conflict preservation.
- The initial application typecheck defect was root-caused to missing Node type context for the source-level blueprint-engine dependency and fixed in the application tsconfig without changing resolver semantics.
- Bootstrap lockfile was captured from a successful full CI run, committed, and CI returned to frozen-lockfile mode.
- Exact-head frozen CI run 36129206143 passed PostgreSQL 16 migration/status, generated contract drift, schema compatibility, lint, typecheck, architecture boundaries, all tests, and production build on revision f96b35bae9abd0b421967733ae90af445928a7b5.
- A later red revision reopens this package.

## FND-007 — Work Package + Quality Gate core

Status: **COMPLETE**

Dependencies: FND-003, FND-004, FND-006.

Purpose:
Represent dependency-aware work, gates and evidence without conflating work completion with gate PASS.

Acceptance:
- [x] WorkPackage dependency validation rejects missing/self/cyclic dependencies;
- [x] dependency readiness is explainable with blocker id/status/reason;
- [x] Quality Gate PASS is impossible without every declared evidence ID being persisted for that gate;
- [x] evidence retains source + revision provenance;
- [x] WorkPackage completion does not auto-pass a Quality Gate;
- [x] Reviewer/Owner authority is required for evidence/review actions;
- [x] Editor may manage work but cannot submit review evidence;
- [x] WorkPackage, QualityGate, and GateEvidence persist in PostgreSQL behind repository ports;
- [x] work/gate updates preserve optimistic recordVersion discipline.

Gate evidence:
- Pure Core functions implement dependency validation/readiness and PASS evidence invariants without Prisma/Next.js coupling.
- Application service separates PROJECT_MUTATE work operations from PROJECT_REVIEW evidence/gate decisions.
- PostgreSQL migration adds WorkPackage, QualityGate, and GateEvidence with project/gate foreign keys and provenance indexes.
- Unit tests cover missing dependency, cycle detection, explainable blockers, ready transition, missing/wrong-gate evidence, and valid PASS evidence.
- PostgreSQL integration tests prove blocked → ready dependency behavior, WorkPackage completion without gate auto-PASS, reviewer authority, and persisted source/revision evidence.
- Initial evidence revalidation exposed a parallel-test race: the FND-007 fixture depended on global SystemBootstrap state while PostgreSQL test files run concurrently.
- Root cause was fixed by seeding a project-scoped OWNER role for the FND-007 fixture; global one-time bootstrap semantics remain unchanged and tests no longer delete shared bootstrap state.
- Exact-head CI run 36130209013 passed frozen install, PostgreSQL migrations/status, contract drift, schema compatibility, lint, typecheck, architecture boundaries, all tests, and production build on revision f74762dd08abf3b33929acb5ea089774bdae2e2e.
- A later red revision reopens this package.

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
