# D1 authority continuity — proposed recovery disposition

Status: PROPOSED_ONLY / P2_CONTINUITY_OPEN / NO_CUTOVER_AUTHORITY.
This is a review package, not an exception, a canonical decision, a migration
result, an amendment to active law, or an authorization to publish. It does
not modify the P1 migration plan or the P1 executable candidate.

## Bound evidence

- Active law 1.3.0; observed main b6699207612ea836c14dd4a9c1ea59549f7de2bb.
- Exact P1 0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0; integration
  45768983568: 72 browser and 26 D1 parity passed. Preserve all seals.
- P1 README blob 652126f5ca07f178bd30f5ac523db49685abe972 explicitly blocks
  cutover if canonical source cannot be read. This proposal cannot clear it.
- Governing protocol blob 775247bf2c3bf2b00dac1a3587eaf32883e404e6:
  immutable published history, authenticated append-only human decisions,
  separate constitutional/project/production authority.
- Historical PR #98 records amendment
  amendment:79521378-d2c1-44f8-a0f3-2265a911a6a0, RATIFIED v5,
  authenticated approval 2026-10-13T00:19:14.003Z, production authority false.
  It records canonical main d09940caff014fb7314370da2510774aa580c3ec and
  eight sealed paths, but explicitly says backend publication was pending
  with zero publication rows at that observation. Do not reinterpret that
  as absence of all history today or as a new authenticated decision.
- Ledger #159: 7185875396 (historical evidence), 7185917125 (Owner direction:
  fresh ratification), 7191886555 (operator retained bundle), 7192105655
  (operator schema inventory), 7192457401 (staged-upload capability),
  7192721075 (Worker overview and continuity review).
- New D1 software-blueprint-hub-db UUID
  4f2a47a5-e250-45ae-8ed1-19afcb04415d. Operator reports 28 application
  tables plus _cf_KV, 59 indexes, 31 triggers, zero authority rows.
  This is new-target evidence, not old-source absence evidence.

## Recovery decision proposed for review

Prefer a new operational authority epoch only if an authorized review
establishes a lawful recovery path despite unavailable old-source readback.
Leave the historical database and existing Git evidence untouched. The
historical database is NOT proven empty, deleted, migrated or superseded.
Record unavailable/unmigrated operational history explicitly, including
principals, revocations, decisions, publications, project and gate records.
Do not reconstruct canonical rows from PR descriptions, logs, screenshots
or chat. Preserve 1.3.0 as active law and do not re-ratify it solely to
fabricate missing history. No legacy provider reconnection unless separately
required and authorized; no paid service.

The review must determine whether unavailable principals/revocations,
pending decisions, work packages and journals make a fresh epoch unsafe.
A new login must not automatically reinstate old project permissions.
If this risk cannot be resolved under the existing protocol, retain
P2_CONTINUITY_OPEN. Authorized reviewers must explicitly identify the
governing recovery mechanism and exact evidence; an Owner preference or a
new README alone does not supersede the P2 stop condition.

## Admission sequence and acceptance

| Boundary | Required evidence | Failure action |
| --- | --- | --- |
| C0 historical preservation | Historical source disposition, immutable evidence references, explicit unresolved inventory, no destructive action | Keep P2 open |
| C1 continuity authority | Reviewed recovery mechanism, exact scope and authenticated authorized decision; no fabricated old records or waiver of governing law | Block canonical cutover |
| C2 remote preflight | Current Worker Access, route/preview settings, free plan, exclusive D1 binding inventory, prior deployment ID and rollback version; actual retained bundle manifest | No upload/promotion until applicable admission |
| C3 isolated candidate preparation | Existing helper emits target config and hashes for exact P1 bundle; secure secret handling and dry-run; no live traffic change | Reconcile actual error, no rebuild unless measured need |
| C4 runtime promotion | Separate exact-version release authority, C0-C3 satisfied, rollback plan, no canonical state replacement before continuity admission | Do not promote |
| C5 fresh authority | Actual GitHub OAuth subject 297152795, authorized bootstrap, append-only audit and live journal/readback; no inherited permissions by inference | Fail closed |
| C6 R33 | Fresh exact amendment and authenticated ratification, sealed Full Gate 45475370038, real artifact read; approved publication and exact canonical runtime activation | Keep ACTIVE 1.3.0 until valid issuance |
| C7 successor | 1.4.0 ACTIVE verified, successor exact protected evidence and fresh authenticated decision, 1.5.0 publication and actual adoption | No premature successor activation |

