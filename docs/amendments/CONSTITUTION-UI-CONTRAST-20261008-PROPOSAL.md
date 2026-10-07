# Amendment Proposal — Universal UI Contrast & Legibility Gate

Status: **DRAFT — NOT RATIFIED / NOT PUBLISHED**
Proposed ID: `CONST-UI-CONTRAST-20261008-001`
Current published policy: `blueprint-os:universal-century-grade@1.2.0`
Proposed compatible-strengthening version: **1.3.0** (subject to impact review and human ratification)
Owning authority: Software-Blueprint-Hub Constitution Authority
Affected pillars: `product-elegance`, `premium-usability`, `long-term-durability`
Originating observation: Bauman Hub dark hero in Subjects/Research renders dark-on-dark title/KPI labels because legacy global `!important` rules override component colors.

## Problem and principle

Design creativity never excuses unreadable interfaces. The same principle must govern every **existing and future** user-facing application through the Universal Constitution's normal versioned adoption and evidence process, not through copying emergency CSS patches or silently changing a published policy.

## Proposed universal law (normative if ratified)

1. A component's foreground and background form one inseparable semantic contrast contract. Light text on dark/gradient/media surfaces, dark text on light surfaces; any reverse pairing must first prove sufficient contrast.
2. At minimum **WCAG 2.2 AA**: normal text **4.5:1**; large text (>=24px normal or >=18.7px bold) **3:1**; meaningful non-text UI boundaries and state indicators **3:1**. Correctly disabled controls use the applicable WCAG exemption, but avoid illegible disabled text where feasible.
3. The requirement covers page titles, body text, descriptions, counters, KPI numbers, labels/captions, hint text, buttons, tabs, active/hover/focus/selected states, responsive layouts and supported themes.
4. For gradients, images, overlays and transparency, prove the **rendered foreground against the final composited background** at representative and worst-case positions. Require an appropriate scrim/opaque text panel if adequate contrast cannot be guaranteed throughout the surface.
5. A component must not inherit a visually incompatible global color rule. Prefer shared semantic tokens and scoped surface variants; do not accumulate indiscriminate `!important` overrides. Resolve cascade conflicts at the canonical design-system owner.
6. Browser acceptance must measure `getComputedStyle` values and rendered background/surface colors after all CSS and theme overrides load. Check desktop and mobile. CI cannot be declared PASS from static token existence alone, nor by changing test thresholds instead of repairing the defect.
7. Contrast is a **release-blocking UX gate** for newly changed user-facing UI. For existing deployments, report PASS/FAIL/UNVERIFIED truthfully, prioritize inaccessible surfaces and migrate via scoped work packages. Do not claim blanket compliance without verification.

## Impact review — preliminary, evidence not yet complete

- **Architecture:** affected app shells, design-token libraries, CSS inheritance, theme providers, style precedence, import/cascade ownership and existing component variants.
- **Accessibility/product:** text, indicators, focus/hover/disabled states and light/dark/media surfaces, including overlays.
- **Security/data:** no new permissions, account or private data requirement; screenshot artifacts must redact sensitive user data.
- **Compatibility:** scope tokens and fix owner precedence; avoid broad `!important` resets that regress existing themes. No forced redesign or unapproved production release.
- **Infrastructure:** local static WCAG contrast checks and existing open-source browser tools suffice; no paid vendor is required.
- **Ecosystem:** inventory governed repositories using `control/constitution-governed-repositories.json` and exact adoption manifests; only actual measured outputs may be marked PASS. New applications inherit via Blueprint resolution after publication.

## Migration and verification work, if ratified

1. Create the exact `1.3.0` normative Constitution change, `control/universal-constitution.contract.json`, corresponding locked template, test fixtures and enforcement changes as **one consistent version set**.
2. Confirm Blueprint quality-gate resolution makes foreground/background contrast an applicable UI/UX requirement, scaled by Blueprint level but never omitted for user-facing surfaces.
3. Verify a negative fixture: legacy `!important` dark-on-dark title/KPI **fails**; a light/dark repaired fixture **passes**; a malformed RGB parser must **fail closed** rather than produce a false-positive PASS.
4. Execute exact-revision gates, review the impacted repositories individually and propagate versioned adoption only with honest per-project PASS/FAIL/UNVERIFIED evidence.
5. Existing app remediation must maintain data, navigational, auth and responsive behavior. Release/publish requires a separate authorized production gate and rollback check.

## Ratification and non-authority statement

This file and its PR are an **amendment proposal only**. No new constitutional version has been published or adopted, and this proposal alone does not certify any project's accessibility. Under `docs/CONSTITUTION-AUTHORITY-PROTOCOL.v1.md`, proceed through IMPACT REVIEWED → MIGRATION READY → RATIFICATION READY → an **authenticated human ratification bound to the exact revision** before changing the published immutable normative Constitution, contract or locked template.

AI may draft and test the proposal; it cannot invent ratification, mutate canonical PASS results or authorize production.
