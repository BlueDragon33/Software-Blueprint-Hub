# Amendment proposal — universal Product Goal Continuity & Next Action

**Proposal ID:** CONST-PRODUCT-GOAL-NEXT-ACTION-20261016-001  
**Status:** DRAFT / IMPACT REVIEW REQUIRED / NOT RATIFIED / NOT PUBLISHED  
**Source authority:** Software-Blueprint-Hub; active Constitution is 1.3.0.  
**No amendment version assigned:** a human constitutional authority must review
compatibility and choose a version if and when this proposal advances.
**Origin:** explicit project-owner requirement, 2026-10-16: improvements
requested for ALL apps must enter Blueprint OS as the shared engineering
compass, and each checkpoint must preserve the product goal with actionable
next-step guidance rather than drift into repetitive status checks.

## Problem, observed failure and bounded evidence

Bauman-Russian-iOS was intended to make an installable native iPhone
Lock Screen vocabulary widget with offline learning and an honest
Application-Management entry. Repeated code/review/CI checkpoints accumulated
while **no SwiftUI app, WidgetKit executable or App-manager enrollment**
had actually been implemented. Correct GitHub CI and governance discipline
did not compensate for the missing user-visible product.

This is an example of **goal displacement**, not evidence that all 15+ governed
projects suffer the same regression. The proposed universal method must be
evaluated on multiple distinct projects, including existing apps, not presumed
to have propagated from a Hub document.

## Authority fit: constitutional overlap versus genuinely new obligations

The published Constitution 1.3.0 ALREADY covers the product execution
contract and the continuity mechanism. The G1–G8 labels below are **analysis
anchors only, not eight new laws**. No normative amendment is in effect.

| Candidate area | Existing governing law | Disposition |
| --- | --- | --- |
| G1/G2 goal outcome, pinned checkpoints | R15, R17, R20, R23 | Implement in existing canonical Profile/Work Package projections. No new law. |
| G3 one primary action | R16, R17 | Existing requirement. Potential *new* UX refinement only: explicit host-action truthfulness and at most two contextual alternatives. |
| G4 bounded autonomy and authority | R7, R17, R19, R22 | Existing law. No new law. |
| G5 suppress unchanged status polling | R7, R16, R17 | Potential *new* precise operational rule: same check + same source/evidence revision cannot outrank independent product work. |
| G6 universal request intake | R15, R21, R24, R26 | Operational scope delta in the existing Hub; no second policy database. |
| G7 truthful offline catalog | R11, R14, R20, R26 | Already required; integration and device evidence still missing. |
| G8 distinct authorities and repos | R11, R14, R26, R27 | Already required. No new law. |
| Work two-option handoff | R19, R22 | Potential *new* situational UX detail, not a mandate to open Work or new execution authority. |

**Amendment scope for Constitutional Authority consideration:** Only the
incremental UI disclosure contract (truthful actionable vs advisory Next Action;
two options when a validated capability gap has a genuinely safe Chat alternative)
and explicit stale-status suppression are potential normative additions.
They may instead be published as subordinate operational UX rules if authority
finds current R16/R19/R22 sufficiently covers them. No successor Constitution
version, ratification or adoption is asserted.

## Existing-law implementation candidates G1–G8 (NOT new law)

**G1 — immutable enough product-outcome anchor.** Each active project has one
explicitly authorized user-visible outcome, an acceptance journey, measurable
evidence for completion and a versioned product-goal reference in canonical
Project Profile/Work Package records. Reject activity/PR/CI counts as the final
definition of product success.

**G2 — exact-goal checkpoint.** Each progress checkpoint records goal ID and
revision, project ID, application source SHA, accepted Work Package, product
artifact/end-user evidence, unresolved blockers, and the next smallest valuable
action. Reconcile against current canonical source, never a chat-only summary.

**G3 — one primary next action.** Offer **one clear primary action** that advances
the currently accepted product goal, with at most two contextual alternatives
where useful. A button may be included only if the product/host supports its
real behavior. It must never imply an executable action, authority or deployment
that doesn't exist. An unresolved mandatory human gate must show the precise
reviewer/action/reason.

**G4 — bounded autonomous continuity.** Continue independent, authorized,
bounded work through implementation -> test -> root-cause repair -> retest.
Do not stop at arbitrary stage counts, paperwork or routine status updates.
Do not bypass genuine human/security/Constitution/production gates, resource
limits, signed execution grant restrictions or actual device acceptance.

