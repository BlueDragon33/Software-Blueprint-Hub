# Engineering Suite Interoperability Contract v1

Status: **CANONICAL CROSS-PRODUCT CONTRACT**
Suite: Blue Dragon Engineering Suite

## 1. Contract principles

1. Products exchange artifacts, not internal runtime objects.
2. Every artifact has one canonical producer/owner.
3. Consumers may cache/derive but must retain provenance.
4. Units and coordinate frames are explicit.
5. Unsupported versions fail closed.
6. Cross-product references never rely on UI labels or transient runtime IDs.
7. Cross-product exchange does not grant mutation authority over the producer project.

## 2. Common envelope

Logical shape:

```ts
type EngineeringArtifactEnvelope<T> = {
  contractId: string;
  contractVersion: string;
  artifactId: string;
  artifactRevision: string;
  producer: {
    appId: 'cad-cam-3d' | 'ecad-design' | 'cae-simulation';
    projectId: string;
    projectRevision: string;
  };
  createdAt: string;
  units: UnitDeclaration;
  coordinateFrame?: CoordinateFrame;
  contentType: string;
  contentHash?: string;
  provenance: Provenance;
  payload: T;
}
```

This is a semantic contract. Language-specific generated types may vary but must preserve meaning.

## 3. Units

No implicit unit conversion.

Mechanical geometry boundary default:

```text
length = mm
coordinate system = right-handed
up axis = +Z
```

Other physical quantities require dimension + unit declaration, for example:

- force: N;
- pressure/stress: Pa or MPa explicitly;
- temperature: °C or K explicitly;
- density: kg/m³ explicitly;
- voltage: V;
- current: A;
- resistance: Ω.

## 4. Coordinate frame

A spatial package must identify:

- handedness;
- up axis;
- origin;
- axes;
- optional transform to parent frame.

Consumers may transform internally but must not alter semantic placement silently.

## 5. Revision binding

A consumer artifact must record the exact producer revision/hash it was built against.

Example:

```text
CAE Study S42
  geometrySource:
    CAD project: P7
    CAD revision: R103
    geometry hash: abc...
```

If CAD changes to R104, the CAE study is **stale**, not automatically valid.

## 6. PCB Mechanical Package v1

Contract ID: `engineering.ecad.pcb-mechanical-package`

Required:

- board ID/revision;
- closed board outline;
- thickness;
- mounting holes;
- package coordinate frame;
- source ECAD project/revision.

Optional:

- component mechanical envelopes;
- component orientation;
- keep-outs;
- connector/cable access zones;
- verified 3D references;
- source component stable IDs/revisions.

Not included:

- full copper connectivity authority;
- routing mutation authority;
- hidden editor runtime IDs.

## 7. Mechanical Constraint Package v1

Contract ID: `engineering.cad.mechanical-constraint-package`

May communicate to ECAD:

- board envelope constraints;
- mounting-hole targets;
- connector target zones;
- keep-outs;
- enclosure clearances;
- mechanical datums.

The imported constraint package is read-only reference data unless the CAD producer accepts a separately proposed change.

## 8. Simulation Geometry Package v1

Contract ID: `engineering.cad.simulation-geometry-package`

Required:

- source CAD project/revision;
- geometry artifact/hash;
- units/frame;
- body identities;
- semantic selection tags where safely available.

Optional:

- candidate material assignment metadata;
- named regions;
- thickness metadata;
- contact hints.

CAE creates its own study references from this package.

## 9. Simulation Result Summary v1

Contract ID: `engineering.cae.simulation-result-summary`

Required:

- CAE study ID/revision;
- source geometry project/revision/hash;
- analysis type;
- solver identity/version;
- solve status;
- convergence/evidence status.

Optional by study type:

- extrema;
- safety factor;
- displacement;
- stress;
- temperature;
- mode frequency;
- hotspot semantic references;
- recommendation text generated from evidence.

A result summary must not claim validity after its bound geometry revision changes unless revalidated.

## 10. Compatibility behavior

Consumers must classify incoming artifacts:

- SUPPORTED;
- SUPPORTED_WITH_MIGRATION;
- STALE_SOURCE;
- UNSUPPORTED_VERSION;
- INVALID;
- AMBIGUOUS_REFERENCE.

Only SUPPORTED or successfully migrated artifacts may enter normal workflows.

## 11. Security

Treat all imported artifacts as untrusted input.

Validate:

- schema;
- size/resource limits;
- numeric finiteness;
- unit declarations;
- coordinate frame;
- reference integrity;
- content hash when supplied.

Never execute code embedded in an engineering artifact.

## 12. Future extension

New contracts may be added for:

- BOM/component identity;
- thermal power maps from ECAD → CAE;
- enclosure heat-transfer constraints from CAD → CAE;
- CAE deformation/thermal summaries → CAD;
- manufacturing feedback → CAD;
- harness/cabling.

Do not overload an existing contract with a different ownership meaning.
