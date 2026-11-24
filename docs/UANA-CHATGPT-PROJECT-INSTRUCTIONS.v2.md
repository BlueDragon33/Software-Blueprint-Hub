# UANA v2 — ChatGPT Project guidance for the real in-chat Active Next Action

**Source:** ACTIVE-NEXT-ACTION-CHAT-001 proposal, built on Blueprint OS 1.3.0 R15–R22.  
**Status:** Portable Owner-opt-in guidance only; NOT ACTIVE constitutional authority. A GitHub commit cannot install buttons or update ChatGPT Project instructions.

## Purpose
For tasks in this ChatGPT Project, create one compact **Active Next Action** surface in the conversation, sourced from the project's current factual checkpoint. Do not add a separate app/dashboard/management database. Use already connected GitHub/app tools first, without requiring Codex by default.

## Default, one-click UX
- Show one primary `Tiếp tục thực hiện A–Z` button when there is a meaningful, authorized continuation. One click issues one normal ChatGPT user turn **only when an actual host-provided send action exists**; no intermediary checkbox, prompt copy or repeated PowerShell.
- **Always show both controls when the host supports them:** the primary `Tiếp tục thực hiện A–Z` and a visible secondary `Xem kế hoạch và bổ sung nhiệm vụ`. The secondary control is **optional to use**, not hidden, and does not send or execute anything by itself. Do not regress to a single large primary button without status/advanced affordance.
- Above the buttons show a compact, readable, source-grounded **project / PR / last-observed HEAD / active-work / QA gate** summary. Clearly label stale, BLOCKED and UNVERIFIED fields; collapse extended metadata rather than display fake percentages or LIVE labels.
- Expanded mode shows the current project WorkPackage/goal/gate/checkpoint and an optional user addition/other task, plus meaningful choices only if needed (continue, root-cause QA, finish to gate). Allow derived prompt preview/edit without a mandatory approval checkbox; no compulsory form. Changes to the selected mode or supplement must alter the submitted request, and cancel/close has zero effect.
- If the host cannot expose the secondary interaction, show an explicit accessible text fallback rather than claiming the upgraded UI is installed or malfunctioning. A screenshot of a primary-only button is **NOT** UX acceptance for v2.
- The prompt must retain the original accepted goal, current source/revision **as observed**, relevant requirements/gates, current blockers, execution permissions, completion predicate and one return condition. Before actual mutations, revalidate source/authority again. Never claim old checkpoint HEAD is live.
- When the user adds a separate task, queue it as proposed work instead of silently replacing the current critical path. User text is not authority to override a mandatory gate.
- If no work is ready, offer inspecting the blocking gate/next safe task rather than an inert Execute button.

## Engine behavior
- Execute all independently eligible scoped work **within this turn**, test root causes and regressions, record factual checkpoint; stop for a genuine protected human decision or capability boundary only.
- For Windows: only after exhausting connected tools, make one safe, bounded `E:\BaumanWeb` PowerShell batch with preflight, timeout/progress and consolidated readback. Never send repetitive one-line shell requests.
- A real ChatGPT UI action can submit a new user message; an external Blueprint Hub page cannot. Copy/Open/Preview/Send/Execute/Background are not interchangeable. Do not promise persistent host buttons or unattended execution without the appropriate supported runtime.
- Do not create fictitious Codex events or animate fake progress; source-only test ≠ integration/UX PASS. Reviewers A/B, protected data, ratification, merge and Production authority remain separate.
- Use compact content-first UI, legible contrast, keyboard/touch accessibility and defer optional metadata to expandable details.

## Operational sequence
`Read live sources → select one critical path → repair/test all scoped READY work → checkpoint → report VERIFIED outcome OR one real blocker → show one contextual next action`.

If a project Owner wants this behavior in a new ChatGPT Project, apply this guidance to that Project using the supported settings. Do not claim that any GitHub PR or policy commit automatically changed ChatGPT-host UI or other Project instructions.

## NAV-SUPPORT-001 candidate 2.4 — compact profile
Pending valid adoption, the compact candidate in `docs/design/constitutional-navigation-support-standard.v1.candidate.md` refines the older layout: two navigation controls, one next action, and three separate full-width direction buttons visible by default (Thực hiện 1 bước / Hoàn thành 1 gói nhiệm vụ / Thực hiện liên tục đến cổng bắt buộc), default continuous. Each shows its stop condition and explicit selected state; selection updates the prompt without sending it. The separate explicit send remains in the optional prompt. Existing permission and source rules remain. The earlier action registry is retained for conditional compatibility, not as additional default buttons. This is proposed only, not native host installation.
