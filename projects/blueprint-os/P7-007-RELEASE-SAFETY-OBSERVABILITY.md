# P7-007 — Release safety and observability hardening

Status: **IN PROGRESS**

## Purpose

Strengthen exact-revision release checks, operational evidence, rollback verification and observability contracts without authorizing or performing a Production deployment.

P7-007 makes Release Gate evidence more trustworthy. It does not convert CI success into a deployment claim.

## Exact revision contract

For pull requests, Release Gate must certify the actual PR head revision.

The workflow must:

1. resolve `RELEASE_GATE_REVISION` to the PR head SHA (or `github.sha` for manual dispatch);
2. checkout that exact SHA explicitly;
3. compare `git rev-parse HEAD` with `RELEASE_GATE_REVISION`;
4. fail closed if they differ.

This prevents a synthetic pull-request merge ref from being mislabeled as evidence for the branch head.

## Operational evidence manifest

After all Release Gate validation steps pass, CI generates:

`artifacts/release-gate-evidence.json`

The manifest records:

- schema version;
- repository;
- exact certified revision;
- workflow;
- run id;
- run attempt;
- event;
- ref;
- generation timestamp;
- the validation groups that passed;
- `productionDeploymentAuthorized: false`.

The manifest is operational evidence for CI validation only.

It must not claim:

- Preview was deployed;
- Production was deployed;
- post-deploy health checks ran;
- rollback was executed in a live environment.

Those claims require separate authorized deployment evidence.

## Artifact identity

Release Gate artifacts must be named with the exact certified revision, not the pull-request merge SHA.

This keeps screenshot / report / manifest provenance aligned with the revision that was actually checked.

## Rollback verification

A `ReleaseRecord` in `rolled-back` status must satisfy all existing release evidence rules and also:

- `rollbackRevision` is present;
- rollback revision differs from the revision being rolled back;
- rollback revision identifies another canonical ReleaseRecord in the same project;
- that target record represents a previously released artifact state:
  - `released`;
  - `rolled-back`;
  - or `superseded`.

A free-form or unknown revision string is not sufficient rollback verification.

## Observability boundary

P7-007 observability is evidence-of-validation, not runtime production telemetry.

Current Release Gate observability includes:

- exact revision;
- CI run identity;
- check groups;
- build/test/browser evidence;
- Human UX artifacts.

Runtime service health, deployment read-back and live rollback checks remain Release Mode / deployment responsibilities under `docs/DEVELOPMENT_RELEASE_POLICY.md`.

## Regression evidence

P7-007 must prove:

1. Release Gate explicitly checks out exact PR head revision;
2. checkout verification fails on revision mismatch;
3. operational evidence manifest accepts only a 40-character exact SHA;
4. manifest never implies Production authorization;
5. rollback to unknown revision fails;
6. rollback to the same revision fails;
7. rollback to canonical previously released revision succeeds;
8. existing exact evidence / immutable released identity / optimistic conflict tests remain green;
9. exact-head Fast CI and Release Gate pass;
10. Human UX artifacts remain usable and provenance-aligned.

## Gate

P7-007 may PASS only when the Release Gate can independently demonstrate what exact revision it certified and rollback state cannot point at an unverified arbitrary revision.

Production deployment remains unauthorized.
