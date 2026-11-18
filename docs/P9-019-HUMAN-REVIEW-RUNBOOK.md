# P9-019 Human Review Runbook

Status: operational runbook for Development/Preview review only.

This runbook exists so P9-019 can be performed by a real authenticated human without weakening Blueprint OS authority boundaries.

## 1. Required runtime services

A review runtime needs:

- PostgreSQL reachable through `DATABASE_URL`;
- Auth.js `AUTH_SECRET`;
- GitHub OAuth `GITHUB_ID` and `GITHUB_SECRET`;
- `BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER=github`;
- `BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT=<exact GitHub provider account id allowed to initialize the first System Owner>`;
- for production-build parity on local loopback only: `BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH=true`.

The provider subject is an authorization selector, not a password. Do not replace it with mutable UI labels or an email guess.

If either bootstrap environment value is missing, Blueprint OS intentionally exposes no Owner initialization action.

## 2. Run the in-product preflight

Start the web app, then open:

`/professional-review/readiness`

The preflight reports only safe status information:

- required environment variables present/missing;
- PostgreSQL reachable/unreachable;
- authority + P9-019 decision tables present/missing;
- local HTTP auth exception enabled/disabled.

It never renders `DATABASE_URL`, `AUTH_SECRET`, GitHub OAuth credentials or the configured bootstrap provider subject.

Use `.env.example` as the local configuration contract. A green preflight is necessary runtime evidence, but it does not test the external GitHub OAuth provider callback and it grants no authority.

## 3. GitHub OAuth callback

Configure the OAuth application callback for the actual review host:

`<review-origin>/api/auth/callback/github`

Examples:

- local: `http://localhost:3000/api/auth/callback/github`;
- Preview: `https://<preview-host>/api/auth/callback/github`.

Do not reuse a Production callback for an unrelated local/Preview origin unless the provider configuration explicitly supports it.

## 4. Database initialization

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm db:migrate:deploy
pnpm db:migrate:status
```

The review decision is canonical PostgreSQL state. An ephemeral database will lose the decision when destroyed.

## 5. Start a local review workstation

For development:

```bash
pnpm dev
```

For production-build parity on localhost:

```bash
pnpm build
pnpm --filter @blueprint-os/web start
```

Blueprint OS keeps secure-cookie lookup enabled in `NODE_ENV=production` by default, even when a request claims a localhost Host. Production-build parity over plain HTTP is allowed only when `BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH=true` **and** the direct request Host is localhost/127.0.0.1/::1. An explicit HTTPS forwarding protocol always keeps secure-cookie lookup enabled. Never set the local-HTTP flag on an Internet-facing Preview or Production deployment.

## 6. Initialize authority

Open:

`/setup/owner`

Expected behavior:

1. signed out → sign-in is required;
2. wrong authenticated account → no bootstrap button is exposed;
3. deployment-configured identity → one-time Owner initialization is offered;
4. already initialized Owner → authority is recognized;
5. a second initialization attempt cannot replace the existing Owner.

Owner initialization does not approve P9-019 and grants no Production release authority.

## 7. Perform P9-019

Open:

`/professional-review`

Verify the exact candidate revision, Release Gate run, artifact ID and digest shown by the page.

Review the responsive evidence and current findings, enter a decision note, then choose the human decision.

Only an authenticated `approve` decision bound to the exact current candidate can unlock P9-020 evidence collection.

## 8. Preserve the decision

Do not destroy or replace the PostgreSQL database after approval unless the canonical decision has been migrated through an approved data-migration/restore process.

The approval is intentionally not checked into Git source and cannot be reconstructed from a chat message.

## 9. Boundary

P9-019 approval:

- may unlock P9-020;
- cannot PASS P9-020;
- cannot authorize Production;
- cannot deploy;
- cannot override Constitution or exact-revision evidence requirements.

## Reviewer A/B Preview P3 binding

Use the existing isolated P3 Neon database and the local Hub review runtime. The Owner must already have a valid GitHub OAuth session mapped to the canonical System Owner. Register the OAuth callback for `http://127.0.0.1:3000/api/auth/callback/github` on the local review client. Use the existing P3 endpoint `ep-dawn-band-b3r8ahco` and database `neondb` over TLS.

Prepare clean worktrees at Hub #167, Reviewer A #6 and Reviewer B #10. Install the pinned dependencies and generate Prisma in the Hub checkout. Use the existing secure local configuration for `DATABASE_URL`, Auth.js and the GitHub OAuth client. Configure `BLUEPRINT_AB_P3_ISSUER_PUBLIC_KEY` with the issuer's Ed25519 **public** SPKI key. When the OAuth session lacks access to the private candidate PRs, use the existing `WORKFLOW_RECEIPT_GITHUB_READ_TOKEN` configuration with read access to their PR metadata. Keep A and B runtime credentials in their separate execution contexts.

Run from the Hub candidate worktree, using a GitHub CLI session authorized to read all three Draft PRs.

```text
node scripts/start-reviewer-ab-p3.mjs <reviewer-a-worktree> <reviewer-b-worktree>
```

The launcher compares the clean worktrees to live Draft HEADs and starts Hub on loopback. Sign in as the System Owner and open [/projects/project:blueprint-os/prompt/workflow?workflowId=blueprint-reviewer-ab-source-inspection](http://127.0.0.1:3000/projects/project%3Ablueprint-os/prompt/workflow?workflowId=blueprint-reviewer-ab-source-inspection). **Theo Hiến pháp** opens the active authority set. Review the three SHAs, workflow digest and issuer fingerprint before selecting **Record Preview P3 binding**. The response returns a planned WorkPackage ID and CAS version after the atomic write. Repeating the same current request reads back the existing binding. A changed or revoked binding requires a separate Owner decision.

The binding uses the digest of the approved projection of the exact registered candidate and leaves the Git manifest in candidate state. It grants no signed dispatch. Verify separate A and B principals and run IDs and read back the canonical journal using their scoped access in the same P3 runtime before authorizing any pilot.


### Vercel monorepo build

When the Vercel project root is `apps/web`, the web package must generate the Prisma client before `next build`. The package-level `prebuild` script delegates to the repository-root `prisma:generate` command so generated Prisma sources are recreated in ephemeral build environments instead of being committed.

Do not commit `packages/persistence/src/generated/prisma/`; it remains a generated artifact.
