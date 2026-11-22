# Blueprint OS — UI Mockup Round-Trip v1.0 (CANDIDATE)

**Legal status:** DRAFT PROPOSAL, NOT RATIFIED, NOT ACTIVE LAW.  
**Parent authority:** active Universal Constitution 1.3.0, especially Product, Architecture, Data, UI/UX, Security, QA and Governance.  
**Policy ID:** `blueprint-os:ui-mockup-roundtrip`  
**Owner:** Software-Blueprint-Hub; each application repository remains owner of its own source, screenshots, implementation and test evidence.

## Preamble and purpose

This policy defines a reproducible loop **live app/source → bounded visual mockup → human design approval → implementation on the existing UI → independent visual and functional verification**. A picture is a visual reference, **not** an implementation plan, business contract or permission to invent features. The companion spec is authoritative only *within* verified existing product functionality and its explicit approval scope. No agent may turn a candidate into law, an approved mockup, a Quality Gate PASS or a Production release by self-assertion.

### Article UI-01 — App truth precedes art

For each requested app/page/state: resolve the real project ID, repository, exact source HEAD, route, authenticated actor, available actions, data contracts and relevant design tokens from bounded sources. Identify known versus unavailable/uncertain data. Screenshots, image generation and text prompts cannot authorize API, database, security, workflow or business changes. Never fabricate live metrics, user records, active statuses, permissions or routes.

### Article UI-02 — Explicit scope and no functional invention

The mockup covers **one named app, surface, state and viewport group**, or an explicitly enumerated set. The system may restyle spacing, layout, hierarchy, palette, typography, icon treatment and responsive presentation, preserving accessible semantics. Do not introduce or remove business actions, routes, data fields, roles, approval behavior or content; do not silently hide a critical control. Any desirable new feature is separately labeled **IDEA — OUT OF SCOPE**, excluded from the implementable image and spec until approved through normal product change control.

### Article UI-03 — Traceability of each visible part

Every interactive or data-bound part of an implementable mockup requires a stable `componentId`, `sourcePath`/actual component anchor, `route`, `dataBinding` or `actionId` where relevant, and explicit state mapping. Decorative blocks may be marked `visualOnly` without a business mapping, provided they cannot be mistaken for actions or real data. No guessed component path is permitted. Any discrepancy between the rendered image and recorded spec is `VISUAL_SPEC_MISMATCH` until reconciled.

### Article UI-04 — Dual evidence, not dual business authority

A mockup package consists of a rendered image file and a **machine-readable immutable spec**, each bound by SHA-256; include `createdFromSourceSha`, `policyVersion`, `viewport`, `route`, `uiState` and `provenance`. The image communicates composition; the approved spec encodes mapping, scope and behavior-preserving constraints. Both must correspond. In conflicts the order is: **active Constitution → real product domain/security/data contracts → reviewed spec → image → cosmetic inference**. A conflict between spec and image must be surfaced, not silently resolved by choosing one.

### Article UI-05 — Artifact and registry ownership

The Hub owns the policy, reusable template, alias definitions, registry index and workflow graph. The app repository or approved evidence store owns image bytes, per-mockup spec, code and screenshot evidence. The Hub index holds only paths/immutable digests/status and approved references, never copies sensitive product data or a second app database. A mockup generated only inside chat or an unpersisted attachment is not a durable registered mockup.

Suggested app-owned paths:
`artifacts/ui-mockups/{surfaceId}/{mockupId}.png` and `artifacts/ui-mockups/{surfaceId}/{mockupId}.spec.json`. The Hub index is `control/ui-mockup-registry.v1.json`; identities use immutable IDs, not 'latest.png'.

### Article UI-06 — Life cycle and design consent

Allowed states: `draft → approved → superseded`; `draft → rejected`; either draft or approved may become `stale` on demonstrated source/contract drift (the immutable historical approval record is retained). Only a specifically identified version can be design-approved by the authenticated authorized human. A chat assertion from an agent, GitHub CI success or the image itself is not approval. Approval of the *design* is **not** constitutional ratification, implementation acceptance, Quality Gate PASS or Production authority. Changes create a new version; they do not overwrite an approved record.

### Article UI-07 — Deterministic resolution of short commands

**`Tạo giao diện mẫu`** (`CREATE_MOCKUP`) resolves an unambiguous current app/surface/state, reads bounded source, creates **exactly one candidate image plus spec**, checks content grounding and registers status `draft`; **does not modify product UI code**. If context cannot identify a unique surface, request the single missing scope before invoking generation. Do not invent a second mockup or generate an image before confirming image is the intended output of this command.

