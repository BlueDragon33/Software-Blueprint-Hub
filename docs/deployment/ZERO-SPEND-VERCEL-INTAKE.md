# ZERO-SPEND Vercel on-demand browser Preview — Blueprint OS 1.3.0

**Status:** SOURCE-ONLY CANDIDATE · Vercel Hobby account/team VERIFIED by read-only API · Bauman Preview NOT AUTHORIZED · NO BUILD/DEPLOY · NO PRODUCTION · NO BILLING AUTHORITY.
Date: 2026-11-03. Hub baseline inspected SHA `cd01fb3c2178393628ce968af209db082227d2c4`.

## Owner decision (2026-11-03)

Vercel is **NOT a default hosting provider for the ecosystem**. Use **Vercel Hobby only on demand** for a real task that requires repeated browser/device UI testing and cannot reasonably be completed with current free/local/Cloudflare preview. This is a proposal/eligibility policy, not a release authorization.

- Only web/PWA surfaces are candidates; native iOS, WidgetKit, Windows desktop, server workers and D1/R2 systems remain in their existing environments.
- All existing Cloudflare URLs/slugs, data owners, Workers/D1/R2, Production and manual release policies remain unchanged.
- Github branch/PR/commit do not imply permission to deploy. The current policy is **zero Vercel imports, zero deployments, zero spend** until eligibility is independently verified.
- Billing: **no card, no Pro, no trial, no upgrade, no paid add-on, no paid domain**; any paid requirement means STOP/SKIP. Hobby is for **personal, non-commercial** use only.
- Git auto deploy is **disabled by default** for any future experiment, including Preview. Vercel's default Git integration can automatically deploy Production from main. A `git.deploymentEnabled: false` config, or independently verified equivalent, must be in place **before importing or enabling Git integration**. Do not rely on an unreviewed setting or a claim in this document.
- Prefer a single **manual, exact-SHA Preview** when separately authorized, then stop. This is not continuously-running cloud CI.

## Prioritized trial — Bauman-Russian-iOS, web/PWA only

**Repo:** `BlueDragon33/Bauman-Russian-iOS` (private).

**Candidate branch:** `candidate/russian-daily-standalone-sites-pwa-20261103-v2`

**Observed branch HEAD:** `0e5775d465ea13d674304adbbc02a1de468ba8f7`

**Static subdirectory:** `web/russian-daily-standalone/`, entry `index.html`.

The source contains HTML, CSS, ES modules, PWA manifest, Service Worker, local device storage and a demo vocabulary interface. No framework build step is documented. It is a candidate for checking iPhone/iPad responsive layout, on-device IndexedDB behavior, navigation, offline cache over HTTPS, and fail-closed demo audio behavior.

**Not covered:** SwiftUI build, Xcode, iPhone Simulator, native WidgetKit/Lock Screen, signing, RU03 release approval or any real device iOS native test. Claiming a successful Vercel Preview as native QA PASS is forbidden.

**Risk holds:** Demo linguistic materials and imagery are not all rights-cleared. Protect Preview using Vercel Authentication if eligible; ensure no unapproved materials become public. Vercel Hobby's collaboration rules for private Git repositories can block bot-authored commits if the commit author is not the team owner. Confirm Git author/identity restrictions and who can actually trigger a manual Preview.

## Verified account / isolated safety guard — 2026-11-03

Connected Vercel reads: authenticated user `dinhnam3391-4708` is active on **Hobby**; team `dinhnam3391-4708` (`team_0WsY0YBA9BhSUVBuN8ZsYZNP`) is **Hobby** and readable after owner consent. Vercel Git namespace `BlueDragon33` has an admin viewer; this does not prove Vercel can deploy every individual private repository. Only `software-blueprint-hub` is listed as an existing team project, **not** Bauman. Charge API returned `404 costs_not_found`, not a proof of no historical charges.

