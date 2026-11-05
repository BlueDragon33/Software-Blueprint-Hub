# Proposed Amendment — Project-Aware Autonomous Execution

Status: **DRAFT / NOT RATIFIED / NOT ACTIVE**
Date: 2026-11-04
Base policy: Blueprint OS 1.3.0
Target version: **TBD by impact review** (do not silently label as published 1.4.0)
Authority: proposal only; no reviewer, issuer, constitutional ratification, merge, deployment or production authority.

## Problem
Users must repeatedly reconstruct project state and paste lengthy prompts to advance a project. Global task menus contaminate unrelated project conversations. A conversational assistant should proactively propose the next evidence-grounded step for the *current* project without inventing runtime access or authority.

## Proposed normative requirements
**PAE-01 — Project-scoped context.** At the start of a user turn within an identified project, resolve the current project identity and canonical repository/workspace scope. Never mix another project's active tasks into this project's next-action surface. If project identity is ambiguous, ask once rather than guess.

**PAE-02 — Evidence-grounded readback.** Before choosing an execution step, reconcile accessible project instructions, durable checkpoint, authorized repository HEAD/PR, open blockers, tests, release status and user intent. Distinguish verified current facts from stale context and unavailable evidence. Do not require a full repository scan when a trustworthy incremental checkpoint suffices.

**PAE-03 — Single Active Next Action.** Present one highest-priority, actionable project-local next step with expected outcome, current gate and exactly one safe fallback when blocked. Where host UI supports it, activation opens the complete editable follow-up draft; only the user's explicit Send submits the actual edited text. No mandatory manual copying or execution on draft opening/cancellation. Never claim an action control exists globally in the ChatGPT Project interface if it does not.

**PAE-04 — Bounded autonomous execution.** Following user direction, execute authorized steps continuously: inspect → plan → change → test → diagnose → repair → retest → record evidence. Minimize needless user prompts, CMD, manual copying and redundant tool calls. Stop at completion, a true authorization/human gate, an environmental/tool limit or a material ambiguity. No autonomous activity outside an active session unless separately scheduled/authorized.

**PAE-05 — Authority and release separation.** Project-local convenience grants no implicit access. Preserve authenticated owner grants, reviewer independence, signed evidence, issuer restrictions, quality gates and exact-revision production approval. No fake PASS, silent merge, publish or deployment. Never equate the user asking to 'finish' with bypassing a mandatory gate.

**PAE-06 — Durable continuation.** Persist a minimal non-secret checkpoint in the project's approved source of truth: project ID, scope, exact HEAD, completed steps, test evidence, unresolved blockers, next action, fallback and timestamp. Chat history and generated prompts are projections, not canonical authority. Avoid recording private credentials or unrelated project information.

**PAE-07 — Graceful degradation.** If GitHub, browser, cloud QA or other required integration is unavailable, state what was not checked, preserve the last verified candidate, and provide a single next action for unblocking. Do not claim that opening a Project alone triggers execution or changes the ChatGPT product UI.

**PAE-08 — Usability and cost.** Favor concise status, minimal tokens/tool calls and ZERO-SPEND where requested, without compromising security or evidence. Do not invoke paid CI, hosted workflows or third-party spend without applicable authorization.


**PAE-09 — Rendered action contract (mandatory).** Active Next Action is an executable interaction contract, not merely a sentence or a shortened paragraph. Separate `visible_label` (brief, human-readable action), `supporting_summary` (optional concise context), `execution_payload` (project-scoped instructions), `action_type`, `target_project`, `evidence_ref`, `gate_state` and `fallback`. Show the full payload in expandable detail and the editable draft/composer, never as a giant heading, inert badge or fake button. Use the host's genuine draft-and-send affordance when available; if unavailable, clearly disclose the limitation and provide an honest supported alternative. This law does not purport to modify ChatGPT's native UI.

**PAE-10 — Interaction acceptance gate.** A rendered action is PASS only when verified on supported clients, including mobile, for: (a) readable hierarchy, sensible wrapping and no giant-text overflow; (b) one primary action with an accessible name and touch target; (c) activation opens the complete editable draft without dispatch, and final Send dispatches the user's actual edited current-project request exactly once; (d) no other project's task or state leaks; (e) disabled/blocked states are truthful and never pretend execution; (f) delivery, execution and completion feedback remain distinct, with recovery available. Screenshots alone are insufficient to prove click behavior; code checks alone are insufficient to prove visual UX.

