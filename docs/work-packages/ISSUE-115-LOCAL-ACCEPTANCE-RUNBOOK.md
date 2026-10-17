# Issue #115 — Offline localhost human-authenticated acceptance (DRAFT / BLOCKED)

This is a **manual opt-in test plan and executable Playwright gate**, not a canonical adoption or authorization record. It is intentionally separate from the P2 synthetic CI data-path proof. It MUST NOT be run against Production, Preview, Neon production, real application-management data or a remote/tunneled database.

## What was and was not verified

- Existing Draft implementation: `packages/runtime/src/issue-115-intake.ts`, `apps/web/app/projects/[projectId]/roadmap/actions.ts`, and four NOT_READY quality gates.
- Disposable PostgreSQL transactional and replay tests are already PASS on GitHub Actions. Do **not** rerun just to fill reports.
- This repository's currently connected Chat runner **does not contain the repository checkout, local PostgreSQL, or legitimate signed-in Owner/Editor/Viewer browser sessions**. Node and Chromium alone do not constitute acceptance.
- `tests/e2e/issue-115-local-acceptance.pw.ts` is a separately authorized operator-run test. The CI `--list` command merely compiles/discovers it and **must never be reported as browser E2E PASS**.

## Preconditions before even enabling the test

1. Operate on a non-production workstation/Work runtime with a real checkout of the **exact reviewed Draft PR #149 SHA**, a verified Node 24 + pnpm 12 install, Next.js server built from the same SHA, Playwright Chromium, and a **new disposable localhost-only PostgreSQL database**. The database name must match `blueprint_issue115_e2e_*`; do not point at a cloud database through an SSH/local port forward. No Vercel or public endpoint.
2. Run **existing official Prisma migrations only** in the disposable database; do not run direct SQL to invent or grant user/project authority. An independently authorized Project Profile `project:blueprint-os` at canonical `recordVersion=1` must already exist in this disposable runtime with zero WorkPackages and zero QualityGates. If missing, this is a **BLOCKER**, not a reason to mint fake owner approval.
3. Three **distinct, genuinely signed-in** local Auth.js sessions must be legitimately bound, via the existing project's auth flow, to one real Owner, one Editor, and one Viewer (roles recorded by the normal guarded authority service). Save their private Playwright `storageState` to ignored files **outside the repository**, e.g. secure temp storage. Never copy secrets into PRs or issue comments. Do not use fabricated JWTs or a synthetic actor to present this gate as real-owner E2E.
4. For local HTTP sessions the existing runtime must be expressly configured for `BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH=true`, with a secure `AUTH_SECRET` and `DATABASE_URL` to that isolated database. Real GitHub login/SSO may be unavailable fully offline; if so, **STOP**, preserve the blocker, and do not bypass identity verification.
5. Set `BLUEPRINT_ISSUE115_EXPECTED_SHA` to the checked-out 40-character Draft HEAD. The test runs `git rev-parse HEAD` and aborts on SHA drift.

## Manual opt-in, never default CI

Use the existing standard Next.js build and `playwright.config.ts` localhost web server, then run exactly:

```sh
# Environment must be set independently by the authorized local operator.
# DATABASE_URL=postgresql://...@127.0.0.1:5432/blueprint_issue115_e2e_<unique>
# AUTH_SECRET=<set in PRIVATE operator environment>
# BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH=true
# BLUEPRINT_ISSUE115_EXPECTED_SHA=<actual reviewed Draft HEAD>
# BLUEPRINT_ISSUE115_OWNER_STORAGE=<private auth storageState path>
# BLUEPRINT_ISSUE115_EDITOR_STORAGE=<private auth storageState path>
# BLUEPRINT_ISSUE115_VIEWER_STORAGE=<private auth storageState path>
# BLUEPRINT_ISSUE115_LOCAL_ACCEPTANCE=enabled

pnpm prisma:generate
pnpm build
pnpm exec playwright test tests/e2e/issue-115-local-acceptance.pw.ts --project=desktop-chromium
```

The test fails closed before any writes unless all guards pass. It **does not** seed a Project, issue tokens, bootstrap an Owner or add a role. Any received cookies must come from externally authorized interactive login; storageState file paths are secrets and should not appear in CI output.

## Required observed outcomes

- Anonymous and Viewer have no P2-115 intake button. Owner and Editor have it in the real authenticated Roadmap view.
- Route interception modifies **the real Next Server Action POST** with an external `Origin`; require a 4xx response and verify **zero** WorkPackages/QualityGates afterward. UI source/config inspection alone is not sufficient.
- Two independent authorized browsers submit the same blocked candidate together; require at least one success and exactly **one** persisted WorkPackage and **four** unique NOT_READY QualityGates (v1, no evidence). The losing request may fail closed; it must never produce duplicate or upgraded authority.
- Canonical GET after POST shows existing BLOCKED WorkPackage. This is **NOT** a signed completion receipt, workflow adoption, QA PASS, three-service E2E, or Production release.
- Operator must collect exact git SHA, isolated DB identity (no password), Playwright output, server Action response metadata, and after-commit record IDs/statuses/versions. **Do not record cookies, signed actions, tokens, passwords or personal data.**
- After review, destroy the entire disposable database and any temporary session storage. Never clean up individual canonical rows in a real project database.

**STOP conditions:** absent legitimate logins/project Profile/permissions, mismatched SHA, non-local or pre-populated DB, Origin mismatch not rejected, missing readback, request race yielding duplicate rows, or any Quality Gate in PASS. Report as BLOCKED/FAIL; never spoof or automatically approve.

**Next Action when blocked:** have the authorized operator run this exact-head local acceptance in a genuinely offline-capable workspace with pre-existing authenticated roles. Until that evidence exists, leave Draft #149 and Issue #115 E2E status blocked.