Runtime rollback after any canonical write must account for persistence
compatibility and journal preservation; switching code versions alone is
not proof of safe rollback. Do not delete or reset either database.
Staged upload is not promotion or canonical cutover; even non-serving upload
requires its own admitted scope and secure inputs. No hosted Preview.

A: exact technical evidence and migration/authority invariants.
B: actual Owner acceptance and ability to complete the intended lawful
publication workflow. Both are presently incomplete for remote recovery.
Do not rerun already passed P1 or R33 tests merely to prepare this review.
Next action: resolve C0/C1 through the governing process while completing
independently eligible C2 evidence collection. This draft grants no rights.

## Newly located historical identity observation and recovery decision

2026-11-26 — Exact historical source: Draft PR #154
`96a59823feaf64330bd7870d695d5bc7f3604402`,
`docs/PR_REVIEW_V2_CANONICAL_ADMISSION_HANDOFF.md` blob
`ecced43ae67d947b8d5b8611909a7d4972a7cf9d` (2026-11-02 observation).
The recorded read-only query reported that authenticated GitHub account
BlueDragon33's provider subject matched the then-canonical SystemBootstrap
Owner. A separate historical browser observation reported System Owner
authority on policy 1.1.0. This materially strengthens the historical
identity lead beyond repository ownership alone. It does NOT prove current
authorization, complete history, absence of later revocation, the exact
historical principal row or a recovery delegation. The source commit is not
a verified signed recovery instrument. No old provider has been accessed.

**Concrete next human decision:** the project owner may personally record
on existing Hub Issue #159 an explicit request to review a proposed
prospective recovery mechanism based on this historical identity lead.
That request is engineering scope and an authenticated GitHub-account
observation if read back from GitHub; it is not itself a canonical
constitutional decision, permission to bootstrap, or a continuity waiver.
No private key, token, password or database credential is needed in chat.

The review must distinguish two mutually exclusive outcomes:

1. Continuity: produce a genuinely pre-existing trusted authority
   instrument or separately authorized recovery decision sufficient under
   the existing protocol, bound to the exact historical identity and
   current validity/revocation evidence. Only then consider an admitted
   epoch transition under 1.3.0.
2. If continuity cannot be established, the real project proprietor may
   consider a separately constituted prospective governance foundation
   with explicit loss-of-continuity disclosure and independently established
   authority to adopt it. That is a governance reset proposal, NOT a valid
   ratification under the old protocol by fiat, not a deletion of records,
   and not an allowed automatic fallback. It must not be labelled
   continuity, existing-law compliance, or ACTIVE 1.5.0 until the new
   foundation's authority, lawful adoption, source-bound gates and separate
   protected decisions are established. Do not silently substitute it.

For either route, no automatic inheritance of old grants, no fake historical
rows, no reset, no new provider, no new resources or paid tier. Preserve
existing 1.3.0 and R33/R34–R38 seals, keep C0/C1 blocked until genuine
admission and C2 partial pending exclusivity evidence. AUTO applies only
to already-authorized non-destructive engineering; storage >=50% alert
policy is independent. The helper quarantine remains effective. An Owner
request should not be repeatedly solicited once recorded; only a new
material decision or evidence warrants another notification.

## Owner request received — prospective foundation review packet v1

Issue #159 comment 7200334604, authored by GitHub BlueDragon33 (account
ID 297152795 corroborated by current connector identity), contains the
explicit engineering request for this packet. GitHub attribution is
observed; a personal human action cannot be proven from comment metadata
alone. It is not a canonical principal, recovery grant, approval of a
foundation, or ratification. No second request of this type is needed.

### Decision record (draft; no operational rights)

- Existing-law route: NOT_ADMITTED. The historical identity observation
  in PR #154 is relevant but no complete canonical data or current
  revocation-valid recovery instrument is available in the inspected
  evidence. The Owner request does not cure that deficiency.
- Prospective route: PROPOSED_NOT_ADOPTED. If separately constituted,
  a new governance foundation would be prospective, never an old-law
  amendment, migration, restored grant, or retroactive validation.
