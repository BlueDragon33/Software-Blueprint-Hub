# P9-008 — Observability & Incident Diagnostics

Status: **RELEASE-GATE CANDIDATE**

## Purpose

Make operational failures explainable without turning logs into a secret-leak channel or a source of release authority.

P9-008 extends Storey 16 — Operational Resilience after canonical backup/restore integrity was established by P9-007.

## Contract

Every operational diagnostic must carry:

- an exact or explicit source revision;
- a correlation ID;
- a bounded context;
- an operation identifier;
- a structured error category;
- severity;
- a user-safe message;
- an operator-safe summary;
- recovery guidance.

Diagnostics are explanatory evidence only. They cannot PASS a Quality Gate or authorize Production release.

## Secret boundary

Before diagnostic metadata or operator text leaves the diagnostic boundary:

- sensitive keys such as passwords, secrets, tokens, Authorization, cookies, API keys, sessions, credentials and private keys are redacted;
- common bearer/basic/GitHub/OpenAI/JWT-like token strings are redacted;
- user-visible runtime error recovery exposes only a safe incident reference, never a raw stack trace.

## Correlation

Multiple records sharing the same correlation ID may be summarized into one incident view.

The summary preserves:

- highest severity;
- all involved source revisions;
- bounded contexts;
- error categories;
- diagnostic IDs;
- deduplicated recovery guidance.

## Product UX

`/diagnostics` provides an inspectable Development Baseline surface for the diagnostic contract.

It deliberately demonstrates redaction using non-production sample values and exposes no canonical project data or secrets.

The System Compass links directly to Incident Diagnostics.

## Acceptance

P9-008 may complete only when:

1. structured diagnostics preserve revision/context/operation/correlation;
2. sensitive metadata keys are redacted;
3. token-like strings are redacted;
4. incident correlation is deterministic;
5. absent correlation evidence fails closed;
6. global runtime recovery surfaces a safe incident reference when available;
7. diagnostics carry `productionReleaseAuthority: false`;
8. source-of-truth contradiction checks remain green;
9. exact candidate Fast CI passes;
10. full Release Gate passes on the candidate revision;
11. Production deployment remains a separate explicit action.

## Current candidate evidence

- PR: #44
- Fast CI on `162a6a1f3a6b57d99b2cdc7afc7d1490314a548d`: **SUCCESS**
- Full Release Gate: pending candidate revision below
- Production deployment: **NOT AUTHORIZED BY THIS GATE**
