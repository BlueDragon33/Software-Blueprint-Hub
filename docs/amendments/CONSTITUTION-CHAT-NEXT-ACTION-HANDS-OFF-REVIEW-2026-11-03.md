# Constitutional amendment candidate — ChatGPT NEXT ACTION: hands-off continuation

**Status:** PROPOSED / REVIEW_ONLY / NOT_RATIFIED / NOT_PUBLISHED / NOT_ADOPTED  
**Constitutional owner:** Software-Blueprint-Hub  
**Active authority:** Universal Constitution 1.3.0 (R7, R15–R22, R9 and constitutional amendment protocol)  
**Proposed integration:** R34 Chat/Agent surface addendum for candidate 1.4.0; no change to published 1.3.0 without separate ratification.  
**Scope:** Every existing, active and future governed project, in both COMPACT (B0–B2) and STRUCTURED (B3–B5) profiles; applies to the ChatGPT conversation/agent surface, **not** to an in-app `NEXT ACTION` button.  
**Owner decision driving this proposal (2026-11-03):** On user invocation, complete all independently eligible authorized work without incremental user prompts; ask the human only at a genuine mandatory authority or capability boundary.

## 1. Problem and precise UX target

A project assistant may create a `NEXT ACTION` button that merely starts a new generic chat turn, reopens a page, restates an existing goal or requests another routine approval; none performs the user's intended work. In parallel, Hub PR #153 proposes a **web-app** action runner. That implementation is a separate surface and does not supply a persistent native ChatGPT button, nor does it implement ChatGPT's host runtime.

The desired ChatGPT NEXT ACTION is **one user-initiated, context-bound continuation**. Activation opens the full editable prompt; execution starts after the user sends it. The agent then autonomously executes the maximum feasible series of approved, authorized tasks within the **current** session and connected capabilities, verifies each material result, recovers safely and finishes only upon verifiable completion or a real stop condition. No mandatory manual copy/paste, repetitive "continue" turn, fictitious Work launch or invented background work.

## 2. Proposed normative surface contract — R34.C

### R34.C.1 — Universal applicability, one canonical source

The same semantic contract applies to all currently governed projects and all future projects after constitutional ratification and evidenced per-project adoption. The Hub owns the versioned rule and machine-readable schema. Existing ProjectProfile, WorkPackage, Quality Gate, governance and Application-Management authorities remain the sources of truth. No per-project shadow constitution, duplicate registry or extra dashboard is permitted.

### R34.C.2 — Honest ChatGPT CTA and host boundaries

Where the conversation host supports inline user actions, show one short, project-specific **NEXT ACTION** control. It opens the full editable scoped request in a supported draft/composer; only the user's explicit Send submits the current edited text and starts the interactive turn. Opening or cancelling the draft must not submit a message, invoke a tool or mutate project state. It **does not itself** create a privileged worker, continuous background agent, automatic repeated chat turns, persistent global ChatGPT toolbar control or Work session. If the host lacks this action, provide an ordinary user-invocable equivalent, not a fake enabled button. This rule does not require a new web-app UI.

The control's label, accessible explanation and outcome must distinguish (a) a supported ChatGPT turn, (b) a host-verified Work/cloud-browser continuation, and (c) a separately authorized scoped execution service. Never claim (b) or (c) from (a) alone. A user click conveys intent to continue **within pre-existing permissions**, not a new grant.

### R34.C.3 — Reconcile once, continue automatically

On explicit Send, after draft submission:
1. Resolve the accepted goal, applicable policy version, canonical projectId, authorized actor/tool capability, repository/branch and real exact HEAD (or UNVERIFIED), active WorkPackage, dependencies, previous substantive PASS evidence and blockers.
2. Build the minimal dependency-aware queue using existing `READY / ACTIVE / BLOCKED / VERIFIED / DONE` semantics. Select work in scope, rather than rediscovering the entire repository or creating redundant plans.
3. For each eligible action: check actor, scope, source revision/record versions and granted operation at **execution time**; execute permitted work; obtain the strongest available independent readback; update only a canonical state the actor may legitimately write.
4. Continue to the next eligible task in the same interactive execution while capacity and permission remain. A blocked task does **not** block safe independent tasks. Do not stop after one status read, plan, patch, test, source check or tool call when further meaningful authorized work is available.
5. When there is a recoverable error, attempt bounded, evidence-directed recovery under active R7/R17; no blind repeated fixes, spend or speculative refactors. Prefer minimal repair and recheck over requesting user labor.

