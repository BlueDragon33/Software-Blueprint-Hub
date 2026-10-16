# Blue Dragon Engineering Suite — Canonical Foundation Blueprint

Status: **SUITE CANONICAL BLUEPRINT**
Blueprint level: **B4**
Constitution: `blueprint-os:universal-century-grade@1.2.0`
Pinned constitutional source revision: `efa7ea02a49d31e18305452813f502dd8ce6ce25`

## 0. Purpose

This document defines the load-bearing foundation for a future engineering suite composed of independent but interoperable CAD, ECAD and CAE products.

The target is not a monolith. The target is a coherent engineering system whose products can evolve independently while exchanging trustworthy engineering meaning through versioned contracts.

The foundation must be strong enough that future commercial scale, team collaboration, AI, simulation, electronics design, additive manufacturing and integrations do not require redefining ownership of engineering truth.

## 1. Authority order

```text
Human Constitutional / Product Authority
        ↓
Universal Constitution 1.2
        ↓
Universal Century-Grade Construction Standard
        ↓
This Engineering Suite Blueprint
        ↓
Per-product canonical blueprint
        ↓
Domain contracts / ADRs / Work Packages / Quality Gates
        ↓
Execution prompts
        ↓
Implementation
```

A suite document cannot weaken the Universal Constitution. A product prompt cannot override a product blueprint. CI success does not grant Production authority.

## 2. Suite members

The suite is deliberately federated across repositories:

```text
BlueDragon33/CAD_CAM_3D
    owns mechanical parametric CAD + 3D-print manufacturing intent

BlueDragon33/ECAD_Design
    owns schematic + PCB + electrical design intent

BlueDragon33/CAE_Simulation
    owns simulation studies + solver setup + simulation results
```

The ECAD_Design and CAE_Simulation repositories now exist and carry constitutional foundation branches. Their product capabilities remain foundation-only until real vertical slices are implemented and tested.

## 3. Why separate repositories

CAD, ECAD and CAE have different:

- canonical domain models;
- file formats;
- geometry/electrical/solver dependencies;
- testing strategies;
- performance profiles;
- release cadences;
- security/trust surfaces;
- commercial capability boundaries.

Therefore they must not be forced into one repository merely to simplify early development.

At the same time, they must not become disconnected products. Cross-product meaning is governed through neutral, versioned interchange contracts.

## 4. Non-negotiable ownership boundaries

### CAD_CAM_3D owns

- `CadProject`;
- sketches, constraints and feature history;
- semantic topology references;
- B-Rep/mesh derivations;
- mechanical component placement intent;
- additive-manufacturing intent;
- STEP/STL/3MF outputs;
- mechanical enclosure/bracket/body design.

### ECAD_Design owns

- schematic project;
- symbols;
- logical connectivity/netlist;
- footprints;
- PCB stackup;
- board outline as electrical/PCB design intent;
- copper, vias, routing and zones;
- electrical constraints;
- ERC/DRC results;
- BOM design references;
- PCB manufacturing outputs.

### CAE_Simulation owns

- simulation study definition;
- geometry reference/snapshot provenance used by that study;
- material assignments;
- loads, fixtures and contacts;
- meshing policy and mesh;
- solver configuration;
- solver execution evidence;
- result fields;
- derived engineering result summaries.

### Application Management owns only operational management

It may own:

- application registration;
- management device metadata;
- UI/feature policy;
- safe runtime status;
- safe audit metadata;
- authorized remote operational controls when real trusted APIs exist.

It must not become the database for CAD geometry, ECAD schematics/boards or CAE result fields.

## 5. One truth per engineering concept

A concept has one canonical owner.

Examples:

- PCB net connectivity belongs to ECAD, not CAD.
- mechanical enclosure feature history belongs to CAD, not ECAD.
- FEA stress field belongs to CAE, not CAD.
- a CAD view of a PCB is a referenced mechanical projection, not a second PCB source of truth.
- a CAE geometry import is a study snapshot/reference, not a forked CAD project.

Copies used for computation must carry provenance and revision identity.

## 6. Cross-suite interoperability law

Products communicate through versioned neutral contracts.

Never couple products through:

