# Constitutional Amendment Proposal — SPATIAL-RESOURCE-UX-001

**Status:** DRAFT — NOT RATIFIED — NOT PUBLISHED — NOT UNIVERSALLY ADOPTED  
**Owner:** Software-Blueprint-Hub Constitutional Authority  
**Active law at intake:** `blueprint-os:universal-century-grade@1.3.0`  
**Intake baseline:** `BlueDragon33/Software-Blueprint-Hub main@cd01fb3c2178393628ce968af209db082227d2c4`  
**Requested on:** 2026-11-15  
**Candidate version:** compatible minor strengthening *to be determined by impact review*; do not preassign or claim active version  
**Evidence origin:** `BlueDragon33/BOIECH_AI` PR [#164](https://github.com/BlueDragon33/BOIECH_AI/pull/164), merged to `main@8f4531f6788c84020c3851ec669d963e3b7bbadb`. This proves **MERGED SOURCE**, not Cloudflare Production deployment, real-device usability, universal law or ratification.

## 1. Problem and constitutional scope

Resource-management applications commonly show physical or logical hierarchies (campuses, buildings, floors, rooms, pools, equipment, schedules) as disconnected flat tables. Visualizing a hierarchy can improve navigation, but attractive isometric illustrations, simulated cards and prebuilt examples can introduce *invented inventory*, unsafe scheduling, duplicate resources or hidden writes.

**Proposed universal principle:** When a real spatial/resource hierarchy materially improves a task, use a coherent navigable representation of the **existing authoritative hierarchy** with a clear path to details and writes. A spatial/3D/isometric representation is one **optional implementation** justified by user goals; it is neither a mandatory design style nor proof of real ownership, capacity or availability.

Applicable projects inherit the existing Constitution Sections **3 Data, 4 UI/UX, 5 Security, 6 QA, 8 Governance, 9.3 Product Elegance, 9.4 Premium Usability, 10.R3/R5/R9/R13/R18/R20 and 11 Computed contrast**. This addendum **strengthens these existing obligations**, not a new architecture tier, approval system, UI app, data registry or quality gate.

## 2. Proposed normative clauses (only if ratified)

1. **Hierarchy-first navigation when appropriate.** A resource-centric task should expose a recognizable path from parent resources to actionable children (e.g., site → building → room/pool → actual schedule), preserving keyboard, search, filtering, labels, status and list alternatives. Do not manufacture levels such as floors/blocks without an authoritative schema and migration. Flat tables remain valid where better suited.
2. **Render real inventory distinctly from examples.** Maps, cards, numbers, occupancy, capacity and availability must derive from authorized canonical reads. Decorative art cannot be used as evidence of a persisted building/pool. A proposed template must be explicitly marked **NOT CREATED / SAMPLE** and excluded from persisted inventory counts and operational status until its authorized creation is confirmed.
3. **Safe, opt-in template lifecycle.** A reusable building/room/equipment template is a draft/projection until an authorized human/role explicitly creates real records through the owning application's existing API. Use stable identity, scoped authorization, version/conflict handling, idempotency/duplicate detection, partial-failure recovery and server readback. Do not auto-create resources when opening a page, repeat submission blindly or silently delete partially created canonical resources.
4. **Unknown safety/capacity values fail closed.** For pools, physical training spaces and other consequence-bearing resources, unknown real capacity, dimensions, permitted users or safety prerequisites must be visible as **UNVERIFIED / CONFIGURATION REQUIRED**. Technical schema placeholders are not actual safety facts or user-visible capacity claims. A template must not become bookable/schedulable until the owning project has verified and activated its required configuration. Existing server-side conflict/capacity/authority checks remain binding.
5. **Task-specific visual distinction without role confusion.** Meaningful resource types may have distinct pictograms, diagrams or illustrations (e.g., a pool basin vs classroom building), but **accessible text and semantic statuses** remain the primary identification channel. No icon, visual similarity or role badge can grant an entitlement, confirm an inspection or signal that a backend mutation succeeded.
6. **Visual restraint, accessibility and real performance.** A spatial overview shall not obscure content, duplicate navigation, harm small screens, or introduce avoidable loading cost. Use an efficient progressive layout with human-readable fallback and keyboard/focus access, `prefers-reduced-motion` where applicable, and real computed contrast evidence. Preserve Section 11/WCAG 2.2 AA thresholds and the existing `gate:ux:commercial-quality`; no weaker parallel threshold is permitted.
7. **Truthful acceptance and publication state.** Verification must distinguish source code, test coverage, real browser UX, data persistence/authorization, release status and observed deployed behavior at exact revisions. A green CI job is not user acceptance, a merge is not a deploy, and constitutional adoption is never Production authorization.

## 3. BOIECH_AI reference implementation (project-specific, NOT universal design requirement)

`BlueDragon33/BOIECH_AI` PR #164 / merge SHA `8f4531f6788c84020c3851ec669d963e3b7bbadb` introduced a building-first Studio and isometric campus gallery:

- **Tổng quan / Phòng học:** select a real building and inspect its children, schedule and utilization.
- **Tòa học:** create and configure buildings, rooms and practice sessions via existing resource APIs.
- **Tòa bể bơi:** a distinctive optional template with an indoor `Bể bơi thực hành` illustration; template preview is not counted as real inventory.
- The practice pool uses the existing `building` + `room` resource model. When created, the basin remains `unavailable` until real capacity is confirmed and the manager activates it; the implementation's database-required placeholder `capacity=1` must never be treated as an actual certified value.
- `Tầng / khối` are **not** existing independent resource entities in that change; they require a separate reviewed schema/migration and acceptance before CRUD is claimed.
- The PR's GitHub Actions evidence is tied to its PR HEAD; verified merged-code and workflow evidence **does not** establish deployed Cloudflare Production, physical safety certification or tested visual acceptance.

These names, SVG artwork, colors, IDs, room capacity placeholder, number of pools, role labels and provider/runtime are **not** general constitutional requirements. They remain owned by BOIECH_AI.

## 4. Impact review — candidate, not a claim of universal implementation

| Area | Applicable principle | Risk / guardrail |
| --- | --- | --- |
| Architecture | Model real parent/child resources and reuse existing owned APIs | No second inventory store or mandatory new resource service |
| Data | Explicit identity, source, persisted/not-persisted distinction | No invented floor, occupancy, capacity or synthetic example counted as real |
| Security | Authorized writes, server validation and conflict checks | Visual controls never grant authority |
| UI/UX | Coherent visualization, text fallback and selected-to-detail navigation | Accessibility/contrast, responsive mobile, measured rendering |
| QA | Exact-SHA tests for count exclusion, duplicate avoidance, fail-closed schedules, recovery | Source check != browser/real data verification |
| Operations | Explicit environment, release and readback | No self-publish; separate Production authority |
| Ecosystem | Each enrolled project determines applicability by real jobs-to-be-done | No forced 3D, no universal building schema, no cosmetic mass refactor |

Initial scoped **impact candidates**: BOIECH_AI (direct), campus/space/resource scheduling apps if their actual Project Profile supports it. Other governed projects are not assumed to use spatial navigation; they may justify **NOT APPLICABLE** for the visualization style while retaining the universal data/safety/UX invariants. A full canonical governed-repository impact matrix and independent review are **PENDING**.

The active content-first candidate, Hub PR [#164](https://github.com/BlueDragon33/Software-Blueprint-Hub/pull/164), already addresses foreground/background priority and Section 11. Reconcile overlapping UX requirements **before** ratification; never duplicate the existing contrast law or weaken its thresholds.

## 5. Migration and gates

1. **DRAFT → IMPACT REVIEWED:** check active Section 11, Product Elegance, Premium Usability, Data/Authority and scoped UX gates; assess affected governed repos (applicable/not applicable with evidence), migration size and perf/accessibility risk.
2. **MIGRATION READY:** prepare *one* coherent proposed next authority-set version — normative document, machine contract, canonical template, policy owner and version-lock tests — only after the version choice and collisions with existing amendment PRs are resolved.
3. **RATIFICATION READY:** independent architecture/security/UX review; realistic resource create → list/readback → avoid duplicate → configure → book flow, unknown-capacity and recovery negatives; desktop/mobile/keyboard computed contrast and performance checks at exact SHA; evidence/rollback for applicable apps.
4. **HUMAN RATIFIED:** authenticated append-only Constitutional Authority ratification bound to *exact proposed version and evidence set*. A chat request, PR merge or AI status cannot stand in for that protocol.
5. **PUBLISHED → PROPAGATING → VERIFIED:** publish the complete authority version set atomically, then adopt in governed repos with per-app PASS/FAIL/UNVERIFIED. Any application deployment remains subject to its own Production authority.

**Explicit boundaries:** this draft does **not** modify published Constitution 1.3.0, `control/universal-constitution.contract.json`, version metadata, locked universal template, GitHub release gates, Application-Management or any application's deployed state. No cross-project silent propagation or ratification is claimed.

**Next action:** independent constitutional impact and UX review of this exact proposal branch, including collision check with the currently open CONTENT-FIRST-001 proposal; return evidence before preparing a versioned ratification package.