### R34.C.4 — Mandatory human-intervention gate, not routine approval

Request a **human decision** only after all independently eligible safe actions have been exhausted and one of these genuinely nondelegable decisions remains:
- authenticated constitutional ratification, independent mandatory human review/UX acceptance, or explicit Production/protected/destructive authorization;
- identity, legitimate access, issuer signature or external consent the agent cannot lawfully confer, where human action is genuinely required to obtain it;
- material goal/product conflict without a safe existing decision, or a choice entailing new cost, paid tools or public disclosure.

A host/session/tool/quota/network failure is instead a **capability boundary**, not a human approval gate: attempt any permitted recovery, continue other independently eligible work and, if still blocked, report `PARTIAL_CAPABILITY_LIMIT` with a precise fallback. Ask the user to act only if that action is indispensable to restore access/consent and name the exact decision or task; do not demand constitutional ratification for an ordinary technical outage.

No implied permission to approve, merge, deploy, publish, grant, change repository visibility, enable branch rules, spend money, release, write sensitive stores, or ratify a constitution. A standing "finish everything" instruction is **not** any such approval. A human decision must identify exact action, object, scope and evidence; an AI reviewer remains advisory unless an independent authorized human actually approves.

### R34.C.5 — Finite execution, truthful closing receipt

Finish with one of:
- `VERIFIED_COMPLETE`: all accepted scope completed with exact revision and applicable independently verified acceptance evidence (not just code/CI);
- `PARTIAL_BLOCKED`: real human/authority/external gate with no eligible independent work remaining;
- `PARTIAL_CAPABILITY_LIMIT`: session, tool, network, runtime or budget boundary genuinely prevented further work.

**Compatibility with R34:** Missing QA or real-world acceptance evidence is a `PARTIAL_BLOCKED` receipt with explicit `QA_EVIDENCE_MISSING` blocker reason, **not** a fourth terminal outcome. These three terminal states follow the existing R34 review candidate; no evidence-free declaration of completion is allowed.

The receipt must contain projectId, effective Constitution, exact HEAD/UNVERIFIED, completed and pending WorkPackages, actions actually performed, directly observed QA and source readback, unchanged protections, blocked dependencies, attempted recovery, **one** concrete non-circular Next Action and a fallback. The existing R34 `nextActionProof` payload uses **actual typed field names** `kind`, `actionId`, `targetTaskId`, `projectId`, `sourceRevision` (or UNVERIFIED), `ownerType`, `selectionReason`, `expectedEvidence`; partial outcomes additionally bind `blockedBy` to `stopReason`, mandatory human decisions require a valid `requiresHuman`, and a repeated action is evaluated using `previousActionId` and `newEvidenceIds`. The labels `blockedByIfPartial` and `previousActionIdAndNewEvidenceIfRepeated` are **semantic proof obligations** in the central candidate contract, not literal fields accepted by `r34-next-action-gate.candidate.mjs`. Repeating the same unresolved action without independently new relevant evidence or a changed gate must be rejected. Do not say "working in background", "already deployed" or "ready for use" absent direct support.

### R34.C.6 — Restart and multi-session continuity

Chat state is not canonical. If a session ends, carry the minimal accepted-goal/checkpoint/HEAD/remaining-queue/evidence/grant-boundary packet into the next authorized turn or a user-initiated Work handoff. Never auto-relaunch a hidden chat turn or imply guaranteed asynchronous continuation. Resume from current canonical readback and invalidate stale or revoked grants; no duplicate PRs, commits or repeated approval requests.

### R34.C.7 — Surface separation

