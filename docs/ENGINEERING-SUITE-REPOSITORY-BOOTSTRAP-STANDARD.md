# Engineering Suite Repository Bootstrap Standard

Status: **CANONICAL BOOTSTRAP STANDARD**

A new engineering-suite repository is not considered founded merely because a repository exists.

## Required day-zero files

Each suite product repository must begin with:

```text
.blueprint/constitution-adoption.json
AGENTS.md
README.md
docs/ARCHITECTURE.md
docs/DEPENDENCY_BUDGET.md
docs/<PRODUCT>_CANONICAL_BLUEPRINT.md
prompts/<PRODUCT>_MASTER_EXECUTION_PROMPT.md
.github/workflows/ci.yml
src/domain/...
tests/...
```

The first commit must contain only foundation truth and compilable/testable domain scaffolding. It must not contain fake product capability.

## Required authority chain

```text
Universal Constitution
  > Engineering Suite canonical blueprint
  > Product canonical blueprint
  > Domain contracts / Work Packages / Gates
  > Execution prompt
  > Implementation
```

## Day-zero quality requirements

- explicit canonical owner;
- versioned project/study schema placeholder;
- local-first operating posture;
- dependency budget;
- no required paid runtime;
- typed identifiers;
- no provider/runtime identity as canonical state;
- CI must at least run typecheck + unit tests + build/package validation relevant to the stack;
- Draft development work until a real vertical slice exists;
- no Product/Production claim.

## Repository independence

A bootstrap repository must not import source files directly from another suite repository.

Cross-suite behavior begins with contract fixtures and adapters, not source-code coupling.

## Shared-code threshold

Do not create shared packages on day zero.

Only extract after two actual consumers prove a stable shared concept.

## Initial branches

Suggested:

- `main`: minimal accepted foundation only;
- `foundation/general-system`: active foundation implementation.

If repository creation starts with the foundation directly on `main`, create the development branch immediately after the initial accepted bootstrap commit.

## Naming and management reservation

| Product | Repository | App ID | Device namespace |
| --- | --- | --- | --- |
| Mechanical CAD | `CAD_CAM_3D` | `cad-cam-3d` | `CAD-` |
| Electronic CAD | `ECAD_Design` | `ecad-design` | `ECAD-` |
| Simulation | `CAE_Simulation` | `cae-simulation` | `CAE-` |

Application Management integration is staged only after the product repository exists and publishes a truthful management contract.
