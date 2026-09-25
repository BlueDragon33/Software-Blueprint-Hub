# ADR-0003 — Authentication and authority model for V1

Status: Accepted for Foundation planning  
Date: 2026-09-25

## Context

The architecture distinguishes Owner, Editor, Reviewer and Viewer even when one person initially operates the product. Building an unauthenticated production mutation surface would violate the Security Constitution.

## Decision

Use Auth.js as the web authentication integration for the initial Next.js application.

Initial deployment mode:

- authenticated accounts are required for any persistent project mutation;
- the first configured account may bootstrap an Owner role through an explicit one-time setup path;
- project authority is stored by Blueprint OS, not inferred from UI routes or OAuth provider claims;
- roles remain Owner / Editor / Reviewer / Viewer;
- authorization is checked in application services/policy guards;
- provider access tokens are not copied into ordinary Blueprint project records.

Authentication provider selection is deployment configuration. GitHub OAuth is an initial supported provider, not a Universal Core assumption.

## Alternatives considered

1. No authentication in V1.
2. One hard-coded admin password.
3. Authentication provider claims directly equal Blueprint roles.
4. Auth.js identity/session + Blueprint-owned authorization.

## Rationale

Option 4 separates identity/session concerns from project authority and allows the project to start with one operator without designing itself into single-user assumptions.

## Consequences

Positive:
- protected mutations from the first persistent deployment;
- future multi-user expansion does not require redefining domain authority.

Cost:
- bootstrap-owner flow and authorization tests are required before production use.

## Security constraints

- fail closed when session/authority cannot be established;
- no client-only authorization;
- no role escalation from generated prompts;
- role changes are auditable protected actions;
- OAuth/provider secrets stay in environment/provider secret management.

## Validation

Integration tests must cover:
- unauthenticated mutation denied;
- Viewer mutation denied;
- Editor allowed only within granted scope;
- Reviewer does not gain Owner actions;
- Owner bootstrap cannot be repeated to seize an initialized system.
