# ZERO-SPEND Vercel intake — Blueprint OS 1.3.0

**Status:** SOURCE-ONLY CANDIDATE · Vercel account NOT CONNECTED · NO BUILD · NO PREVIEW · NO PRODUCTION · NO BILLING AUTHORITY.
Date: 2026-11-03. Hub main inspected SHA `cd01fb3c2178393628ce968af209db082227d2c4`.

## Objective

Keep ChatGPT + GitHub Free as the editing path. Consider Vercel **Hobby only** as an optional Preview host for eligible personal, non-commercial web projects. Preserve all existing Cloudflare and offline/local-native services. Never make Vercel a required dependency of Blueprint OS.

Structured 22-repository inventory: [`zero-spend-vercel-intake.candidate.json`](zero-spend-vercel-intake.candidate.json). Decisions reflect read-only default-branch source inspection, not end-to-end hosting tests.

## Routing results

- **HOBBY_CANDIDATE (3):** `Math_Bauman` (static educational site), `MPC_PID_System` (Vite), `CAD_CAM_3D` (Vite/OCCT WASM; verify size and browser features). All require verified Hobby account, non-commercial eligibility, a clean static Preview, and no new service dependencies.
- **PRESERVE_EXISTING (5):** `Bauman-master-ai-system`, `BOIECH_AI`, `Application-Management`, `RU_LIFE`, `Health_Care`. Keep Cloudflare/Workers/D1/R2 workflows, URLs, database ownership and release gates.
- **NEEDS_REVIEW (3):** `Software-Blueprint-Hub` (auth + Prisma + backend), `GrowUP_MyChildren` (child data/control services), `PriceReport_Tunggiabao` (commercial-use eligibility). Default is no Vercel.
- **NOT_APPLICABLE (11):** other native/local/private services/docs-only repositories listed in the JSON inventory.

## Hard zero-spend guard

1. No Vercel Pro/trial-to-paid, no card, no paid add-ons, no paid domain, no API token/paid service purchase, no payment authorization. If Vercel displays a charge, billing requirement or eligibility doubt, **SKIP**.
2. Vercel Hobby usage is restricted to personal, non-commercial applications. A commercial app is **NOT_ELIGIBLE**, regardless of free quota.
3. Before any GitHub import, verify the account is actually Hobby, owner controls the selected repository, the app can run without paid backend/DB, and necessary secrets/data are not exposed.
4. **No Vercel Git import or deploy from this candidate.** Vercel automatically deploys on Git pushes and may publish `main` as Production by default. To enable future integration, a separately reviewed app change must explicitly disable Git auto deployments (see Vercel `git.deploymentEnabled: false`) and be verified **before** connection; only manual scoped Preview may then be tested.
5. Any future Preview must be explicitly authorized against exact SHA/Work Package and must not use live production data. A Preview build or green CI is not Quality Gate PASS.
6. Keep Cloudflare Worker/D1/R2 URLs, slugs, release channels and production databases untouched. No parallel canonical authority, no silent migration.
7. NO GitHub-hosted Actions, merge, deploy, Neon's canonical state mutation, reviewer impersonation, authorization grant or automatic Production publication in this phase.
8. On free-tier exhaustion or provider unavailability: STOP / RETAIN EXISTING. Do not convert to a paid plan.

## Evidence gates for a first free Preview

- Human confirms ownership, non-commercial use and a verified Vercel Hobby account with zero billing requirements.
- Project-specific source compatibility and build/root directory are checked (and monorepo/project specific paths pinned).
- A deny-by-default branch deployment configuration is reviewed; no auto-production path remains.
- Non-secret env/asset configuration is approved; auth, databases, personal data and live Cloudflare state are excluded.
- Preview only, exact commit identifier, output URL and tested UX recorded as evidence; revert/stop on failure.

## External references (not activation)

- Vercel Hobby: https://vercel.com/docs/plans/hobby
- Automatic Git deployments: https://vercel.com/docs/git
- Disable Git deployments: https://vercel.com/docs/project-configuration/git-configuration
- Universal Constitution: `docs/UNIVERSAL-CONSTITUTION.md`
- Existing offline-first policy: `control/development-runtime-policy.v1.json`

**Current result:** policy inventory prepared in an isolated experiment branch. No Vercel account has been authenticated through ChatGPT, no provider plan checked on the user's account, no app imported, no deployment performed and no money spent.
