# ADR candidate — provider-neutral verification and Vercel-free execution path

Status: **proposed / implementation guidance, not constitutional ratification**  
Scope: P1–P4 execution pipeline and P0 technical preparation. User direction (2026-10-16): stop relying on Vercel because connector sessions disconnect repeatedly.

## Decision

1. **Vercel is not a prerequisite** for development, source review, GitHub CI, isolated PostgreSQL tests, signed-grant contract checks or independent QA.
2. Use GitHub as source/PR/CI evidence transport with immutable commit SHAs and workflow run IDs. CI success is **not** a running-service E2E, production approval or canonical Quality Gate PASS.
3. For the first integrated runtime, prefer an **ephemeral isolated test environment** provisioned from GitHub Actions with service containers and disposable PostgreSQL. Start Gateway, Execution Worker and independent QA Worker under separate identities and secrets; invoke one explicitly authorized read-only workflow against a disposable test repository; persist and read back journal and independent QA evidence.
4. Configure issuer signing key and distinct worker trust keys as short-lived, least-privilege CI secrets or GitHub OIDC-backed secret-store access. Never use default repository tokens as a substitute for cross-private repository rights. Explicitly verify token scope for each target; prohibit key material in logs, repo or prompt.
5. Keep SHA pinning, adoption checks, budget enforcement, anti-replay, independent QA, migration/rollback verification, immutable evidence and human decision gates. Fail closed whenever ephemeral CI cannot represent a required authenticated user/session or target policy. Such a requirement stays **BLOCKED/UNVERIFIED**, not simulated PASS.
6. Release is provider-neutral but **separate**. Do not automatically publish or change the existing Production deployment. An eventual long-running service/hosting provider is a separate reviewed architecture and operating decision; no provider has been selected here.
7. Existing Vercel deployments/settings remain untouched. This decision removes dependency in future workflow design; it does not silently disconnect, delete or disable production infrastructure.

## Minimum GitHub Actions integration target

- Pin exact HEADs for Hub, Gateway, Worker and QA Worker; check the current Constitution 1.3.0 adoption and source/workflow/canonical digests before dispatch.
- Start disposable PostgreSQL and apply the exact tracked migrations, verify ledger and rollback strategy.
- Execute one signed, permission-scoped and budget-bounded **inspection-only** workflow with a durable one-time claim.
- Have an independent QA process retrieve the pinned source bytes rather than trust the executor's claims; validate persisted hashes and append-only restrictions.
- Negative tests: revoked/missing/wrong issuer, wrong project, wrong actor/role, stale SHA/digests, replay, budget exhaustion, failed migration, missing cross-repo permission, tampered QA artifact.
- Archive sanitized run IDs, revision tuples, migration evidence and relevant logs with retention and hashes. Keep blocked gates visible; don't forge signed completion receipts.
- Require independent code review and the existing release authorization before any Production action.

## Definition of done

- GitHub Actions job URL and exact checked SHAs;
- isolated runtime integration passes both happy-path and failure/rollback tests;
- durable journal and QA evidence independently read back;
- authenticated target limitations explicitly recorded;
- release authorization remains distinct from technical test completion.

References: Hub issue #115; `docs/EXECUTION-DEPARTMENTS-OPERATING-MODEL.v1.md`; `control/execution-department-ownership.v1.json`. This ADR supersedes **only the operational assumption that Vercel Preview must be used**; it does not amend or override constitutional artifacts.
