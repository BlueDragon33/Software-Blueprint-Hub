# PAE Amendment — Impact and Migration Assessment (Draft)

Status: DRAFT; no independent reviewer signoff; no human ratification; no publication.
Linked proposal: docs/amendments/PROJECT-AWARE-AUTONOMOUS-EXECUTION-20261104-PROPOSAL.md (PAE-01..12).

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
3. Separate visible label/summary from execution payload and action authority; use only real supported interaction.
4. Preserve exact HEAD and evidence in checkpoint; ensure stale HEAD causes refresh rather than unsafe execution.
5. Verify mobile and desktop rendering, actual click dispatch, project isolation, blocked states and accessibility.
6. Record regression results and independent review; only then mark project adoption evidence complete.
7. Keep non-compliant or unsupported implementations BLOCKED; never auto-publish or override production gates.

## Required acceptance scenarios
- UX-01: Long internal prompt is not rendered as large heading or prose block.
- UX-02: Mobile portrait renders readable short action and supporting context without clipping.
- UX-03: Tapping action dispatches correct project task exactly once.
- UX-04: Other project action cannot appear or dispatch.
- UX-05: No connector/host action: explicit unsupported state, not fake interactive control.
- UX-06: Reviewer/production block remains enforced after tapping.
- UX-07: Session resume reads checkpoint and corrects stale SHA.
- UX-08: Accessibility name, focus/touch behavior and feedback checked on actual supported host.
- UX-09: Merely shortening the text does not satisfy UX-03.
- UX-10: No hosted CI / paid calls without authority.

## Remaining blockers
- No independent UX interaction evidence or authorized real-host mobile test.
- No reviewer signoff.
- No authenticated exact-revision constitutional ratification.
- No canonical machine-readable contract/template version set or publication evidence.
- No project-by-project verified propagation.

Decision: DRAFT; ACTION_UX_PASS NOT PROVEN; RELEASE BLOCKED.
