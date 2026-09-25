# Schema migration evidence

Breaking canonical schema changes must not be accepted merely because generated
TypeScript still compiles.

For `vertical-slice.contracts.v1.json`, a breaking change detected against the
versioned baseline requires:

`schemas/migrations/vertical-slice.contracts.v1.md`

with exact lines:

```text
Status: ACCEPTED
From-SHA256: <exact baseline sha256>
To-SHA256: <exact current sha256>
```

The evidence document must also explain compatibility impact, migration,
rollback, and validation. A stale hash does not authorize a newer schema.