**G5 — no recurring stale status loop.** Re-check CI/review/availability only
when it can resolve a concrete dependency or evidence has changed. Suppress
an identical "check review again" primary action when the source revision and
evidence revision have not changed; advance independent READY product work
where safe. Conditional review notifications should not displace delivery.

**G6 — all-app requirement intake belongs to Hub.** When the owner explicitly
says a requirement is for ALL apps, record **one** Hub-owned cross-app
requirement candidate with origin, scope, affected layers, acceptance criteria,
risk/security review, priority, version and migration proof. Do not copy this
normative requirement into each app, create a new policy authority in
Application-Management, or silently mark all apps compliant. Amendments to
ratified universal law require separate, authenticated human ratification;
ordinary compatible workflow guidance may be reviewed and adopted without
a Constitutional amendment, under its appropriate non-law authority.

**G7 — truthful app catalog and offline path.** Products carry a second
acceptance journey when the project goal includes being reachable from
Application-Management. A repository entry is not proof of a working launcher,
installed app or live Control API. When standalone offline-first is selected,
do not block a working local app on unfinished production/publish wiring.
Mobile OS launch and device verification must be separately proven.

**G8 — cross-repo boundaries and independent acceptance.** Hub owns policy,
workflow selection, Next-Action *projection rules* and canonical acceptance
references; product repositories own source, language/data approval and tests;
Application-Management owns truthful app catalog, launcher and device/health
metadata. A central navigation policy never authorizes language review, content
publication, GitHub merges or production release.

## Implementation candidate in THIS PR

- `control/product-goal-continuity.candidate.v1.json` — explicit non-ratified
  proposal contract, with `realUiIntegrated:false`, 
  `allAppPropagationVerified:false`, `productionAuthority:false`.
- `scripts/product-goal-continuity.mjs` — deterministic **advisory** selector for
  exact-goal/HEAD/work/evidence snapshot consistency; refuses mismatched source
  revisions, undelegated owners, duplicate actions, unsupported completion
  evidence and cyclic dependencies; suppresses unchanged review-status loops.
  Includes a bounded, text-only Work handoff with two contextual options when
  a concrete tool gap AND an independent safe Chat action are identified.
  **A caller-supplied snapshot marker is never authentication.** An authenticated
  server adapter must authorize canonical reads before exposing the projection.
- `tests/governance/product-goal-continuity.test.mjs` — negative regression
  cases for repeated status checks, source staleness, authority crossing,
  competing work and impossible PASS.
- `.github/workflows/product-goal-continuity-candidate.yml` — focused CI only
  for this proposal. Passing it means **candidate contract tests passed**, not
  adoption, propagation, product UX or universal Constitutional compliance.

**Not implemented in this candidate:** live authenticated adapter from
canonical Project Profile/Work Packages, real Next.js UI/buttons, Work-mode
switching, new signed execution grants, external scheduled automation,
cross-repo app migrations, native iOS WidgetKit code or any Production release.
No app is enrolled or marked compliant by this proposal.

**Trust invariant:** If a UI receives a pure JS projection directly from
untrusted client-supplied JSON, it MUST NOT imply server authorization,
canonical freshness, enabled buttons or project completion. Snapshot field
agreement is a consistency test, not a signed receipt. The real integration
must call existing `loadProjectWorkspace`/runtime Profile and Work Quality
read APIs with an authenticated actor and show unavailable/forbidden states.

## Owner-directed universal continuous-execution preflight — 2026-10-17

**Scope and authority:** The owner explicitly requests the same Blueprint OS
workflow for **existing, in-progress and future projects**. The active law
1.3.0 already mandates bounded, evidence-grounded execution (R15–R22).
This section is a **candidate operational projection**, not a self-ratified
new constitutional law, new Project Profile, or second workflow registry.

**Two required phases, in order:**

1. **PREPARE / VERIFY / REPAIR BEFORE THE BUTTON.** Resolve the current
   Constitution/adoption and Project Profile; restore product outcome and
   end-user acceptance; inspect current source HEAD and relevant PR/evidence;
   reconcile dependencies and one critical path; reproduce/fix actionable
   *entry-blocking* engineering defects with focused regressions; measure
   relevant security, data persistence, offline/runtime and Quality Gates;
   classify HUMAN_AUTHORITY, CAPABILITY and SECURITY blockers explicitly;
   record an exact-revision canonical checkpoint with one safe READY task,
   bounded scope and stop predicate.
