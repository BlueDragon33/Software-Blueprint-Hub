# CONTENT-FIRST-001 — read-only CSS foreground/background triage

**State:** SOURCE_CONTRAST_TRIAGE / BROWSER_RENDER_NOT_RUN / NOT_A_RELEASE_ACCEPTANCE.
**Date:** 2026-11-14. **Central owner:** `BlueDragon33/Software-Blueprint-Hub`.
**Proposal:** Draft PR #164, based on published Constitution 1.3.0, existing §11 and `gate:ux:commercial-quality`.
**Review scope:** one scoped source pass over three existing apps, NOT 18/18 coverage. No application source, release, account, data or authority changed.

## Evidence method and non-claims

- Calculated standard WCAG luminance and contrast for CSS literal foreground and candidate/declared background pairs. Figures below are unrounded in the decision and displayed to three decimals. Ordinary small text threshold **4.5:1**; large text **3:1**; meaningful UI non-text **3:1**. W3C: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html and https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html.
- A **CSS_SOURCE_BELOW_AA** result is not proof that live users saw exactly the same rendered combination: later imported stylesheets, cascade specificity, CSS variables, image/gradient interpolation, inactive elements, user settings, shadow DOM, device render and deployed SHA can change the final pair.
- Actual browser `getComputedStyle` plus **final composited pixel/surface** sampling, route/actor/theme/viewport readback, logged in private role tests and Owner visibility: **NOT_RUN**. The existing browser-tab context provider failed with `UNAVAILABLE: Sheep MCP session closed`; no authenticated site inspection or screenshot was obtained. A production URL does not prove it uses the inspected main SHA.
- Do **not** promote findings to a real-browser FAIL/Quality Gate decision until live source and computed surfaces agree. Conversely, do not dismiss a below-threshold CSS declaration because it looks fashionable.

## Scoped application matrix

| App | Verified repository main SHA and CSS blob | CSS source triage | Real browser / release gate |
|---|---|---|---|
| Blueprint Hub | `cd01fb3c2178393628ce968af209db082227d2c4`; `apps/web/app/globals.css@7f2b7f8442af03f24b5b8c2c030bae66fa2903ad` | **RISK / exact compositing unknown**: `.brand span` `#7a849c` over light translucent sidebar `rgba(249,251,255,.9)`, approximate `#f9fbff` opaque pair **3.615:1**; this is an approximation, not the final composed background. Exact selector presence and screen usage pending. | **UNVERIFIED / NOT_RUN** |
| Application-Management | `fae66a63182666b17a81e35c4273bee661a851ef`; `app/globals.css@86ccdcb0081ce1a5ba0c01dc408e152ba62414f9` | **CSS_SOURCE_BELOW_AA**: `.button.accent` (line 128) `#fff` on gradient light stop `#c18b38` **2.992:1** (dark stop `#956625` 4.994:1); `.ai-table-head` (line 61) `#7a8b8e` on `#f4f8f7` **3.319:1** at 10px; `.ai-metric-grid small` (line 42) `#76878a` on parent white card **3.748:1**. | **UNVERIFIED / NOT_RUN** |
| BOIECH_AI | `c6687d8f2af5919f1631dcde86e61bc6d8d0cfd6`; `boi-ech/app/account-gate.module.css@558f1e26c47a2de1b068626425d34b16b0c9ce97` | **CSS_SOURCE_BELOW_AA**: `.authRoot .authForm>button[type=submit]` (lines 42–44) `#fff` on gradient light stop `#05b7a3` **2.527:1** (dark stop `#075369` 8.570:1); `.root .profileForm input::placeholder` (line 123) `#91a0af` on input white **2.675:1**. Placeholder text is meaningful where displayed and needs sufficient contrast. | **UNVERIFIED / NOT_RUN** |
| Other governed GUI apps | Not source-inspected in this scoped pass | **NOT_AUDITED** | **UNVERIFIED / NOT_RUN** |
| Headless governance services | No GUI surface inspected | **NOT_APPLICABLE only after confirming the applicable surface is truly headless** | **NOT_APPLICABLE_PENDING_VERIFICATION** |

## P0/P1 remediation priority when authorized per application

1. **P1 first:** Application-Management gold primary/secondary CTA, 10px table header and metric detail; BOIECH_AI account login/submit gradient and meaningful placeholder. Establish actual selector/route and deployed exact SHA; test worst-case gradient endpoint, role/theme/mobile and keyboard focus, not just the first pixel.
2. **P2:** Blueprint Hub sidebar secondary text and transparency/gradient composites. Compute final CSS/pixels, verify WCAG exemptions (if truly decorative/logotype) only with documented basis. Audit other screens after fixing confirmed accessible-path failures.
3. Fix at app-owned semantic color token / component and add focused regression; do not spread global `!important` overrides. Preserve data, behavior, role/identity security and offline states.
4. Each result must include **app, route/component, authenticated actor/role if relevant, exact deployed SHA, CSS SHA, theme, viewport, foreground, final composed background, unrounded ratio, minimum, outcome, privacy-redacted screenshot and independent UX review**.
5. Group later app audits into migration Work Packages only after valid Constitutional Authority process; no bulk PASS, site creation, costly runner or Production action.

## Constitutional cross-PR compatibility and current QA truth

- Draft #164's machine-contract `adoption.gate` initially used a noncanonical alias `existing-gate:ux:commercial-quality`. Corrected on #164 to **`gate:ux:commercial-quality`** and added a regression that ties both `adoption.gate` and `existingUxGate` to the published `computedContrast.requirementId`. The law/actual gate remains unchanged.
- #164 has **zero changed-path overlap** with constitutional PRs #153/#155/#156/#158. Their source proposals still need version/ID/authority reconciliation at ratification; no separate R-number or 1.4.0 designation claimed here.
- Post-fix **17/17 independent V8 source/contrast-fixture assertions PASS** on exact GitHub source; this does **not** run the committed Node `node:test` suite. `node --test tests/governance/content-first-legibility.candidate.test.mjs`: **NOT_RUN** in an exact complete repository checkout. Browser computed-style and real app UX: **NOT_RUN**.
- Independent authorized reviewer A/B **PENDING**. Draft/NOT_RATIFIED/NOT_PUBLISHED/NOT_ADOPTED; no new Production authority.

**Next action:** perform authorized local/Work browser contrast verification of the source-flagged routes, fix only confirmed app-owned UI after applicable approval, and run exact Node governance checks plus signed independent review of the final draft SHA. Do not infer “all apps checked” from this source triage.
