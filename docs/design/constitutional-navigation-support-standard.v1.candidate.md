# Blueprint OS — Navigation Support Controls v1 (Draft Standard)

> STATUS: PROPOSAL ONLY in Hub Draft PR #173. This is **not** an ACTIVE Constitution amendment or a release approval.

## Visual and interaction baseline

The owner-provided reference (2026-11-24) is the UI acceptance target:
- A pinned **Bảng hỗ trợ điều hướng** entry with high-contrast, rounded dark/light responsive styling.
- Two immediately usable controls: **Theo Hiến pháp** (read normative authority) and **Tạo prompt tiếp theo** (draft only).
- Three **mutually exclusive**, keyboard-operable **Định hướng của bạn** radio options: close P0 before P1, provisional layout while closing P0, or P1 fidelity strictly after P0 is verified. Show the default clearly.
- **Yêu cầu riêng** text area with a hard 2,000-character limit. Any modification to radio selection, requirements, prompt text or canonical source invalidates the previous prompt review.
- **Prompt được tạo** editable preview with **Duyệt prompt → Sao chép → Thực hiện tiếp**. Copy and continue remain disabled until the **current** prompt is reviewed. The continue action only opens a validated in-app Workspace path; it never invokes an Agent or sends a prompt silently.
- Desktop/tablet/mobile 1440/800/390, light/dark, keyboard, focus outlines, reduced-motion and no horizontal overflow. Always maintain text contrast and 44+px hit targets.

## Safe data and authorization contract

The prompt builder accepts the existing server-derived `NextActionView` only; directions are an explicit allowlist of **user preferences**, not source truth or delegated release authority. Missing canonical source revision must disable prompt generation. Review is for text content only; **never** mark QA, P0/P1, human UX, independent reviewer, WorkPackage/Graph, merge, constitutional ratification or Production as APPROVED.

Do not put private source, credentials, hidden tokens, or user-authored prompts in URLs, analytics or screenshot artifacts. All follow-up actions must re-read current HEAD, Constitution ACTIVE and owner permissions before altering canonical state. Do not create a second Tool, site or ledger to implement these controls.

## Rollout and gates

1. Implement and test the reference control within existing Hub project Workspace Draft #173, not a new app.
2. Verify Node24 prompt allowlist and blocked gate logic, React/Next SSR/typecheck/build, and real Chromium desktop/tablet/mobile with transient synthetic screenshot artifacts.
3. Obtain owner screenshot/UX acceptance and independent security review before proposing shared propagation to existing Application-Management and managed apps. Propagation must be incremental, role-aware and preserve each application's workflow context.
4. Do **not** change the ACTIVE Constitution 1.3.0, disable reviewer gates, merge this Draft, or publish from this proposal.

Canonical portfolio ledger remains Hub Issue #159. Hub→APP Graph remains `metadataOnly=true, endpoints={}`, `NOT_CONNECTED`; C33 key-freshness and historical kid/SPKI findings remain OPEN_BLOCKING until independently remediated.


## Proposed normative amendment — NAV-SUPPORT-001 (Owner direction 2026-11-24)

**Candidate legal text (not yet effective):** Every existing and future governed Blueprint project SHALL provide a consistent, readily discoverable navigation-support surface on each substantive project-work response or equivalent task workspace. It SHALL expose the effective Constitution, current evidence-based next action, mutually exclusive P0/P1 directions, a custom requirement field, and an editable follow-up prompt with distinct review, copy and continue actions. Default to closing P0 before P1; the owner has explicitly not accepted the current UI. Preserve canonical source binding, accessibility, privacy, human approval and independent trust boundaries. A text review SHALL NOT confer any engineering, constitutional, operational or release authority.

**Effectivity and universal inheritance:** Upon valid constitutional ratification and publication, this obligation applies immediately to all governed existing and future projects; there is no optional per-project opt-out, nor a requirement to wait for the Hub product's Production release before the law takes effect. The existing authorized constitutional publication mechanism, normative text, machine contract, template and policy source must be reconciled at one version; do not change the ACTIVE pointer in isolation. Implementation and verification are distinct from legal effect: each project records its real adoption status and remediates P0 first, without bulk claims of compliance or deployment. Do not block publication solely on unrelated product UI release status; mandatory constitutional ratification itself remains protected.

**Host limitations:** For ChatGPT and other host-controlled interfaces, render functional controls when supported; otherwise provide a visible text/copyable prompt equivalent on every substantive reply. Never pretend a repository can install persistent native host UI or that text fallback proves native interaction acceptance. For existing applications, reuse the authorized shared presentation contract, not a new app, dashboard, registry or duplicated approval engine.

**Acceptance:** verify repeat replies, desktop/tablet/mobile, keyboard/touch, focus, contrast, stale revision invalidation, honest fallback, and actual user-observed task outcomes. A missing required support surface or nonfunctional/misleading critical action is P0; visual refinements are P1 only after P0 passes. Record evidence in existing Issue #159 and project-specific canonical evidence. No synthetic PASS, new keys/grants, reviewer bypass or Production authority.

**Authority disposition:** Owner requests immediate publication, but the same execution instruction explicitly prohibits merge, ratify and publish and preserves human gates. This Draft captures the requested normative obligation without claiming ACTIVE effect or overriding that restriction. Constitutional publication and product release are separate actions.
