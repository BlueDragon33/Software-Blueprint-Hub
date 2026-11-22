# ECAD_Design Agent Instructions

Read in order before architecture/domain changes:

1. `.blueprint/constitution-adoption.json`
2. Engineering Suite canonical blueprint from `BlueDragon33/Software-Blueprint-Hub`
3. `docs/ECAD_DESIGN_CANONICAL_BLUEPRINT.md`
4. relevant domain contracts / Work Packages
5. `prompts/ECAD_DESIGN_MASTER_EXECUTION_PROMPT.md`

Rules:

- preserve one canonical `EcadProject`;
- no transient editor/provider identity in durable design state;
- local-first core;
- explicit schema migrations;
- no fake ERC/DRC/manufacturing evidence;
- no direct source import from CAD/CAE repositories;
- cross-suite exchange only through versioned contracts;
- continue routine work automatically;
- stop for human UX/manufacturing/provider/merge/Production authority.
