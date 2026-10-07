# CAE_Simulation — Foundation Blueprint

Status: **BOOTSTRAP BLUEPRINT — REPOSITORY PENDING**
Target repository: `BlueDragon33/CAE_Simulation`
Blueprint level: B4
Constitution: `blueprint-os:universal-century-grade@1.2.0`

## Mission

Build trustworthy engineering simulation workflows attached to explicit geometry revisions, with replaceable meshing and solver adapters, evidence-aware results and deep interoperability with CAD/ECAD.

## Source of truth

Future `CaeStudy` owns simulation intent and evidence.

It includes:

- source geometry reference;
- analysis type;
- material assignments;
- loads/fixtures/contacts;
- mesh policy;
- solver configuration;
- run evidence;
- results/review state.

It does not own the originating CAD feature tree.

## Foundation layers

```text
Simulation UI
   ↓
Study application layer
   ↓
CAE semantic model
   ↓
Versioned study contracts
   ├─ geometry source
   ├─ materials
   ├─ BC/load/contact
   ├─ mesh policy
   ├─ solver request
   └─ result/evidence
   ↓
Adapters
   ├─ geometry preparation
   ├─ mesher
   ├─ solver
   ├─ local/native execution
   ├─ optional remote compute
   └─ result visualization
```

## Initial capability order

1. study schema/persistence/migration;
2. CAD geometry package import + revision/hash binding;
3. material model;
4. fixed support + force/pressure;
5. mesh adapter;
6. static linear structural solver adapter;
7. result field import/visualization;
8. convergence/evidence reporting;
9. thermal;
10. modal;
11. contact/nonlinear only after foundation evidence;
12. CFD substantially later.

## Solver strategy

Do not implement an FEA solver from scratch as the starting strategy.

Evaluate mature open solver/mesher options and isolate them behind adapters. Candidate research may include CalculiX, Code_Aster, Elmer, Gmsh and other suitable engines, but no provider is selected by this foundation document.

## Geometry revision law

Every study binds to an explicit source geometry revision/hash.

If source CAD changes:

- study becomes stale;
- existing results remain historical evidence;
- system must not present them as results for the new geometry;
- remapping/revalidation is explicit.

## Boundary-condition references

Loads/fixtures should bind to CAE durable references derived from semantic CAD tags where possible.

Never persist an OCCT runtime face hash or mesh element number as the sole cross-revision engineering identity.

## Result truth

A colored contour is not sufficient evidence.

Results need:

- solver identity/version;
- run status;
- convergence;
- units;
- extrema;
- source geometry revision;
- mesh provenance;
- warnings/limitations.

AI explanations must not overstate simulation confidence.

## ECAD interoperability

Future ECAD → CAE inputs may include:

- component power dissipation;
- board stackup/material;
- thermal source maps;
- connector/current-related heat metadata.

These remain versioned artifact contracts.

## Commercial principle

The product should simplify correct study setup and interpretation, not hide engineering assumptions.

## Bootstrap acceptance

The repository foundation is complete only when it contains:

- Constitution adoption;
- this canonical product blueprint;
- master execution prompt;
- AGENTS entrypoint;
- architecture/ownership document;
- dependency budget;
- CI skeleton;
- typed study-domain boundary;
- no fake solver results.