**PAE-11 — Failure classification and regression.** Classify separately: `PRESENTATION_FAIL`, `INTERACTION_FAIL`, `PROJECT_SCOPE_FAIL`, `EXECUTION_FAIL`, `AUTHORITY_BLOCKED`, `HOST_UNSUPPORTED`. A failure in any mandatory criterion blocks `ACTION_UX_PASS`; a repeated failure requires a root-cause record and regression case. Never close a defect by merely shortening labels or moving the full prompt into another visible text block.

**PAE-12 — Host capability boundary.** ChatGPT Project membership and opening a chat do not grant control over host UI layout or automatic on-open execution. Product-owned UI cannot be promised or enforced by repository policy alone. The implementation must distinguish assistant-controlled response rendering, project-repository code, and host-controlled UI; report unsupported host features without fake compliance.

**PAE-13 — Editable full prompt.** Preserve one compact contextual action and expandable execution detail in the conversation. Use `OPEN_EDITABLE_DRAFT` in the shared candidate interaction contract. Opening or cancelling the draft must not submit a message, invoke tools or change project state. The user may inspect and edit the whole prompt before explicit Send; submission must use that edited text once and revalidate the trusted project, repository, revision, accepted goal, actor permissions and supported host capabilities. Edits cannot confer roles, issuer authority or privileged approval. A submitted request is not proof that execution or release has occurred.

**PAE-14 — Scoped A-to-Z execution.** Offer `NEXT_STEP` or `SCOPED_A_TO_Z` within the same prepared request. Use A-to-Z only after the user selects it or an existing explicit authorization already covers the current project and accepted goal. Continue all independent READY tasks through inspect, implement, test, diagnose, repair, retest and evidence/checkpoint readback; a blocked branch does not suspend other safe work. Reuse valid PASS evidence, preserve R7 finite-repair bounds, ZERO-SPEND and existing approval gates, and ask no repeated routine technical confirmations. Stop with the existing truthful receipt at completion or a real authority/capability boundary; do not promise unattended background execution. All current/future governed apps inherit these semantics through the established reviewed adoption process, with no duplicated prompt/governance engine in app repositories.

The single shared interaction/mode contract and A-to-Z template are maintained in **companion Draft PR #155**: [pinned candidate contract](https://github.com/BlueDragon33/Software-Blueprint-Hub/blob/fd4e1b55ed7557e74dc888c31dbf918b6341d97c/control/chatgpt-next-action-hands-off.candidate.v1.json), R34.C.9. This is **not an active main-branch dependency** or an adoption claim. Reconcile the two proposals into one exact reviewed normative/contract/template set before ratification; do not create another source of constitutional authority.

## Scope and impact review (pending)
- Pillars: UX, Governance, Security, QA, Operations, Prompt Architecture.
- Applicability: all governed projects with an AI conversational workflow; implementation depth depends on Blueprint Level, integration availability and risk.
- Security: project isolation, least privilege, prompt injection resistance, exact SHA binding, no secret propagation.
- Compatibility: additive process contract; no automatic UI or external agent capability implied.
- Migration: each project identifies its canonical checkpoint location and a project-local next-action template; missing integrations remain explicitly BLOCKED.
- Test plan: isolation between two projects; stale HEAD correction; real one-click dispatch; mobile rendered typography/wrapping; inert/copy-only action rejection; accessible touch target; blocked/unsupported host states; unavailable connector fallback; reviewer/production gate refusal; resume after checkpoint; ZERO-SPEND guard.
- Acceptance evidence: exact repository revisions, trace of next-action selection, real interaction evidence on supported mobile/desktop hosts, authorized tool execution logs, visual review, regression results and independent review as applicable.

## Required constitutional lifecycle
DRAFT → IMPACT REVIEWED → MIGRATION READY → RATIFICATION READY → HUMAN RATIFIED → PUBLISHED → PROPAGATING → VERIFIED.

**No mutation to active Universal Constitution 1.3.0, no version publication and no claim of adoption.** Human Constitutional Owner ratification must bind an exact reviewed amendment revision; separate publication and propagation remain required.
