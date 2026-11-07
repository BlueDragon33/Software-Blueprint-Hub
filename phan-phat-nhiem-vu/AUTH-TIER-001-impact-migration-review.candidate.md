# AUTH-TIER-001 — Impact / migration / human-review brief

**Status:** PRELIMINARY IMPACT DRAFT — NOT reviewed by independent actor; NOT ratification-ready. Policy ACTIVE 1.3.0 at main `cd01fb3c2178393628ce968af209db082227d2c4`. Proposal intake branch original `339e2c7fb6bc33f04b0bd082ce894211688e2ec8`. Source snapshot 2026-11-07, no runtime tests or deployed changes.

## Inventory and discrepancy

- Governing registry `control/constitution-governed-repositories.json`: **15 unique repositories**, all GitHub repository metadata reachable. Accounts proposed: 11 AUTH-L1 (mostly optional), 1 AUTH-L2 (BOIECH_AI), 2 AUTH-PLANE (Hub, Application-Management), 1 NOT-APPLICABLE (ROS-1-2, branch `ros2`).
- `Application-Management/app/project-registry.ts` at main `f347bd0ccd5e7f7e4e4bca4a31168e1219c18370` lists **14 unique projects**, missing **`BlueDragon33/pc-manager-desktop`** versus governed 15. It contains additional legacy/module aliases that are not independently governed repositories. This is a real reconciliation finding; fix under existing App-Manager project scope after its Owner gate, not by changing the Hub registry without evidence.
- Verified existing `BOIECH_AI` Issue #108 is OPEN, 2026-11-07; requests two server-reviewed onboarding decisions, account/device isolation, 5/10/200 role quotas, 3 device slots, scoped consent-based sync, Cloudflare Workers/D1 Free target. Its own source candidate, realistic D1 QA and KDF runtime cost are still unverified for this work.
- OPEN Hub PRs at inspection: #94, #101, #141, #147, #149, #150, #151, #152, #153, #154, #155, #156, #157. #155/#156 edit Next Action/Constitution proposal, #154 is signed review identity and #153 is timestamp QA. None of these is already ratified by this AUTH proposal. No version collision resolution or combined canonical merge has been proved.

## Risk and architectural decision

**Critical:** central Owner authority, delegated account impersonation, health and children's private data, payment/paywall cost drift, BOIECH D1 migration and session/device race conditions. **High:** offline entitlements, existing Device Gate and identity mappings, family privacy, PC Manager P-256 agent, modem-local credentials, CAD/PriceReport local datasets. **Medium:** undeployed/open-only math/simulation/ROS distinctions. The proposed contract is additive and defaults OFF; retaining offline/local core and keeping app-owned databases is a mandatory design constraint.

**Version class:** compatible minor *candidate*, but exact version + R-number **UNDECIDED** because open constitutional amendment lanes can move it. A change requiring existing offline-local users to log in would be breaking/out-of-scope. Do not rewrite active 1.3.0 or copy branch file over active canonical set. A combined version set needs distinct normative, machine contract, template, policy source and version metadata pinned to exact bytes.

## Migration plan (not yet authorized)

| Wave | Trigger | Deliverable | Stop condition |
|---|---|---|---|
| M0 | current DRAFT | cross-PR conflict matrix, exact-SHA reference, per-repo classification validation, threat model | missing owner source or mismatch |
| M1 | independent technical/security review | verified impact and backward-compatible schema extension; schema+negative tests and target-runtime feasibility | unsolved risk or version collision |
| M2 | authenticated Constitutional Human ratification on exact revision and evidence | append-only decision, exact normative/contract/template source set | no authenticated ratification |
| M3 | separately authorized publication | publish canonical version set with source/readback and migration guide | mismatch in version set or tests |
| M4 | after published | one Project Profile projection and Work Package per governed repo; Owner confirms optional/required/N/A + baseline; no automatic feature enable | missing per-project authority |
| M5 | QA pilot L2 BOIECH and pilot L1 Bauman on separate draft app PRs | migration rehearsal, server authorization tests, real app Preview/device/role/UX tests, FREE capacity; security review | no real runtime/reviewer/cost data |
| M6 | subsequent local-first/high-risk projects | opt-in rollout with backups, additive mapping, canary, rollback, adoption readback, scoped evidence | privacy, offline or restore failure |
| M7 | separate Production decision | exact artifact Owner/Production approval, free infra verification, observed rollback plan | cannot claim Production readiness |

**Per-repository tasks** are individually authored in `AUTH-TIER-001-project-workpackages.candidate.json`. They are task **candidates**, not dispatched to 15 repos; propagation follows publication, not this draft.

## Compatibility / backup / reversal

Existing users/accounts and app-specific sessions persist unchanged until each app migration is reviewed. Add nullable/app-scoped account identifiers only after explicit ownership mapping. Back up DB including foreign-key anchors, restore into a disposable environment and check row counts, associations and historical certificates. Do not merge identities based on name/phone. Gate new reads/writes behind OFF flags; rollback disables new paths, not deletes legacy data. Per-device revocation is server-effective; offline copies may remain and must be represented honestly. Preserve original URLs/slugs, current FREE billing tiers, no new service/database and no GitHub-hosted Actions.

## Acceptance matrix — evidence status

| Check | Current status |
|---|---|
| Input files / current Hub main version / protocol | SOURCE-READ |
| 15 registry identities accessible | SOURCE-READ |
| App Manager registry alignment | FINDING: 14 vs 15 (pc-manager-desktop missing) |
| Contract and per-app plans | CANDIDATE SOURCE ONLY |
| Source-only static JSON consistency | SELF-CHECK ONLY (not independent review) |
| Real application login/device/role UX | NOT_RUN |
| D1/PostgreSQL migration and concurrency | NOT_RUN |
| Cloudflare Workers Free CPU / KDF benchmark | NOT_RUN |
| Browser/offline/privacy/backup restore | NOT_RUN |
| Independent authorized security and constitutional review | BLOCKED / NOT_PROVEN |
| Authenticated human constitutional ratification | NOT_REQUESTED / NOT_GRANTED |
| Canonical publication / Project propagation / Production | NOT_DONE |

## Human Constitutional Authority decision packet (NOT ready for approval)

Proposed scope: **AUTH-01…AUTH-12** as reviewed additive classification + conditional account-management requirements; preserve AUTH-PLANE and N/A exceptions. Sign-off must identify exact amendment source revision and digests, consensus version/R-number after conflict reconciliation, 15 Project Owner-approved profiles, independent security/privacy/offline review, schema migration test plan, FREE capacity evidence for pilot and exact version set. Do **not** ask Human Authority for a generic yes/no of this changing draft; present only at RATIFICATION READY after independent evidence.

**Current blockers:** missing independent authorized review; target version/R-number unresolved against existing PRs; registry mismatch; no per-project Owner validation or target-runtime/migration QA; no authenticated human ratification.

**One Active Next Action:** Obtain authenticated independent security/architecture impact review of the exact AUTH-TIER-001 candidate and resolve the 14/15 registry discrepancy and R33/R34 version collision in the existing amendment workflow; remain DRAFT, do not publish or propagate.