- UI component imports;
- internal database tables;
- runtime object pointers;
- repository-relative source imports;
- OCCT runtime handles;
- PCB-editor runtime IDs;
- solver node IDs as cross-suite identity;
- provider-specific cloud IDs.

Allowed integration modes:

- local file/package exchange;
- explicit local IPC;
- versioned API;
- versioned shared package after extraction criteria are met.

Every exchanged artifact must declare:

- producer;
- producer schema/version;
- artifact identity;
- source project/revision identity;
- unit semantics;
- coordinate-frame semantics where spatial;
- content hash/checksum where practical;
- provenance;
- compatibility/unsupported behavior.

## 7. Canonical engineering coordinate convention

Cross-suite spatial interchange uses a right-handed coordinate system with **Z-up** unless an artifact explicitly declares another frame.

Mechanical boundary defaults:

- length unit: millimeter;
- angles: explicit degrees or radians field, never implicit;
- origin: artifact-defined and named;
- transforms: explicit 4×4 or typed pose contract;
- no hidden conversion based on UI orientation.

Products may use different internal coordinates. Adapters must convert at the boundary.

CAE solver internals may use SI units. Solver adapters must declare conversions explicitly and never infer them from display text.

## 8. Engineering Artifact Envelope

All substantial cross-product artifacts should converge on a common envelope shape:

```text
EngineeringArtifactEnvelope
├─ contractId
├─ contractVersion
├─ artifactId
├─ artifactRevision
├─ producerApp
├─ producerProjectId
├─ producerProjectRevision
├─ createdAt
├─ units
├─ coordinateFrame (when spatial)
├─ contentType
├─ contentHash
├─ provenance
└─ payload / payloadReference
```

The envelope is interoperability metadata. It does not create shared ownership of the payload.

## 9. First cross-domain contracts

### ECAD → CAD: PCB Mechanical Package

Purpose: allow enclosure/mount/mechanical design around a board.

May contain:

- board outline;
- board thickness;
- mounting holes;
- component placement envelopes;
- keep-out volumes;
- connector/cable access zones;
- optional verified 3D references;
- component stable IDs/revisions;
- coordinate frame;
- source ECAD revision.

CAD may derive enclosure features from it but may not edit electrical connectivity through this package.

### CAD → ECAD: Mechanical Constraint Package

Purpose: communicate mechanical constraints relevant to PCB layout.

May contain:

- allowed board envelope;
- forbidden/mechanical keep-outs;
- mounting bosses/holes;
- connector target zones;
- enclosure wall/clearance surfaces;
- datum/reference frame;
- source CAD revision.

ECAD imports these as constraints/references, not as authority over the CAD project.

### CAD → CAE: Simulation Geometry Package

Purpose: create a simulation study from a known mechanical state.

May contain:

- exact STEP/B-Rep-compatible exchange artifact or solver-ready neutral geometry;
- semantic face/edge/body tags;
- material candidate metadata if known;
- coordinate frame;
- source CAD project/revision;
- content hash.

CAE binds loads/fixtures using CAE-owned durable references that retain provenance back to CAD semantic tags where available.

### CAE → CAD: Simulation Result Summary

Purpose: feed engineering decisions back into design without making CAD own solver state.

May contain:

- study ID/revision;
- source geometry revision/hash;
- solver identity/version;
- convergence/evidence status;
- max displacement/stress/temperature/safety factor where applicable;
- hotspot semantic references;
- recommended review zones;
- link/reference to full CAE-owned result dataset.

CAD may visualize or use these summaries for design review/AI suggestions. Full result fields remain CAE-owned.

## 10. Shared-core extraction rule

Do **not** create `Engineering-Shared-Core` now.

A shared repository/package may be extracted only when all are true:

1. at least two real suite applications consume the same stable concept;
2. the concept is not properly owned by either product;
3. duplication has produced a concrete maintenance or compatibility cost;
4. a versioning policy exists;
5. a maintainer/owner exists;
6. replacement/migration impact is understood.

Until then, shared contracts live canonically in Software-Blueprint-Hub and are projected into product adapters as needed.

## 11. Local-first operating model

Each engineering product must retain a useful local standalone core.

```text
CAD local core   ECAD local core   CAE local study setup/result review
      \              |              /
       \--- optional interoperability ---/
```