2. **CONTINUE SAFE WORK ON EXPLICIT USER TRIGGER.** Only after an authenticated
   server/host implementation rechecks that preflight and live HEAD, offer the
   true user-triggered continuous-execution control. Within one authorized
   execution keep going READY task → implement → test → diagnose/root-cause
   repair → re-test → next independent READY task. Apply R7 finite repair
   bounds, R18 scope discipline, R19 genuine intervention and R20 exit
   evidence. Do not require routine user confirmation for ordinary,
   authorized engineering actions; do not promise background execution.

**Blocker rule (no impossible zero-defect claim):** All **known, actionable
entry-blocking problems** must be fixed and retested before “ready.”
A pending mandatory human/qualified expert acceptance, unavailable device,
credential, legal source right, or protected release permission cannot be
“automatically solved.” If it blocks the active critical path and no safe
independent READY slice exists, show `BLOCKED` plus the precise remediation,
**not a misleading execution button**. If truly independent READY work exists,
it may continue while the dependent item remains openly blocked. New defects
found during execution are treated via R7/R17; unknown future defects cannot be
pre-certified absent.

**Auditable candidate fields:** the existing
`control/product-goal-continuity.candidate.v1.json` declares eight mandatory
preflight evidence dimensions and source-readback requirements. The existing
`scripts/product-goal-continuity.mjs` offers
`assessContinuousExecutionPreflight`, which deliberately returns
`PREFLIGHT_EVIDENCE_FORMAT_READY` and `buttonAuthorized:false` for even a
complete caller-supplied packet. It does NOT authenticate source, actor, Project
Authority, automated host execution, gate PASS or Production. A connected
server must resolve actual canonical records and scope before a live control
may be enabled; a user-triggered chat action is not an always-running worker.

**Migration and test:** stage one already-governed application and one newly
admitted application using real canonical Profile/Work Package/Quality Gate
records. Prove permitted vs blocked states, stale source revision, broken
dependency, missing QA, unresolved entry defects, unrelated human gates and
no safe READY work. Do not claim cross-portfolio rollout or universal
`VERIFIED` from candidate CI alone. Preserve the existing proposal-only
constitutional review/ratification sequence.

## Impact review checklist (NOT YET SIGNED OFF)

- **Product/UX:** single prioritized main CTA versus G4's "no button for every
  capability"; mobile accessibility, blank/blocked/recovery states; support
  keyboard/VoiceOver/screen reader, optional secondary links.
- **Architecture:** existing central prompt/workflow graph and Project Profile
  supply task identity; do not introduce a competing workflow database.
- **Integrity:** source SHA, canonical goal revision and latest evidence must be
  authenticated server-side. An in-memory JS projection is not an authorization
  service. Avoid stale-content misrepresentation or forged gate claims.
- **Security:** only a user-authorized real action may run on click; no fake
  next-step buttons, unconditional shell/merge, release or cross-app mutation.
- **Offline:** actionable local work can proceed without public deployment;
  backend/device-dependent actions show blocking dependencies honestly.
- **Resources:** bound attempts, files, QA scope and tokens to the known defect.
- **Ecosystem:** inventory sealed governed repos + append-only registrations +
  pending candidates, then stage *per-app* measured review; do not automatically
  rewrite all application repositories or the sealed baseline.
- **Compatibility:** existing 1.3.0 is not retroactively edited; determine
  whether new strengthening needs a ratified compatible successor.
- **Failure modes:** old checkpoint; duplicate work; no executable action;
  infinite CI poll; full-app reference video missing; approval in chat but
  no authenticated review; "installed" inferred from code; unsigned device build.

## Migration and evidence plan (after separate review)

1. Reuse the **existing** accepted canonical product goal and Work Packages
   for Bauman-Russian-iOS plus a distinct governed app. If an accepted
   canonical record is absent, classify it MISSING/UNVERIFIED rather than
   treating this proposal or chat narrative as authoritative.
2. Derive actions from existing approved Project Profile / Work Packages, not
   arbitrary UI form strings. Add exact source binding and user authorization.
3. Implement one real central project workspace Next-Action UI and end-to-end
   integration (product artifact, evidence, safe action, human gate, recovery);
   verify a primary action advances a measurable goal.
4. Cover offline-first and Application-Management navigation with observed
   actual journeys, no connected/installed badges without device/readback proof.
5. Create per-app inventory with state: NOT_ASSESSED / BLOCKED / VERIFIED,
   reviewer/evidence/commit. Do not declare cross-ecosystem DONE from CI alone.
6. If the law is modified, apply the full Amendment → Impact → Migration →
   RATIFICATION → Publication → Propagation → Verification protocol, and
   separately review release authority and rollback.

## Ratification and authority

