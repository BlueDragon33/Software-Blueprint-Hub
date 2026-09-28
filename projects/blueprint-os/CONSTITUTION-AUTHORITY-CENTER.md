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
Status: **COMPLETE**

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

Completion evidence:
- exact-head `5e0b86c5b42246d7fd9e1312db69f2f48c0c055c` passed full Release Gate run `36369217048`;
- PR #78 squash-merged as `64b5bcdf1686069a3cf9ad039ee13f94a6d2cc41`;
- authority-set atomicity, PostgreSQL publication integration, production build and Playwright all passed;
- Production authority remained false.

### CA-005 — Ecosystem propagation
Status: **COMPLETE**

For governed repositories:
- detect stale adoption version;
- generate migration Work Packages;
- open/update adoption changes;
- report CI compliance;
- never fabricate project gate evidence;
- keep Production authority separate.

Candidate implementation:
- canonical governed-repository registry covers the authority repo plus 13 governed repositories;
- provenance-bound adoption snapshot records exact default-branch Git SHA and manifest state;
- deterministic propagation planner reports current / migration-required / policy-ahead / invalid-adoption / unverified;
- stale policy produces a non-authoritative migration plan with zero external-repository mutation, Quality Gate PASS or Production authority;
- invalid/missing adoption fails closed instead of being treated as migrated;
- CI validates registry/snapshot coverage, branch, exact SHA shape, project identity, Blueprint Level and adoption authority boundaries;
- /constitution exposes the propagation matrix only to authenticated Constitutional Authority;
- public Constitution readers do not receive governance inventory metadata;
- the first verified snapshot is 14/14 current at policy 1.1.0.

Completion evidence:
- initial exact-head full Release Gate passed on `c82950620dd16af0e34d2f49fa2bb35b20e354c9` in run `36370333878` after repairing the Next.js runtime control-file path;
- Fast CI and full gate both execute the Constitution ecosystem snapshot validator;
- production build and Playwright desktop/tablet/mobile evidence passed with the authority-only propagation matrix;
- propagation remains a read-only plan; external repository mutation, Quality Gate PASS and Production authority remain false;
- final exact-head `83c69685836ff11173d82ffa26fd59f44438de2c` passed full Release Gate run `36370577912`;
- PR #79 squash-merged as `1290f9078537759d4ee1c56b8f226113d85843df` and main Fast CI run `36370799997` passed.

### CA-006 — Constitutional compliance matrix
Status: **COMPLETE**

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

Candidate implementation:
- a standard Constitution Compliance Attestation protocol separates adoption from compliance evidence;
- the matrix accepts COMPLIANT only for the active policy and exact current source revision;
- all six Century-Grade pillars and all seven Universal constitutional gates must appear in a valid attestation;
- a PASS gate requires evidence IDs and evidence revisions;
- missing attestation remains UNVERIFIED instead of inheriting adoption or CI success;
- stale adoption becomes MIGRATION REQUIRED before compliance is considered;
- malformed, contradictory or stale attestation fails closed as BLOCKED;
- observation time and compliance verification time are separate;
- authority-only /constitution UI exposes repository, policy, Blueprint Level, six-pillar state, blocking gates, exact evidence revisions and verification status;
- the initial live repository scan found no standard CA-006 attestation in the 14 governed repositories, so the truthful baseline is 14/14 adoption-current and 0/14 compliance-attested;
- matrix projection cannot mutate project Quality Gates, fabricate PASS, certify the exact release revision or authorize Production.

Completion evidence:
- initial exact-head full Release Gate passed on `b193d13c1dc5adafb2d8c982c627edcb892a91fb` in run `36372608266`;
- CA-006 snapshot integrity, typecheck, architecture boundaries, unit/integration, production build and Playwright desktop/tablet/mobile all passed;
- E2E strict-locator ambiguity caused by the same repository appearing in both CA-005 and CA-006 was fixed by scoping assertions to the intended matrix rather than weakening product behavior;
- the truthful baseline remains 14/14 adoption-current, 0/14 compliance-attested, 14/14 compliance-unverified;
- automatic Quality Gate PASS, canonical project mutation, exact-release certification and Production authority remain false.

### CA-007 — Trusted post-publication lifecycle closure
Status: **RELEASE CANDIDATE — GATES PENDING**

Purpose:
Close the canonical amendment lifecycle after publication without weakening any authority boundary.

Candidate implementation:
- `published → propagating` now requires a trusted propagation attestation bound to the exact amendment, canonical publication record, target policy version, Git revision, workflow run and snapshot digest;
- propagation may truthfully record a mixed ecosystem state, including repositories still requiring migration; it does not imply compliance;
- `propagating → verified` now requires a separate trusted verification attestation bound to the same exact amendment/publication authority;
- verification fails closed unless every governed repository is compliance-attested and non-compliant, unverified, migration-required and blocked counts are all zero;
- malformed repository-count partitions, stale record versions, missing canonical publication records, untrusted attestations and missing lifecycle-verifier infrastructure are rejected;
- propagation and verification are persisted as append-only Constitution evidence using the existing optimistic-concurrency repository path;
- unit tests exercise fail-closed validation plus the complete post-publication state transition;
- PostgreSQL integration proves append-only amendment revisions and evidence from `draft` through `verified`;
- lifecycle evidence cannot PASS a project Quality Gate, certify the final Production release revision or grant Production authority.

Release evidence:
- PR #81 exact candidate `f1dbb699b66f07ae043a3c67a0fcb1cbb5119a46` passed Development Fast CI run `36375326525`;
- full Release Gate is pending on the next exact-head release candidate;
- status must remain RELEASE CANDIDATE until exact revision full-gate evidence exists.

## Completion gate

Constitution Authority Center is not complete until:
- published amendments are immutable/versioned;
- a new Constitution version cannot publish without human ratification;
- governed projects detect stale policy;
- migration preserves truthful non-compliance;
- Blueprint OS itself remains subject to self-audit;
- exact evidence proves the full amendment lifecycle;
- Production is never implied by constitutional publication.
