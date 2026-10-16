# ECAD_Design — Canonical Product Blueprint

Status: FOUNDATION
Authority: Universal Constitution 1.2 → Engineering Suite Blueprint → this document.

## Product mission

Create a local-first, AI-assisted electronic design system that preserves editable intent from schematic through PCB manufacturing and interoperates mechanically with CAD.

## Canonical source of truth

`EcadProject` is the durable editable source of truth.

It must own:

- project identity and schema;
- schematic sheets;
- symbols and pins;
- nets/connectivity;
- constraints/rule classes;
- footprint assignment;
- PCB stackup and board outline;
- component placement;
- routing primitives;
- ERC/DRC evidence;
- BOM/manufacturing provenance.

## Forbidden architecture

Never:

- make canvas/SVG IDs project identity;
- couple canonical data to a vendor SDK;
- make CAD own ECAD connectivity;
- make AI own a hidden parallel netlist;
- claim DRC/ERC PASS without real rule execution;
- require a paid cloud to open/edit/export a local project.

## Interop

Mechanical exchange follows `ENGINEERING-SUITE-INTEROP-CONTRACT.v1`.

The ECAD project may publish a PCB Mechanical Package but remains the owner of electrical design.

## Dependency law

Evaluate file ecosystem, rendering/geometry engines, ERC/DRC, routing and library providers before committing to a deep dependency.

No PCB router/kernel is selected by this bootstrap.

## Release law

Manufacturing correctness requires file-level regression plus real-human validation before release.
