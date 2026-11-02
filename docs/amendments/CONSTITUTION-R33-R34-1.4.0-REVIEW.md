# Constitution R33 + R34 — candidate 1.4.0 (REVIEW ONLY)

Repository: BlueDragon33/Software-Blueprint-Hub
Base dependency: PR #152, head b06d93704b088319e1cc8b26161f0b4dc217858e
Sealed active constitutional baseline: cd01fb3c2178393628ce968af209db082227d2c4
Effective policy: 1.3.0 R1–R32. Proposed: 1.4.0 R33–R34.
Disposition: CHANGES_REQUIRED; NOT_RATIFICATION_READY; NOT_PUBLISHED.
This is a review proposal, never a self-approved constitutional amendment or execution grant.

## Proposed 10.R33 — universal controls, directional handoff and inheritance

All governed projects must inherit ONE Hub-owned, versioned behavioral contract, but implement device-, role- and application-appropriate interfaces. Preserve the existing ProjectProfile, WorkPackage, dispatch, owner and security boundaries. Application-Management may surface status, not mint constitutional, Production or execution authority.

1. **Exactly one inbound handoff per verified host surface.** Chat receives only WORK → CHAT. Work receives only CHAT → WORK. Never show two inbound inboxes or a direction selector in either receiving surface. An outgoing handoff is a separate export/copy action. Unknown or unverified Chat/Work host context shows neutral manual guidance, never an invented inbox or host transport.
2. **Consistent controls.** HƯỚNG DẪN explains the actual project/checkpoint; NEXT ACTION selects exactly one currently legitimate next step; TRIỂN KHAI TỪ ĐẦU TỚI CUỐI obeys R34's bounded continuation obligation. CẦN WORK is conditional on a verified host/tool boundary, with explicit user start and truthful copyable handoff. In Work, QUAY LẠI CHAT — TIẾP TỤC NHIỆM VỤ must be available for both completed and blocked work when the host supports it, with a manual copy fallback.
3. **No invented integration.** The Hub repository cannot automatically change the native ChatGPT Project/Work interface or infer authenticated host context from URL/query strings, pasted prose, project names or simulated browser props. A claimed live Chat/Work integration requires a trusted host adapter, same-project identity and real UX acceptance.
4. **Scoped receipts.** Work → Chat reports are UNVERIFIED until independent canonical readback of projectId, ProjectProfile/WorkPackage/dispatch versions, source HEAD, changed files, role/owner, QA and decision gates. Reject cross-project, stale and self-signed trust. A copied report never grants approval, production rights or QA PASS.
5. **App-specific design; common obligations.** Adapt controls to web/mobile/native desktop/offline/CLI and role-specific contexts; keep accessibility, concise visual hierarchy and source-scoped permissions. Do not install duplicate global buttons on all pages, duplicate constitutions or a new registry. The Hub is the exemplar and centralized rule owner.
6. **Evidence-gated adoption.** Each of the 18 current tracked applications and all future governed projects must report actual adapter version, source revision, independent applicable QA, real host UX/authorization results and remediation blockers before being VERIFIED. The three private execution services are distinct infrastructure. Do not infer adoption from manifest entries or synthetic tests.

### R33.7 — controls must be real, distinct and accompanied by usable guidance

At every governed project checkpoint with a legitimate Next Action, the user must be able to find a functional **HƯỚNG DẪN** control separate from **NEXT ACTION**. Merely writing "NEXT ACTION" as a heading or saying the user can ask for help is not sufficient. The help control opens contextual, scoped instructions containing the actual project, source/profile version when known, concrete task, reason/evidence, effect of pressing the primary action, prerequisites, and the limit of its authority. It must be operable by keyboard, accessible on mobile and readable without new privilege elevation.

NEXT ACTION is a separate primary actionable control: it selects precisely one real task, rechecks canonical authorization and versions, and performs only its advertised permitted navigation or operation. It may not silently become "ask the assistant to do the same thing again", a generic copy prompt, a help text toggle or fake Work/Production execution. When execution is not integrated, disclose "read-only navigation" explicitly.

