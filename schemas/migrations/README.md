# Schema migration evidence

Breaking canonical schema changes must not be accepted merely because generated
TypeScript still compiles.

For every guarded schema, a breaking change detected against its versioned baseline requires a matching migration-evidence document.

Currently guarded contracts:
- `vertical-slice.contracts.v1.json` → `schemas/migrations/vertical-slice.contracts.v1.md`;
- `reference-import-manifest.v1.json` → `schemas/migrations/reference-import-manifest.v1.md`.

with exact lines:

```text
Status: ACCEPTED
From-SHA256: <exact baseline sha256>
To-SHA256: <exact current sha256>
```

The evidence document must also explain compatibility impact, migration,
rollback, and validation. A stale hash does not authorize a newer schema.
