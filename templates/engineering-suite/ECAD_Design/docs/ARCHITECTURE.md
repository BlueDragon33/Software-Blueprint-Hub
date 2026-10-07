# ECAD_Design Architecture

```text
UI / Editor
   ↓
Application Use Cases
   ↓
Electrical Domain
   ↓
Versioned EcadProject Contracts
   ├─ schematic graph
   ├─ component/symbol/footprint
   ├─ PCB/stackup/layout
   ├─ ERC/DRC
   └─ manufacturing provenance
   ↓
Ports / Adapters
```

Canonical owner: `EcadProject`.

Cross-suite mechanical exchange uses the Engineering Suite Interoperability Contract. No direct CAD source-code dependency.
