# Reference Import Contract v1

Status: **IMPLEMENTATION BASELINE**

Schema:
`schemas/reference-import-manifest.v1.json`

Runtime contract:
`packages/contracts/src/reference-import.ts`

Validator:
`validateReferenceImportManifest(...)`

## Purpose

Reference Import Manifest v1 defines how Blueprint OS stores a frozen, provenance-safe external architecture/reference snapshot without converting that external material into canonical Project state.

The contract belongs to the **Knowledge / Reference Import boundary**. It does not add a new Universal Core project entity.

## Identity

Every manifest has three related identities:

- `caseId` — route/catalog identity, for example `bauman-nextgen-v1`;
- `referenceCaseId` — Knowledge Library identity, exactly `knowledge:reference-case:<caseId>`;
- `id` — import-manifest identity derived from the case version, for example `reference-import:bauman-nextgen:v1`.

Validation fails closed when those identities disagree.

## Exact source provenance

A valid manifest must record:

- source repository;
- exact source ref/branch;
- source pull-request number and title;
- exact 40-character imported revision;
- exact 40-character source-manifest revision;
- import date.

Labels such as `latest`, `main` without an exact revision, or a missing revision are insufficient provenance.

## Imported artifact classification

`sourceArtifacts[]` enumerates the external dossier artifacts that formed the snapshot.

Each artifact records:
- source path;
- import role;
- one or more explicit classifications.

Allowed classifications are:
- `already-supported`;
- `pattern-candidate`;
- `project-specific-extension`;
- `product-gap`;
- `core-gap`.

Unknown classifications are rejected rather than interpreted heuristically.

## Semantic aliases

`conceptMappings[]` keeps external domain vocabulary namespaced.

Each mapping includes:
- source concept;
- classification;
- unique namespace;
- optional Blueprint concept;
- disposition.

This prevents same-name concepts from being merged accidentally, such as:
- academic `Evidence` vs engineering `GateEvidence`;
- learner-output `Project` vs managed software `Project`;
- academic mastery vs engineering readiness.

## Authority boundary

Reference imports are not allowed to claim:

- canonical Project state;
- engineering Quality Gate evidence;
- release authority;
- access authority.

All four authority flags are schema-locked to `false`.

## Local-first canonical reads

The manifest is stored locally inside the repository and is validated before application use.

The drift policy is fixed to:

- `snapshotMode: frozen`;
- `networkRequiredForCanonicalRead: false`;
- `updateMode: new-observation`;
- `currentnessClaimRequiresSourceCheck: true`.

Existing Reference Case reads therefore never require live GitHub/network access.

A future source refresh creates a new observation/version. It does not silently rewrite the frozen import.

## Compatibility

Reference Import v1 is **additive-first**.

Unknown fields are rejected.

Breaking schema changes require:
- an ADR;
- a migration plan;
- a compatibility statement.

The repository compatibility guard compares the current schema against:
`schemas/baselines/reference-import-manifest.v1.json`.

Accepted breaking changes must carry exact baseline/current hashes in:
`schemas/migrations/reference-import-manifest.v1.md`.

## Fail-closed rules

Validation rejects, among other cases:

- missing exact provenance;
- malformed revision hashes;
- identity mismatch;
- duplicate source artifact paths;
- duplicate semantic namespaces;
- unknown classifications;
- network-dependent canonical reads;
- authority escalation;
- unknown top-level fields.

## Bauman v1 instance

The first contract instance is:

`packages/application/src/reference-imports/bauman-nextgen-v1.json`

It freezes Bauman PR #127 at architecture revision:
`52b2a581a9c38a7060e95209e94c3087764f6d5f`

and source-manifest baseline:
`c195f2abc4fe0ee6a6cf3f05aab04e814a07d0b2`.

The manifest contains 24 classified source artifacts and 10 namespaced concept mappings.

## Runtime ownership

`packages/application/src/reference-imports.ts` validates local manifests on load and exposes read-only lookup/list operations.

Reference Case UI projections consume that validated manifest rather than hard-coding source repository/revision metadata.

This keeps provenance single-sourced and prevents UI copy from becoming an accidental authority layer.
