# ECAD_Design — Foundation Blueprint

Status: **BOOTSTRAP BLUEPRINT — REPOSITORY PENDING**
Target repository: `BlueDragon33/ECAD_Design`
Blueprint level: B4
Constitution: `blueprint-os:universal-century-grade@1.2.0`

## Mission

Build an AI-assisted electronic design application that preserves editable electrical intent from schematic through PCB layout and manufacturing outputs, while exchanging mechanical constraints with CAD through neutral contracts.

## Source of truth

Future `EcadProject` owns electrical design intent.

It must be independent of:

- React/editor widgets;
- rendering IDs;
- KiCad/other-provider internal IDs when imported;
- billing/account IDs;
- CAD runtime topology IDs.

## Foundation layers

```text
UI / editor
   ↓
ECAD application use cases
   ↓
Electrical domain model
   ↓
Versioned project contracts
   ├─ schematic graph
   ├─ rules
   ├─ PCB layout
   ├─ component identity
   └─ manufacturing provenance
   ↓
Adapters
   ├─ file import/export
   ├─ ERC/DRC engine
   ├─ geometry/rendering
   ├─ autorouter (optional)
   ├─ component libraries
   └─ CAD interoperability
```

## Initial capability order

1. project schema/persistence/migration;
2. schematic graph and symbols/pins/nets;
3. ERC;
4. footprint/component contract;
5. PCB board outline/stackup;
6. placement;
7. tracks/vias/zones;
8. DRC;
9. BOM;
10. Gerber/drill outputs;
11. PCB Mechanical Package for CAD;
12. AI typed proposal layer;
13. advanced routing/optimization later.

## Mechanical interoperability

ECAD exports a versioned PCB Mechanical Package.

CAD may consume:

- outline;
- thickness;
- holes;
- component envelopes;
- keep-outs;
- connector zones.

ECAD may consume CAD Mechanical Constraint Packages.

No product directly edits the other's canonical project.

## Component strategy

Component identity must separate:

- logical symbol;
- physical footprint;
- mechanical envelope/3D representation;
- manufacturer part identity;
- sourcing/BOM information.

One vendor catalog cannot become mandatory product truth.

## AI

AI proposals must mutate ECAD only through typed validated operations.

Examples:

- place symbol;
- connect pins;
- change component value;
- assign footprint;
- propose placement;
- propose route;
- explain ERC/DRC issue.

AI may not bypass electrical rules.

## Commercial principle

The sellable value is not “AI draws a PCB”. It is faster trustworthy design with editable intent, mechanical awareness, reusable component knowledge and understandable checks.

## Dependency strategy

Before choosing editor/router/file libraries, compare current open ecosystems and licensing. Do not commit to a provider merely because it is easiest to prototype.

## Human gates

High-impact schematic/PCB interaction, DRC behavior and manufacturing-output correctness require human acceptance before release.

## Bootstrap acceptance

The repository foundation is complete only when it contains:

- Constitution adoption;
- this canonical product blueprint;
- master execution prompt;
- AGENTS entrypoint;
- architecture/ownership document;
- dependency budget;
- CI skeleton;
- empty but typed project/domain boundary;
- no fake PCB editor functionality.