- Status of old history: PRESERVED_UNAVAILABLE / NOT_MIGRATED. Retain
  exact Git evidence, sealed artifacts and historical database; identify
  unavailable principals, grants/revocations, ratifications, publications,
  issuer/adoption decisions, work packages, gates and claims as unknown,
  not zero. No deletion, overwrite or invented historical records.
- Current law remains 1.3.0; 1.4 and 1.5 remain candidate content.
  Preserve R33 Full Gate 45475370038 and successor evidence, but do
  not transfer acceptance to a changed authority mechanism.

### Prospective foundation — minimum charter for independent review

1. Establish legitimate foundational authority independently of the
   candidate being reviewed. Verify the proprietor's current control
   and mandate using an authenticated, challenge-bound channel and an
   independently validated witness or other externally established trust
   anchor; record provenance, scope, validity and revocation policy.
   Repository control alone is insufficient to assert old-law continuity.
   If legitimacy for a new foundation cannot be established, stop.
2. Before any adoption, present an exact versioned charter containing
   the proposed authority model, new epoch identifier, explicit break in
   continuity, unavailable-history register, no inherited grants,
   separate reviewer/release roles, recovery/revocation rules, and rollback
   and data-retention boundaries. Bind the independent A and B verdicts
   and the proprietor's separate authenticated decision to its digest and
   candidate SHA. Reject any missing, stale or mismatched verdict.
3. Only after valid foundation adoption and explicit authorization for
   implementation, design a prospective initialization transaction in
   the already-existing isolated D1 target. No direct SQL to assert
   authority; no bootstrap via helper, no reuse of a historic principal
   ID or credential. Each principal and grant must be established afresh
   under the adopted foundation. Bind nonce, expiry, issuer, epoch and
   idempotency; journal append-only; reject replay and cross-epoch grants.
   Require exact candidate and target preflight, separate execution
   approval, actual rollback evidence and independent readback.
4. Distinguish the new foundation's baseline and subsequent publication
   process explicitly from the old 1.3 -> 1.4 -> 1.5 continuity path.
   Do not assume the old version chain can be lawfully replayed in the
   new epoch. Independently review adoption of the preserved policy
   content and transition semantics before any claim of ACTIVE 1.5.0.
   No automatic adoption by projects; each must establish current grant
   and verify exact digest through its legitimate adoption contract.

### Acceptance matrix — specifications, NOT executed tests

| ID | Adversarial case / acceptance condition | Expected outcome |
| --- | --- | --- |
| RCV-01 | GitHub comment or repository admin alone claims old Owner | DENY continuity |
| RCV-02 | Historical identity lead without current validity/revocation evidence | DENY continuity |
| RCV-03 | No independent foundational mandate or mismatched challenge/digest | DENY foundation adoption |
| RCV-04 | A or B evaluation missing/stale, or a separately mandatory authenticated independent-review gate lacks its required distinct actor | DENY the affected admission; direct engineering remains eligible |
| RCV-05 | Unavailable historic row interpreted as absent or fabricated | DENY migration/adoption |
| RCV-06 | Replay, expired nonce, wrong epoch/target or revoked issuer | DENY, no mutation |
| RCV-07 | Duplicate or interrupted authorized transaction | At most one journaled result; safe retry |
| RCV-08 | Historical grant or publication used as new-epoch approval | DENY |
| RCV-09 | Target not isolated, binding inventory incomplete, rollback unproven | DENY execution |
| RCV-10 | Correct new-foundation inputs without separate release approval | No publication/promotion |
| RCV-11 | No-loss audit: old data untouched, prior seal unchanged, new decisions traceable | Independent readback required |
| RCV-12 | Policy activation/adoption claimed without live exact-version/digest proof | DENY claim |

### C2 and reviewer work in parallel

Keep C2 PARTIAL. The existing target D1 and retained bundle do not
prove exclusivity for all older Worker versions. Obtain source-bound
provider inventory of current and still-deployable historical versions,
bindings, routes, Access controls and rollback version. If the API
cannot expose enough evidence, document exact missing fields and
versions; request an independently reviewed change of admission scope
if justified, rather than silently treating current bindings as complete.
Do not upload, promote, create new resources, delete versions or revisit
a legacy provider to obtain this evidence. Do not rerun sealed P1 QA.

