# WORKER-LOCAL-ADAPTER-TRUST-REVIEW — 2026-11-02

**Scope:** Blueprint Hub Draft PR #154 + independent QA Worker Draft PR #5; Constitution 1.3.0.  
**Decision: CANDIDATE ALLOWLIST ONLY / BUILD-SCRIPT EXECUTION DENIED / LOCAL WORKER RUNTIME NOT AUTHORIZED.**  
No live services, D1, Worker/site, hostname, OAuth redirect, real PostgreSQL, Neon database, domain or Production change.

## Source/version constraints observed before this stage

- Hub package lock and `apps/web/package.json` declare `next=16.3.6` on Node 24, `@auth/core=0.41.3`, Prisma 7.10.0 and `@prisma/adapter-pg`.
- Previously observed `vinext=1.4.0` static `check` reported **96% compatible** (12 supported, 1 partial, 0 issues). This is a **Next.js import/config analyzer**, not a workerd or Postgres check.
- Previously queried pinned `@opennextjs/cloudflare=1.20.15` metadata reported Next peer range `>=15.5.28 <16 || >=16.4.1`, which excludes Next 16.3.6. `PEER_RANGE_INCOMPATIBLE_BLOCKED` is correct. No Next version change is authorized to resolve it.
- Earlier `pnpm dlx` attempted OpenNext CLI help but failed `ERR_PNPM_IGNORED_BUILDS` for `esbuild=0.28.2` and `workerd=1.20261023.1`. Do not disable lifecycle safety or infer runtime incompatibility from this.
- Node compatibility is only partial parity: Cloudflare documentation lists implemented/polyfilled APIs and nonfunctional stubs. Compatibility dates on/after 2026-08-04 enable Node.js compatibility by default, but this does **not** prove compatibility with the Hub modules or credentials.

## Executable integrity audit — non-executable package inspection only

Controlled proposal: `control/worker-local-adapter-trust.proposed.json`.
Independent test: `tests/governance/workers-toolchain-trust.test.mjs`.
Audit script: `scripts/audit-worker-package-integrity.mjs`.

Seven exact review pins:
1. `vinext@1.4.0` — primary candidate
2. `@opennextjs/cloudflare@1.20.15` — peer-incompatible alternative
3. `next@16.3.6` — current app
4. `esbuild@0.28.2` — lifecycle permission candidate
5. `@esbuild/linux-x64@0.28.2` — platform package
6. `workerd@1.20261023.1` — lifecycle permission candidate
7. `@cloudflare/workerd-linux-64@1.20261023.1` — platform package

The GitHub Actions audit has `contents:read` only and never uses a Cloudflare credential, API or runtime environment. It fetches exact npm package metadata and tarballs from the registry with `npm pack --ignore-scripts` into disposable runner storage; it **does not install or execute those package scripts**. The downloaded tarball bytes are independently hashed with SHA-512 and SHA-1, compared to the registry's declared integrity and shasum, then the package `package.json` is extracted to stdout with `tar -xzOf` to compare package identity, version and lifecycle script metadata. It reports script **names only**, not secrets, arbitrary source or untrusted text. Raw package tarballs are not retained as CI artifacts. The report keeps package hashes, provenance limitations and `approvedBuildScripts:[]`.

A matching registry SRI proves only that the fetched bytes agree with the *same registry's claims*, **not independent source reproducibility, code safety, trusted npm publisher identity, signature verification or executable native binary safety**. A network/metadata/hash/archive mismatch must fail the job. Never classify a green artifact audit as `WORKER_RUNTIME_PASS`.

### Minimal proposed build-script allowlist

| Candidate | Version | Why considered | Current authority |
| --- | --- | --- | --- |
| `esbuild` | `0.28.2` | pnpm detected a blocked install hook; likely binary selection/validation | **DENY**; review candidate only |
| `workerd` | `1.20261023.1` | pnpm detected a blocked install hook; native runtime binary involved | **DENY**; review candidate only |
| All other packages | exact pinned | installation not needed for metadata/tarball verification | **DENY** |

**There is no authorized `pnpm.onlyBuiltDependencies`, `pnpm approve-builds`, `dangerouslyAllowAllBuilds`, npm install with scripts enabled, `vinext init`, `wrangler deploy` or `opennextjs-cloudflare deploy` change in this phase.** A future scoped approval must be bound to exact package versions, script contents, npm SRI and platform binary hashes, and must assess whether the pnpm policy supports version-scoped admission. If it does not, reject or use an independent sandbox that cannot persist/globalize the permission. Auditing is not permission.

## Fail-closed sandbox local-only plan (not yet authorized)

