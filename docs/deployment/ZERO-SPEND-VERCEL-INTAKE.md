# ZERO-SPEND Vercel on-demand browser Preview — Blueprint OS 1.3.0

**Status:** SOURCE-ONLY CANDIDATE · Vercel account NOT CONNECTED · NO BUILD · NO PREVIEW · NO PRODUCTION · NO BILLING AUTHORITY.
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

## Alternative Vercel candidates now dormant

`Math_Bauman`, `MPC_PID_System`, and `CAD_CAM_3D` had basic web/static compatibility but **no confirmed need for continuous Preview testing**. Do not import or deploy them merely to increase Vercel coverage.

Other projects retain their previous status: five Cloudflare-based systems preserved, three requiring review before hosting choices, ten not applicable to Vercel. The exact twenty-two-repository decision set is in [zero-spend-vercel-intake.candidate.json](zero-spend-vercel-intake.candidate.json).

## Exact procedure for a future eligible web Preview

1. Verify the **actual account** is Vercel Hobby with zero billing requirement, allowed region, personal/non-commercial use and private repository access. No account verification has happened yet.
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

**Outcome:** The intake policy was updated in an isolated experiment branch in the public Hub repository. No Vercel connection, account readback, import, live preview, test run, change to the Bauman repository, merge or production deployment has taken place.
