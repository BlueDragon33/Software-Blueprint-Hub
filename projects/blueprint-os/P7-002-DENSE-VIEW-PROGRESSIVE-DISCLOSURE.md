# P7-002 — Dense canonical view progressive disclosure

Status: **IN PROGRESS**

## Problem

Phase 6 Product UX Gate accepted the canonical mobile views as usable but recorded a P2 hardening issue:

- Knowledge Library;
- Prompt Workspace;
- Quality;
- Releases & Lessons

can become long and expensive to scan on narrow screens.

The problem is density, not missing truth.

## Rule

Progressive disclosure may hide secondary detail from the first scan, but it must never hide the identity or status needed to interpret canonical state.

Always visible:

- record title / canonical ID where material;
- lifecycle or gate status;
- exact release revision where material;
- evidence count and latest/source revision where material;
- Prompt Fresh/Stale state and current source revision;
- Knowledge item source/version authority summary.

May be disclosed:

- full requirement lists;
- full linked-evidence lists when a compact provenance preview remains visible;
- secondary metadata;
- long tags lists;
- rollback detail;
- older Prompt history rows;
- verbose learning/provenance detail.

## Interaction contract

Use semantic native disclosure where possible:

`<details><summary>…</summary>…</details>`

Requirements:

- keyboard native;
- no custom hidden-state source-of-truth;
- summary text explains what will be revealed;
- content remains present in the document and can be expanded without network reload;
- disclosure does not change canonical data;
- critical provenance is not available only behind disclosure.

## Target surfaces

### Quality

Each gate keeps name/status and compact evidence provenance visible.

Requirements, linked IDs and the full evidence register may be expanded.

### Knowledge

Each item keeps title/version/summary visible.

Source/authority/status/tags move into a semantic “Provenance & tags” disclosure.

### Prompt

Current source revision, Fresh/Stale state, actions and current execution prompt remain primary.

Older Prompt history may use progressive disclosure if history becomes dense.

### Releases & Lessons

Version/status/exact revision/evidence identity stay visible.

Rollback/provenance/long secondary detail and verbose lesson context may be disclosed.

## Gate

P7-002 may PASS only when:

- existing canonical E2E remains green;
- new disclosure controls are keyboard-operable;
- critical revision/evidence/status assertions remain visible without expansion;
- mobile screenshots show materially improved scanning hierarchy;
- no provenance is deleted;
- exact-head CI + Human UX review PASS.

Production deployment remains unauthorized.
