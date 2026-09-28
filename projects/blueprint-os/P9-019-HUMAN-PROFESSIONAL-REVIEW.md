# P9-019 — Human Professional Review

Status: **REVIEW CANDIDATE — HUMAN SIGN-OFF REQUIRED**

## Evidence reviewed

- exact application revision: `c407386d5e7f112d8be39a3800a4e7a0444bec5e`;
- full Release Gate run: `36409922206` — PASS;
- screenshot artifact: `10963368635`;
- artifact digest: `sha256:559428654aa09e5349d808449425364df4a4671574496292a768ab1a6fcdea9b`;
- desktop, tablet/iPad-class and mobile evidence inspected;
- representative surfaces reviewed: Projects/Compass, canonical workspace, Constitution/Compliance, Quality, Portfolio, Data Lifecycle, Prompt, Knowledge/Reference Case, Releases/Lessons.

## Refresh reason

The previous candidate became stale after Release Gate governance parity was hardened and stale evidence fixtures were repaired. The current candidate is bound to a new exact revision and new responsive UX artifact.

## Professional review findings

### Blocking defects

No P0/P1 defect was observed in the refreshed captured evidence.

### Remediated — Quality mobile evidence length

The prior P2 mobile scan finding was addressed with a searchable, status-filterable Quality Gate register. The existing progressive-disclosure evidence register remains intact, while the user can now reduce a large gate set without losing canonical status or provenance.

Release Gate E2E verifies search by evidence revision and filtering by gate status.

### Remediated — Data Lifecycle sparse tablet state

The prior P2 sparse tablet finding was addressed with project-scoped setup guidance for projects that do not yet have a checked-in lifecycle policy.

The guidance explains record-kind selection, retention/archive definition and destructive-action blockers while explicitly creating no policy, executing no destructive action and granting no Production authority.

### Current candidate finding state

No tracked P0/P1/P2 finding remains open in the refreshed review candidate. Human professional sign-off is still required; remediation and automated evidence do not self-approve P9-019.

## Boundary

The professional visual review above is **AI-assisted evidence review**, not a human sign-off.

P9-019 must not be marked COMPLETE until an explicit human review decision is recorded against this exact review candidate (or a newer exact revision). Automated CI, screenshots or model judgement cannot manufacture that approval.

Production release authority remains false.

## Decision protocol

The application layer now exposes an explicit, fail-closed human review decision protocol.

A decision is valid only when:

- it originates from an authenticated user action;
- reviewer identity and an exact UTC decision timestamp are present;
- the decision is bound to the exact reviewed revision and screenshot artifact digest;
- every tracked finding is acknowledged before an approval;
- any unresolved blocking P0/P1 finding prevents approval;
- request-changes/reject remain blockers and cannot advance P9-020;
- an approval may authorize only the transition to P9-020; it still grants **zero Production release authority**.

No approval decision is checked into source control. The current canonical state therefore remains **HUMAN SIGN-OFF REQUIRED** until an actual human action records one.

## Operational authority setup remediation

A review surface is not operational if no real authenticated account can acquire the authority required to use it.

ADR-0003 requires an explicit one-time Owner bootstrap path. The P9-019 implementation now includes `/setup/owner`, which:

- requires an Auth.js-authenticated identity;
- delegates to canonical `AuthorityService.bootstrapOwner`;
- creates exactly one System Owner through the transactional authority repository;
- fails closed if an Owner already exists, preventing takeover by another authenticated account;
- creates no P9-019 approval, P9-020 acceptance or Production authority;
- routes the configured Owner back to the separate professional-review decision surface.

Responsive E2E coverage verifies signed-out authentication guidance, configured-Owner recognition and takeover rejection.

Because this remediation changes the reviewed product surface, any earlier P9-019 screenshot candidate is stale until a new exact-revision full Release Gate is captured.

## Review recording surface

The development baseline now includes a first-class `/professional-review` surface so the human gate can be performed through an authenticated product action rather than by editing source text.

The surface:

- shows the exact candidate revision, Release Gate run, artifact ID and digest;
- links directly to the exact GitHub Actions run and screenshot artifact;
- lists the reviewed desktop/tablet/mobile viewports and the exact product surfaces covered by the evidence;
- keeps every currently tracked finding visible;
- requires explicit acknowledgement of every tracked finding before approval, and shows a clear no-acknowledgement state when the refreshed candidate has no open findings;
- obtains reviewer identity from the authenticated server session;
- generates the decision timestamp on the server;
- persists one append-only decision for the exact candidate in PostgreSQL;
- prevents a second decision from silently rewriting the same candidate;
- enforces `PROJECT_REVIEW` authority;
- keeps `productionReleaseAuthority = false` for every outcome.

Automated Playwright coverage verifies that the review control is reachable, responsive and fail-closed, but it deliberately does **not** submit an approval. Automated testing remains evidence about the decision mechanism, not the human sign-off itself.