A temporary outage of:

- Application Management;
- cloud account;
- sync provider;
- AI provider;
- billing provider

must not redefine engineering truth.

Solver execution may legitimately require heavy local/native/remote compute for certain CAE workloads, but the dependency class must be explicit and replaceable where practical.

## 12. AI law across the suite

AI is an engineering assistant over owned domain contracts.

AI must not create a hidden universal project model that supersedes CAD/ECAD/CAE sources of truth.

Preferred pattern:

```text
intent
  ↓
domain router
  ↓
typed proposal(s)
  ↓
per-domain validation
  ↓
cross-domain compatibility validation
  ↓
preview/diff
  ↓
explicit commit under owning product
```

Examples:

- CAD AI proposes feature-tree operations.
- ECAD AI proposes schematic/placement/routing operations.
- CAE AI proposes study setup/material/load/mesh operations.
- cross-domain AI may orchestrate proposals but cannot bypass each product's validation/authority.

## 13. Commercial architecture

The suite may later offer individual or bundled commercial plans, but marketing packages must not become domain invariants.

Keep separate:

```text
Identity
!= Authorization
!= Entitlement
!= Product Project Ownership
!= Engineering Artifact Ownership
!= Production Authority
```

One account may later access all suite products, but single sign-on does not mean shared engineering databases.

## 14. Repository independence requirements

Every product repository should be independently capable of:

- build/test;
- versioned persistence;
- local development;
- release evidence;
- dependency budget;
- recovery/export of user-owned project data;
- constitutional adoption;
- its own canonical blueprint;
- its own Draft/Release/Production gates.

No product release should require another product repository to compile unless a deliberately versioned published contract says so.

## 15. Failure and compatibility policy

Cross-suite consumers must fail safely when:

- contract version is unsupported;
- source revision/hash does not match;
- units are absent;
- coordinate frame is ambiguous;
- semantic references cannot be resolved;
- payload is corrupt;
- producer capability is missing.

Never silently guess engineering units or remap an unresolved critical reference.

## 16. Product UX relationship

The suite may later present a unified launcher/account/navigation shell, but each engineering workspace remains optimized for its discipline.

Common conceptual workspace switch:

- Mechanical Design
- Electronics
- Simulation
- Manufacture

This is navigation/orchestration, not a requirement that all tools share one UI codebase.

## 17. Device namespaces

Reserved management-device namespaces:

- CAD: `CAD-`
- ECAD: `ECAD-`
- CAE: `CAE-`

Namespaces may not be reused across products.

## 18. Initial repository charters

### CAD_CAM_3D

Status: active product foundation.

Continue development. It is the first implementation proving suite principles.

### ECAD_Design

Foundation only until intentionally activated.

Initial future product scope:

- schematic;
- symbol/footprint model;
- netlist;
- PCB layout;
- ERC/DRC;
- BOM;
- Gerber/drill/manufacturing outputs;
- PCB mechanical package.

Do not start by writing a PCB geometry/router kernel from scratch before evaluating mature open engines/libraries and file ecosystems.

### CAE_Simulation

Foundation only until intentionally activated.

Initial future product scope:

- static structural;
- material/fixtures/loads;
- meshing adapter;
- solver adapter;
- result visualization;
- thermal/modal later;
- CFD substantially later.

Do not write a finite-element solver from scratch as the starting strategy.

## 19. Foundation acceptance criteria

The suite foundation is accepted when:

- ownership boundaries are canonical;
- coordinate/unit conventions are explicit;
- cross-domain artifact contracts are defined;
- repo boundaries are reserved;
- no premature shared-core repository exists;
- ECAD/CAE bootstrap blueprints adopt the Constitution;
- CAD declares its membership without losing project sovereignty;
- Application Management boundary remains operational only;
- future repo creation requires no architectural guessing.

## 20. Change discipline

Changes to suite-level ownership, coordinate semantics, artifact-envelope meaning or shared-core extraction law are **foundation changes**.

They require:

- explicit architectural review;
- compatibility impact;
- migration plan if already consumed;
- updates to affected product blueprints/prompts;
- human Product/Architecture authority when the change could invalidate multiple products.
