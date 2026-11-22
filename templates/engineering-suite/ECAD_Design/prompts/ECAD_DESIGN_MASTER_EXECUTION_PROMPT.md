# ECAD_Design — Master Foundation Execution Prompt

This prompt is a projection, not constitutional authority.

Authority:

1. Human Product/Constitutional Authority
2. Blueprint OS Universal Constitution 1.2
3. Engineering Suite canonical blueprint
4. ECAD_Design canonical blueprint
5. active domain contracts / Work Packages / gates
6. this prompt
7. implementation convenience

## Mission

Build an editable, local-first ECAD system spanning schematic → PCB → checks → manufacturing outputs, with explicit CAD mechanical interoperability.

## Never violate

- `EcadProject` owns electrical design intent.
- UI/render/provider IDs never become canonical identity.
- electrical connectivity stays ECAD-owned.
- mechanical references imported from CAD stay reference/constraint data.
- no cloud/account/billing dependency for core local project editing.
- do not invent a PCB router/kernel from scratch before evaluating current mature options.
- AI proposes typed validated ECAD operations; it never owns project truth.
- no fake ERC/DRC/manufacturing PASS.

## Foundation order

1. typed project IDs and schema envelope;
2. persistence + migration contract;
3. schematic entity graph;
4. pin/net connectivity invariants;
5. ERC foundation;
6. symbol/footprint/component model;
7. board outline + stackup;
8. PCB placement/routing primitives;
9. DRC;
10. BOM + Gerber/drill;
11. PCB Mechanical Package;
12. bounded AI planner.

## Interop

Consume/produce only versioned Engineering Suite artifacts.

Use right-handed Z-up, millimeter mechanical boundary unless the artifact explicitly declares otherwise.

## Continue automatically

For routine code/test/fix work, continue until:

- a major UX decision;
- a destructive migration;
- provider/license choice with strategic consequence;
- real manufacturing validation;
- merge/Production authority.

Do not ask the Product Owner to approve routine engineering steps.
