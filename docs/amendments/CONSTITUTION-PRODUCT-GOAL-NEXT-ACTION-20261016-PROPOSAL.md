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

## Proposed law strengthening (subject to human ratification)

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
  a trusted exact-goal snapshot; refuses stale/mismatched snapshots, duplicate
  actions, unsupported completion evidence and cyclic dependencies.
- `tests/governance/product-goal-continuity.test.mjs` — negative regression
  cases for repeated status checks, source staleness, authority crossing,
  competing work and impossible PASS.
- `.github/workflows/product-goal-continuity-candidate.yml` — focused CI only
  for this proposal. Passing it means **candidate contract tests passed**, not
  adoption, propagation, product UX or universal Constitutional compliance.

**Not implemented in this candidate:** live authenticated adapter from
canonical Project Profile, real Next.js UI/buttons, new signed execution grants,
external scheduled automation, cross-repo app migrations or any Production
release. No app is enrolled or marked compliant by this proposal.

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

1. Authorized owner confirms the accepted product goal/UX journey and target
   artifact for representative Bauman-Russian-iOS, plus a non-iOS project.
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
