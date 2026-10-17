# Universal ZERO-SPEND Cost Gate — Blueprint OS 1.3.0 candidate

**Stage: DRAFT / NOT RATIFIED.** This is a proposed operating policy, not a constitutional revision or automatic rollout. Active Constitution 1.3.0, source-of-truth protections, RU03, device QA, review, merge, Preview and Production gates remain fully binding. Constitutional Authority retains exclusive ratification rights under `docs/CONSTITUTION-AUTHORITY-PROTOCOL.v1.md`. Coordinate separately with the Product Goal Continuity candidate (Draft PR #147).

## Evidence, not guesses

On 2026-10-17 the owner provided a GitHub Free billing screenshot: **2,000/2,000** Actions minutes used, US$159.47 metered fully discounted, **US$0 billable usage** displayed. GitHub refused to start Bauman-Russian-iOS private macOS jobs due to a payment/spending-limit gate. This does NOT establish an outstanding $159.47 charge, and does not prove that Swift code failed. Account-wide minutes for private hosted runners are shared across projects.

GitHub owner inventory found **22 repositories**; the default-branch workflow directories were enumerated for visible repos, but that does not measure real per-workflow billable minutes. Private Bauman-Russian-iOS Draft PR #3 contains native macOS workflows not present on default main. Inventory on this branch is **metadata**, not complete exact-SHA compliance proof.

GitHub official docs: standard hosted jobs on public repositories and self-hosted runners are currently billed at zero GitHub Actions minutes; **private hosted jobs consume limited allowance and beyond-quota use can be billed or blocked**; larger/custom runners may cost money. Do not change any private repository to public as a cost workaround.
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows

## Proposed rules Z1–Z10 (subject to review)

1. **Local-first Quality:** on Windows use focused, reproducible tests for the changed module. App-manager may *suggest* approved commands but never inject arbitrary shell or elevate to admin.
2. **Budget fail-closed:** before initiating private hosted CI read the owner's current Actions spending gate; unknown/exhausted/blocked = **BLOCKED**, no automatic retry and no increase to spending limit or payment method.
3. **Cost-aware scheduling:** prefer local Node/Python/Playwright and scoped regression; do not rerun an already proven exact SHA/dependencies just to gain another green badge. Full test suites only when changed source and release authority justify them.
4. **No false test equivalence:** macOS SwiftUI, WidgetKit SpringBoard, Apple signing/App Group, physical iPhone or RU03 remain BLOCKED/NOT_TESTED when unavailable. Previous GitHub CI is not a PASS for new SHA.
5. **Safe Windows execution:** self-hosted Actions on the user's management PC are **not enabled**. If ever proposed, require disposable isolated VM, non-admin runner, no personal tokens/secrets, protected source, tightly scoped networking, no privileged IPC, threat-model review and explicit owner action. Native local commands first.
6. **No hidden release:** preserve offline-first and Bơi Ếch existing special publishing mode without authorizing automatic online publish, Preview/Production, merge or ratification for any app.
7. **No cost laundering:** keep repository visibility unchanged and never turn a private repository public solely to access free CI.
8. **One correct Next Action:** route decisions back to the product goal, not repeated CI-status review.
9. **Bounded Work:** only for a genuinely necessary cross-app task; present two options (continue Chat or budgeted Work prompt). Work is not a Constitutional Authority.
10. **True inheritance after approval:** Hub is canonical; project migration and source-SHA QA follow human constitutional review, not blind mass edits or fake 22/22 compliance.

## Immediate zero-hosted-minute audit

From a checked-out copy of **this candidate branch** under `E:\BaumanWeb\Software-Blueprint-Hub`, using Node.js 22+, run on Windows:

```powershell
node scripts/zero-spend-audit.mjs --root "E:\BaumanWeb" --output "E:\BaumanWeb\zero-spend-audit.json"
node --test tests/governance/zero-spend-audit.test.mjs
```

This inspects only local `.github/workflows/*.yml` files from the 22-owner-repository candidate inventory. Missing clones/unknown triggers/dynamic runners remain **NOT_CHECKED/REVIEW**, not compliant. It does not call GitHub, start Actions, run any app code, access credentials, calculate actual invoice allocations, or write anywhere except the explicitly named JSON report.

## Implementation sequence / impact

- **P0 NOW**: read-only inventory and local negative tests; keep private hosted CI paused while the owner's account quota is exhausted. To prevent further automatic workflow attempts on protected branches, an authorized owner can disable specific workflows in GitHub's Actions settings; these settings are NOT modified here.
- **P1 CONDITIONAL**: Application-Management can expose a reviewed local test allow-list only with origin SHA validation and least privilege, never full arbitrary command execution.
- **P2 REVIEWED**: per-project separate Draft PRs adjust verified CI triggers/path filters/job dedupe, preserving release and compliance gates. Do not alter 22 repositories in bulk without exact workflow and approval evidence.
- **P3 AUTHORITY**: Constitutional Authority decides whether to ratify and publish a new exact constitution version or adopt a narrower lower-level operational guideline. Only then propagate it with signed project checkpoints and truthful PASS/BLOCKED.

**Cost semantics:** ZERO-SPEND refers to *no additional paid GitHub-hosted Actions or paid external services*. Local electricity, connectivity, owner hardware, or future voluntary payments are not represented as literally free. No automatic cost/billing operations were taken.

**Next Action after static audit:** review the resulting high-risk private-auto and unknown workflow list; choose one scoped pilot to make app-local tests available through an approved App-manager UI, while keeping hosted CI/Apple tests blocked.