Reviewer A: independently evaluate C0/C1 legitimacy, trust anchors,
scope separation, C2 proof completeness, replay/transaction/rollback
criteria and unchanged seals. Reviewer B: independently evaluate whether
the prospective charter satisfies the Owner's Cloudflare-only,
ZERO-SPEND and no-data-loss requirements, intelligible disclosures,
recovery UX and usable decision path. Both should cite exact SHA, state
identity and role provenance, and return findings with explicit PASS,
FAIL or INSUFFICIENT_EVIDENCE per scope; advisory review is not an
authenticated runtime verdict. No verdict is pre-populated.

### Next required human decision (separate design work from protected admission)

If continuity evidence arrives, assess it under the existing protocol.
Otherwise prepare the prospective charter and present the actual findings to
the proprietor for a separate decision on adoption only after the independent
foundational mandate and all applicable admission evidence exist. The existing
Owner request already covers design; no repeat design approval is required. Actual foundation adoption requires the
independently established authority and digest-bound decision described
above. Do not wait for a separate reviewer service to perform ordinary engineering assessment or prepare the design. A direct, explicitly non-independent assessment can support design iteration and an optional Owner design-scope decision. It does not satisfy any mandatory independent or protected gate.
The helper stays quarantined and C0/C1 remain AUTHORITY_REQUIRED.


## Direct execution correction — R16/R17/R19/R22

Source-grounded assessment of the preceding draft at e0974439 (same
executing agent, NOT an independent A/B verdict):

- DEF-01, sequencing: requiring external reviewer availability before
  even preparing a design conflates engineering work and protected
  acceptance. The controlling execution rules permit direct analysis,
  scoped implementation and actual QA while independent review is
  unavailable. Mark reviewer NOT_RUN and defer only the transition that
  explicitly requires its verdict. No automatic gate waiver.
- DEF-02, evidence usability: the prior phrase "independently validated
  witness or other externally established trust anchor" is not yet a
  usable operator procedure. Separate proof of current repository and
  Cloudflare control, legal/project mandate for a *prospective* charter,
  and proof of old-law constitutional authority. They are different
  facts. GitHub account control and Cloudflare access cannot establish
  continuity or retroactively authenticate historic decisions.
- DEF-03, user-facing decision: distinguish design-scope acceptance
  from foundation adoption and runtime activation; provide a single
  bounded decision only when it is actually necessary. The existing
  request 7200334604 already authorizes ordinary design and testing;
  no additional design confirmation is needed to continue within it.

### Direct work order (not a new governing law)

1. Read exact existing requirements, source and evidence; classify
   each gap as ENGINEERING_READY, CAPABILITY_BLOCKED, or AUTHORITY_REQUIRED.
2. Perform engineering-ready work: inspect invariants, reproduce
   concrete defects, fix scoped root causes, test changed surface and
   affected regressions, assess result against actual requirements.
   Preserve existing seals; do not rerun accepted tests solely to
   manufacture progress. Stop speculative edits after three distinct
   failures; move to an independent eligible task.
3. For the prospective charter, prepare exact role/decision definitions,
   historical non-continuity disclosure and transition/rollback
   preconditions without creating a runtime credential or a grant.
   Assess each RCV criterion at source level, then implement/test only
   admitted ordinary candidate scope. Use NOT_RUN for unavailable tests.
4. For current control evidence, use already-authorized read-only
   GitHub repository metadata and existing Cloudflare account UI.
   Record account role/ownership only if actually displayed; account
   access and matching repository proprietor are corroboration, not an
   independently established foundational mandate. Do not request
   credentials in chat, access prior providers or invent a witness.
5. Present a concrete gap and exact evidence needed if no legitimate
   mandate or continuity instrument is available. If a distinct
   prospective foundation is considered, clearly disclose that the
   historic version chain cannot be treated as lawfully restored.
   Establish its legitimate authority independently before adoption.
6. All applicable mandatory review/Owner/QA/security/UX gates retain
   their existing meaning. Do not relabel direct assessment as
   independent; do not wait for A/B to do work that does not require
   them. No live state mutation, protected transition, publication or
   Production release merely because direct QA completed.

This corrects the candidate's execution ordering, not its authority
model or acceptance criteria. The quarantine remains effective; no
adoption, no C0/C1 or C2 PASS, and no new test execution is asserted.


