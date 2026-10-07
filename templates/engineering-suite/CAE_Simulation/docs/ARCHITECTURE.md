# CAE_Simulation Architecture

```text
Simulation UI
   ↓
Study Application Layer
   ↓
CAE Domain
   ↓
Versioned CaeStudy Contracts
   ├─ geometry source/revision
   ├─ materials
   ├─ BC/load/contact
   ├─ mesh policy/provenance
   ├─ solver request/run
   └─ result/evidence
   ↓
Mesher / Solver / Execution Adapters
```

Canonical owner: `CaeStudy`.

Cross-suite geometry/result exchange uses the Engineering Suite Interoperability Contract. No direct CAD source-code dependency.
