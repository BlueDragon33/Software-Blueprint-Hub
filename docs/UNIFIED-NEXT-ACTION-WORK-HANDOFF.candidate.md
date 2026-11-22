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


## Directional Chat ↔ Work receipt surfaces (candidate correction, not a live UI)

**The arrows describe where a handoff packet originates and where it is received, not where a launch button navigates.** Do not render both directional handoff controls on the Chat surface.

| Receiving surface | Only incoming handoff | Minimum behavior | Explicitly NOT on that surface |
| --- | --- | --- | --- |
| **Chat** | **WORK → CHAT** | Accept a Work result/checkpoint for verification against canonical project HEAD, scope, evidence and Quality Gates; return one truthful Next Action, never import claimed PASS or approval automatically | Incoming **CHAT → WORK** direction |
| **Work** | **CHAT → WORK** | Accept a bounded user-approved Chat work package in Work mode, after explicit user initiation and same-project/authority checks; do not execute from the packet alone | Incoming **WORK → CHAT** direction |

A host-level **Mở Work của dự án** affordance, if the host ever supports an authenticated same-project Work session, is **mode navigation** and is **not** an additional `CHAT → WORK` handoff control on Chat. No such host integration is present in this PR. A generic chat URL, user-pasted prompt or visual direction label is not an authenticated transfer or permission to start Work. The single primary Next Action remains a project-scoped canonical navigation action until a separately verified executor is authorized; never auto-open Work/Codex.

**Minimum packet references:** canonical project ID; owning repository and exact observed SHA; effective Constitution version; existing WorkPackage/issue ref; approved goal and permitted scope; evidence/gate state; blockers; one next eligible action. These are references for reconciliation, not a replacement Project Profile, independent execution journal, or credentials. Never transfer secrets/private recordings or silently grant review/issuer/Production powers. A `WORK → CHAT` outcome is **UNVERIFIED** until Chat independently reads the real source or durable receipt. `CHAT → WORK` intake cannot implicitly dispatch jobs.

**Related independent candidates:** PR #141 holds proposed R33 interruption recovery (checkpoint/HEAD and ambiguous-write deduplication), PR #147 holds product-goal continuity, and PR #151 holds an alternative read-only navigation UI. This PR #152 does **not** import their code, claim they are merged, create a second law, or make R33 active. Reconcile overlapping interfaces in governance review; reuse the existing R15–R32 and per-owner state until any valid future ratification. Rollout to Bauman and Russian Expert Engine is **NOT_ADOPTED / NOT_TESTED** for this directional contract, even though both declare the active 1.3.0 Constitution.

## Actual implementation status

**Present**:
- Hub `packages/application/src/unified-next-action.ts` exposes one project-scoped canonical next-step navigation derived from the existing `ProjectReadinessSnapshot.nextAction`.
- Hub project Overview has exactly one **POST-backed** CTA. The Server Action re-resolves the session, rechecks `PROJECT_READ`, fetches live `ProjectProfile.recordVersion` and `ProjectReadinessSnapshot.nextAction`, rejects stale/cross-project actions, and only then navigates to Quality, Roadmap or Release Orchestration. It **does not execute** a WorkPackage or continuously repair code; do not report this as an autonomous executor.
- A request that needs Work has a fail-closed state `requires-verified-session`, **without a secondary URL** until a trusted host gives a verified Work session link. The ChatGPT conversation can still offer a context-preserving **Tiếp tục nhiệm vụ** message button separately.

- The machine-readable **candidate** policy is centralized in `control/unified-next-action.candidate.v1.json` (no application may claim adoption from its existence).

- **P2 internal proof-of-boundary adapter** `packages/runtime/src/next-action-inspection-adapter.ts` is now available **only to trusted internal callers**, not connected to a public Server Action or scheduler. It repeats `PROJECT_MUTATE` and canonical ProjectProfile/Next Action/WorkPackage/Quality Gate checks before each inspect-scoped runner or independent QA step; requires an explicit trusted, rechecked **WorkPackage ↔ workflow-digest ↔ exact app HEAD** binding; constructs workflow issuer/adoption authority and execution/QA journals from the existing PostgreSQL runtime; reuses `executeAndVerifyScopedInspection`, which validates the signed grant, durable claim/attempt readback, exact pinned bytes and independent QA readback. Neither a shared project ID nor a manifest marked approved is adoption.
- **Canonical PostgreSQL binding provider is implemented as a Draft, not activated in production:** `packages/persistence/src/next-action-work-binding-repository.ts` uses the existing System Owner and adopted-workflow authority, a new append-only decision table, `recordVersion` and exact app SHA. The internal adapter instantiates this source from the same runtime PostgreSQL connection and rechecks it before privileged inspection/QA operations. The new migration and binding tests passed on disposable PostgreSQL; no binding record has been written into a real managed project.
- **What remains blocked:** no real Owner-authorized link decision, signed issuer grant, authenticated locally hosted runner or live E2E receipt/QA acceptance has been supplied. The internal adapter still has no public endpoint, and **cannot run autonomously from the Next Action button**. Human/release gates remain protected by existing verifiers.

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

## Phased adoption plan (proposal only; no app marked adopted)

| Sequence | Consumer and contract target | Gate and deliverable | Recorded state |
| --- | --- | --- | --- |
| 0 | **Software-Blueprint-Hub** — central authority and pilot | PR #152 single POST-backed CTA; source-pinned CI, review and permission/UX smoke | Draft, no release |
| 1 | **Application-Management** — local launcher/portfolio | Read contract version from Hub, map project identity to an existing truthful offline entry; group restart + SHA readback + runtime QA under one display goal only after per-step evidence; no new port/online dependency | Not adopted |
| 2 | **Bauman Hub, RU_LIFE, Russian Expert Engine, iOS WidgetKit** | Display a domain-specific Next Action sourced from verified project readiness; keep RU03 and content/teacher validation as explicit human gates; no duplicate Constitution copy | Not adopted |
| 3 | **PC Manager Desktop and other apps** | Use canonical action/same project binding, respect Windows and offline-first runtime gates, cover expected device/role states | Not adopted |
| 4 | **Remainder of registered app catalog** | Incremental registered-repository adoption, per-project scope/HEAD checks, regression proof, human review; never mass-mark compliant | Not adopted |

Each rollout is stopped if a project lacks actual metadata, local launcher binding, PROJECT_READ/PROJECT_MUTATE authority for its operation, signed execution adoption, pinned source SHA, independent QA or an authorized Work host session. A mere GitHub registry entry is not a live ProjectProfile.

## Minimum safe executor boundary (not installed)

The central candidate JSON names the **minimum** inputs a later execution adapter must prove: separately authenticated scoped PROJECT_MUTATE, exact repo/app HEAD, signed and time-bounded grant, adopted central workflow digest, trusted issuer and source, single-use durable journal, authorized offline runner, and independent outcome readback. These requirements are already represented by the existing prompt-workflow execution authority/journal layers; **do not create a second parallel authority system**. Every dependency must be checked before its own step, with fresh permission and source checks after a pause or restart. Human review, issuer grants, merge, production release and Quality Gate PASS remain gated.

The work of connecting that existing executor to this one-button user experience **has not been completed**; this policy alone does not grant execution rights. Work-mode project deep linking also remains unsupported, and there is no secondary button.
