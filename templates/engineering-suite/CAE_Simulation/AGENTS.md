# CAE_Simulation Agent Instructions

Read in order before architecture/domain changes:

1. `.blueprint/constitution-adoption.json`
2. Engineering Suite canonical blueprint from `BlueDragon33/Software-Blueprint-Hub`
3. `docs/CAE_SIMULATION_CANONICAL_BLUEPRINT.md`
4. relevant domain contracts / Work Packages
5. `prompts/CAE_SIMULATION_MASTER_EXECUTION_PROMPT.md`

Rules:

- preserve one canonical `CaeStudy`;
- bind every study/result to explicit geometry revision/hash;
- stale source geometry must surface stale simulation state;
- no transient solver/mesh/runtime identity as sole durable reference;
- no fake convergence/result PASS;
- no direct source import from CAD/ECAD repositories;
- solver/mesher providers stay behind adapters;
- continue routine work automatically;
- stop for human engineering/UX/provider/merge/Production authority.
