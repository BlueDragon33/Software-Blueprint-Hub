# ACTIVE-NEXT-ACTION-CHAT-001 — Constitutional proposal for ChatGPT conversation assistance

**State:** PROPOSED_ONLY · NOT_RATIFIED · NOT_ACTIVE · NO_PRODUCTION_AUTHORITY  
**Constitutional authority:** `blueprint-os:universal-century-grade@1.3.0`, main baseline `0d0d0bece3afa82aaf5792a64c0d4bab56dc9825` (verified 2026-11-22).  
**Amendment ID:** `constitution-amendment:active-next-action-chat-001`  
**Version strategy:** Compatible clarification of R15–R22, **target version unassigned**. Resolve alongside pending 1.4 proposal #171; do not claim 1.4 or silently bump 1.3.0.  
**Affected domains:** Product, UX, Security, QA, Operations, Governance. Existing requirements/gates only.

## 1. Problem, source and correct surface

Owner wants a genuine **ChatGPT conversation/project** Active Next Action, not another page, control plane, app, prompt-copy widget or compulsory Codex process. Previous response showed a basic two-stream form, required unnecessary approval friction and presented an old static revision as if it were live. Multiple PRs propose overlapping behaviors (#155 editable A–Z prompt, #156 same project-local flow, #161 copy-only external Prompt Workspace, #173 canonical task intake and integration). Only one contextual assistance pattern is needed.

ChatGPT conversation buttons are **host-rendered ephemeral controls**. GitHub commits, even ratified constitutions, **cannot install or force a button in ChatGPT** or alter platform-wide product controls. An externally hosted Blueprint application may offer copy/open links but cannot submit a ChatGPT turn for the user. A native button may invoke a new turn only when the actual ChatGPT host exposes that capability during a real user click. These differences are mandatory, not marketing disclaimers.

## 2. Proposed R15–R22 implementation refinement (NOT ACTIVE)

- **NAI-01 — One active project and truthful sources.** Fetch current project/PR/HEAD, policy, gates and checkpoint using authorized connected capabilities. Never use an old cited SHA as live truth or mix projects; unknown means UNVERIFIED.
- **NAI-02 — One-click primary continuation.** A compact **Tiếp tục A–Z** button directly submits one user-directed continuation when host action exists. No mandatory form, checkbox, copy/paste or routine confirmation to continue the already-authorized objective. When no canonical READY work exists, it asks to inspect BLOCKED state instead of inventing work.
- **NAI-03 — Advanced options only when needed.** A secondary optional panel exposes scope mode (continue, focused QA, finish to gate), the current work stream, and a separate optional supplement/other task. Selecting options is not mandatory for default continuation.
- **NAI-04 — Two streams with bounded scope.** Stream 1 is the pinned canonical current task and gate/evidence state. Stream 2 is untrusted user-proposed addition or other task, reviewed as a scoped change; a different task is queued rather than silently replacing the current approved critical path.
- **NAI-05 — Honest host action.** An actual supported ChatGPT host action may submit **only from an explicit user interaction**. Preview, copy, open external Hub and submit are different actions. No hidden dispatch on render/effect; no fake AI/background runner claim; if host action unavailable, provide a copyable draft and say it is not executable.
- **NAI-06 — Derived prompt provenance.** The generated request identifies project, repo/PR, **last observed** SHA or digest with mandatory recheck, existing goal, gates, checkpoint, permitted changes, stop criteria and single return condition; it is a projection, never a credential or authority.
- **NAI-07 — Gate-safe authority.** Scope approvals from UX are not canonical `PROJECT_MUTATE`, constitutional ratification, independent A/B approval, Quality Gate PASS, PR merge or Production permission. Exact revisions and authorized server boundaries are rechecked immediately before protected writes.
- **NAI-08 — Continuous eligible work.** Within the current authorized turn, finish root-cause fixes, tests, regression and durable checkpoint along one critical path before giving the owner another prompt. Do not claim unattended operation after the turn ends.
- **NAI-09 — Windows only at a real blocker.** Exhaust current tools; only when native Windows or owner credentials are actually unavailable, produce **one bounded and preflighted PowerShell batch** targeting the verified `E:\BaumanWeb` workspace, with timeout/progress, strict exit, evidence logs and one consolidated readback. Avoid asking for commands repeatedly.
- **NAI-10 — Truthful visual feedback.** Statuses CODED / SOURCE_QA / INTEGRATION_QA / REAL_UX / MERGED / DEPLOYED / ACCEPTED are distinct. Source tests never imply runtime/real user success. Live graph animation requires real scoped telemetry; disconnected or simulated activity is labeled accordingly.
- **NAI-11 — Portability and graceful degradation.** On web, Windows, iOS, Android and other supported ChatGPT surfaces, use the controls **actually available there**. The same Project instruction guidance can be manually opted into a supported ChatGPT Project; source commit does not update chat/project settings or synchronize UI state automatically.
- **NAI-12 — Minimal UX, token and data footprint.** Collapse metadata by default; use readable content-first styling, keyboard and touch controls, reduced-motion support and one primary action. Never place credentials, personal secrets or raw Agent stdout in prompt previews/logs; no per-step polling or new backend solely for chat button presentation.

### Execution decision order
`READ AUTHORIZED CANONICAL STATE → RESUME READY WORK → SCOPED DIAGNOSE/FIX/QA → CHECKPOINT → [ONLY IF NECESSARY] HUMAN OR NATIVE CAPABILITY HANDOFF`. If the user invokes an advanced/new-task option, reconcile the delta with R15 and existing WorkPackage authority first.

## 3. Authority and conflict reconciliation

| Existing item | Relationship to proposal | Rule |
|---|---|---|
| ACTIVE R15–R22 | Already obligate preserved goal, one critical path, effective autonomy and minimal intervention | Clarify **UI projection**, do not duplicate authority |
| PR #155 / #156 | Project-local editable Next Action and selected A–Z continuation proposals | Preserve editing, actual Send, no host fabrication |
| PR #161 | External Blueprint Prompt Workspace candidate with **copy/open**, no ChatGPT host submit | Remains copy-only externally; never map it to in-chat submit |
| PR #173 | Unified Workspace server WorkPackage intake + Atlas Graph candidate | No duplicate canonical store or second workflow engine |
| PR #166 | Graph Intelligence candidate | Telemetry requires real event source; static graph is not a runner |
| PR #171 | Independent A/B reviewer and possible 1.4 constitutional amendment | Coordinate compatible next version; never self-review/ratify |
| PR #164 | CONTENT-FIRST candidate | Contrast and readable controls remain subject to ACTIVE §11; no retroactive published claim |

## 4. Impact analysis

**Security:** no new authority; host action is only an explicit user-initiated new message. A prompt may not grant privileged rights. Reject cross-project, stale-source, fake verified, forged runner/approval and secret leakage.

**Data:** canonical WorkPackages, gates, checkpoints remain owned by their existing services. Chat controls are transient; any persistent task records require authenticated backend with version checks and idempotency.

**UX:** improve one-tap continuation while avoiding forced choices and extra dashboards; validate desktop/mobile keyboard, screen readers, disabled/degraded states and truthful labels.

**Operations:** no new cloud service, storage, cron, paid model or orchestration service. Existing ZERO-SPEND invariant persists. No auto-merge or auto-Production.

**Compatibility:** external Hub continues using copy/open-only unless its actual connected capabilities change; old project guidance v1 remains usable but is superseded only after owner opt-in to v2. Do not install into other projects by Git commit.

**Risk:** moderate UX/provenance changes; high if incorrectly interpreted as Agent/constitutional/Production authority. Explicit negative tests in machine candidate and project instructions address those hazards.

## 5. Migration, acceptance and ratification

**M0:** Pin CURRENT 1.3.0 authority set and intersecting PRs. **M1:** Publish *proposal* files and portable ChatGPT Project guidance, clearly not normative. **M2:** Validate contract and negative tests under local Node, then real supported-host UX in ChatGPT without pretending to install native controls. **M3:** Independent reviewer A/B verifies no authority/conflict regressions against exact SHA. **M4:** Authenticated constitutional authority approves or rejects exact proposal/evidence set. **M5:** On ratification only, publish a coordinated new Constitution version (normative Markdown + machine contract + foundation template + policy/version declaration) atomically, then propagate with readback.

**Required acceptance:** primary action immediately issues one new chat turn on actual supported host interaction; advanced panel is optional; no silent actions; user-added tasks are queued with scope checks; stale/unknown HEAD is revalidated; no false PASS, execution, live status or constitutional authority; native PowerShell only at genuine blocker; keyboard/mobile legibility; source/host/manual evidence pinned.

**STOP GATE:** No authenticated append-only ratification decision, independent review or exact version-set verification exists for this candidate. Therefore merging a new normative Constitution to `main` or claiming it **PUBLISHED** would violate the existing protocol. The Owner's request to pursue merge/publish is the goal, not itself the protocol's authenticated ratification record.
