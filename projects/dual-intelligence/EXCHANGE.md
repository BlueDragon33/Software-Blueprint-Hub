# Intelligence exchange v1

Hub owns `packages/contracts/src/intelligence-exchange.mjs`. Its exported schema is materialized in `schemas/intelligence-exchange-manifest.v1.json`. Engine repositories carry the exact portable module and a source pin for offline execution. Local research and defense records have independent revisioned formats with separate owners.

The wire is one UTF-8 JSON object and one trailing LF. Member names sort in ASCII order and JSON uses compact separators. All admitted fields are ASCII scalars in a closed schema. The lowercase SHA-256 digest covers the same compact object with the integrityDigest field removed, without a trailing LF. Scope binds a known manifest producer and owner to Hub for private reference-only use. A UUID refers to local evidence. Raw content, paths, source URLs, credentials, AI text and canonical decisions have no wire field. Each producer assigns a stable opaque evidence UUID and increments contentRevision when the finding changes.

| Input | Behavior |
|---|---|
| Current v1.0.0 and exact independently pinned digest | Eligible only after current read scope and retention checks |
| Older content revision or unapproved source revision | Reject |
| Known ID and equal revision with the same digest | Idempotent duplicate |
| Known ID and equal revision with a different digest | Reject revision conflict |
| Unknown schema version, new field or noncanonical wire | Reject pending explicit protocol update |
| Missing or revoked trusted pin, unavailable verifier, malformed authorization | Reject |

A digest establishes byte integrity. Authorization and identity depend on a caller bound to the consuming Hub's existing project access and independently maintained source verification. The caller supplies an atomic trusted snapshot of that scope, the current source pin, and any prior reference. The adapter returns an advisory reference without persisting data or passing gates. Current v1 has no automatic migration. Future readers must add explicit version dispatch and regression cases before accepting a new wire version. Historical manifests can be re-evaluated against a still-current, unrevoked pin within the retention window. Deleting the trusted pin or changing source revision withdraws admission.

Local adversarial cases include foreign scopes, unsupported revisions, poisoned source instructions, unreviewed rights, over-budget data, duplicate object keys, unchecked asset identity, forged digests, fabricated gate fields, stale references and raw-private evidence. No execution provider participates in this slice.
