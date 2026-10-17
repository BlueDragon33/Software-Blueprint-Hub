# Blueprint OS R15–R32: REAL authenticated browser preflight acceptance

**Scope:** optional, non-CI, localhost-only E2E against a disposable `blueprint_qa_test` PostgreSQL database. This document is an executable test procedure, **not** a Constitution amendment or quality signoff.

## Why the ordinary CI does not count as authenticated acceptance

CI runs Next.js + Chromium against a real disposable DB to prove that anonymous visitors have no approval button and untrusted HTTP Origin requests fail. Synthetic Principal fixtures validate authorization and append-only CAS. Neither substitutes for an actual external Auth.js/App-Manager SSO session for an authenticated Owner, Editor and Viewer. The pinned App-Manager SSO callback is not a local fake login endpoint.

The separate opt-in `playwright.real-auth.config.ts` **never** launches an impersonation server, issues JWTs, seals SSO cookies, grants roles, or enters Production. The suite fails before tests if an independent login, the correct Profile, or a disposable runtime is unavailable.

## Prerequisites and external authorization

1. Run **the real compiled Blueprint OS application**, with independently configured authentication provider, at `http://127.0.0.1:3000` or approved HTTPS loopback; its `DATABASE_URL` must point only at **localhost database `blueprint_qa_test`** with actual migrations. Use a disposable project with ID beginning `project:qa-`, a canonical Profile, an actual governed HEAD and required gates/work. Do not bypass `PROJECT_READ` or `PROJECT_ADMIN`. Any valid signed `inspect-scoped` grant must be provided independently by the authorized issuer; the tests do not create it.
2. A real human uses the configured Auth.js or pinned App-Manager identity provider to sign in as three **different real Principal records**, already assigned Project Owner (or genuine System Owner), Editor and Viewer respectively. Do not manually invent JWT, SSO, Owner or consent.
3. In three separate **authenticated browser contexts**, save Playwright `storageState` files **outside** the Git checkout in a private directory. Never paste or commit those files, put them in Actions secrets, or upload screenshot/trace/HAR. State files contain bearer session material. Ensure each state uses the same actual local host as the configured base URL. Destroy them securely after acceptance. On platforms without a browser-assisted storageState capture, this E2E remains BLOCKED rather than simulating credentials.
4. Pass absolute, private storageState paths for each role, and the actual matching `principal:<uuid>` identifiers from the already-populated disposable DB. No role is assigned or upgraded by the suite. Owner mutations additionally require explicit operator authorization and `BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES=true`.

Set these environment variable names in the local shell **without placing secrets in the repository**:

```text
BLUEPRINT_REAL_AUTH_E2E=true
BLUEPRINT_REAL_AUTH_E2E_BASE_URL=http://127.0.0.1:3000/
DATABASE_URL=postgresql://<disposable-credentials>@127.0.0.1:5432/blueprint_qa_test
BLUEPRINT_REAL_AUTH_E2E_PROJECT=project:qa-<verified-canonical-id>
BLUEPRINT_REAL_AUTH_E2E_OWNER_PRINCIPAL=principal:<uuid>
BLUEPRINT_REAL_AUTH_E2E_OWNER_STATE=<absolute-private-path>/owner.json
BLUEPRINT_REAL_AUTH_E2E_EDITOR_PRINCIPAL=principal:<uuid>
BLUEPRINT_REAL_AUTH_E2E_EDITOR_STATE=<absolute-private-path>/editor.json
BLUEPRINT_REAL_AUTH_E2E_VIEWER_PRINCIPAL=principal:<uuid>
BLUEPRINT_REAL_AUTH_E2E_VIEWER_STATE=<absolute-private-path>/viewer.json
BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES=false
BLUEPRINT_REAL_AUTH_E2E_EXPECT_SIGNED_GRANT=false
```

Run:

```sh
pnpm exec playwright test --config=playwright.real-auth.config.ts
```

Playwright session and request contents are intentionally **not** retained in HTML report, trace, screenshot or video. Do not change the default to upload authenticated recordings to CI.

## Acceptance sequence and evidence boundary

- Precheck: ensure signed-in browser actually renders the project, the three stored Principal IDs are distinct and corresponding OWNER/EDITOR/VIEWER roles exist in the **disposable** PostgreSQL; missing permissions are a BLOCKER, not a PASS.
- Owner: real GET and a **valid** Server Action POST with matching Origin (read-only source recheck), then intercept the same real action POST and supply a hostile Origin. The latter must receive an HTTP rejection. This is stronger than posting an invented action ID.
- Owner/Editor/Viewer: Owner controls appear to Owner only, Editor can work only within `PROJECT_MUTATE` and Viewer has no mutating controls. For a verified READY work, an Owner confirmation form must exist.
- Signed execution control: `BLUEPRINT_REAL_AUTH_E2E_EXPECT_SIGNED_GRANT=false` requires it **absent**. Set to `true` only after real Owner attestation, approved adoption, trusted issuer, valid source-bound grant, and real runtime prerequisites are installed. The suite asserts it **visible** but does not click to dispatch.
- Optional destructive-to-disposable test: set `BLUEPRINT_REAL_AUTH_E2E_ALLOW_OWNER_WRITES=true` **only** after authorizing changes to this isolated project. The suite checks actual OWNER attestation, canonical PostgreSQL readback, then explicitly revokes the receipt and verifies the execution control hides again. A previously attested project is rejected to avoid overwriting someone else's approval. Real DB CAS/replay/head/gate/risk source drift regressions continue independently in isolated PostgreSQL CI.
- Results do **not** prove release/RU03/independent QA authority; user-hosted localhost and **real actor** E2E are UNVERIFIED until this controlled run genuinely passes.

**Stop** if real roles, SSO, verified governed HEAD, local service, storageState, proper risk remediation, or separately approved signed grants are missing. Do not fabricate their absence away.

**One next action:** execute the opt-in suite against the genuine disposable localhost runtime with existing authenticated role states and record its exact HEAD, replay/CSRF observations, and project-scoped attestation readback. Keep PR Draft.
