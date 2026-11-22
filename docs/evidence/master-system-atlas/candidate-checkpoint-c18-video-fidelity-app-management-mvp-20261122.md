# C18 — Video-fidelity product definition and Application Management Tool MVP (2026-11-22)

**Status:** PRODUCT/INTEGRATION DESIGN CHECKPOINT ONLY, not a runtime implementation, approval, release, or a new canonical ledger. **Source:** user-provided original MP4 files `Hệ thống AI` (~15.5 seconds) and `Quy trình AI 2` (~25.2 seconds), inspected as temporal frames on 2026-11-22; prior agreed Blueprint Graph Intelligence Studio + Master System Atlas; live GitHub source below. Source files remain user-supplied references, not copied into GitHub or hosted publicly. **Constitution:** Hub main `control/universal-constitution-version.json` blob `aa7986feeb6027fa52b88751a078c2ba5e8cd0fa` = ACTIVE 1.3.0, no production release authority.

## 1. Video reference versus desired engineering functions

**Video A — `Hệ thống AI`:** dark high-density layered agent/network mesh, left-side TASK/REPO/TESTS/PLAN.MD input sources, architect/check/splitter to many colored specialist units, curved glowing multicolored inter-layer connections, focused/expanded states, terminal/event traces and a final graph-run summary. Its displayed numeric labels (for example `15 agents`, `412 units`, `409 verified`) are **video-demo UI content, never Blueprint OS current telemetry**. Fidelity target = true multilayer clusters + semantic interconnection, overview-to-detail, animated **verified** state changes only, not the old three-column grid of rectangle cards.

**Video B — `Quy trình AI 2`:** central lead/writer, separate architect, routing/fork layer, parallel search/grep/audit workers, quality feedback, resource selection and live session log. Its model names and rates are illustration of roles and routing, **not mandatory or free provider selection**. Fidelity target = observable delegation workflow with review/QA/cost gates; no asserted autonomous 24/7 worker without authenticated running infrastructure. Zero-spend defaults must remain enforceable.

**Existing Blueprint OS:** ACTIVE Constitution 1.3.0, 20-layer Compass/engineering foundation, 12 dependency-linked W00–W11 lanes in `docs/architecture/MASTER-SYSTEM-PRINCIPLE-ALGORITHM-ATLAS-20261122.md`, WorkPackage and QualityGate canonical, Evidence Graph, Graph Intelligence, Prompt Workspace, authenticated authority and external independent Reviewer A/B. Retain all; never replace with decorative imitation or a second control plane.

## 2. Exact GitHub state relevant to a visitor clicking Application Management

