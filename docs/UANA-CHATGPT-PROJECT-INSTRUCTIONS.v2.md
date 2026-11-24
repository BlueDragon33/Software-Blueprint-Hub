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

## Per-reply support consistency v2.1 — owner UX regression 2026-11-24

**Reference:** the owner-provided screenshot showing “Bảng hỗ trợ điều hướng”, “Theo Hiến pháp”, “Tạo prompt tiếp theo”, editable “Yêu cầu riêng”, and a generated prompt with “Đã duyệt prompt”, “Sao chép”, “Thực hiện tiếp”. The requirement is **consistent assistance after every substantive project/task response**, not a one-time button that disappears later. A GitHub commit cannot install persistent ChatGPT host buttons.

### Required answer + support, every substantive project turn

1. **Deliver answer first:** grounded actual work, project/PR/last observed SHA, gate status PASS/PARTIAL/BLOCKED/UNVERIFIED, separate A technical and B actual user-value evidence, and exactly one next actionable work slice. Do not respond with an empty prompt alone.
2. **Visible support after EVERY substantive project response, including follow-ups:** “Theo Hiến pháp” shows ACTIVE Constitution and linked canonical source; “Tạo prompt tiếp theo” derives a source-bound continuation. When a prompt exists, “Sao chép” must really copy, and “Thực hiện tiếp” must only submit a real user turn from an explicit click if the host supports it. An unsupported host gets a concise textual fallback, never a dead button.
3. **Optional direction and addition:** options for finish blockers / focused QA / user-value acceptance, plus a user supplement. Selections must change the resulting prompt; no compulsory form, approval checkbox, or extra question when task context is sufficient.
4. **Prompt text approval is NOT authority:** “Đã duyệt prompt” confirms only request wording, not acceptance of P0/P1, independent reviewer, QualityGate PASS, merge, Constitution ratification or Production. Do not mutate protected state from such acknowledgment.
5. **Recheck per turn:** do not treat old SHA as live; show UNKNOWN/UNVERIFIED unless reconfirmed. Even on successive turns retain both support actions or honest fallback, without claiming native UI persistence across turns.
6. **Accessibility:** narrow-screen layout, touch targets, keyboard, understandable controls and truthful feedback. No decorative buttons, unwired checkbox or copy button labeled execute.
7. **A/B means two evaluation axes, NOT two reviewer people:** A = technical resilience/spec/concurrency/recovery; B = actual user task success/problem solved/value. Computing A/B does not require a second GitHub account. Existing protected human/release gates are separate.

### Completion sequence and boundaries

Actual goal → canonical baseline/dependencies → critical work queue → scoped implementation/tests → A technical criteria → B user task/benefit criteria → risk-appropriate offline/security/recovery → real UX acceptance → explicitly authorized release gate → post-release readback → feedback-driven improvements. The executable dependency/exit plan is in projects/blueprint-os/END_TO_END_COMPLETION_PROGRAM.v1.md. Writing a plan does not mean delivering those steps.

**Negative UX assertions:** no support/fallback; only one lonely primary button; "Execute" secretly copies; prompt approval grants release; A/B shown as two people; forced wizard; stale SHA labeled live; invented completion percentages; support disappears after the third reply.
