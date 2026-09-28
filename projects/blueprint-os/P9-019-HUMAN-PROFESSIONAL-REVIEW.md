# P9-019 — Human Professional Review

Status: **REVIEW CANDIDATE — HUMAN SIGN-OFF REQUIRED**

## Evidence reviewed

- exact application revision: `f936d3e4eb6a56671415e9f500b0935159baf49d`;
- full Release Gate run: `36441844449` — PASS;
- screenshot artifact: `10978228236`;
- artifact digest: `sha256:63400e4ef649f8c88e54b711052e194251c42c313e69ff9ac429b5d602b580cf`;
- desktop, tablet/iPad-class and mobile evidence inspected;
- representative surfaces reviewed: Projects/Compass, canonical workspace, Constitution/Compliance, Quality, Portfolio, Data Lifecycle, Prompt, Knowledge/Reference Case, Releases/Lessons.

## Refresh reason

The previous candidate became stale after adding the fail-closed human-review runtime readiness surface, safe configuration diagnostics and the local environment contract. The current candidate is bound to the exact remediated revision and refreshed responsive Human UX evidence.

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

## Runtime readiness remediation

A secure review mechanism is still not operational if missing runtime configuration causes opaque authentication failures or server errors.

The P9-019 flow now includes `/professional-review/readiness`, a fail-closed preflight that checks, without rendering secret values:

- required PostgreSQL/Auth.js/GitHub OAuth/bootstrap environment configuration;
- PostgreSQL connectivity;
- presence of the authority bootstrap and human-review decision persistence tables;
- whether the local HTTP authentication exception is enabled.

The page links into System Owner setup only when no blocking preflight check remains. `.env.example` defines the local configuration contract, while the runbook remains the operator procedure.

This runtime readiness remediation is captured by full Release Gate `36441844449` on exact revision `f936d3e4eb6a56671415e9f500b0935159baf49d`. Earlier P9-019 candidates are stale.

## Security hardening after operational bootstrap

The first operational bootstrap implementation revealed two additional defects during review:

1. **First-login takeover risk** — one-time bootstrap was atomic but any authenticated account could claim Owner before initialization.
2. **Local review cookie mismatch** — `next start` on HTTP localhost could look for the secure Auth.js cookie solely because `NODE_ENV=production`, while real local review must remain supported.

The remediation now requires an exact deployment-configured provider + provider subject before the bootstrap control is exposed or the server action executes. Missing/mismatched identity fails closed. Localhost/loopback uses local HTTP session-cookie lookup, while non-local Production hosts stay secure-cookie-only.

The secure bootstrap and cookie policy remain part of the current refreshed candidate.

See `docs/P9-019-HUMAN-REVIEW-RUNBOOK.md`.

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

This remediation is now captured by full Release Gate `36416876423` on exact revision `30e536e077e0172c9fb8819ea5ab9a280f407f26`. Earlier P9-019 screenshot candidates are stale.

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