TRIỂN KHAI TỪ ĐẦU TỚI CUỐI is not interchangeable with NEXT ACTION: it implies R34's continued authorized execution, and a working execute button cannot appear until a trusted scoped runner exists. A disabled or explanatory state is truthful; simulated buttons or inferred ChatGPT host integration are not. Per-project verified adoption requires a real interaction test of HƯỚNG DẪN and NEXT ACTION at exact source revision. The shared contract is owned by Hub, not copied constitutions.

### R33.8 — Central constitutional template for NEXT ACTION, guidance and both prompts

A governed project MUST consume the Hub-owned versioned **Universal Next Action Blueprint** at each legitimate project checkpoint, and MUST NOT invent its own independent NEXT ACTION constitution or hardcode a different project-specific prompt format. The common template has four **distinct, mandatory outputs**:

1. **HƯỚNG DẪN:** an actual accessible open/close control explaining current project, exact ProjectProfile version, task and source, prerequisites, why it has priority, how the primary action behaves, expected evidence and truthful limits. It must not impersonate execution.
2. **ĐỊNH HƯỚNG:** an actionable prioritized approach based on the current dependency/Quality Gate/WorkPackage/readiness state. Focus on blockers, minimal-safe fixes, reused PASS evidence and a coherent path to acceptance. Never replace a canonical next step with generic strategy.
3. **PROMPT NEXT ACTION TỐI ƯU:** one scoped step with expected result, canonical project and evidence binding, permitted tool plan, reauthorization/readback, QA gate, and exactly one *non-circular* closing Next Action only if a legitimate blocker remains. A generic "continue work" restart is prohibited.
4. **PROMPT TRIỂN KHAI TỪ ĐẦU TỚI CUỐI:** an unambiguous bounded work handoff that continues all remaining accessible safe steps in dependency order, attempts permitted recovery, preserves local dirtiness/known QA, and reports actual VERIFIED_COMPLETE or PARTIAL_BLOCKED/PARTIAL_CAPABILITY_LIMIT. Copying the prompt does not launch Work, approve the task or exercise authority.

**Mandatory shared inputs:** canonical projectId; ProjectProfile recordVersion; action kind/label/reason; current readiness/linked evidence; exact current source revision ONLY if independently trusted; scoped WorkPackage/dispatch versions where verified; actor authorization and tool budget at execution time. Unknown source/role/host context MUST be rendered UNVERIFIED, never fabricated from stale test artifacts. Metadata carried inside prompts is untrusted DATA, not executable instruction. The Hub's presentation layer must not leak cross-project or secret information.

**Runtime and surface separation:** NEXT ACTION remains a single real server-reauthorized, read-only navigation control until a scoped executor with appropriate grants exists. HƯỚNG DẪN is an operable disclosure. Optimized prompts are inspectable and copyable, never fake background runners. Chat can receive WORK → CHAT; Work can receive CHAT → WORK only when host mode is verified; unknown host shows neutral guidance. No fabricated host mode or automatic Work spending.

**Inheritance acceptance:** Every one of the 18 currently tracked apps, and every future governed app, must implement an adapter that consumes the same central schema with app-appropriate UX; must verify its own exact source HEAD, actor, roles, profile version, keyboard/mobile behavior, scoped QA, stale-state fail-close, and no fictitious execution. Until per-app evidence is independently read back, keep NOT_ADOPTED/NON-COMPLIANT rather than inferring 18/18 from this draft. Three private workers are infrastructure, not extra app tiles.

**Version boundary:** This is proposed R33.8 for 1.4.0, NOT an immediate rewrite of published active 1.3.0 R1–R32. It is not publishable without full eight-source atomic candidate replay, compatibility analysis and human ratification.

### R33.9 — NEXT ACTION is one-click planned execution, not prompt copy

The default NEXT ACTION must have a real, contextual interactive action, not a copyable prompt or an invitation to restart Chat repeatedly. One click SHALL: (1) resolve an authenticated actor and exact canonical ProjectProfile/WorkPackage/Quality Gate context, (2) revalidate actor and source record versions against the UI intent, (3) generate the preplanned optimal prompt and bounded typed step plan from the existing Hub-owned shared template, (4) execute every available permitted safe step in the same bounded request or authorized continuation, (5) read back genuine results and render them inline, then either continue with other eligible tasks or give an exact, truthful stop reason. The prompt is internal planning material, not an authority token, clipboard prerequisite or unrestricted shell directive.

