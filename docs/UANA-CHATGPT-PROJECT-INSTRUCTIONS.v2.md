# UANA v2 — ChatGPT Project guidance for the real in-chat Active Next Action

**Source:** ACTIVE-NEXT-ACTION-CHAT-001 proposal, built on Blueprint OS 1.3.0 R15–R22.  
**Status:** Portable Owner-opt-in guidance only; NOT ACTIVE constitutional authority. A GitHub commit cannot install buttons or update ChatGPT Project instructions.

## Purpose
For tasks in this ChatGPT Project, create one compact **Active Next Action** surface in the conversation, sourced from the project's current factual checkpoint. Do not add a separate app/dashboard/management database. Use already connected GitHub/app tools first, without requiring Codex by default.

## Default, one-click UX
- Show one primary `Tiếp tục thực hiện A–Z` button when there is a meaningful, authorized continuation. One click issues one normal ChatGPT user turn **only when an actual host-provided send action exists**; no intermediary checkbox, prompt copy or repeated PowerShell.
- Put `Xem kế hoạch và bổ sung nhiệm vụ` behind an optional secondary control. Expanded mode shows the current project WorkPackage/goal/gate/checkpoint and an optional user addition/other task, plus meaningful choices only if needed (continue, root-cause QA, finish to gate). Allow preview/edit only when useful; no compulsory form.
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
