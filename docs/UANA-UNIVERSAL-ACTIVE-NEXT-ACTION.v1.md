# UANA v1.0 — Universal Active Next Action

Status: SOURCE-ONLY CANDIDATE; NOT PUBLISHED. Owner selected C, a centralized reusable module inside the existing Blueprint Hub Prompt Workspace. NO new control plane, route, database, Worker, dashboard, approval role or paid service.

## Source of truth and authority
- Published Blueprint OS remains 1.3.0 (control/universal-constitution-version.json). Reverify active policy at execution.
- Every recommendation is derived from the PROJECT_READ-authorized Project Profile, unfinished Work Packages, linked Quality Gates and a current Prompt Projection. The prompt is NOT canonical data, not a reviewer result and not a signed Owner approval.
- Existing route: /projects/:projectId/prompt. One reusable component serves all authorized projects with canonical work. Other projects' data MUST NOT be loaded or mixed.
- Git HEAD, repository and Issue checkpoint are OPTIONAL verified references; unknown fields remain visibly UNVERIFIED. A Prompt Projection ID is not falsely presented as an Issue ID.
- Application-Management may consume metadata links later; it must not clone the central prompt registry or authorization state.
- A single repository commit CANNOT automatically update every ChatGPT Project's instructions. Portable Owner-approved instructions are in docs/UANA-CHATGPT-PROJECT-INSTRUCTIONS.v1.md.

## Behavior
1. Validate project identity and reject Work Package or Gate records belonging to another project.
2. Require exact sourceRevision = projectionRevision. No suggestion from stale or absent source.
3. Pick unfinished canonical Work Package (blocked > in-progress > ready > planned, stable ID). Never suggest redoing completed/cancelled work.
4. Present up to three honest options: A inspect, B bounded continue or unblock (default), optional C long-range advisory ONLY if no active gate problems. No artificial three choices when one/two are warranted.
5. Owner selects with a real radio control, opens Preview, edits the derived prompt locally, explicitly copies and sends via ChatGPT. From the external Hub page the service CAN COPY and OPEN CHATGPT only; it CANNOT submit a chat turn itself, and must never claim it did.
6. All choices carry project ID, canonical revision, projection ID and Work Package ID. Unverified source metadata is shown as unknown. Changes to source invalidate the draft.
7. Outcome feedback is triaged by real source evidence and A/B review; green CI or positive user feedback alone cannot promote a Quality Gate or universally reliable learned rule.

## Failure / release boundaries
- Reject mixed-project data, wrong revision, duplicate IDs, invented Git HEAD, stale projection, unauthenticated read, missing canonical tasks and oversized input; never fabricate a recommendation.
- Drafts always declare candidateOnly=true, qualityGatePassed=false and productionAuthorized=false. No UI action grants ProjectAuthority, signs Constitution, mutates canonical state, touches secrets/D1 or merges/deploys Production.
- Edited draft is untrusted text; the receiving project agent must re-check source and authorization independently.
- No model weight fine-tuning; evidence-based lessons require multi-project pattern governance and human approval.
- FREE-only, keep existing runtime, avoid duplicated apps and token-heavy polling.

## Implementation
- Pure typed engine: packages/application/src/universal-active-next-action.ts, exported by existing package index.
- Adversarial tests: tests/application/universal-active-next-action.test.ts.
- Native Prompt Workspace UI: apps/web/app/projects/[projectId]/prompt/uana-panel.tsx, scoped CSS; integrated into existing page.tsx.
- Portable ChatGPT Project instruction template: docs/UANA-CHATGPT-PROJECT-INSTRUCTIONS.v1.md.

## Gates and rollout
R0: candidate branch + Node24 tests + review. R1: real responsive/browser evidence and Owner UX trial in authorized existing Preview. R2: optional App-Management metadata-only link, no copied control plane. R3: per-Project Owner opt-in for instructions (no bulk mutation). R4: cross-project evidence replay/Owner approval of pattern improvement.

No merge, deploy, secret, new database, paid provider or Production authorization is implied. ACTIVE NEXT ACTION: verify full Node24 CI and independent review at exact HEAD, obtain real Owner UX feedback, then request human approval before publishing.
