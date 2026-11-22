# C3 — Universal Next Action UI integration checkpoint
Date: 2026-11-22. Draft PR #173. Latest source change `2e0b034170eb999760a175842f7a91c4dcf22e27`.
ACTIVE Constitution 1.3.0 unchanged. ZERO-SPEND. No merge, ratify, publish.

## Live source comparison
PR #166 (unmerged) `graph-intelligence-studio.tsx` and server loader were read directly. Graph Studio uses a canonical authenticated PROJECT_READ loader and read-only projection; its UI is a separate candidate, not assumed to exist on main. PR #161 `uana-panel.tsx` was read: currently previews then copies draft to clipboard and opens ChatGPT, explicitly cannot send from Blueprint Hub. Main project Overview was read and updated only on PR #173 candidate branch.

## Actual code changes
- `apps/web/app/projects/[projectId]/_components/universal-next-action.candidate.tsx`: one primary CTA, real internal-navigation semantics, project context, source/checkpoint details, blocked/unverified states, keyboard access, no false dispatch.
- `apps/web/app/projects/[projectId]/_components/universal-next-action.candidate.module.css`: mobile-first responsive layout, contrast and focus styling, reduced-motion.
- `apps/web/app/projects/[projectId]/page.tsx`: component mounted within existing authenticated Overview after canonical workspace read. CTA opens the existing project Prompt Workspace. Until exact canonical Next Action projection is wired, status is deliberately `unverified` and WorkPackage/Checkpoint/SHA are null. This is real navigation, **not autonomous execution or project-level checkpoint resume**.
- `packages/application/src/atlas-next-action-adapter.candidate.mjs` and 8 test cases remain read-only integration candidates.

## Verified vs not verified
GitHub connector confirmed writes and returned commit SHAs. Local container has Node 22.16.0 but GitHub clone failed DNS resolution (`Could not resolve host: github.com`), so no exact-HEAD checkout or test run. **Typecheck, build, browser, Playwright, cross-device and JSON Schema consistency are UNVERIFIED**. No claim that Graph Studio is integrated: PR #166 remains a separate PR. No claim that ChatGPT host tab can be controlled by Blueprint OS.

## Next implementation gates
1. Exact checkout of PR #173 and PR #166 in authorized runner; run candidate node tests and schema validation, typecheck/build and browser QA with logs and exit codes.
2. Resolve semantic contracts across #161/#166/#173 and wire server-authorized real READY work, gate/evidence and checkpoint into Overview. Never accept client-supplied authority or unverified revision as PASS.
3. Provide an in-app supported action that genuinely performs bounded authorized work; otherwise label the CTA `Open Prompt Workspace`, never `Execute`.
4. Validate touch, keyboard, small screens, reload, stale state, role separation and failure recovery on actual devices/browsers.
5. Only after QA, reviewer and human gates can integration/merge/publish be separately considered.