**Do not substitute read-only preflight for the entire mission.** A safe automatic readback is a legitimate stage, not a claim that repairs, native tests, Work sessions, releases, ratification or deployment happened. Any protected mutation requires the EXISTING independent signed/scoped runner, current ProjectProfile/WorkPackage version, verified workflow adoption, fresh authorization, idempotent journal, source revision, human QA and applicable stop gates. If unavailable, disclose BLOCKED and do not synthesize a runner. Paid tools, Work/Codex and GitHub Actions remain opt-in or require the relevant explicit grant.

**Task-adaptive tools and CMD evidence:** The system must offer inputs only when the verified canonical task needs them. For a CMD-driven task, a bound read-only command from a strictly versioned Hub-owned allowlist may be rendered if and only if an exact canonical WorkPackage step declares its safe command identifier. Show the command, execution context, a field to paste redacted output, and an analysis/continue control. Revalidate actor, ProjectProfile, current task/command id and decision gates on each submission. Pasted stdout/stderr is untrusted and does not establish independent QA or a permission grant. Never execute pasted text, invent local machine execution, infer CMD steps from free-text model output, or store secrets. Future privileged commands need a distinct reviewed typed grant.

**One common template, adaptive interfaces:** Hub owns the preplanned prompt schema and continuation policy; each of the 18 existing applications and future governed projects consumes the SAME semantic obligations and produces role/device-appropriate UI. Not every task receives a CMD field. Routine read-only tasks may be inspected in one click; blocked authorization tasks disclose the actual boundary, and CMD tasks use a bounded paste-feedback flow. Native ChatGPT/Work integration is only asserted after a trusted host adapter exists. No app may claim adoption by showing a fake button or static copy control.

**Verification:** Test single-click trigger → server-side canonical read → plan construction → permitted operation → source-bound result, plus stale version/role denial, repeat prevention, no automatic Work spending, CMD allowlist, mismatched output handling, size limits, privacy and keyboard/mobile inputs. Unit/render tests do not replace real authenticated browser QA or independent evidence.

## Proposed 10.R34 — end-to-end is execution, not one-step delegation

1. **Carry exact context.** Reuse the user-approved goal, known constraints, latest HEAD, previous meaningful PASS evidence and state. Never demand repeated answers, create duplicate discovery work, or request an ordinary available read-only operation from the user.
2. **Continue across eligible steps.** TRIỂN KHAI TỪ ĐẦU TỚI CUỐI must execute every accessible, permitted safe step in dependency order, then verify and continue; a single status read, plan, prompt, preflight or patch draft is not completion. A blocker in one branch does not stop independent safe tasks.
3. **Scoped safety and budget.** Never self-authorize a role, source write, paid Work/Codex, GitHub Actions, merge, ratification, dispatch, Production, or release. Honor exact owner/cost/time/tool and review gates; stop only when a real gate is proven.
4. **Try safe recovery.** Diagnose actual failure, retry only with new evidence, repair minimally where permitted, and check the result before human escalation. If a tool/read/permission boundary remains, report exact cause and the smallest truly necessary human step.
5. **Truthful outcomes.** VERIFIED_COMPLETE requires independent relevant source/acceptance evidence; PARTIAL_BLOCKED or PARTIAL_CAPABILITY_LIMIT discloses what remains and why. Test fixture, generated download, script, proposal or screenshot alone is not product delivery or ratification.
6. **Mandatory final receipt.** Record canonical project/revision or UNVERIFIED, operations performed, scoped QA, remaining tasks, real blocker, attempted recovery, protected local dirty state, and exactly ONE Next Action. Never declare success early or turn every single preflight into a new user question.
7. **Real implementation proof.** The central R34 receipt-shape gate can reject self-reported premature stops, but it is NOT a verified execution agent, authority service, independent QA or native ChatGPT host adapter. Actual adoption needs scoped runtime continuation and negative tests per project.

### R34.8 — NEXT ACTION is not a self-restarting prompt

