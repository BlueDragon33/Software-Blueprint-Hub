# Blueprint OS — Universal Constitution v0

Status: **DESIGN BASELINE**

The constitutions are long-lived engineering laws. Project Profile and Blueprint Level determine their depth; no project is exempt from basic discipline.

## 1. Product Engineering
- Start from problem, users, jobs-to-be-done, constraints and success evidence.
- Every project has a Project Profile before normal feature implementation.
- Scope must be explicit enough to reject attractive but irrelevant features.
- Engineering depth scales with risk, scale, longevity and integration complexity.
- Generated prompts are execution projections, never source-of-truth.

## 2. Architecture
- Architecture defines ownership, dependency direction and change boundaries.
- Contracts precede components that depend on them.
- Prefer stable Core plus adapters/providers/extensions when variation is genuinely external to Core invariants.
- Medium/large systems validate one realistic vertical slice before broad expansion.
- Technology choices are project decisions, not Universal Core assumptions.

## 3. Data
- Persistent data has an explicit owner.
- Durable identity never depends on display text, array index or incidental filename/route.
- Schema version, record/content version and runtime/release revision are distinct.
- Migrations are explicit, testable and preferably additive/idempotent.
- Retention, deletion, export, provenance, backup and restore are designed where applicable.
- UI state and report projections do not silently become authoritative business state.

## 4. UI/UX
Target: calm, precise, coherent, responsive, accessible and task-oriented.
- Information architecture precedes repeated screen/card accumulation.
- User-facing products define a shared shell/design system appropriate to scale.
- Loading, empty, error, permission and recovery states are first-class.
- Responsive behavior is designed, not obtained by shrinking desktop.
- Accessibility and human UX review are acceptance conditions.
- Avoid card-inside-card accumulation, CSS override piles, duplicated navigation and button-for-every-capability interfaces.

## 5. Security
Prime rule: every authority and trust boundary is explicit; UI visibility is never authorization.
- Authentication and authorization are distinct.
- Protected mutations are enforced at trusted boundaries.
- Secret ownership is singular and explicit per control domain.
- Inputs are validated at boundaries.
- External integrations receive only required data/capabilities.
- Destructive actions define confirmation, idempotency and recovery.
- Plugin/extension/AI authority is explicitly granted and bounded.
- Threat-model depth scales with consequence.

## 6. QA + Auto-Fix
`REPRODUCE → CLASSIFY → ROOT CAUSE → FIX → REGRESSION TEST → RETEST → WHOLE-SYSTEM CHECK`
- Quality criteria are measurable where practical.
- CI green never alone means product PASS.
- A fix that hides failure or weakens tests without a requirement change is invalid.
- Critical user journeys require real UX acceptance.
- Gates require evidence.
- Forbidden PASS tactics: disabling tests, arbitrary sleeps, catch-and-ignore, CSS hacks as architecture, unproved gate claims.

## 7. Operations
- "Works locally" is not release readiness.
- Environments and promotion rules are explicit.
- Releases identify exact artifact/revision.
- Rollback/recovery depth scales with consequence.
- Health/telemetry/logs identify revision and failing subsystem without leaking secrets.
- Backup without tested restore is incomplete where restore matters.
- Successful build never implies automatic production mutation.

## 8. Governance & Evolution
- Important decisions live outside chat history.
- Public contracts have deprecation lifecycle.
- Technical debt records reason, risk and removal trigger.
- Work packages exist for real gaps, defects, dependencies, migrations or capabilities — not numbering.
- Case-specific assumptions are not promoted to Universal Core without review.
- Constitutions change rarely; project blueprints may evolve but cannot silently violate active constitutions.

## Scalable Blueprint Levels — initial model
- **B0 MICRO**: purpose, I/O, errors, basic security, tests, release definition.
- **B1 SMALL**: add user flow, UI/data structure, deployment, regression.
- **B2 PRODUCT**: add product charter, system context, domain/API/security/design-system/QA/operations.
- **B3 SYSTEM**: add bounded contexts, trust model, integration, observability, migration, ADR.
- **B4 PLATFORM**: add plugin/capability/package compatibility and advanced governance.
- **B5 CRITICAL**: add deep threat modeling, audit, DR, strict change control and independent verification.

These levels are proposals to be validated in Phase 2/3, not permanently hard-coded.
