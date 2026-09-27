# Constitution Authority & Amendment Protocol v1

Status: **GOVERNING PROTOCOL**

Software-Blueprint-Hub has two simultaneous roles:

1. **Governed project** — it obeys the active Universal Constitution like every other project.
2. **Constitutional authority system** — it is the canonical place where amendments are proposed, analyzed, ratified, published and propagated.

These roles must never collapse into one unchecked authority.

## Authority separation

Three authorities are distinct:

- **Constitutional Authority** — may change the Universal Constitution only through this protocol.
- **Project Authority** — may mutate one project's canonical engineering state.
- **Production Authority** — may promote an exact artifact/revision to Production.

Possessing one authority never implies another.

AI, providers, plugins, UI state and Application Management receive none of these authorities implicitly.

## Amendment lifecycle

```
DRAFT
  ↓
IMPACT REVIEWED
  ↓
MIGRATION READY
  ↓
RATIFICATION READY
  ↓
HUMAN RATIFIED
  ↓
PUBLISHED
  ↓
PROPAGATING
  ↓
VERIFIED
```

A proposal may be rejected before publication. A published Constitution is never retroactively erased; correction requires a new amendment/version.

## Stage rules

1. **Amendment Proposal** — define problem, rationale and exact law surface.
2. **Impact Analysis** — examine architecture, security, data, UX, operations, compatibility and every governed project.
3. **Migration Plan** — define project migration without fabricated PASS evidence or silent grandfathering.
4. **Human Ratification** — an authenticated human constitutional authority decides approve/reject.
5. **Publication** — publish normative Constitution, machine-readable contract and canonical template as one exact version set.
6. **Propagation** — governed repositories adopt the new policy version and surface migration blockers.
7. **Verification** — exact evidence proves adoption/compliance; Production remains a separate decision.

## Anti-abuse laws

The constitutional authority may not:
- weaken a law merely to make Blueprint OS or another project pass;
- rewrite history by editing an old published version in place;
- manufacture evidence or migrate a FAIL gate to PASS;
- let AI ratify or publish;
- infer Production authority from constitutional publication;
- silently exempt a project from a mandatory pillar.

## Versioning

Published versions are immutable historical authorities.

Normal compatible strengthening may use a minor version.
Breaking constitutional meaning requires an explicitly reviewed major version.
The impact analysis must justify the version class; version choice is not cosmetic.

## Prompt architecture

Constitution work uses stage-specific prompts generated from canonical amendment state.

```
Constitution
    ↓
Amendment Prompt
    ↓
Impact Prompt
    ↓
Migration Prompt
    ↓
Ratification Brief
    ↓
Publication Prompt
    ↓
Propagation Prompt
    ↓
Verification Prompt
    ↓
Project Execution Prompts
```

Generated prompt text is always a projection. It never becomes the source-of-truth.

Every Constitution Authority prompt must include:
- exact active policy and target version;
- exact amendment identity;
- source digest/revision;
- affected pillars/requirements;
- stage duty;
- compatibility/security consequences;
- migration implications;
- evidence needed for next stage;
- unresolved human decisions;
- explicit non-authority statement.

## Ratification

Ratification must be:
- authenticated;
- append-only;
- bound to the exact amendment revision/evidence set;
- attributable to a human constitutional authority;
- separate from publication execution.

Chat text, AI output, green CI or a UI badge is not ratification.

## Publication

Publication is valid only when:
- amendment is ratified;
- exact version set is generated;
- Constitution document, machine-readable contract and Universal template agree;
- source-of-truth/compatibility tests pass;
- publication evidence is recorded.

## Propagation

Every governed repository must:
- declare the current policy version;
- fail compliance when stale;
- migrate according to its Blueprint Level and real risk;
- retain truthful NON-COMPLIANT status until required evidence exists.

## Verification

A successful constitutional rollout proves governance compliance only.

It does not mean:
- every product feature is complete;
- P9-020 is accepted;
- Production is deployed;
- Production deployment is authorized.