## Correction: A/B means two evidence axes, not two mandatory reviewer people

Exact prior program: M0–M9 at PR #178
c6f3ea2b91342c58fa7bbf9b7a268ec22f200098, and proposed quality
standard at PR #177 8017ebfdc2da8bfee8993bfa009c804870ab2492,
control/quality-evaluation-standard.v1.json (12 technical and 10 user
metrics, each proposed threshold 90/100, all mandatory metrics required,
no cross-axis compensation). These are proposed rubrics, not newly
ratified law. Existing formal reviewer authorities remain distinct.

- A — Technical testing: actual source/runtime evidence for specification
  coverage, source-of-truth consistency, regression, P0/P1, security,
  state consistency, restart/recovery, migration/backup/restore, fault
  injection, latency, observability and applicable offline behavior.
  For this recovery scope, use isolated negative tests for RCV-01..12,
  including authorization denial, replay, revocation, stale SHA,
  duplicate transaction, interrupted persistence and rollback, only when
  implemented and executable. Retain prior helper quarantine tests as
  scope-bound historical evidence; do not rerun sealed P1 suites merely
  to claim progress.
- B — User testing: test the actual operator journey as a user: understand
  unavailable history and consequences, distinguish engineering approval
  from foundation adoption and publication, choose the correct permitted
  action without ambiguity, recover from expired/stale/denied states, read
  truthful status, verify data preservation, accessibility and effort.
  Define observable baseline/candidate tasks and expected outcomes.
  Browser-driven persona tests and AI walkthroughs are useful engineering
  evidence but not observed real-user outcomes. For this draft, B remains
  UNVERIFIED until representative real-user evidence is collected. Do not
  fabricate sample sizes, scores, usability trials or human acceptance.

Execution loop: requirements -> implement -> A technical test and B
user-journey test -> classify actual findings -> causal repair -> scoped
retest of both affected axes -> system reconciliation -> next READY work.
If one axis lacks runtime or user evidence, carry its honest status and
continue independent eligible implementation; only hold the specific
acceptance/transition requiring that evidence. No automatic PASS, waiver
of C0/C1/C2, protected release, constitutional ratification, or mandatory
qualified review. Reviewer A/B services can contribute evidence in parallel;
they are not prerequisites for ordinary test-and-fix work. No new scores or
test runs are asserted by this documentation change.

## Prospective charter v1 — concrete decision packet (NOT ADOPTED)

**Disposition:** old-law continuity NOT_PROVEN; prospective mandate
NOT_ESTABLISHED; C0/C1 not admitted. This is a candidate design, not an
authorization to operate a new foundation or replace the old one.
Owner engineering request 7200334604 remains sufficient for preparation.

### Record disposition

| Record family | Current evidence | Proposed treatment |
| --- | --- | --- |
| Constitutional normative law | main 1.3.0, immutable protocol blob 775247bf2c3bf2b00dac1a3587eaf32883e404e6 | Keep existing law and history unchanged; no declaration of successor ACTIVE |
| Prior Owner | PR154 blob ecced43ae67d947b8d5b8611909a7d4972a7cf9d, historical 2026-11-02 observation | Historical identity lead only; never restore a grant from it |
| Historical decision | PR98 amendment:79521378-d2c1-44f8-a0f3-2265a911a6a0, historical ratification observation | Preserve provenance; no reconstructed canonical row or reuse as approval |
| Principals, revocations, journals, pending work, adoption and publications | Complete current old-source rows unavailable | UNKNOWN_NOT_MIGRATED, not empty; deny automatic inheritance |
| Target | Existing Cloudflare D1 4f2a47a5-e250-45ae-8ed1-19afcb04415d | No initialization/reset/write; isolation, actual backup and rollback required |
| Candidate law | R33 Full Gate 45475370038; R34–R38 exact target 28d96c17936d7ce1bcf660f4dcc4c96d64497344 | Preserve seals; do not transfer protected acceptance to a changed authority mechanism |

No current preservation of the historical database itself is independently
verified; the observed fact is that these recovery operations did not
access or mutate it. The historic record register above does not certify
that the source still exists or that data is recoverable.

### Proposed authority roles and separation

- Project proprietor: may consider whether to establish a genuinely
  separate prospective governance foundation, after proof of mandate.
  Current GitHub repo owner metadata and authenticated account both show
  BlueDragon33 / subject 297152795; this corroborates current repository
  control only. Cloudflare account role and mandate remain unverified.
