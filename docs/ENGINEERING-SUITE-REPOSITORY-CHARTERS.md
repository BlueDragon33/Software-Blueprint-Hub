# Engineering Suite Repository Charters

Status: **FOUNDATION RESERVATION**

## CAD_CAM_3D

Repository: `BlueDragon33/CAD_CAM_3D`
Status: active
App ID: `cad-cam-3d`
Device namespace: `CAD-`

Owns mechanical parametric design and additive-manufacturing intent.

Must remain able to operate locally without ECAD or CAE.

## ECAD_Design

Reserved repository: `BlueDragon33/ECAD_Design`
Status: pending repository creation
App ID: `ecad-design`
Device namespace: `ECAD-`

Mission:

> AI-assisted, editable electronic design from schematic through PCB manufacturing outputs, with first-class mechanical interoperability with CAD.

Canonical future entities:

- ECAD project;
- schematic sheet;
- symbol instance;
- pin;
- net;
- rule class;
- footprint;
- PCB board;
- layer/stackup;
- track/via/zone;
- design rule;
- component placement;
- BOM reference;
- manufacturing output provenance.

Non-goals at foundation:

- inventing a PCB router/geometry kernel from scratch;
- cloud-required project ownership;
- copying CAD feature history into ECAD;
- mixing mechanical and electrical sources of truth.

## CAE_Simulation

Reserved repository: `BlueDragon33/CAE_Simulation`
Status: pending repository creation
App ID: `cae-simulation`
Device namespace: `CAE-`

Mission:

> Trustworthy engineering simulation studies attached to explicit geometry revisions, using replaceable meshing/solver adapters and evidence-aware results.

Canonical future entities:

- CAE project/study;
- geometry source reference;
- material assignment;
- boundary condition;
- load;
- contact;
- mesh policy;
- mesh provenance;
- solver configuration;
- solve run;
- result dataset;
- result summary;
- convergence/evidence status.

Initial solver strategy:

- do not write an FEA solver from scratch;
- evaluate open, mature solver/mesher adapters;
- keep solver-specific IDs out of suite-level identity;
- preserve a local/offline path where practical;
- allow future remote HPC as an optional execution provider, not project owner.

## No shared-core repository yet

The suite explicitly rejects premature creation of a fourth shared-code repository.

Shared contract extraction happens only after two real consumers prove the need.
