# P9-016 — Accessibility & Adaptive UX Audit

Status: **ACTIVE / DEVELOPMENT CANDIDATE**

## Purpose

Re-audit the current Phase 9 product across desktop, tablet/iPad and phone after the Compass, Bootstrap Factory, Security and Data Lifecycle surfaces were added.

## Required evidence

- keyboard-only navigation remains usable;
- skip navigation and visible focus remain intact;
- active workspace route retains `aria-current="page"`;
- reduced-motion disables animation/transition behavior;
- no critical surface introduces horizontal page overflow;
- touch targets remain usable on tablet/phone;
- PASS/FAIL/candidate/blocked state remains text-visible rather than color-only;
- dense Quality/Lifecycle/Release views remain readable on narrow viewports;
- desktop, tablet and mobile Playwright projects all execute current critical journeys.

## Gate

P9-016 cannot complete from unit tests alone. Exact merged revision must pass full Release Gate including all three viewport classes and Playwright evidence. Production deployment remains separate.