The proposed ChatGPT `NEXT ACTION` control and existing **in-app** controls can share *policy semantics* but must not be equated. A source change to Hub PR #153 or an application deployment cannot install a native ChatGPT UI affordance. Host integration and any Work/browser automation require separately verified capabilities, interactive UX evidence and permission checks.

### R34.C.8 — Two technical reviewers finish before Owner assessment

**Owner's required sequence:** Reviewer A completes implementation, self-review, fixes and relevant verified testing; Reviewer B, genuinely distinct from the implementer, independently re-reads the **same exact HEAD** and reviews functionality, security, regressions and R34/Constitution compatibility. Reviewer B sends specific findings back to A for minimal repair. **Every source change invalidates prior same-HEAD review evidence**, so B must re-check the final updated HEAD. Do not forward half-complete work, a checklist of unresolved defects or an AI-only declaration of `PASS` to the Owner for ratification.

**The Owner is the final assessor, not an outsourced debugging step.** Only after A's technical work is complete, B's independent review is genuinely evidenced, all blocking findings are closed and all required QA/host acceptance is documented may the canonical workflow mark the packet `OWNER_REVIEW_READY`. Then present one consolidated package: exact revision and target, scope/changed files, reviewer A and B identities and separately produced evidence, test matrix, negative tests, remaining nonblocking risks, compatibility/version decision, rollback implications and the exact human decision requested. A human may accept, reject or return it for changes; no AI substitutes for authenticated human constitutional ratification.

**No fake second reviewer:** A second AI message, model label, self-generated signature or an advisory QA Worker fixture is not independent authority. Reviewer B must be separately authenticated/authorized where the governing policy requires it, with independently source-bound readback and an attributable review. The existing QA Worker is `NOT_DEPLOYED` and `NOT_CONSTITUTIONALLY_ATTESTED`; naming QA Worker or Claude as B does not prove a completed independent review or confer GitHub approval rights. If B or mandatory acceptance evidence is unavailable, keep `REVIEW_BLOCKED / OWNER_REVIEW_NOT_READY`, continue any independent safe tasks, record the missing gate and **do not request premature Owner ratification**.

**Separation of authority:** Reviewers A and B may produce technical findings, execute pre-authorized scoped corrections and provide evidence, but they cannot self-ratify constitutional law, confer GitHub approval from advisory outputs, publish, merge or deploy by implication. Human ratification remains governed by the published Constitution Authority & Amendment Protocol. This is a candidate policy addition for 1.4.0, not an active 1.3.0 modification or an already running orchestration service.

### R34.C.9 — Editable full prompt and scoped A-to-Z execution

**Owner UX direction (2026-11-05):** retain the compact contextual action and expandable execution detail shown in the conversation; let the user inspect and edit the whole prompt before sending. Keep one primary recommendation for the current project. The full prompt belongs in the draft/composer or expanded detail, not a giant heading. Opening an editable draft must not submit it. Cancelling has no external side effect; Send must dispatch the actual edited text once, with honest delivery feedback and duplicate-submission protection.

Offer `NEXT_STEP` and `SCOPED_A_TO_Z` within that same prepared request. Use A-to-Z when the user selects it or an existing explicit authorization for the accepted project/goal already requests it. Otherwise use the next-step scope. A-to-Z means continuing all independently eligible READY work through the accepted goal: inspect, plan, implement, test, diagnose, repair, retest, read back and checkpoint. It creates no new project scope, authority, paid capacity or unattended background task. Preserve the active R7 finite-repair cap and all independent review, exact-revision ratification, merge, publication and Production gates.

At Send/execution time, resolve the trusted project, repository, current revision, accepted goal, actor permissions and host capability again. User edits are instructions, never authenticated role/issuer/approval records. Changed or unavailable context must be reconciled before privileged work; another project's task or an old SHA cannot silently replace the selected target. A blocked branch does not stop independent safe work, and ordinary technical decisions already delegated do not need another confirmation. Report meaningful milestones and one final truthful receipt; submitting a request does not prove its work has executed.

