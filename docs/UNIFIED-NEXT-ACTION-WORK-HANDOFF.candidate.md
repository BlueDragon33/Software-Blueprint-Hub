# Blueprint OS — Unified Next Action and Work Handoff (CANDIDATE)

Status: **DRAFT / NOT RATIFIED**. Applies as a proposed common presentation/orchestration standard for apps governed by the currently active Constitution **1.3.0**; this file **does not amend the Constitution**, authorize cross-project work or change release gates. Approval requires normal Blueprint governance.

## User intent and single-action rule

1. On a project surface show one **Công việc tiếp theo → Tiếp tục nhiệm vụ** CTA. Resolve it from that project's authenticated canonical Readiness/Work/Quality state, not a global hardcoded task. The action can represent a **chain of dependent safe engineering substeps**, so restart + SHA readback + runtime checks + QA may appear as **one user goal** in App-Manager; the orchestrator still records independent evidence and re-verifies every gate.
2. Do not render one button per technical step. Respect ordering, dependencies, exact repository/commit SHA, idempotency, compensation/rollback, no duplicate PASS, and token economy (do not rediscover already PASS evidence).
3. Missing technical preconditions: self-remediate only within authorized operations. A missing external permission or human acceptance means **BLOCKED / request explicit confirmation**, not a fabricated readiness flag.
4. A second button **Mở Work của dự án** appears **only when** Work is actually necessary AND a supported host integration has returned a verified Work-mode session bound to **the same ChatGPT project**. A generic chat URL, project home URL, arbitrary user-supplied href or merely setting `requiresWork: true` does **not** prove a Work session.
5. If the environment cannot open Work directly, **do not render a fake Work launch button**. Provide a truthful manual handoff explanation or copyable work package; do not claim automatic navigation, and do not create a new Work session by guessing an address.
6. Chat/Work buttons never themselves become Project Authority, owner approval, issuer adoption, service dispatch, CI PASS, merged state or Production release authority. Runtime executor must reauthorize at action time, require ready conditions and store pinned before/after evidence.
7. The shared policy is owned by Software-Blueprint-Hub. Managed apps consume a **versioned contract**; they must not fork the Constitution, invent their own authorization, or create separate control planes. Application-Management may surface actions and verified app/runtime status, not mutate Blueprint governance on behalf of another app.

## Actual implementation status

**Present**:
- Hub `packages/application/src/unified-next-action.ts` exposes one project-scoped canonical next-step navigation derived from the existing `ProjectReadinessSnapshot.nextAction`.
- Hub project Overview shows exactly one actionable CTA. Depending on the canonical action, it navigates to Quality, Roadmap or Release Orchestration within **the same project**. It **does not execute** a WorkPackage or continuously repair code; do not report this as an autonomous executor.
- A request that needs Work has a fail-closed state `requires-verified-session`, **without a secondary URL** until a trusted host gives a verified Work session link. The ChatGPT conversation can still offer a context-preserving **Tiếp tục nhiệm vụ** message button separately.

**Not implemented / pending**:
- A verified host-to-Work deep link and same-project Work-mode session identity. Current ChatGPT controls do not support a direct Work-mode switch.
- Trusted action dispatch, per-project safely resumable multistep orchestration, automatic technical blocker remediation and full adopter propagation. Each requires a versioned backend contract, real authority/readiness at POST, tests and normal review.
- Rollout to independently managed application repositories. This Draft is a central pilot and contract candidate only; **no project adoption or Constitution amendment is claimed**.

## Acceptance gates for follow-on work

A. Single-button UX regression confirms exactly one primary CTA and no ad hoc duplicate technical buttons in the next-action section.

B. Action selection is project-bound and uses canonical readiness. A Viewer can navigate only pages allowed by `PROJECT_READ`, and protected mutations still require `PROJECT_MUTATE` at the server.

C. Work is shown only with **proof of verified mode + project binding + allowed destination** returned by a supported host integration. Wrong-project, unsigned, expired or generic chat destinations must fail closed.

D. If continuous execution is later enabled, it must not infer permission from UI; it must stop at a gate, report the exact blocker, and never merge, dispatch, approve or publish without specific authority.

E. Adopt across managed apps only after constitutional/governance review; collect adoption receipts/evidence per project instead of blind mass sync.