1. **Trust intake:** independently inspect the tarball's install.js/postinstall scripts and native package artifact provenance; cross-check official upstream release signatures/checksums where available and assess unverified publisher/script changes. Freeze reproducible lockfile revisions and all exact hashes; do not use `@latest` in any trusted execution phase.
2. **Sandbox design:** ephemeral locked-down Linux container/micro-VM running as non-root, disposable filesystem, no shared home/GitHub auth tokens/SSH agent, no cloud credentials, no production secrets, no mount of project-configured `.env` or real Neon URL. Restrict egress (only reviewed registry fetch during separate acquisition; **no egress during script execution or workerd tests**). Loopback-only local socket; resource/time limits and teardown.
3. **Package execution gate:** separate human/supply-chain review must explicitly approve each exact postinstall script and its version+integrity, or keep `BUILD_SCRIPT_DENIED`. Never auto-toggle pnpm trust based on green CI. No backdoor using another package manager or global scripts flag.
4. **Adapter compilation gate:** only after approvals, build the existing Hub source in disposable local storage with exact vinext/Next versions, record bundle size and failing imports. Keep actual Worker cloud-account/bindings and external DNS entirely absent; no routes/site generated.
5. **Runtime parity gate:** under local `workerd` only after permitted binary provenance, run synthetic/no-secret HTTP route tests, server actions, Auth.js JWT secure-cookie state/denial, SSO PKCE fail-closed (without real OAuth callback) and `node:crypto`/`zlib`/`util` semantics. No real identity assertion or permanent session.
6. **Database gate:** simulate database outage first. If local PostgreSQL parity is separately authorized, use **only disposable PostgreSQL fixture data** and inspect connection/TCP/pooling errors with no canonical credentials. Real Neon remains out of scope.
7. **Release stop:** project slug/domain, canonical principal, SSO origin, Constitution 1.3.0 and authorization remain untouched. Missing independent review, package integrity mismatch, unexpected lifecycle hook, origin/cookie leak, Workerd parity error or resource overrun => **BLOCKED**. Evidence is immutable exact-SHA CI artifacts, never a fake Quality Gate PASS, deployment or signed completion.

## Decision boundaries

`PACKAGE_REGISTRY_SRI_MATCH` (if all seven hashes verified) **≠** publisher attestation **≠** permission to execute install scripts **≠** adapter build success **≠** workerd runtime compatibility **≠** authenticated E2E **≠** Constitutional ratification **≠** Production approval.

Cloudflare official supporting references:
- https://developers.cloudflare.com/workers/configuration/compatibility-flags/
- https://developers.cloudflare.com/workers/runtime-apis/nodejs/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/

## Exact npm postinstall source and native binary provenance — read-only audit

Evidence runner: [Hub Workflow #41456664883](https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/41456664883), source revision `bdb640ba8f5bf195d872f8fda38c65657d34b370`. In isolated GitHub CI, all package content was fetched with `npm pack --ignore-scripts` and inspected using `tar -xzOf`; **no `postinstall`, native binary, `workerd`, provider CLI or build-script approval was executed**.

- **esbuild 0.28.2**: exact published `package/install.js` SHA-256 `612294e278914443bdcf81cb17f54afec34dbdd2ebd999a6ee187912320cc315`. Independent source review of tagged `evanw/esbuild@v0.28.2` `lib/npm/node-install.ts` shows potential nested `npm install`, HTTPS redirect/download, binary version process execution and filesystem mutation; these are review risks, *not* claims that these actions occurred in the audit.
- **workerd 1.20261023.1**: exact published `package/install.js` SHA-256 `c020655f335c6f9a4a1e8c8655fc71f37ce5aacd99c3eb7583ed5d60a0940768`. Tagged `cloudflare/workerd@v1.20261023.1` `npm/lib/node-install.ts` similarly shows nested install/download, child process version check and binary replacement. The tagged `npm/workerd/package.json` is a build template and does not prove byte-equivalence to the published generated `install.js`. No reproducible compilation or signed publisher attestation was verified.
- **esbuild native ELF x86-64**: independently streamed from `@esbuild/linux-x64@0.28.2` npm tarball. SHA-256 `e1698a3d5c6c0798fee4fd3b5cc816651f460c63d390a7a26ea4beb0b1884100` matches the Linux x64 binary hash in the version-tagged `evanw/esbuild/npm/esbuild/package.json`.
- **workerd native ELF x86-64**: streamed from `@cloudflare/workerd-linux-64@1.20261023.1`, SHA-256 `b6aff93fcc97091fa38b4ba78c172276349c4940000694c5baf382c218b8e6ee`. Independently downloaded public asset `cloudflare/workerd/releases/download/v1.20261023.1/workerd-linux-64.gz` is pinned to GitHub Release asset SHA-256 `28e7942d0ca91c565ee7ef973725b558f96454bbb86ee5bd40802d723aeab909`; its **decompressed binary bytes match** the npm ELF SHA-256. This proves public-release-to-npm binary parity, not the identity or security of a signing publisher or byte-for-byte reproducible build.
- **Attack gates**: adversarial tests reject missing/altered postinstall behavior, non-ELF/wrong architecture, wrong gzip hash and unapproved script/trust policy changes. All build-script execution rights remain DENY. Compatibility and Production remain BLOCKED.

Scripts: `scripts/audit-worker-postinstall-provenance.mjs`, `scripts/verify-workerd-release-provenance.mjs`; tests: `tests/governance/workers-postinstall-provenance.test.mjs`, `tests/governance/workerd-release-provenance.test.mjs`. Exact SHA evidence artifacts are retained by the 7-day GitHub Actions retention policy; no package binaries, fetched release gzip or token files are included.

**Local-only sandbox decision remains BLOCKED:** any later binary execution needs a separately authorized sandbox with a disposable filesystem, no mounted git credentials or `.env`, no canonical database, no egress during install-script/runtime execution, no privileged host mount, and bounded CPU/memory/time. Public npm/GitHub fetches were allowed **only during the separate read-only provenance audit**, never during script execution. Confirm native dependencies, build provenance and reviewer authority before any change to `approvedBuildScripts:[]`.

**One Guided Next Action:** `LOCAL-WORKER-TRUST-PROVENANCE-REVIEW` — decide whether the two exact install hooks and native binary sources may enter a separately sandboxed, non-cloud local-only test. If source/signature/sandbox review lacks independent approval, remain **BUILD_SCRIPT_DENIED**. Do not create a site or merge to main.
