# ADR candidate — provider-neutral execution, hosting and controlled Cloudflare evaluation

Status: **PROPOSED / NOT RATIFIED / NOT DEPLOYED / NO PRODUCTION AUTHORITY** (2026-11-02)
Scope: existing Software-Blueprint-Hub; Constitution 1.3.0; P2 authenticated read-only reviewer; no new project or site.
Owner direction: remove the former hosting-provider dependency from code, operational prerequisites and future action plans. Existing public URLs and historical evidence must not be silently deleted, rewired or promoted.

## Decision and authority boundary

1. GitHub is source/PR/review/CI evidence transport; exact SHA and signed verification are mandatory. It is **not** the application's user database or an authenticated user session.
2. Provider-neutral disposable GitHub Actions + PostgreSQL are preferred for protocol and contract tests. A fixture or green CI must not claim the authenticated real-service E2E, a human decision or Quality Gate PASS.
3. Long-running online infrastructure is **optional and separately approved**. No automatic deployment on push, merge, CI success or `workflow_dispatch` alone. Follow `docs/DEVELOPMENT_RELEASE_POLICY.md` and `control/development-runtime-policy.v1.json`.
4. A future Cloudflare Workers adapter **may be evaluated in place** for the existing Next.js app; it is not selected for Production. Do not scaffold a new website, change application slug, domain, GitHub OAuth app settings, secrets, D1 schema or Neon credentials in this Draft PR.
5. All canonical state remains in existing PostgreSQL until a separately reviewed data/identity migration is approved. Do not substitute D1/KV or isolated CI PostgreSQL for canonical records.
6. Preserve pre-existing production/live endpoints as historical operational facts until a separately authorized cutover/decommissioning procedure with rollback and owner approval. No new domain or hostname is inferred.
7. Publication readback now accepts only explicitly set **`BLUEPRINT_DEPLOYMENT_REVISION`**, an exact immutable commit SHA for the **running** artifact, never a vendor-injected SHA or an untrusted CI SHA. When absent/stale, publication fails closed. `CONSTITUTION_POLICY_VERSION` remains 1.3.0 in Draft source and must match deployed code evidence.

## Cloudflare compatibility decision matrix — evaluation only

| Option | Status | Reason |
| --- | --- | --- |
| Existing local Next.js (Node) + isolated PostgreSQL | CURRENT DEVELOPMENT PATH | Keep for tests, authentication and feature-parity reference. No internet-facing publication. |
| Existing app adapted to Cloudflare Workers with vinext | CANDIDATE / NOT VALIDATED | Cloudflare currently recommends vinext for Next.js; it is beta. Check React Server Components, server actions, Next.js 16.3.6 compatibility, Node APIs, and request-scoped environment, then compare app behavior to original Node build. |
| Existing app adapted with OpenNext for Workers | ALTERNATIVE / NOT VALIDATED | Explore only if compatibility shows vinext gaps; requires separate adapter, `nodejs_compat`, worker runtime build and exact version qualification. |
| Cloudflare Pages static export | NOT SUITABLE WITHOUT REDESIGN | Hub uses authenticated server routes, Prisma/PostgreSQL, server actions and SSR; a static Pages export cannot be assumed equivalent. |
| Existing managed runtime / self-controlled Node server | FALLBACK / NOT APPROVED | Could preserve Node semantics with an approved host; does not waive access, backup, budget, security or Production gates. |

Official technical references:
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- https://developers.cloudflare.com/pages/framework-guides/nextjs/

## Mandatory engineering checks before any host choice

- **Source integrity:** exact Hub/QA/Gateway/Worker revisions, Constitution version, contracts and full CI state. No merge while known launcher tests fail unless separately resolved and accepted.
- **Runtime:** verify Next.js 16 App Router, route handlers, Auth.js JWT `getToken`, server actions, Node crypto/stream API, `@prisma/adapter-pg` / `pg`, Prisma Client generation, connection pooling and Workers memory/CPU and concurrent requests. Do not assume the code is portable without tests.
- **Identity:** the existing GitHub OAuth redirect must match the exact *separately approved* origin; do not reuse a production callback on a new preview. `AUTH_SECRET` and all credentials remain server-only, secure cookies required on HTTPS, no first-come-first-served Owner bootstrap.
- **Database:** read-only schema and compatibility first; independent migration approval/backup/restore plan if needed. Preserve System Owner principal, append-only issuer/adoption/claim histories and exact `recordVersion`.
- **Security:** independent review for provider bindings, secret storage, OAuth callback isolation, client/server boundaries, CDN caching of private routes, no-store diagnostic endpoints, inbound/outbound restrictions, origin and authorization checks.
- **Operations:** check observability with privacy redaction, provider cost limits, long-term maintenance, scaling, exportability, recovery time, domain/cert/DNS ownership, rollout/rollback and compatibility with Application Management routes and existing IDs.
- **Evidence:** run local/offline smoke and isolated PostgreSQL tests; if approved, an existing bounded non-Production runtime with real GitHub session must prove `GET /api/authority/p2-session` HTTP 200, `activeCodePolicyVersion=1.3.0`, exact artifact SHA, and `AuthorityService.require(PROJECT_MUTATE)`. This is a capability observation **only**, not issuance of a grant.
- **Stop:** any unresolved adapter behavior, absent approved origin, missing deployment SHA, bad Auth.js callback, lost canonical database, failed gate or unavailable independent review => **BLOCKED**, no automatic fallback to a legacy host or synthetic E2E.

## Preserved proof and phase status

- P2 proposal Work Package remains **blocked** and P2 Quality Gate **not-ready** until authenticated canonical service writes are separately authorized.
- Older deployed UI previously displayed policy 1.1.0; this is **not** evidence that the Draft 1.3.0 source runs on that host. Legacy URL remains an observation only, never a recommended preview.
- Historical hosting-specific material remains accessible in version-control history; this ADR replaces it as current provider-neutral operational guidance. The rewrite is not a Constitutional amendment or approval to decommission a live endpoint.

## One candidate next action

**CLOUDFLARE-READINESS-EVIDENCE (NO DEPLOY):** on the existing Hub Draft PR, run the compatibility and architecture tests with exact source, record actual adapter gaps and owner-controlled approval requirements. No new Worker/Pages site, namespace, hostname, callback or Production mutation.
