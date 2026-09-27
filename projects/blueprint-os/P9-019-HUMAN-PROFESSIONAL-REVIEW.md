# P9-019 — Human Professional Review

Status: **REVIEW CANDIDATE — HUMAN SIGN-OFF REQUIRED**

## Evidence reviewed

- exact application revision: `6da60278e4ef03a95f137eae1902a4054de66120`;
- full Release Gate run: `36252022005` — PASS;
- screenshot artifact: `10908943707`;
- artifact digest: `sha256:44c493d1373e4e27edef26ce6fae11465b7a0dc8adf1af2d85c77fdcf3d5aa7d`;
- desktop, tablet/iPad-class and mobile evidence inspected;
- representative surfaces reviewed: Projects/Compass, canonical workspace, Quality, Portfolio, Data Lifecycle, Prompt, Knowledge/Reference Case, Releases/Lessons.

## Professional review findings

### Blocking defects

No P0/P1 defect was observed in the captured evidence.

### P2 — Quality mobile evidence length

The Quality surface remains readable and does not overflow horizontally, but evidence-heavy projects can create a long vertical scan on mobile.

This does not block the gate. Preserve progressive disclosure and add filtering/collapsing only when real evidence volume justifies it.

### P2 — Data Lifecycle sparse tablet state

A project without a checked-in lifecycle policy correctly refuses to inherit policy from another project. The tablet empty state is therefore semantically correct, but visually sparse.

This does not block the gate. A future improvement may add contextual setup guidance without creating policy authority.

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
- keeps every tracked finding visible;
- requires explicit acknowledgement of every finding before approval;
- obtains reviewer identity from the authenticated server session;
- generates the decision timestamp on the server;
- persists one append-only decision for the exact candidate in PostgreSQL;
- prevents a second decision from silently rewriting the same candidate;
- enforces `PROJECT_REVIEW` authority;
- keeps `productionReleaseAuthority = false` for every outcome.

Automated Playwright coverage verifies that the review control is reachable, responsive and fail-closed, but it deliberately does **not** submit an approval. Automated testing remains evidence about the decision mechanism, not the human sign-off itself.

