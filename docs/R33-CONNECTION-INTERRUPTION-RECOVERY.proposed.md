# R33 — Connection Interruption & Verified Recovery (PROPOSED)

**Policy extension candidate:** `10.R33` to Universal Constitution 1.3.0 (not active or ratified).
**Owner:** `BlueDragon33/Software-Blueprint-Hub`.
**Normative inheritance:** 10.R1–R4, 10.R15–R22, Data, Security, QA and Operations.
**Goal:** preserve verified work when response streaming, a connector, runner or browser session is interrupted. This proposal **cannot fix ChatGPT platform network connectivity**. It governs what the operator may claim, persist, inspect, resume or repeat, not the platform transport.

## R33.1 — Separate transport from task outcome

The message `Connection interrupted. Waiting for the complete answer` reflects a response delivery interruption, **not evidence** that GitHub commits, CI jobs, API mutations, task execution or the entire response failed. Equally, a partial response is **not evidence of full completion**. Never infer the result of a write from a lost response. Record outcomes as `VERIFIED_DONE`, `VERIFIED_PENDING`, `BLOCKED` or `UNVERIFIED` based on independent sources; do not use self-reported PASS.

## R33.2 — Incremental truthful user updates

For work lasting beyond an immediate answer, give a short purpose/next-step plan, then communicate durable verified results as soon as possible; do not delay all useful information until a final large response. Keep partial reports self-contained and precise. An update is **not** an execution checkpoint unless backed by a durable reference. Never promise background continuation unless a separately authorized scheduled mechanism actually exists.

## R33.3 — Durable checkpoint, not another database

Use the **existing** work issue, PR, commit, immutable evidence reference or canonical workflow journal. Do not create a new general-purpose status DB, task manager or duplicate repository. At logical side-effect boundaries (before/after a write, completed work package, gate outcome, or forced halt) record only:
- project/work package identity, current objective, scope, next bounded action;
- exact repository + baseline/observed HEAD, current branch and any created commit/PR/issue;
- independently verified steps, status and source-specific run IDs/digests;
- in-flight side effect identifier or `none`, idempotency key/claim where the existing backend supports it;
- unresolved dependencies, permission boundary, remaining budget and rollback/reconciliation strategy.
No secret, private user data, guessed CI status or raw connector token may be stored. If no authorized durable store is available, report `CHECKPOINT_NOT_PERSISTED` rather than claiming saved progress.

## R33.4 — Recovery reads real state first

On `Khôi phục công việc` or a supported alias:
1. Resolve a **single** work package from this conversation or explicit issue/PR/project reference; when ambiguous, ask only for the missing target. Do not assume last visited repo is the target.
2. Read the most recent **trusted durable checkpoint**, current remote HEAD, PR/issue/CI state and ownership grants using existing authorized connectors. Limit reads to relevant refs/diff/logs; **no full-repository scan** by default.
3. Reconcile each previously attempted side effect with remote state and immutable evidence. If a GitHub write may have succeeded while transport failed, **inspect the exact target** and deduplicate before any retry.
4. Classify as `VERIFIED_DONE`, `VERIFIED_PENDING`, `BLOCKED`, `UNVERIFIED`. If history is absent, contradictory, stale or only assistant-authored, do not fabricate source status; give the narrow missing verification.
5. Resume exactly one eligible next action with existing authorization and normal QA. Preserve previous human approvals only if they are still valid for exact scopes/revisions; never infer re-approval.
6. Publish a bounded status summary: done, next, blocker, evidence URLs. Do not perform unrelated refactors.

## R33.5 — Fail-closed write ambiguity and replay safety

Any **in-flight mutating operation** with unconfirmed outcome is a recovery stop: `MUTATION_OUTCOME_UNKNOWN`. Check target state and durable idempotency claim first. Repeat only when verified not applied and safe to retry under existing authorization. Creation, PR merge, deployment, payment, data deletion, device approval, privilege changes, and Production changes remain subject to independent authority and audit. Recovery never overrides Quality Gates, reviewer approvals, Protection Rules or Release authority. For non-idempotent actions without a verifiable durable outcome, refuse automatic retry.

## R33.6 — Revision safety and no duplicate work

Exact HEAD, PR commit and signed source digests are required when reviewing prior evidence. If the branch advanced or a key capability changed, mark `STALE_CHECKPOINT`; recompute the *affected* scoped delta and run relevant regression tests. Never replay the previous patch blindly, recreate an already-existing PR, overwrite a third party's changes or rerun expensive verification solely because the chat disconnected.

## R33.7 — Bounded continuity and token budget

Use one active critical path and one next action, existing CI and evidence artifacts, bounded reads and appropriate retry budgets. Stop when no new evidence or capability is available. Prefer existing R16/R17/R19/R20 checkpoints to any novel state store. Avoid full chat transcription, massive copied logs and accumulating `resume.md` documents. Checkpoint captures sufficient references to resume, not a new narrative report.

## R33.8 — Invocation semantics

| User phrase | Exact intent | Required operation |
|---|---|---|
| `Khôi phục công việc` | `RESUME_VERIFIED_WORK` | Identify the current exact work item → inspect checkpoint and live refs → reconcile ambiguous writes → resume one eligible next action |
| `Tiếp tục từ checkpoint` | `RESUME_VERIFIED_WORK` | Equivalent to recovery; never blindly retry an unconfirmed write |
| `Lưu checkpoint` | `PERSIST_CHECKPOINT` | Persist concise verified evidence to **an existing authorized work item**, or state clearly why not saved |
| `Báo checkpoint` | `REPORT_CHECKPOINT` | Read current evidence and report state; **no mutations**, no new CI/job/deployment |

The plain command `Tiếp tục` may follow this recovery discipline when an unambiguous active work package is present, but must **not** silently create durable state or grant new authority. In a new chat, a link such as `Khôi phục công việc từ PR #134 trong Software-Blueprint-Hub` disambiguates the task.

## R33.9 — Acceptance and activation

Negative tests must reject: fake checkpoint status, missing revision, stale HEAD, absent authority, ambiguous target, unknown in-flight write, duplicate replay and claimed durable storage without a reference. Positive tests must show a read-only recovery plan with verified evidence and one next action. Integration tests must observe real effects before declaring a live recovery capability.

**This file is a proposal only.** Neither this draft nor passing candidate CI modifies active Constitution `1.3.0`, overwrites the existing R15, self-ratifies a future policy revision, publishes runtime changes or grants Production authority. Review, ratification, publication and adoption remain separate established gates. No Vercel dependency is introduced.
