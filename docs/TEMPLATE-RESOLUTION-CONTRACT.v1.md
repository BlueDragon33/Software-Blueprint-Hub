# Blueprint Template Resolution Contract v1

Status: **B0 design contract**

## Purpose

Resolve a Project Profile into a deterministic set of required Blueprint Modules and Quality Gates without hidden last-write-wins behavior.

## Inputs

A resolution run receives one immutable input snapshot:

- Project Profile + recordVersion;
- selected Blueprint Level;
- active Project Type Template versions;
- optional Capability/Domain Template versions;
- explicit project additions.

The resolver records all input versions in its output fingerprint.

## Precedence and authority

Resolution has **authority layers**, not arbitrary numeric priority:

1. Universal Constitution — non-overridable constraints.
2. Blueprint Level baseline.
3. Project Type Templates.
4. Capability/Domain Templates.
5. Project-specific additions.

Lower layers may add or strengthen requirements. They may not remove or weaken a requirement imposed by a higher layer.

"Project-specific" never means "may bypass Constitution."

## Canonical IDs

Modules and gates merge only by canonical ID.

Examples:

- `module:security:threat-model`
- `module:ux:information-architecture`
- `gate:release:no-p0-p1`

Display names never determine identity.

## Merge semantics

For the same canonical ID:

- identical scalar value → keep once;
- set/list with set semantics → deterministic union and stable sort;
- boolean requirement → logical OR when `true` means stricter/required;
- severity/depth → choose the stricter value according to a schema-defined ordered scale;
- descriptive text → retain source-attributed variants; no silent overwrite;
- incompatible scalar/enumeration → **RESOLUTION_CONFLICT**.

There is no last-write-wins rule.

## Conflict behavior

A conflict fails closed.

Resolver output:

```text
status: conflict
conflictId
targetId
field
sources[]
values[]
suggestedResolutionKinds[]
```

A conflict must be resolved by one of:

- correcting the Project Profile;
- selecting/removing an incompatible template;
- publishing a compatible template version;
- ADR-backed change to a higher-level contract.

UI cannot dismiss a structural conflict and mark the blueprint ready.

## Conditions

Template activation conditions:

- are pure predicates over the immutable Project Profile snapshot;
- may not query mutable UI state;
- may not call external services;
- must be versioned with the template;
- must produce an explanation string when activated.

## Deterministic algorithm

1. Validate input snapshot.
2. Load exact template versions.
3. Evaluate activation predicates.
4. Sort activated templates by authority layer, canonical template ID, semantic version.
5. Seed Universal Constitution constraints.
6. Apply Blueprint Level baseline.
7. Merge Project Type requirements.
8. Merge Capability/Domain requirements.
9. Merge project additions.
10. Detect conflicts.
11. Resolve module dependency closure.
12. Detect missing dependencies/cycles.
13. Resolve required Quality Gates.
14. Produce rationale/provenance for every requirement.
15. Hash canonical normalized input + template versions + resolver version.

Same canonical input must produce the same normalized output.

## Output contract

A successful result contains:

- `resolutionId`;
- `resolverVersion`;
- `inputFingerprint`;
- `projectId`;
- `profileRecordVersion`;
- `activatedTemplates[]`;
- `requiredModules[]`;
- `requiredGates[]`;
- `dependencyEdges[]`;
- `rationale[]`;
- `warnings[]`.

## Invariants

1. A template cannot override Universal Constitution.
2. A lower authority layer cannot weaken a higher requirement.
3. Unknown template/schema versions fail validation.
4. Required module dependencies cannot remain unresolved.
5. Cyclic dependency graphs fail resolution unless the schema explicitly defines a legal aggregate cycle.
6. Gate readiness is never inferred from module presence; it requires Gate Evidence.
7. Prompts consume the resolved snapshot but cannot mutate it.

## Minimum test matrix

- identical input → identical result/fingerprint;
- B0 project does not receive B4-only modules absent another activation reason;
- overlapping templates union compatible requirements;
- incompatible requirements produce RESOLUTION_CONFLICT;
- lower layer cannot remove mandatory security gate;
- missing dependency fails;
- dependency cycle fails;
- template version change changes resolution fingerprint;
- order of input template list does not alter normalized result.
