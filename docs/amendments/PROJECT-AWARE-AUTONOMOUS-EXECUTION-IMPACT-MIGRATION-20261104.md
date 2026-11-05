# PAE Amendment — Impact and Migration Assessment (Draft)

Status: DRAFT; no independent reviewer signoff; no human ratification; no publication.
Linked proposal: docs/amendments/PROJECT-AWARE-AUTONOMOUS-EXECUTION-20261104-PROPOSAL.md (PAE-01..14).

## Impact matrix
| Domain | Change | Risk / mitigation |
|---|---|---|
| UX | Project-local primary action; mobile-readable presentation | Host rendering differs; require visual and actual tap acceptance |
| Security | Context isolation and authorization boundaries | Prevent cross-project leakage; fail closed on ambiguous identity |
| Governance | Proposal cannot self-ratify | Separate constitutional owner, reviewers and publication |
| QA | New ACTION_UX_PASS gate | Do not infer from CI, screenshot, label length or mock click |
| Operations | Durable checkpoints and recovery | Exact revision binding, non-secret evidence, staleness detection |
| Cost | Prefer ZERO-SPEND | No paid workflow or hosted CI without authorization |
| Compatibility | Additive process semantics | No host UI modification promised; no automatic rollout |

## Migration by project
1. Inventory project ID, repository, canonical checkpoint path and current release gates; avoid cross-project task aggregation.
2. Implement project-scoped action selection with a single primary action and exactly one safe fallback.
3. Separate visible label/summary from the full editable execution payload and action authority; use the shared R34.C.9 candidate contract and template rather than a per-app duplicate. Opening a draft does not execute; final Send uses the edited text.
4. Preserve exact HEAD and evidence in checkpoint; ensure stale HEAD causes refresh rather than unsafe execution.
5. Verify mobile and desktop rendering, actual click dispatch, project isolation, blocked states and accessibility.
6. Record regression results and independent review; only then mark project adoption evidence complete.
7. Keep non-compliant or unsupported implementations BLOCKED; never auto-publish or override production gates.

## Required acceptance scenarios
- UX-01: Long internal prompt is not rendered as large heading or prose block.
- UX-02: Mobile portrait renders readable short action and supporting context without clipping.
- UX-03: Tapping opens the complete editable draft; explicit Send dispatches the correct project's actual edited text exactly once.
- UX-04: Other project action cannot appear or dispatch.
- UX-05: No connector/host action: explicit unsupported state, not fake interactive control.
- UX-06: Reviewer/production block remains enforced after tapping.
- UX-07: Session resume reads checkpoint and corrects stale SHA.
- UX-08: Accessibility name, focus/touch behavior and feedback checked on actual supported host.
- UX-09: Merely shortening the text does not satisfy UX-03.
- UX-10: No hosted CI / paid calls without authority.
- UX-11: Editing the full prompt preserves the actual edited text sent; opening a draft alone sends nothing.
- UX-12: Closing/cancel has no external side effect; duplicate clicks/sends cannot duplicate a dispatch or protected mutation.
- UX-13: An edited/stale project, SHA, goal or claimed role is revalidated against trusted scope and permissions before execution.
- UX-14: A-to-Z selected or inherited from explicit authorization continues independent READY work through bounded repair and checkpointing; a blocked branch does not halt the rest.
- UX-15: Unsupported host, session/capability limits and protected review/release gates stay truthful; source/static tests and the Owner's screenshot cannot certify native-host ACTION_UX_PASS.


## Protocol alignment and version decision
- This document is an **author-authored assessment**, not an independent `IMPACT REVIEWED` decision or `MIGRATION READY` gate attestation.
- Constitutional Authority, Project Authority and Production Authority remain distinct. The proposer and implementing assistant cannot impersonate independent reviewers or an authenticated Constitutional Owner.
- The proposal is an additive strengthening of conversational execution governance, provisionally compatible with a **minor** constitutional amendment. Final version number/class requires impact-review decision; the currently planned 1.4.0 release must not be overwritten or assumed to include this PR.
- Publication requires one exact ratified revision set: normative Constitution, machine-readable contract and canonical template, with compatibility checks and publication evidence. None is produced or authorized by this draft.
- Project propagation requires per-repository adoption and evidence; policy approval alone cannot mark a project compliant.

## Additional architecture and data impacts
- **Architecture:** Project-scoped selection belongs in a provider-neutral orchestration/adapter boundary; canonical authority is not a chat prompt or UI widget. Avoid coupling to any single host's action component.
- **Data:** Checkpoint owner, schema version, revision, provenance, retention and non-secret content must be defined per project. A stale or unavailable checkpoint must not silently replace authoritative repository evidence.
- **Failure and recovery:** Action dispatch must be idempotent where possible; repeated taps or retried requests must not duplicate protected mutations. Record a correlation identifier and truthful failure state without storing credentials.
- **Compatibility:** Projects without an action-capable host must provide a non-deceptive conversational fallback; do not claim that a constitutional update changes the ChatGPT application's native UI.

## Gate evidence still needed
- Independent assessment of UX/security/architecture/data and compatibility on exact proposal HEAD.
- Authorized mobile and desktop rendered/tap tests, with screenshots plus actual action trace.
- Project migration inventory and adoption blockers, not merely a generic checklist.
- Constitutional Owner's authenticated ratification bound to the reviewed exact revision, followed by separate publication.

## Remaining blockers
- No independent UX interaction evidence or authorized real-host mobile test.
- No reviewer signoff.
- No authenticated exact-revision constitutional ratification.
- No canonical machine-readable contract/template version set or publication evidence.
- No project-by-project verified propagation.

Decision: DRAFT; ACTION_UX_PASS NOT PROVEN; RELEASE BLOCKED.
