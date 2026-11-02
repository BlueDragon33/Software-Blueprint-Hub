# Cloudflare Workers local compatibility investigation — 2026-11-02

**Status: SOURCE + CLI OBSERVED; WORKERS RUNTIME / ADAPTER / AUTHENTICATED E2E NOT VERIFIED.**
Applies to existing Hub Draft PR #154 and independently pinned QA Worker Draft PR #5.
No new account, Worker/site, Pages project, hostname, domain, Auth.js callback, SSO trust, canonical Neon database, secret or Production publication was created/changed.

## Experiment and source

The GitHub Actions workflow `.github/workflows/cloudflare-compatibility-local.yml` runs in an ephemeral `ubuntu-24.04` runner with `contents: read` only and no deployment environment or cloud API token. It retains sanitized, short-lived artifacts of each CLI result.

First independent evidence: [vinext/OpenNext local probe run #41441384999](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/41441384999) at Hub source `44d7a73b647f51869d3947a8eb5d6296f7f94761` (a predecessor to the current candidate). Later exact HEAD runs must be checked independently rather than borrowing the result as new-head PASS.

1. Installed pinned Hub monorepo dependencies with pnpm 12.4.0, generated Prisma Client and successfully typechecked the unchanged Next.js application on Node.js 24.
2. `pnpm dlx vinext@latest check` ran inside the **existing `apps/web`** (no `init`, config rewrite, package change, runtime server or deployment). Observed `vinext 1.4.0`, CLI exit **0**, **96%** source compatibility, **12 supported / 1 partial / 0 issues**. All six observed Next.js imports supported: `next/link`, `next/navigation`, `next/server`, `next/cache`, `next/headers`, `server-only`. The partial feature is `reactStrictMode` for App Router. The tool observed 29 pages, 1 layout, 6 route handlers and 1 error boundary; its enumeration is its own, not a claim that every source route is tested. **This is a static compatibility check, not workerd parity.**
3. `npm view @opennextjs/cloudflare@latest version peerDependencies engines --json` exited **0**, proving the npm registry metadata was reachable. An attempt to run the OpenNext CLI help in the disposable runner was stopped by pnpm's **`ERR_PNPM_IGNORED_BUILDS`** policy for `esbuild` and `workerd`; exit **1**. This is a **supply-chain/build permission blocker**, not a verified compatibility defect of OpenNext. No blanket approval of package build scripts or bypass of pnpm policy is allowed from this task.
4. Static inventory `scripts/assess-cloudflare-worker-compat.mjs` enumerates local Next.js/Prisma/Auth.js/SSO/Node API use and always emits `ADAPTER_RUNTIME_NOT_VERIFIED`; prior run reported 9/9 expected **source markers**, 6 route handlers and 6 server-action modules, plus `node:crypto`, `node:zlib`, `node:util` imports. Counts express source presence, not runnability.
5. CI now also runs existing Auth.js, Application-Management SSO and Owner session fail-closed unit tests under **Node 24**, not under Workers. The existing isolated PostgreSQL P2 official migration and append-only journal tests are a separate disposable service experiment; they cannot demonstrate Workers-to-Postgres TCP operation.

## Compatibility matrix with honest limits

| Surface | Evidence | Status |
|---|---|---|
| Next.js 16.3.6 App Router, routing, SSR and common imports | vinext 1.4.0 static checker 96%, CLI exit 0 | SOURCE_CHECK_PASS; RUNTIME_UNVERIFIED |
| `reactStrictMode` | vinext partial support for App Router | PARTIAL / must parity-test |
| Server Actions, React Server Components | source patterns + vinext general feature support | WORKER_RUNTIME_UNVERIFIED |
| Auth.js `getToken`, signed JWT/secure cookies and actual GitHub callback | Node tests and static source; no actual workerd/Auth.js request | WORKER_RUNTIME_UNVERIFIED |
| Application-Management PKCE/SSO exact HTTPS origin, `node:crypto`, HttpOnly cookies | Node tests; no origin or runtime configured | WORKER_RUNTIME_UNVERIFIED |
| Prisma 7 `PrismaPg`, generated native client, `pg` TCP, connection pooling and Neon read-only | Node typecheck and separate disposable PostgreSQL integration | WORKER_DATABASE_UNVERIFIED |
| Node APIs `node:crypto`, `node:zlib`, `node:util`, Buffer, stream and abort behavior | source inventory only; some Workers Node modules may be stubs | WORKER_NODE_API_UNVERIFIED |
| vinext full bundle, local workerd startup and HTTP smoke | no `vinext init` or Worker config was generated | BLOCKED / NOT_RUN |
| OpenNext CLI, build and local workerd parity | npm metadata 0; CLI blocked by pnpm ignored builds | SUPPLY_CHAIN_BLOCKED |
| Cloudflare Pages static export | Hub uses server routes, Prisma, Auth.js and server actions | NOT_EQUIVALENT_TO_FULL_STACK |
| Signed 3-service P2, canonical issuer/adoption, reviewer and Production | external authority, missing prerequisites | BLOCKED; NOT_AUTHORIZED |

## Security, next validation and stop rules

Cloudflare's current official Next.js guide recommends beta vinext for existing Next.js 16 and `vinext check` before non-destructive `init`. OpenNext is an alternative for established projects with migration gaps. Cloudflare Node compatibility is versioned and can contain non-functional module stubs; declared import support does not prove API semantics.

- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/
- https://developers.cloudflare.com/workers/configuration/compatibility-flags/
- https://developers.cloudflare.com/workers/local-development/

**Do not** run `vinext init`, `wrangler deploy`, `wrangler setup`, `opennextjs-cloudflare deploy`, approve package postinstalls, attach remote bindings, configure a new origin or log into a cloud provider as part of this evidence stage. If local workerd testing is later explicitly authorized, first review the dependency build-script permissions and sandbox boundaries; use only disposable local binding fixtures and no canonical database credentials.

**One next technical gate:** `WORKER-LOCAL-ADAPTER-TRUST-REVIEW`: review and pin exact adapter/dependency versions and the `workerd`/`esbuild` build-script allowlist, then separately decide whether a fully sandboxed *local-only* runtime comparison is permissible without creating any cloud resources. Until then all Worker compatibility, in-app Owner capability and three-service E2E remain UNVERIFIED.
