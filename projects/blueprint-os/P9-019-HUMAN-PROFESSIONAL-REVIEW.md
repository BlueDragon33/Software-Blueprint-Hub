# P9-019 — Human Professional Review

Status: **REVIEW CANDIDATE — HUMAN SIGN-OFF REQUIRED**

## Evidence reviewed

- exact application revision: `c2190d1540edaf2946d866e3719cd8fa78172719`;
- full Release Gate run: `36317309428` — PASS;
- screenshot artifact: `10931137598`;
- artifact digest: `sha256:603a9fc0b91bfa29d99fc8c1aa2b65c72ade18c87d657050f1343b4ff8fcc9e4`;
- desktop, tablet/iPad-class and mobile evidence inspected;
- representative surfaces reviewed: Projects/Compass, canonical workspace, Quality, Portfolio, Data Lifecycle, Prompt, Knowledge/Reference Case, Releases/Lessons.

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