All checks and draft text remain **candidate evidence** only. No agent may
self-ratify this law, update published Constitution 1.3.0 in place, alter its
locked template/contract, declare an application Quality Gate PASS, update
sealed registrations, merge PRs or publish products on this basis.

Authenticated human Constitutional Authority must decide if/how to publish
this as a successor; Project Authority and Production Authority are distinct.
See `docs/CONSTITUTION-AUTHORITY-PROTOCOL.v1.md`.


## Read-only P3/P4 evidence checkpoint — 2026-10-16 (not a registry)

This sampling **does not mutate** `control/constitution-governed-repositories.json`
(sealed baseline) or `control/governance-registration-ledger.v1.json`
(append-only admission history). The canonical baseline at Hub main
`cd01fb3c2178393628ce968af209db082227d2c4` lists **15 repositories**.
The registration ledger admits **2 more** (ECAD_Design, CAE_Simulation) with
`complianceState: UNVERIFIED` and `canonicalProjectProfile: false`.
Enrollment is not adoption or product acceptance.

| Provenance | Application | Revision/observed evidence | Product-goal continuation |
| --- | --- | --- | --- |
| Outside baseline and ledger, candidate | `BlueDragon33/Bauman-Russian-iOS` | main `80c17043c472ff9fca0db8ed0fc329863be6b47e`; complete recursive tree = README.md only | **BLOCKED product**: no native Xcode project, SwiftUI app, WidgetKit extension, signed device/Lock Screen evidence or dynamic-catalog enrollment. Must not call installed, offline verified, RU03 accepted or managed. |
| Baseline governed | `BlueDragon33/Application-Management` | Draft PR #360 head `cc42893a4dbd99e5ff7f4e24398af345cc3da55b`: Constitution, fast, regression, isolated local smoke and full checks success; preview browser skipped | **PARTIAL verification only**: no actual Windows cold-start cross-app iOS launch or authenticated enrollment. Offline-first publication hold remains. |
| Baseline governed | `BlueDragon33/pc-manager-desktop` | main `37035ef6d3e90ed5fc06d03b618921dbae1f8404`; Rust, Windows native build, offline protocol, frontend, constitution checks success | **PARTIAL verification only**: real end-user device UX / signed installer release not inferred from CI. Distinct app with non-iOS workflow. |
| Baseline governed | `BlueDragon33/Bauman-master-ai-system` | main `70df417bacb615602f76b40fea1073ad221059a6`; browser and Russian UI checks success | **PARTIAL verification only**: web learning journey is not an iOS native offline/widget acceptance or qualified RU03 review. |

**P4 staged NOT_ASSESSED remainder:** BOIECH_AI, RU_LIFE, Health_Care,
NC03_Modem, ROS-1-2, Math_Bauman, GrowUP_MyChildren,
Hardware_Simulation, MPC_PID_System, CAD_CAM_3D,
PriceReport_Tunggiabao, ECAD_Design, CAE_Simulation. Their presence in a
manifest/ledger is no basis for VERIFIED or PASS. Hub is the authority owner
of this PR, not a separate application-acceptance PASS.

**Actual iPhone slice acceptance dependency:** create and build a genuine
offline WidgetKit executable from approved (separately RU03-reviewed) Russian
content, install and exercise it on a supported device, measure data readback,
then validate a truthful Application-Management discovery/launch contract under
its existing catalog authority. A source-only check cannot replace iOS device
evidence. Do not grant iOS enrollment authority through Hub candidate tests.

**Scope note:** Work handoff as text is testable via this PR; native Xcode,
actual iPhone provisioning and signed enrollment are *capability/evidence
boundaries*, not reasons to mark a candidate selector or the Constitution as
ratified. The current primary product-advancing next action for iOS is a minimal
offline native WidgetKit executable, not another unchanged PR review poll.

**Post-checkpoint product work (separate Draft PR):** [Bauman-Russian-iOS #2](https://github.com/BlueDragon33/Bauman-Russian-iOS/pull/2), initial head `72385f2a024224d0d889dc555128993940d64e25`, introduces a SwiftUI app, offline WidgetKit extension, shared App Group storage, an unsigned macOS build check and a metadata-only App-manager contract. The main branch remains README-only. Native unsigned iOS Simulator **BUILD PASSED** at that exact SHA ([macOS CI job](https://github.com/BlueDragon33/Bauman-Russian-iOS/actions/runs/38927981269/job/117064353243)). This proves compilation of the app and embedded widget target ONLY, not real iPhone install, offline shared-state readback, RU03 approval or enrolled App-manager entry.
