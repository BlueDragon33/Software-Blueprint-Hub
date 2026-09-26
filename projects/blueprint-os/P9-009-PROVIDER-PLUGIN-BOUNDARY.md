# P9-009 — Provider / Plugin Boundary

Status: **DEVELOPMENT CANDIDATE**

## Purpose

Define one safe external-provider boundary for source control, deployment systems and future connectors without leaking credentials or granting external providers authority over Blueprint OS canonical state.

## Laws

1. Provider capabilities are explicit and versioned.
2. Project scope is explicit; a provider cannot silently operate on another project.
3. Raw secrets are forbidden in provider descriptors and invocation metadata.
4. Credentials are opaque references only.
5. Every invocation is revision-aware, actor-aware and correlation-aware.
6. Provider execution is external; an invocation plan is not proof that the provider action succeeded.
7. Providers cannot mutate canonical Blueprint state, PASS Quality Gates or authorize Production release.
8. Production mutations remain blocked until Release Orchestration introduces separate explicit authority.

## Contract

A provider descriptor declares:

- stable provider identity/version/kind;
- allowed project IDs;
- credential-reference policy;
- explicit capabilities and their mode;
- hard-false authority flags for canonical Blueprint mutation, Quality Gate authority and Production release authority.

An invocation request declares:

- provider/project/capability;
- actor;
- exact source revision;
- correlation ID;
- optional opaque credential reference;
- target environment;
- non-secret metadata.

The resulting invocation plan is deterministic and carries an audit fingerprint.

## Acceptance

P9-009 may complete only when:

1. provider descriptors reject authority leakage;
2. unsupported capabilities fail closed;
3. out-of-scope project access fails closed;
4. raw secret-bearing keys and token-like values fail closed;
5. credential references use accepted opaque prefixes;
6. invocation plans are deterministic and audit-fingerprinted;
7. Production mutations remain blocked;
8. source-of-truth contradiction checks remain green;
9. exact PR-head Fast CI passes;
10. a full Release Gate passes before any Production publish decision.
