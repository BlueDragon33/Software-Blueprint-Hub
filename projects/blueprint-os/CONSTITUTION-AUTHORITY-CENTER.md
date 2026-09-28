# Constitution Authority Center — Storey 01 Expansion

Status: **ACTIVE FOUNDATION**

This is not Storey 21. It strengthens Storey 01 — Constitution & Authority.

## Goal

Make Software-Blueprint-Hub the canonical constitutional authority system for the ecosystem while keeping it subject to the active Constitution.

## Work packages

### CA-001 — Authority model + Prompt Architecture
Status: **COMPLETE**

- amendment lifecycle is fail-closed;
- ratification requires authenticated human authority;
- AI prompt projections cannot ratify/publish/PASS/release;
- Prompt Architecture v2 defines precedence and stage envelopes;
- `/constitution` exposes current authority and protocol.

Completion evidence:
- PR #75 exact head `6c020fdfe11b55d71d074b7e62c75f9ff3293218` passed the full Release Gate;
- merged baseline `be534f3a4fe6f19d1f9eeb5fba97ce182c28ab6a`;
- Production authority remained false.

### CA-002 — Canonical amendment persistence
Status: **COMPLETE**

Persist append-only:
- amendment proposal revisions;
- impact evidence;
- migration plan;
- ratification decision;
- publication record;
- propagation runs;
- verification evidence.

Required:
- optimistic concurrency;
- immutable published versions;
- stable IDs;
- audit provenance;
- no UI-only constitutional state.

Candidate evidence:
- PostgreSQL current amendment record plus append-only revision history;
- append-only stage evidence;
- atomic evidence + lifecycle transition transactions;
- exact recordVersion conflict protection;
- System Owner global authority boundary.

Completion evidence:
- PR #76 exact head `7b05ae19ffe14c0b1e9c1ea3fd14b2de4802eb32`;
- full Release Gate run `36365074322` passed PostgreSQL migration, typecheck, architecture boundaries, integration tests, build and Playwright;
- squash-merged baseline `db176342a6d970f8b1498e348606e60078fc0736`;
- main Fast CI run `36365279832` passed.

### CA-003 — Human ratification surface
Status: **COMPLETE**

Create authenticated Constitution Reviewer/Owner action:
- exact amendment revision;
- exact impact/migration evidence;
- approve/reject;
- mandatory note;
- append-only decision;
- no automatic AI ratification.

Candidate evidence:
- authenticated System Owner ratification action only;
- approve/reject requires mandatory note;
- decision is append-only and bound to exact pre-decision recordVersion;
- decision and lifecycle transition persist atomically;
- Playwright intentionally never performs ratification;
- ratification grants zero Production authority.

Completion evidence:
- same PR #76 exact-head/full-gate evidence as CA-002;
- System Owner authority is global and separate from project reviewer authority;
- browser automation intentionally never performs a human ratification action.

### CA-004 — Atomic publication set
Status: **IMPLEMENTED CANDIDATE — FULL GATE REQUIRED**

Publication must update and verify as one authority set:
1. normative Constitution document;
2. machine-readable Constitution contract;
3. canonical Universal Blueprint template;
4. amendment history record;
5. policy version.

Partial publication fails closed.

Candidate implementation:
- canonical Constitution moved to `docs/UNIVERSAL-CONSTITUTION.md`; legacy `.v0.md` is a compatibility pointer only;
- `control/universal-constitution-version.json` defines the exact authority set;
- CI verifies policy/version identity across normative document, machine contract, Universal template and application policy source;
- full Release Gate emits an exact Git-SHA/run-ID-bound authority-set attestation;
- application validates component paths, versions and SHA-256 authority-set digest;
- publication requires a separately injected trusted attestation verifier;
- without trusted verification, publication fails closed;
- PostgreSQL publication transition atomically writes publication evidence, immutable publication record and amendment revision;
- no manual Publish button or free-form publication payload is exposed;
- constitutional publication grants zero Production authority.

### CA-005 — Ecosystem propagation
Status: **PLANNED**

For governed repositories:
- detect stale adoption version;
- generate migration Work Packages;
- open/update adoption changes;
- report CI compliance;
- never fabricate project gate evidence;
- keep Production authority separate.

### CA-006 — Constitutional compliance matrix
Status: **PLANNED**

Global view:
- repository/project;
- adopted policy version;
- Blueprint Level;
- migration status;
- six-pillar status;
- blocking constitutional gates;
- exact evidence revision;
- last verification time;
- Production authority shown separately.

## Completion gate

Constitution Authority Center is not complete until:
- published amendments are immutable/versioned;
- a new Constitution version cannot publish without human ratification;
- governed projects detect stale policy;
- migration preserves truthful non-compliance;
- Blueprint OS itself remains subject to self-audit;
- exact evidence proves the full amendment lifecycle;
- Production is never implied by constitutional publication.
