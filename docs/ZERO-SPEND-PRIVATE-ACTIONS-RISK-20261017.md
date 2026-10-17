# Read-only private-repository hosted runner risk sample — 2026-10-17

**Status:** STATIC EVIDENCE ONLY; no GitHub jobs launched, no global workflow mutation and no cost allocation/invoice proof. Read from connected GitHub default branches except the iOS P2 Draft branch.

| Private repo | File(s) reviewed | Trigger(s) | Runner evidence | Disposition |
|---|---|---|---|---|
| Bauman-Russian-iOS | `.github/workflows/ios-p2-build.yml` on `feat/p2-native-widget-offline-gated` | `pull_request` | two `macos-15` jobs | **BLOCKED_HOSTED_CI**, historically quota denied |
| Blueprint-Russian-Expert-Engine | `contract-checks.yml` on main | `push` | `ubuntu-latest` | REVIEW_PRIVATE_AUTO |
| Software-Blueprint-Execution-Gateway | `ci.yml` + `constitution.yml` on main | `pull_request` | Ubuntu for ci; Constitution job defined separately | REVIEW_PRIVATE_PR |
| Software-Blueprint-Execution-Worker | `ci.yml`, `constitution.yml`, `live-pinned-smoke.yml` on main | `pull_request` | Ubuntu for ci and live smoke; Constitution separately defined | REVIEW_PRIVATE_PR |
| Software-Blueprint-QA-Worker | `ci.yml`, `constitution.yml`, `live-pinned-smoke.yml` on main | `pull_request` | Ubuntu for ci and live smoke; Constitution separately defined | REVIEW_PRIVATE_PR |

Some Constitution workflows are reusable callers rather than independently specifying `runs-on` at the top of their YAML, so static inspection **does not establish the ultimate execution runner or cost**. Any scheduled, reusable, dynamic, or unparsed workflows require additional scoped review before policy edits.

**Ecosystem:** 22 owned repos were enumerated; many public repos have multiple workflows. GitHub's standard hosted runners in public repositories are generally free, whereas *private* hosted runs use shared free allowances; that does not grant automatic release or avoid larger-runner costs. The main-branch filename inventory is only a starting point; no 22/22 compliance claim.

**Root cause already established for specific iOS run:** the owner's GitHub Actions annotation explicitly denied starting both jobs because of an account payment/spending-limit gate. The owner billing screenshot showed 2,000/2,000 included Actions minutes used and $0 billable after full discounts. **The source may still be valid even though new CI is blocked.**

**Decisions reserved for authorized owner:** (1) whether to disable any existing private auto-workflow in GitHub UI, (2) which product local tests have sufficient trust/isolation to run on Windows, (3) when to re-enable hosted CI after quota resets, and (4) whether the constitutional Cost Gate is ratified or kept operational. No payment, repository-visibility switch, self-hosted runner, secret access, merge or Production action is implied.

**Next experiment:** On the owner's Windows PC run the read-only audit script from the candidate Hub branch. Its JSON output identifies locally cloned workflows and missing repos without invoking GitHub-hosted CI.