- Foundational authority: must be established outside the candidate,
  with scope, identity provenance, validity and revocation boundary
  verified before any adoption. An independently validated pre-existing
  instrument or trusted witness can support the mandate; neither is
  asserted here. No credential is created by this charter.
- Constitutional decision maker, project mutation actor, project review
  actor and exact artifact release actor: separately scoped grants,
  freshly established only after legitimate adoption. None is granted
  by GitHub/Cloudflare admin access, an engineering comment, UI, CI, or
  the A/B scores. Retain any required formal independent role separation.
- Executor/AI: prepare, test and report only; no human decision,
  credential issuance, ratification or publication authority.

### Decision and evidence path

| Step | Evidence / action | Success means | Does not mean |
| --- | --- | --- | --- |
| F0 | Reconcile old-source availability without reconnecting excluded providers; preserve existing Git references | Explicit historical disposition and unresolved inventory | C0 verified or data migrated |
| F1 | Obtain existing independently verifiable mandate/continuity instrument, if one exists; distinguish current project control from old canonical authority | A legitimate decision maker can be identified for a specifically scoped route | Automatic new or restored grant |
| F2 | If continuity is not established, show exact prospective charter and its SHA/digest, explicit break with old records and project impact, and verify separate foundational mandate | A prospective adoption decision can be considered | Old-law amendment or 1.5 activation |
| F3 | Obtain authenticated, separately authorized decision tied to exact charter digest, intended epoch, scope and validity; evaluate actual mandatory tests and applicable independent gates | A reviewed adoption decision, if independently valid | Runtime initialization or release approval |
| F4 | Only after valid adoption and separate implementation/execution authority, design and test a transactional initialization in the existing isolated target; verify C2 and rollback | Candidate/runtime evidence at exact revision | Permission to publish or overwrite old data |
| F5 | Review version transition semantics, issue exact ratifications and publications under the applicable legitimate framework, verify actual per-project adoption | Only observed, authorized status changes | Automatic inheritance or retroactive restoration |

Route C (existing-law continuity) may proceed only with a real
revocation-valid authority instrument and source disposition satisfying
the current protocol/P2. Route P (prospective foundation) must not be
presented as route C. If neither mandate exists, the protected route is
blocked; no self-issued challenge, synthetic signature or automatic
fallback. No additional confirmation is needed for already-authorized
ordinary design work.

### C2 operator handoff (one bounded action, not repeated QA)

Latest collector candidate 0a5ad1f9e6649fce2300c3adc251a5aa375f2ef0,
source blob 436a1797ec82ca90c80dc36b596374c3b7ef376f, ledger 7201266556.
Run in the existing authenticated environment only:
`node experiments/d1-publication/collect-c2-inventory.mjs`.
Use an already-authorized Workers read credential privately via the
existing secure environment, never send a token or raw payload. If
unavailable, report READ_TOKEN_UNAVAILABLE; do not create a credential
or another resource automatically. Submit only the sanitized result
and exact source identity. TARGET_REFERENCE_FOUND requires binding
reconciliation; INCOMPLETE requires the named missing observation;
NO_TARGET_IN_OBSERVED_STANDARD_VERSIONS is limited negative evidence,
never C2 admission. A no-reference result does not verify account-wide
coverage, other Worker surfaces, Access, routes, plan, D1 schema or
rollback. No live C2 result has been received at this checkpoint.

### Operator journey acceptance (design inspection only)

1. Read the prior request: design is already authorized; do not ask
   the operator to submit it again.
2. Select the applicable route: if only GitHub identity or old UI
   evidence is available, both protected routes remain blocked.
3. If no Cloudflare read credential exists, stop only the C2 query.
   Keep the design and existing evidence; never paste credentials.
4. If a valid new mandate is provided, distinguish the exact
   adoption decision from runtime promotion, constitutional ratification
   and project adoption. Do not label old data restored.
5. Without an authenticated publication record and exact active
   readback, show ACTIVE 1.3.0 and candidate 1.5.0 separately.

These are operator task scripts, not measured human trials or runtime
tests. The proposed charter changes no code, seals, authority model,
provider configuration or accepted tests. No overall A/B score.