**`Theo mẫu đã có áp dụng vào giao diện`** (`APPLY_APPROVED_MOCKUP`) resolves exactly one `approved`, not-stale, exact-digest model for the current app/surface. It **MUST NOT call image generation, redraw, restyle from scratch or silently select a draft**. It reads existing image bytes and spec, checks provenance and source drift, maps existing components, changes only allowlisted UI paths, runs regression and visual evidence checks and opens a reviewable PR. Ambiguous, stale or absent approved models **BLOCK**, with a concise reason. A user's explicit `Duyệt mẫu này` is a distinct design approval intent and must identify the exact version; it does not approve code or release.

### Article UI-08 — Diff boundaries and source drift

Before editing, compare `createdFromSourceSha` to present HEAD for relevant routes, data contracts, components and tokens. Unchanged compatible paths may be reconciled with evidence; changed behavior or unmapped elements cause `STALE_SOURCE_REQUIRES_REVIEW`. Restrict writes to explicitly mapped presentation files; any API/auth/data schema/permission/config mutation requires a separate change request and gate. No whole-repo sweep by default; use current HEAD/diff and named files.

### Article UI-09 — Fidelity, responsive states and a11y

For agreed desktop/tablet/mobile breakpoints, compare real rendered UI to the same approved mockup viewport and state. Record screenshot hashes and a layout/component mapping assessment, text truncation, contrast, keyboard/focus/semantics, loading/empty/error/permission states and representative actions. Visual metrics may be used if declared before testing and calibrated; **no invented universal pixel-accuracy threshold**. A static lookalike that does not work is a failure. Keep a human UX review of important journeys.

### Article UI-10 — Data and image safety

Use authorized sanitized or synthetic data labeled as illustrative, never depict private/sensitive production data without legitimate access and minimization. Protect consent, copyright, licensed assets and personal identifiers. Generated images may contain hallucinated text/components; cross-check every actionable label. Restrict stored artifact access and retention as required by the app's policy.

### Article UI-11 — Evidence and no self-certification

Create a traceable record: app and source SHAs, approved image/spec digests, bounded files changed, PR/commit, test run IDs, before/after screenshots by viewport, mapping coverage, open deviations and independent reviewer result. A passing unit test is not visual/browser acceptance, and a passing visual test is not permission to release. Fail closed on absent authentic evidence; forbidden tactics include placeholder 'PASS', silent skipped suites, fake previews and CSS override piles.

### Article UI-12 — Rollback and provider sovereignty

Keep each implementation change reversible by exact commit/PR and token/theme rollback where appropriate. No hosting vendor, including Vercel, is a mandatory part of the mockup flow. Preview may be local, CI-hosted or separately authorized; state of running services must be truthfully observed. Do not use a mockup to mutate Production.

### Article UI-13 — Budgets and controlled loops

Default one model per command, bounded relevant files, deterministic artifacts, at most two design correction attempts without new source evidence, and no recursive full project scanning. User-requested variants are separately versioned, not silently added. If the gate fails, report the smallest causal mismatch rather than endlessly regenerating or rewriting.

### Article UI-14 — Adoption and enforcement gates

This document and `control/ui-mockup-roundtrip.contract.v1.json`, `control/ui-mockup-command-aliases.v1.json` and `prompt-workflows/templates/ui-mockup-roundtrip.v1.json` are **proposal artifacts only**. Their presence or CI validation does **not** make them active universal law. Ratification requires a separately authenticated, reviewed constitutional decision and propagation through existing Blueprint OS adoption mechanisms; sealed Constitution 1.3.0 snapshots remain untouched.

## Required result contract

- `CREATE_MOCKUP`: real image + companion spec + draft registry entry + provenance + explicit unsupported elements; **product code unchanged**.
- `APPROVE_MOCKUP`: verified human approval of one exact image/spec digest + audit trail; **no code/release authority**.
- `APPLY_APPROVED_MOCKUP`: no generated images; diff + regressions + real before/after screenshots + independent UX findings + explicit remaining blockers. Status is `implemented-candidate` until independent acceptance.
- Failure states: `AMBIGUOUS_SCOPE`, `MISSING_APPROVED_MOCKUP`, `UNMAPPED_COMPONENT`, `STALE_SOURCE_REQUIRES_REVIEW`, `VISUAL_SPEC_MISMATCH`, `UNVERIFIED_RENDER`, `NO_HUMAN_APPROVAL` and `OUT_OF_SCOPE_CHANGE`.

**Related authority:** `docs/UNIVERSAL-CONSTITUTION.md` §4/§6/§8, `control/universal-constitution-version.json` 1.3.0 and existing `prompt-workflows/` central DAG conventions.