The shared candidate interaction fields, mode rules and **single A-to-Z prompt template** live in `control/chatgpt-next-action-hands-off.candidate.v1.json`. Project adapters specialize the current goal/checkpoint/permissions rather than copying governance into app repositories. Applicability is universal after the established ratification and per-project evidence-backed adoption process; current adoption remains unverified. The screenshot is Owner UX preference evidence only: native host adapter/edited dispatch, desktop/mobile behavior and execution acceptance remain `NOT_RUN` until tested on the actual supported host.

### R34.C.10 — Review, edit and explicitly approve task dispatch (candidate)

For the **current ChatGPT Project/conversation only**, provide one actual `XEM NHIỆM VỤ TIẾP THEO` action when the host supports interaction. Clicking it must **only open a task preview** of the current accepted goal, project/repository, exact HEAD or UNVERIFIED, scope, ordered next steps, acceptance evidence, blockers and protected gates, along with the **complete editable prompt**. The preview must not submit, call repository tools, approve credentials, or mutate canonical state. The user may edit the full content, choose `NEXT_STEP` or `SCOPED_A_TO_Z` within existing authorization, or cancel without side effects.

Only a second explicit **`DUYỆT & GỬI THỰC HIỆN`** action submits the **actual edited request once** into a new user-initiated interactive turn (or a separately verified host executor where legitimately available). This is **approval of the task-dispatch instruction only**, never constitutional ratification, independent review, merge, Production deployment, data deletion, paid spend or issuer authority. On receipt, the executor must revalidate trusted project identity, actor grants, repository/HEAD, chosen task scope and protected boundaries before real operations; stale or unauthorized requests fail closed. Submission, execution, testing, completion and publication require separate truthful receipts. The assistant must continue eligible work during the live turn without repeatedly demanding routine approval.

A button displayed by the assistant in one message is **not** a persistent ChatGPT Project toolbar or an installed app control. An unavailable host adapter must expose a truthful non-button fallback, not invent UI capabilities or background work. Acceptance requires real desktop/mobile visual and actual click→edit→approve→single-dispatch traces, cancellation/duplicate protection and cross-project denial. No candidate/source-only test is native-host acceptance. These same semantics must be reconciled with companion PR #156 before any publication or all-project propagation.

## 3. Acceptance matrix (negative tests included)

1. **Continue beyond one step:** given three independent authorized tasks, performs all accessible tasks and records distinct readbacks in one interactive execution, not three prompts.
2. **Blocked branch:** when one task requires human review, performs remaining independent safe work first; requests only the precise mandatory human decision.
3. **No real runner:** source-only access never claims to run a desktop shell, hosted test, Work session or Production.
4. **No circular CTA:** rejects a repeated "NEXT ACTION: continue project" lacking changed task, evidence or legitimate blocker.
5. **Stale/permission drift:** deny stale ProjectProfile, revoked actor, wrong repo/HEAD, changed WorkPackage, forged issuer or untrusted pasted output.
6. **Recovery budget:** bounded distinct-evidence repairs, retries cannot silently consume unlimited time/tokens or change scope.
7. **Human separation:** advisory AI results cannot fill required independent human review, constitutional ratification or Production release.
8. **Real host acceptance:** test that the *actual ChatGPT surface* supports the user interaction and the newly initiated conversation receives the scoped continuation. A Markdown/mock/candidate web-app button is not evidence.
9. **Portfolio propagation:** each of the 18 currently tracked apps plus future enrolled projects proves its own adapter/process adoption; do not mark them adopted by manifest defaults. Non-app infrastructure applies the applicable same governance rules without fabricated app tiles.
10. **Replay/checkpoint:** when the session ends, the next permitted turn resumes from source readback without losing the approved target or redoing previous verified work.
11. **Editable draft:** opening sends no message and runs no work; the complete prompt is editable, cancellation changes no external state, and final Send uses the actual edited text exactly once.
12. **Revalidation:** edits cannot turn an old SHA, another project's ID, pasted command or claimed role into trusted authority; revalidate scope and capabilities before execution.
13. **Scoped A-to-Z:** explicit selection/standing authorization continues independent READY work until the accepted goal or a genuine boundary, with R7 bounds, ZERO-SPEND and no redundant routine confirmations.
14. **Truthful host state:** distinguish draft, submitted request, verified operation and completed acceptance; unsupported dispatch stays disclosed without fake success. Static candidate tests do not prove native host UX.

