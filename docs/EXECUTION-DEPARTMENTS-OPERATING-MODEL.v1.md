# Execution departments — operating model v1 (candidate)

**Scope:** Blueprint OS ownership and delivery handoffs only. This is not a constitutional amendment, a second workflow orchestrator, a live executor, a signed issuer, a completion receipt, or an automatic release approval.

## Authorities and accountable surfaces

- **Owner / constitutional authority:** authenticated human decision under active Constitution 1.3.0.
- **Blueprint OS:** canonical project architecture, workflow manifests, Work Packages, gates and references to verified evidence; it owns this role catalog.
- **Each product repository:** business code, its data, migrations, source revisions, tests, operational fixes and evidence. Work packages must point to the exact source.
- **Application-Management:** app directory, access/device control and non-sensitive operational metadata; not app data storage or gate authority.
- **Trusted executor (planned separate trust boundary):** accepts scoped, signed, revocable execution grants and writes a durable journal; it cannot ratify law, mark gates PASS or approve Production.
- **Independent verification:** a different check or actor must validate implementation evidence before a canonical authority may accept it. An AI-produced test summary is not proof.

The machine-readable responsibility catalog is `control/execution-department-ownership.v1.json`. It is validated by `scripts/check-execution-departments.mjs` and negative tests in `tests/governance/execution-departments.test.mjs`. This prevents accidental authority widening and unsupported changes to role boundaries.

## Recommended handoff flow

User requirement → Product acceptance → Architecture/UX change scope → bounded implementation → independent regression/integration/security review → authenticated human review where required → release evidence tied to exact artifact SHA → explicit release decision → operational read-back → lesson.

Every handoff records **project ID, current commit SHA, Work Package, dependencies, owner, files/credit/attempt limits, verifiable output, evidence refs, blockers and next responsible role**. Do not treat a role description as a runnable DAG; use the existing central `prompt-workflows/` definitions and canonical database instead.

If a test fails, return to the smallest causal Work Package with new evidence; block repeated failures without new evidence. No self-certification, invented receipt, forced green test, silent production access, or whole-repo re-scan by default.

## Rules for a separate repository

**Default:** keep organizational roles, policy and prompt DAG definitions in Blueprint OS; keep app implementation inside the app repository. Do not create twelve department repos.

A separately operated unit *qualifies for a repo-split assessment when any one condition is VERIFIED*:

1. Independent product/service release lifecycle, with a versioned API, accountable owner, deploy and rollback.
2. Need for OS/network/credential isolation or untrusted compute that would increase the Hub blast radius.
3. Documented sustained load or execution queues that breach a defined service-level objective or consume shared CI resources.

A candidate that meets a condition still requires a bounded integration test, operations owner, cost/retention budget, contract tests, failure-mode test, security review and approved production path before moving code. A fork of the repository is not proof of readiness.

**First candidate:** `execution-worker`. This service, if justified, would contain the isolated task-runner/queue, provider adapters, sandbox and resource limits. Blueprint OS would retain task planning, workflow manifests and policy, canonical Gate truth and evidence references. Application-Management would retain only lifecycle/health metadata. Source repositories would retain code changes and test evidence. The worker must never receive constitutional ratification or production release authority by proxy.

Do **not** create or deploy an execution-worker repository until the signed-grant/issuer, idempotent journal, scoped permission, end-to-end execution and least-privilege boundary have been verified. Splitting an unfinished engine multiplies moving parts and does not make it work.

## Prioritized rollout

- **P0 — inventory truth:** register new governed foundation repositories and show missing adoption/attestation truthfully. Historical snapshots are not fresh evidence; avoid copying old SHA forward as current. Reconcile after component PR merge.
- **P1 — organization and gates:** validate the 12 departments, authority separation, handoff and evidence in both Fast CI and Release Gate; link this catalog to existing Work Packages in a later reviewed change.
- **P2 — live execution:** implement one narrow signed-grant → scoped runner → independent QA → durable outcome flow. Production remains off until the real target environment and explicit authority are verified.
- **P3 — conditional repository split:** if P2 exposes an independent lifecycle, privileged sandbox or measured load, promote `execution-worker` from candidate to a dedicated repository through an approved architecture decision. Otherwise keep the worker modular within the existing runtime.
- **P4 — integration and UX:** test an Application-Management journey end-to-end, then propagate to other apps with a compact app-icon UI and settings hidden until needed.

**Exit conditions:** a role/model validator PASS is only governance-model integrity. A workflow or product is complete only when actual execution, independent evidence, human-required gates, exact-SHA artifact and post-deployment behavior are proven. No deployment or quality gate is authorized by this document.
