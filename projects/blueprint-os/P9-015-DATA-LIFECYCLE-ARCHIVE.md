# P9-015 — Data Lifecycle & Archive

Status: **ACTIVE / DEVELOPMENT CANDIDATE**

## Purpose

Make retention, archive, export, migration and deletion explicit engineering policy instead of hidden database behavior.

## Non-negotiable laws

1. Lifecycle actions are project-scoped and fail closed on cross-project records.
2. A lifecycle preview is not canonical mutation authority.
3. Deletion is forbidden unless the record kind explicitly allows it.
4. Any allowed deletion requires an integrity-protected export first.
5. Legal hold blocks archive, migration and deletion.
6. Records used as release evidence cannot be deleted while that dependency exists.
7. Schema retirement must preserve identity, source provenance and version traceability where migration is required.
8. Project Profile, Quality Gate, Gate Evidence, Architecture Decision, Release Record and Lesson Learned histories are durable and not deletable by this baseline policy.
9. Secret-bearing keys or token-like values are invalid lifecycle input.
10. Production release authority remains false.

## Acceptance gate

- deterministic policy fingerprint;
- explicit rule per supported record kind;
- unsafe deletion policy fails closed;
- retention threshold enforced;
- verified export required before deletable records become eligible;
- legal-hold and release-evidence blockers enforced;
- lifecycle evaluation remains preview-only;
- responsive project workspace surface exposes the policy without adding destructive controls;
- exact PR-head Fast CI passes;
- merged revision must pass full Release Gate before P9-015 can be marked COMPLETE.
