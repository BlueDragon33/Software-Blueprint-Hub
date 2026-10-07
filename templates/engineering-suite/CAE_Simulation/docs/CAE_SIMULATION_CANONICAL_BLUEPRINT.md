# CAE_Simulation — Canonical Product Blueprint

Status: FOUNDATION
Authority: Universal Constitution 1.2 → Engineering Suite Blueprint → this document.

## Product mission

Create trustworthy simulation workflows tied to explicit source geometry revisions, using replaceable meshing/solver providers and evidence-aware result interpretation.

## Canonical source of truth

`CaeStudy` is the durable source of simulation intent/evidence.

It must own:

- study identity and schema;
- analysis type;
- exact source geometry reference/revision/hash;
- material assignments;
- fixtures/loads/contacts;
- mesh policy and provenance;
- solver configuration;
- run record;
- result metadata/fields;
- convergence/evidence status.

## Forbidden architecture

Never:

- copy CAD feature history as CAE truth;
- use solver node/element IDs as sole durable cross-revision identity;
- silently reuse results after geometry revision changes;
- fake solver/convergence/safety-factor results;
- make AI explanation stronger than numerical evidence;
- require a specific remote solver provider for project ownership.

## Adapter strategy

Mesher and solver implementations are adapters. Foundation does not select one.

A future static structural vertical slice may evaluate open engines, but provider selection needs license, deployment, performance and replacement analysis.

## Interop

Geometry/result exchange follows `ENGINEERING-SUITE-INTEROP-CONTRACT.v1`.

## Release law

Numerical result correctness requires solver fixtures, convergence checks and human engineering review before commercial claims.