- Hub [Draft #173](https://github.com/BlueDragon33/Software-Blueprint-Hub/pull/173) **pre-C18 HEAD `608358a72e99151fefdf1e1797673ded172bf7b4`** OPEN/DRAFT; previous C13 exact-tree scoped Graph/DUAL/ANA QA recorded **28/28 Vitest + 3/3 Chromium PASS**, not all-gates release acceptance. Its Graph view route `apps/web/app/projects/[projectId]/evidence-graph/page.tsx` and `graph-intelligence-studio.tsx` are real source code, with Graph filters/impact/provenance/zoom/pan and SVG Bézier paths. **Current visual layout is a 3-column card grid** (`W=224`, `H=112`, `COLUMNS=3`), not reference-video neural mesh. UANA offers local Workspace navigation and optional reviewed `PLANNED` intake, **not running an Agent**; project-wide source CAS C15-ANA-CAS-01 remains OPEN. Release gates P9-019/020 not met for new Draft.
- Application Management **main** `app/application-registry.ts` existing `software-blueprint-hub` entry is category `Kỹ thuật`, `tier=client`, `status=warning`, `contractState=migrating`, with `href=/apps/software-blueprint-hub` and public external URL `https://software-blueprint-hub.vercel.app/`. `app/apps/software-blueprint-hub/page.tsx` blob `05c695dfa6f289ad5adfe32cb4e31cf7b21ffb00` loads the generic authenticated `ApplicationWorkspace` (overview, devices/access, content/control, generic links). **It is not an internally deployed neural Tool**. Existing application-registry note about older P9 production does not attest latest #173 integration.
- Application Management [Draft #376](https://github.com/BlueDragon33/Application-Management/pull/376) HEAD `13840deaf3ba5dc8ed3e09af5134c2b12fa763f2` defines a **different, not-merged internal `/tools/blueprint-compass`** with app list/search, observed public GitHub repo HEAD, up-to-20 PRs/issues, safe advisory verdict, manual Refresh, and strict project-scope checks. Its legacy route `/apps/software-blueprint-hub` redirects to Tool **only on its Draft branch**. This Compass is metadata-only, no authoritative WorkPackage read/write, Graph Atlas, private App mesh, CI control or live Agent orchestration. APP main `app/management-dashboard-v2.tsx` `systemTools` does **not** list Blueprint Compass; #376 must not be misrepresented as published.
- APP [Draft #414](https://github.com/BlueDragon33/Application-Management/pull/414) HEAD `60e3b0c6fb37613bfb10648394f4cef31b389e34`: R0.2 synthetic instrumented 10/50/200 app performance/browser QA **BLOCKED/NOT_MEASURED**. Existing Hub [Issue #159](https://github.com/BlueDragon33/Software-Blueprint-Hub/issues/159) is the portfolio checkpoint, no second ledger.

**LIVE authenticated end-user Production screen was not inspected**. Everything here is exact GitHub source/PR/CI evidence. A public web fetch for `software-blueprint-hub.vercel.app` was inaccessible in this analysis; do not claim an authenticated click-through or live deployment of #173.

## 3. One integrated product; ownership boundaries

**APP MANAGER = gateway/control-plane and user entrypoint** (existing auth and device-role policy, Tool directory, launcher, SSO/session, shell, aggregated read-only operations, rollout/rollback). It never owns Blueprint project WorkPackage, QualityGate or reviewer approval.

**HUB = engineering source of truth** (ACTIVE Constitution, project profile, graph ontology, canonical Prompt revision, WorkPackage/QualityGate/Evidence, dependency/readiness, audit, bounded and authorized commands). Existing `/projects/[projectId]/...` pages stay as independently operable advanced workspace. Source-specific GitHub identifiers and canonical Prompt source revision must not be conflated.

**NEURAL TOOL = UI projection inside APP's existing candidate `/tools/blueprint-compass`** (future displayed label `Blueprint OS · Neural Command Center`, not a second separately registered client or new remote control plane). Data arrives via versioned, authenticated read-only Hub adapters when verified; public GitHub inventory is strictly labeled `UNSIGNED_GITHUB_METADATA_ONLY`. If Hub is unavailable, retain only clearly dated snapshot/status if such a snapshot has actually been authorized and implemented, otherwise `UNVERIFIED`. No simulated LIVE RUNS.

**SPECIALISTS = existing bounded components**: Graph Intelligence evidence/impact, DUAL orchestration, QA workers and Reviewer A/B, Tech Intelligence / Innovation Defense (each independent, versioned, provenance-bound). A proposed AI planner is advisory until an authenticated runner, permissions and exact revision are proven. Never expose private identities/tokens in frontend.

**Local-first and anywhere:** a remotely accessible authenticated web Tool provides *access to view/prepare actions from mobile or desktop*, but jobs cannot continue with browser closed unless an approved local agent or hosted worker is **actually connected and running** with valid leases, heartbeats, idempotency, revocation and zero-spend. UI animations are not evidence of a 24/7 backend.

## 4. R0/R1/R2/R3/R4 phased release decision

**R0 — earliest independently releasable slice, read-only internal Tool** (not synonymous with the full Hub #173 merge): adapt **existing** APP #376 route and App main navigation into one Blueprint OS Tool; preserve bookmark redirect with verified auth; show truthful Projects/Registry, Git HEAD, PR/Issue and blocked evidence; link to existing authenticated Hub pages where authorized; support desktop/mobile, loading/error/stale and regression/backward compatibility. **No canonical writes, no private bridge, no Agent, no self-approval.** Requires exact candidate SHA, build/tests, access/role isolation, real browser click/refresh/phone acceptance, non-spoofed state, $0 enforcement, rollback and explicit Owner release authority under ACTIVE law. APP #414 R0.2 performance data must be evaluated for changed high-risk UI surfaces, not pretended measured.

**R0.1 — honest visual integration**: inside same route, embed read-only **actual** neural graph from pinned Hub Graph projection/Atlas data via permission-scoped adapter. Add source+revision+observedAt and semantic node/edge on-hover/click. Need exact identity/SSO and real app-to-Hub API acceptance; if missing, mark `UNVERIFIED` rather than display fixture as live. Can be separate release checkpoint from R0.

**R1 — visual-fidelity neural explorer**: full layered/clustering/edge bundling, L0 10 macro domains -> L1 app/project modules -> L2 Goal/Work/Gate/Evidence/Defect/Checkpoint -> L3 Algorithm/Formula/Experiment/Model details. Pan/zoom/search/focus/diff/cause/timeline, keyboard/touch/contrast/reduced-motion. Performance tests 100/1000/10000 data nodes with real target hardware; no fabricated metrics. Dense aesthetic only inside graph canvas; surrounding text remains readable.

**R2 — orchestration monitor**: video-B pipeline Planner -> role-based specialized workers -> human/Reviewer gates -> QA -> logs/results; actual accepted event traces rather than fake token counters or animation. Can begin as read-only run/history monitor; no execution without a verified authorized worker.

**R3 — safe canonical write & continuation**: fix C15-ANA-CAS-01 with a single atomic source-version write boundary shared by affected writers, real concurrent negative tests and auth recheck; then enable reviewed `PLANNED` WorkPackage intake in Tool. No Agent dispatch from a button without runner.

**R4 — truly bounded operations from anywhere**: authentic distinct private App A/B identity and 8 protected bridge cases, audited scoped command executor with revocation/retry/rollback and real device/worker heartbeat; P9-019/020 human & release gates. Never promise always-on execution based on web UI alone.

**Do not block safe R0 read-only presentation work solely because R3 mutation CAS is incomplete**, but **do** preserve R0's own real identity/QA/Owner release gates and do not merge full gated #173 as a shortcut.

## 5. What the user MUST see when clicking the proposed Tool (not current Production)

**Top shell:** `Blueprint OS / Neural Command Center`, Constitution ACTIVE 1.3.0, observed Git revision, data source, last verified timestamp, `CONNECTED/DEGRADED/UNVERIFIED` and separate `PLANNED/IN_PROGRESS/BLOCKED` lifecycle states. Never show offline while source only stale; never show running without heartbeat.

**Main initial screen L0:** visually dense but readable 10-domain neural map with cluster labels Constitution / Projects / Architecture / Work & Algorithms / Data / Security / QA & Evidence / AI & Training / Operations / Reviews. Link proven edges, clearly mark proposed edges; selectable colored specialist streams. Reuse current ecosystem navigation & 20-layer Compass behind the graph.

**Interaction:** tap Project or node -> L1 zoom cluster, source-backed path Goal -> Dependency -> WorkPackage -> QualityGate -> Evidence -> Defect -> Fix -> Checkpoint; right inspector shows exact source/revision/owner/status/blocker; bottom panel actual activity/event log or clearly marked no telemetry. Search/domain/status filters and saved view only when storage/auth verified. Mobile defaults to compact domain summary + node drilldown, not an unreadable whole graph.

**Tabs inside one Tool:** `Toàn cảnh` (graph), `Dự án` (catalog), `Nhiệm vụ & Next Action` (review/hand-off), `Agent & Quy trình` (actual read-only runs/roles), `QA · Evidence · Gate` (truthful release blockers). Advanced Hub stays reachable without iframe/SSO privilege bypass.

**Buttons by phase:** R0 `Xem chi tiết`, `Đọc lại GitHub`, `Mở Hub`, `Xem PR/Issue`; R3 after CAS `Lưu nhiệm vụ PLANNED`; R4 only after authority `Yêu cầu chạy` with visible confirmation and revocation. Do **not** render functioning-looking dead buttons for unimplemented features. Future screens may show "Chưa kích hoạt" as plain explanations.

## 6. Dependency, acceptance and checkpoint

Workstream W00–W11 preserved; recommended next READY slices in order:
1. **C18-S0 design freeze (this doc):** exact route reuse, visual language and product truth table signed as *proposal*, not ratified Constitution.
2. **C18-S1 App candidate integration:** reconcile APP #376 with current App main + authenticated router, remove duplicate Blueprint client card only when compatibility and human approval established; preserve older URL, unique Tool route. No new repo/site, no premature flag `connected`.
3. **C18-S2 Hub read-only Graph adapter:** source-typed, auth-scoped versioned contract; UI follows actual data; separation code Git SHA versus Prompt source revision and stale/permission negative cases.
4. **C18-S3 browser QA:** explicit click from APP Tool, back navigation, mobile iPhone-sized viewport, auth signout and cross-project denial, no leaked private information, 0-cost network and honest offline states; keyboard/WCAG 2.2 AA computed foreground/background, slow/failed upstream.
5. **C18-S4 earliest R0 decision gate:** exact SHA evidence, rollback and authorized human Production decision. Do not ratify/merge/publish by this document. R1 visual upgrade and R2/R3/R4 can remain independent subsequent WPs.

**Current outcomes:**
- SOURCE_VERIFIED: existence and contents of Hub #173 Graph & UANA pages, APP main client route and registry, APP Draft #376 Tool, APP Draft #414 R0.2 blocker, Constitution ACTIVE 1.3.0.
- VISUAL_FIDELITY_NOT_ACCEPTED: current Hub three-column grid does not replicate original dense layered videos.
- APP_TOOL_PRODUCTION_NOT_VERIFIED: no internal `/tools/blueprint-compass` on APP main source, no authenticated Production click-through; #376 remains Draft.
- 24_7_RUNTIME_NOT_VERIFIED: no accepted always-on bounded orchestrator.
- PRIVATE_BRIDGE_NOT_RUN, CAS_OPEN, HUMAN_RELEASE_NOT_AUTHORIZED.
- ZERO-SPEND, no new ledger, no duplicate project registry, no merge/ratification/Production.

**Next Action:** make the first independently releasable, real, accessible *read-only* Tool inside APP on an isolated branch based on current main, preserving existing `/tools/blueprint-compass` candidate (no second Tool); in parallel prepare source-grounded neural layout on Hub #173 without concealing C15 CAS or private Reviewer gates. Only propose publication when R0 acceptance has actual exact-head readback and Owner authority.
