# Constitution Enforcement Model

Status: **ENFORCED UNIVERSAL BASELINE**

Blueprint OS treats the Universal Constitution as executable engineering law, not guidance.

## Enforcement chain

```
UNIVERSAL CONSTITUTION
        ↓
MACHINE-READABLE CONTRACT
        ↓
CONSTITUTION-LOCKED TEMPLATE CATALOG
        ↓
DETERMINISTIC BLUEPRINT RESOLUTION
        ↓
PROJECT READINESS / QUALITY GATES
        ↓
RELEASE GATE
        ↓
PRODUCTION AUTHORITY
```

A lower layer may strengthen a requirement. It may not remove, disable, replace or weaken a Universal requirement.

## Current and future projects

The rule is **retroactive at resolution time**.

- New projects inherit the current Universal Constitution during Bootstrap.
- Existing projects are re-resolved against the current Universal Constitution whenever their canonical Blueprint is read/resolved.
- If a new Universal gate is introduced, an existing project becomes truthfully blocked until the corresponding canonical Quality Gate/evidence exists.
- No migration may fabricate PASS evidence to preserve an old green status.
- Changing a project template cannot replace the runtime-controlled Universal Constitution template.

This means Constitution evolution may create new legitimate work for existing projects. That is intentional: the system prefers truthful non-compliance over silently grandfathering weaker standards.

## Runtime lock

The server runtime uses a Constitution-locked template catalog.

The lock:
1. injects the current unconditional Universal Constitution template into every project resolution;
2. allows project/level/capability templates to add or strengthen requirements;
3. rejects any catalog that attempts to supply a different payload under the Universal Constitution template identity;
4. retains the resolver's fail-closed conflict behavior.

Direct UI state, AI output, plugins, providers and Application Management cannot disable this lock.

## Repository adoption contract

Every ecosystem repository must contain:

`.blueprint/constitution-adoption.json`

and declare:
- exact Constitution policy ID/version;
- project ID;
- Blueprint Level;
- all mandatory inherited pillars;
- no disabled pillars;
- no Constitutional waivers;
- canonical Quality Gates as evidence authority;
- Production authority as a separate explicit Release Gate.

The canonical policy is:

`control/universal-constitution.contract.json`

The validator is:

`scripts/check-constitution-adoption.mjs`

## CI enforcement

Blueprint OS runs Constitution compliance in both Fast CI and the full Release Gate.

Other ecosystem repositories should call the reusable workflow:

```yaml
name: Constitution

on:
  pull_request:
  push:
    branches: [main]

jobs:
  constitution:
    uses: BlueDragon33/Software-Blueprint-Hub/.github/workflows/constitution-compliance.yml@main
```

A repository with a missing manifest, stale policy version, missing pillar, disabled pillar or Constitutional waiver fails this check.

## Release rule

Passing the adoption check means the repository is bound to the law. It does **not** itself prove every Quality Gate has PASS evidence.

Production readiness still requires project-appropriate evidence for the inherited gates. A release process may not infer PASS from:
- successful build;
- successful deployment;
- green adoption manifest;
- UI status;
- AI assessment;
- provider status.

The exact release revision must satisfy its canonical Quality Gates.

## Amendments

Universal Constitution changes are rare and versioned.

An amendment must:
1. update the normative Constitution;
2. update the machine-readable contract;
3. update the canonical Universal template;
4. update enforcement tests;
5. pass full exact-revision Release Gate evidence;
6. propagate to ecosystem repositories.

Projects may not pin themselves forever to an obsolete Constitution version to avoid a stronger law. Migration may be staged during development, but Production release cannot claim current Constitutional compliance while the repository declares a stale policy version.

## Authority boundary

Neither this mechanism nor Application Management grants Production authority.

The Constitution answers **what cannot be violated**.
Blueprint Level answers **how deeply it must be implemented**.
Quality Gates answer **what evidence proves it**.
Release authority answers **whether a specific revision may be promoted**.