The PWA HEAD remains `0e5775d465ea13d674304adbbc02a1de468ba8f7`. A separate source-only branch `candidate/bauman-web-vercel-zero-spend-preflight-20261103` at `a7893c8eacd49b63ef14febd4261670c794cb65c` adds `web/russian-daily-standalone/vercel.json` with `git.deploymentEnabled=false`, plus 2 Node policy tests and an admission evidence document. Both tests ran locally on byte-identical GitHub blobs and passed; **not** web runtime/iPhone QA.

This guard **does not exist on `main`** and has not been verified in a created Vercel project. It does not authorize Git import: an import may trigger a Production deployment from `main` before the candidate config applies. Unreviewed demo photograph, real private-repo permissions, protected Preview configuration, personal/non-commercial eligibility and independent Blueprint review are still blocking.

## Independent review gate — 2026-11-03

Bauman source-only handoff now at `a7893c8eacd49b63ef14febd4261670c794cb65c` with no PR created or GitHub Actions run. The review packet documents:
- PR #1/#2/#3 and QA Worker PR #5 Draft, zero reviews found; a pinned QA Worker advisory on other source files is **not** reviewer authority for this Vercel change
- GitHub private repository Rulesets endpoint 403; **not** evidence that branch protections are enforced
- Personal-account private GitHub repo collaborators receive **WRITE** access; do not give an external reviewer repository access solely to view source (per [GitHub permission levels](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/permission-levels-for-a-personal-account-repository))
- Bounded offline review can be shared by the owner, but remains **ADVISORY** without authenticated source readback or formal reviewer authorization
- Source demo asset rights not item-cleared; no public demo or RU03 content release
- `main` currently contains only README, not the PWA or its Git-disable config. No Git import.
- Vercel's [2026-09-09 changelog](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan) makes All Deployments Authentication available at no extra cost on Hobby, but it has not been configured/read back for a nonexistent Bauman project.

## Alternative Vercel candidates now dormant

`Math_Bauman`, `MPC_PID_System`, and `CAD_CAM_3D` had basic web/static compatibility but **no confirmed need for continuous Preview testing**. Do not import or deploy them merely to increase Vercel coverage.

Other projects retain their previous status: five Cloudflare-based systems preserved, three requiring review before hosting choices, ten not applicable to Vercel. The exact twenty-two-repository decision set is in [zero-spend-vercel-intake.candidate.json](zero-spend-vercel-intake.candidate.json).

## Exact procedure for a future eligible web Preview

1. Verify the **actual account** is Vercel Hobby with zero billing requirement, allowed region, personal/non-commercial use and private repository access. Account/team Hobby readback is verified; private-repo permission, cost and project-level protection/auto-deploy settings remain unverified.
2. Verify a real device/browser test is blocked without a web Preview; capture the Work Package, acceptance criteria, branch/commit SHA and scope.
3. Review app assets, privacy and all externally fetched sources; deny unsafe public disclosure. Check Vercel Hobby private-repo collaboration restrictions.
4. Before Git import, prove **Git automatic deployments are disabled**, including `main` Production; do not create a parallel Production deployment, new canonical site or persistent service.
5. With explicit user authorization for the exact web surface, run **one bounded manual Preview**, no paid resources or extra cloud services. Record actual URL, exact SHA, usage and device test results as evidence.
6. Preserve `REVIEW_BLOCKED` if reviewer/gates are absent; a successful Preview is not CI PASS or Production authority.
7. On quota/region/billing/permissions error, stop and keep local/Cloudflare; no fallback to a chargeable plan.

## Source references

- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Vercel Git deployments](https://vercel.com/docs/git)
- [Disable auto Git deployments](https://vercel.com/docs/project-configuration/git-configuration)
- [Vercel private-repository collaboration](https://vercel.com/docs/deployments/troubleshoot-project-collaboration)
- `docs/UNIVERSAL-CONSTITUTION.md` and `control/development-runtime-policy.v1.json`

**Outcome:** The intake policy is updated on an isolated Hub experiment branch. Vercel Hobby account/team and GitHub namespace were read; an isolated Bauman source guard was committed and 2 exact-blob Node policy tests passed. **No Vercel import, live Bauman Preview, app runtime QA, merge, approval, GitHub Actions dispatch, Production or spending action occurred.**