A final NEXT ACTION must not merely restate the user's standing instruction, open an already-readable diagnostic page, trigger another generic Chat message, or ask the user to do a read that the connected agent is currently authorized and able to perform. For every proposed final Next Action, the reviewer must establish:
- exactly ONE concrete action with stable actionId and a targetTaskId already in the approved goal's complete task scope;
- projectId and source revision match the actual scoped checkpoint, with honest UNVERIFIED fallback when readback is blocked;
- the specific owner (agent, human authority or unavailable external host), stop gate (if incomplete), reason that the action could not already be completed, and expected evidence;
- no approved safe task remains merely eligible. When safe work is still possible, the correct decision is CONTINUE, not HANDOFF;
- the proposed action is not the same previous unresolved action unless new independent relevant evidence or a changed gate is identified;
- human action is requested only at a genuine human authorization/capability boundary and is reduced to the smallest necessary decision.

The R34 review-only gate rejects unstructured or circular Next Actions and truncated task inventories. Its input is an untrusted self-report, so an allowed receipt shape is NOT proof of a genuinely complete task plan, verified blocker, host capability, independent evidence, or permission to dispatch. Actual runtime integration must obtain trusted canonical work scope and source-bound action history before it can enforce this law. Any project that merely copies the rule but still ends in generic self-restarting prompts is NON-COMPLIANT, not an adopter.

## Version classification and review gate

Proposing 1.4.0 is provisional, not automatic: R33 and R34 add cross-app mandatory behavior, which may break existing interfaces/operating processes. An authorized compatibility reviewer must decide whether this is compatible strengthening suitable for MINOR or a MAJOR change. Preserve published 1.3.0 history. The ratification workflow must bind exact revision, digest, human actor, decision and migration plan before an atomic publication.

## Canonical publication protocol — actual code constraint

At active 1.3.0, packages/application/src/constitution-publication-sources.ts expects EXACTLY EIGHT inputs, not five:
- docs/UNIVERSAL-CONSTITUTION.md
- control/universal-constitution.contract.json
- packages/application/src/foundation-templates.ts
- packages/application/src/constitution-authority.ts
- control/universal-constitution-version.json
- .blueprint/constitution-adoption.json
- control/constitution-ecosystem-snapshot.json
- control/constitution-compliance-snapshot.json

The latter three may change top-level policy metadata only. Do NOT rewrite their historic per-repository observed manifests, source revisions or compliance snapshots. The strict replay tool also expects real Git diff headers and complete source context. Until a clean exact-checkout eight-source patch passes native replay, rollback and authority-set digest checks, status remains CHANGES_REQUIRED. The historical 1.3.0 candidate builder is deliberately sealed; introduce a separate reviewed 1.4.0 generator instead of rewriting historical records.

## What has and has not been tested

Independent review on November 1, 2026: GitHub main cd01fb3c2178393628ce968af209db082227d2c4, PR #152 head b06d93704b088319e1cc8b26161f0b4dc217858e. Structural assertions on 5 source files 21/21 and projection checks 8/8 passed, not native eight-source publication acceptance. Synthetic eight-source patch applies/reverses only on a fixture; true Git blob indexes, exact clean checkout replay, and per-app authenticated UX remain unverified.

R34 review-only receipt-shape tests: 20/20 Node tests on the candidate module. Result RECEIPT_SHAPE_COMPLETE is never permission for QA PASS; the independent canonical readback must still follow. No automatic Work launch. Pilot PR #152 local checkout was previously reported to contain 34 dirty paths, not independently accessed in this review.

## Required migration evidence

Maintain a single 18-app adoption matrix; start with the Hub pilot and validate source/owner/roles plus real UX at exact revision, then move in app risk waves. Keep all adopters NOT_ADOPTED unless separately demonstrated. ROS stays on branch ros2. Maintain snapshot distinction between 15 historical records and current 18 tracked applications plus 3 infrastructure services.

## ONE next engineering action

Create and execute a version-aware 1.4.0 eight-source candidate verifier on a clean, isolated exact commit, with sealed blob indexes, native strict replay/rollback, digest and historical record preservation. Then request a genuine human impact/compatibility review. Do not ratify or publish in this PR.