## 4. Impact, compatibility and migration

- **Architecture:** semantic contract only; reuses Hub canonical work and existing 1.3.0 R19/R21/R22. No independent ChatGPT host API, backend, app route, command runner or shadow DB.
- **Security:** no expansion of standing authority; privilege rechecked per step, data redaction, no secret capture, idempotent mutations and independent attestation remain mandatory.
- **UX:** ChatGPT-specific contextual CTA with an editable full draft and explicit Send; scoped A-to-Z is selected or inherited from existing authorization. Does not change existing app CTA. Single useful final Next Action and fallback, no unnecessary user requests.
- **Operations/cost:** work is bounded by tools, grants and host/session limits; paid services and cross-host execution remain explicit opt-in.
- **Compatibility with active 1.3.0:** R7's three-remedy finite cap remains binding, R15's approved-scope/authority precedence is unchanged, R16's one active critical path and bounded work queue remain canonical, R17's evaluation exit applies to every permitted change, R18 prohibits unnecessary surfaces, R19 distinguishes nondelegable decisions from recoverable limits, R20 requires end-to-end acceptance, and R21–R22 require universal proportionate execution with truthful tool limits. R34.C adds **ChatGPT host-surface semantics**, not a new self-approving capability or a replacement for those rules.
- **Compatibility with existing R33/R34 Draft:** Hub Draft PR #153 independently proposes R33/R34 and R34.8. R34.C is an *addendum to that same proposal*, not an alternate ratified R34 or competing source of constitutional truth. Before ratification, reconcile branch revisions and integrate into one reviewed normative set: exactly three terminal outcomes; R34.8 evidence fields (actionId, targetTaskId, projectId, sourceRevision, ownerType, selectionReason, expectedEvidence) and conditional real gate fields (blockedBy, requiresHuman, previousActionId, newEvidenceIds); the R34.8 rubric retains semantic obligations blockedByIfPartial and previousActionIdAndNewEvidenceIfRepeated. No generic self-restart or implicit Work/runner authority. A standalone merge of #155 does not implement or ratify #153 and vice versa.
- **Version decision:** candidate 1.4.0 may add a mandatory host-facing operational obligation. Independent authority must decide MINOR vs MAJOR from actual compatibility and host capability evidence. Do not silently impose new requirements on active 1.3.0.
- **Migration:** review amendment and schema -> isolated host and negative tests -> authenticated independent review -> human constitutional ratification -> atomic eight-source publication with exact digest and rollback -> managed portfolio propagation, per-project acceptance and truthful adoption states. This draft completes **only the first candidate stage**.

## 5. Explicit stop and authority state

`REVIEW_BLOCKED` remains until an eligible independent reviewer and genuinely enforced review/branch controls exist. This draft grants no authority to self-approve, ratify, merge, deploy, change visibility, create users, run paid tools, execute arbitrary commands or write Neon/Production. Prior PR #153 / #154 and QA Worker PR #5 remain independent Draft workstreams and are not evidence that this ChatGPT-specific surface is deployed.

## 6. Owner-requested editable prompt update — source QA, 2026-11-05

The R34.C.9 update has 14 candidate consistency checks executable with `node --test tests/governance/chatgpt-next-action-hands-off.candidate.test.mjs` under Node 24. These check the policy/contract, authority boundaries and shared prompt, not a native host adapter. The screenshot records the Owner's preferred interaction; it does not certify edited-message dispatch or A-to-Z execution. Native-host desktop/mobile acceptance remains `NOT_RUN`, Reviewer B remains unverified and `OWNER_REVIEW_NOT_READY` remains in force. The exact candidate revision and native Node results are recorded on Draft PR #155; historical callback-only results there apply solely to their earlier revisions. Active Constitution 1.3.0 and all portfolio adoption records are unchanged.
