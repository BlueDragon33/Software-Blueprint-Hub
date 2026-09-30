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


### Vercel monorepo build

When the Vercel project root is `apps/web`, the web package must generate the Prisma client before `next build`. The package-level `prebuild` script delegates to the repository-root `prisma:generate` command so generated Prisma sources are recreated in ephemeral build environments instead of being committed.

Do not commit `packages/persistence/src/generated/prisma/`; it remains a generated artifact.
