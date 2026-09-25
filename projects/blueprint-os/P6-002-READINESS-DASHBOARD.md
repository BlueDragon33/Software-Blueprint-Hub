# P6-002 — Readiness Dashboard

Status: **COMPLETE — CI/E2E/HUMAN UX EVIDENCE ACCEPTED**

## Purpose

Turn canonical Work Package, Quality Gate and Gate Evidence state into a truthful project readiness surface.

P6-002 explicitly rejects cosmetic readiness percentages.

## Source-of-truth flow

```
Project Workspace
  ↓
ProjectProfileApplicationService → resolved required gate IDs
  ↓
ProjectReadinessApplicationService
  ↓
AuthorityService PROJECT_READ
  + WorkQualityRepository
  ↓
pure Core readiness aggregation
```

The UI must not aggregate persistence rows by itself.

## Readiness semantics

Project dashboard state is one of:

- `blocked` — missing required gate, failed gate, or blocked Work Package;
- `attention` — candidate gate requires review;
- `in-progress` — engineering work/gates are still active;
- `gate-ready` — all resolved required gates currently PASS and no canonical work remains incomplete.

`gate-ready` is deliberately **not** Product Ready and **not** Release Ready.

## Gate truth

The dashboard shows:

- number of resolved required gates;
- tracked required gates;
- required gates at PASS;
- missing required gate records;
- active tracked gates;
- failed/candidate/not-ready gate counts.

A required gate absent from canonical QualityGate storage is a blocker, not a hidden zero.

## Work truth

The dashboard uses the Core dependency graph to expose:

- completed work;
- active work;
- blocked work;
- exact blocking dependency IDs/status/reasons.

Work completion never auto-passes a Quality Gate.

## Evidence truth

P6-002 shows linked evidence count, source, revision and timestamp.

Current/stale freshness is **not** inferred merely from age.

Until Blueprint OS has an authoritative current-revision resolver for an evidence source, recorded evidence is labeled:

`recorded-unverified`

Other states:

- `none` — no linked evidence;
- `incomplete` — a gate references missing evidence IDs.

This prevents false freshness claims.

## Next-action rule

The dashboard chooses one explainable next action in this order:

1. define missing required gate;
2. resolve failed gate;
3. unblock dependency work;
4. review candidate gate;
5. prepare not-ready gate;
6. continue incomplete work;
7. verify exact-revision release evidence.

## UX acceptance

The canonical project route must expose:

- clear readiness headline;
- gate/work/evidence summary without percentages;
- active gates with status/provenance;
- blocked work with reason;
- one next action;
- explicit copy that evidence currentness is not auto-verified;
- responsive desktop/mobile hierarchy.

## Gate

P6-002 may PASS only when:

- authority-safe application aggregation is tested;
- missing required gates fail closed;
- dependency blockers are visible;
- candidate/failed/pass semantics are tested;
- evidence freshness is not overstated;
- PostgreSQL/browser integration remains green;
- Human UX screenshot review has no blocking defect.


## Completion evidence

Reviewed implementation revision before completion-status commit:

`7d1add5c8871e695063b8ad48d0d89cb185dc0e2`

Automated evidence:

- push CI run `36158576457`: **SUCCESS**;
- exact branch revision passed:
  - PostgreSQL migration/status;
  - contract drift/schema compatibility;
  - lint/typecheck/architecture boundaries;
  - unit, authority and PostgreSQL integration tests;
  - production build;
  - canonical registry/readiness E2E seed;
  - Playwright Project Registry + Readiness Dashboard E2E;
  - screenshot artifact upload.

Readiness browser assertions prove:

- B4 project reports `1 / 4 PASS`;
- missing required `gate:platform:compatibility` fails closed;
- next action names the exact missing gate;
- blocked Work Package exposes the unfinished dependency and status;
- evidence is labeled `Revision recorded · currentness unverified`;
- the canonical readiness summary contains no cosmetic percentage.

Human UX artifact:

- artifact id: `10874667169`;
- digest: `sha256:ba23f06cf26cdc39af20df77a3e20dd8c3b4efc237214847fda96a274915810a`;
- desktop readiness screenshot reviewed;
- mobile readiness screenshot reviewed.

Human review findings:

1. Readiness state and primary blocker are visible before lower-priority project detail.
2. Gate, work and evidence facts remain distinct; no percentage implies false completion.
3. Missing gate, candidate gate and not-ready gate are visually distinguishable without relying only on color.
4. Next action is prominent and explains why it is next.
5. Evidence provenance/currentness disclaimer is visible and appropriately conservative.
6. Dependency blocker includes the exact dependent Work Package and status.
7. Mobile layout is single-column, has no horizontal overflow and keeps status/count badges compact.
8. The longer resolved-blueprint requirement list remains usable but should be reorganized by P6-003 Project Workspace information architecture.
9. No blocking P0/P1 UX defect was observed.

## Result

**P6-002 = COMPLETE**

P6-003 — Project Workspace information architecture is the next dependency Work Package.

Production deployment remains unauthorized.
