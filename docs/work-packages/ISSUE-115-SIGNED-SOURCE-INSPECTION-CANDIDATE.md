# Issue #115 — Proposed canonical Work Package and Quality Gates (DRAFT ONLY)

> **Status: PROPOSAL_NOT_PERSISTED / REVIEW_REQUIRED / EXECUTION_BLOCKED.** This document is an editable submission for the **existing** canonical Project Profile, Work Package and Quality Gate application services; it is NOT a new registry, a canonical DB record, an adopted workflow, an approved issuer, a signed receipt, a constitutional amendment, an execution authorization, or an instruction to mutate Production.

## Observed source and authority (2026-10-17 checkpoint)

- Draft implementation PR: [#149](https://github.com/BlueDragon33/Software-Blueprint-Hub/pull/149), starting HEAD `638edb4063859421c21d2f1335015c1213ff1e71`. Draft-only modifications in this PR are **not deployed on main**.
- Blueprint Hub main/source-of-inspection observed: `cd01fb3c2178393628ce968af209db082227d2c4`. **Re-fetch HEAD immediately before signing; stop on drift**.
- Canonical Profile observed through read-only isolated Neon query: `profile:blueprint-os` / `project:blueprint-os`, `recordVersion:1`, B4. Its actual availability and version in the authoritative target runtime must be rechecked on entry.
- Isolated branch `br-dry-star-b35qhh51`: zero `ProjectAuthority`, `WorkPackage`, workflow adoption and issuer decisions at checkpoint. Production: no ProjectAuthority or WorkPackage records at checkpoint. **A SystemBootstrap Owner may have authority separately; do not infer permission from counts alone**.
- Existing `prompt-workflows/projects/` includes only `application-management.visa-recovery.v1.json` with `status:candidate`, owning `project:application-management`. It CANNOT authorize `project:blueprint-os` source inspection, nor can its status be flipped in a fixture to simulate approval.
- Main-only three-service GitHub Actions job requires `workflow_dispatch`, `refs/heads/main`, Preview environment and scoped GitHub App tokens; Draft PR checks do not run that private job. **No dispatch without canonical grant**.
- Published Constitution: **1.3.0**. No amendment or Production grant is requested.

## A. Proposed schema-valid WorkPackage payload

The following is the **WorkPackage** contract-shaped candidate; `meta` timestamps and `recordVersion:1` are **proposal placeholders, not actual DB-generated values**. On authorized creation the server must allocate/verify the canonical record version and timestamps. A submitted `blocked` state is deliberate; approval and adopted workflow are not yet proven.

```json
{
  "id": "work:p2-115-blueprint-signed-source-inspection",
  "projectId": "project:blueprint-os",
  "title": "P2-115: one authenticated source-pinned Gateway → Worker → independent QA inspection",
  "purpose": "Prove one genuinely authorized inspect-scoped GitHub source-read for Blueprint OS with signed grant, separately re-fetched independent QA and durable PostgreSQL audit, without changing product code or promoting candidate workflow/test fixtures to canonical approval.",
  "dependencies": [],
  "acceptanceCriteria": [
    "A separately authenticated Project Authority has created this package via WorkQualityApplicationService.createWorkPackage; the canonical readback identifies this exact Work Package and its recordVersion.",
    "A reviewed Blueprint OS-owned central workflow is actually approved and its exact manifest digest adopted by the System Owner; an independently authorized Ed25519 issuer is allowed for the same project/workflow.",
    "A single signed inspect-scoped grant for BlueDragon33/Software-Blueprint-Hub@<fresh-main-SHA> reads only README.md, maxAttempts=1, maxFiles=1, maxTokenEstimate=1000, <=300 seconds valid; stale HEAD or missing permission fails closed.",
    "Execution Worker performs zero writes and journal.read confirms one source-pinned observed attempt; QA Worker independently reads the same SHA and the QA record is durably persisted/read back in a disposable isolated PostgreSQL target.",
    "Replay, wrong project/issuer, tampered evidence, missing key, expired grant and unavailable journal fail closed; no fabricated completion receipt, auto Quality Gate PASS, merge or Production action."
  ],
  "qualityGateIds": [
    "gate:p2-115-authority",
    "gate:p2-115-inspection",
    "gate:p2-115-independent-qa",
    "gate:p2-115-receipt"
  ],
  "status": "blocked",
  "meta": {
    "schemaVersion": "1.0.0",
    "recordVersion": 1,
    "createdAt": "2026-10-16T17:18:31.028Z",
    "updatedAt": "2026-10-16T17:18:31.028Z"
  }
}
```

## B. Proposed schema-valid QualityGate payloads

Create these via `WorkQualityApplicationService.createQualityGate` under the same authorized project, **with status `not-ready` and empty evidenceIds**; never create in `pass` state. The four gates reflect distinct authorities and outcomes. A successful runner or independent QA check does NOT automatically satisfy the separate signed receipt and review gate.

```json
[
  {
    "id": "gate:p2-115-authority",
    "projectId": "project:blueprint-os",
    "name": "Authenticated canonical authority & adopted workflow",
    "requirements": [
      "ProjectProfile profile:blueprint-os and Project Authority must be fetched through authenticated runtime; PROJECT_MUTATE is required to record the Work Package, and a separately authorized reviewer must review the gate.",
      "A Blueprint-OS-owned central workflow manifest with a single DISCOVER/inspect-scoped node must be actually reviewed and approved; the current Application-Management candidate cannot authorize this project's grant.",
      "System Owner must record a valid exact-digest workflow adoption and Ed25519 issuer allow decision through guarded application/repository services; no fixture identity, self-approval, forged digest or private key in Git."
    ],
    "status": "not-ready",
    "evidenceIds": [],
    "meta": {
      "schemaVersion": "1.0.0",
      "recordVersion": 1,
      "createdAt": "2026-10-16T17:18:31.028Z",
      "updatedAt": "2026-10-16T17:18:31.028Z"
    }
  },
  {
    "id": "gate:p2-115-inspection",
    "projectId": "project:blueprint-os",
    "name": "Signed single-file source inspection with durable execution audit",
    "requirements": [
      "One signed, short-lived (at most 300 seconds) inspect-scoped grant binds project:blueprint-os, BlueDragon33/Software-Blueprint-Hub and a freshly read exact main SHA; only README.md is allowlisted.",
      "Enforced grant budgets: maxAttempts=1, maxFiles=1, maxTokenEstimate=1000; no source edit, shell, deployment, broad scan, endpoint or secret disclosure.",
      "Gateway and Worker prove fresh canonical source, issuer scope, replay denial and observed source digest; an immutable PostgreSQL execution claim and observation are read back."
    ],
    "status": "not-ready",
    "evidenceIds": [],
    "meta": {
      "schemaVersion": "1.0.0",
      "recordVersion": 1,
      "createdAt": "2026-10-16T17:18:31.028Z",
      "updatedAt": "2026-10-16T17:18:31.028Z"
    }
  },
  {
    "id": "gate:p2-115-independent-qa",
    "projectId": "project:blueprint-os",
    "name": "Independent SHA-pinned QA and immutable PostgreSQL readback",
    "requirements": [
      "QA obtains a separately constrained read identity and fetches README.md from the exact same immutable source SHA independently of the Worker response.",
      "Independent digest equals the persisted observation; QA proof is appended to a separate immutable PostgreSQL record and read back after storage.",
      "Negative evidence covers stale SHA, missing adoption, wrong issuer/project, tampering, replay and unavailable persistence; release and Quality Gate PASS stay false."
    ],
    "status": "not-ready",
    "evidenceIds": [],
    "meta": {
      "schemaVersion": "1.0.0",
      "recordVersion": 1,
      "createdAt": "2026-10-16T17:18:31.028Z",
      "updatedAt": "2026-10-16T17:18:31.028Z"
    }
  },
  {
    "id": "gate:p2-115-receipt",
    "projectId": "project:blueprint-os",
    "name": "Trusted completion receipt and authorized Quality Gate review",
    "requirements": [
      "A genuine source-pinned, authority-signed completion receipt (if and only if the existing trusted receipt mechanism supports this source/actor) references the matching persisted inspection and independent QA record; otherwise this gate remains NOT_READY.",
      "A separately authorized PROJECT_REVIEW actor validates immutable GateEvidence provenance and explicitly decides each Quality Gate; executor/QA success cannot self-promote to PASS.",
      "No Constitution ratification, Production approval, PR merge, public deployment or RU03 content approval is implied by a read-only source inspection."
    ],
    "status": "not-ready",
    "evidenceIds": [],
    "meta": {
      "schemaVersion": "1.0.0",
      "recordVersion": 1,
      "createdAt": "2026-10-16T17:18:31.028Z",
      "updatedAt": "2026-10-16T17:18:31.028Z"
    }
  }
]
```

## C. Exact execution budget (for subsequent authorization, not a live grant)

- Mode: **inspect-scoped only**, node stage `DISCOVER`; one Work Package, one node and one ordinary action.
- Project: `project:blueprint-os`; source repository: `BlueDragon33/Software-Blueprint-Hub` (not Application-Management; grant context must equal the workflow's project/repo owner).
- Source: **freshly verified Hub `main` SHA**; observed baseline `cd01fb3c2178393628ce968af209db082227d2c4`. Exact file: `README.md`, no directories, no recursive traversal.
- Signed grant: `mode=inspect-scoped`, `allowedPaths=[README.md]`, `maxAttempts=1`, `maxFiles=1`, `maxTokenEstimate=1000`, expiry window **≤300 seconds**. The executor must enforce the grant's concrete fields; nominal overall Work budgeting does not override the grant.
- External coordination budget: maximum **8 files, 4 logs, 8 tool calls and 1 source-code repair** across a future Work session, distinct from the single-file runtime grant. No speculative retries or cost-expanding escalations.
- Token usage for pure GitHub file inspection should actually be 0 if no model call occurs; `1000` is a ceiling, not a consumption target.
- GitHub App: separate least-privilege executor and QA read tokens; never reveal keys, change approvals, add shell access, or deploy.
- Data: disposable PostgreSQL service or separately approved non-production branch. Never run unreviewed migration against Production.
- Stop: invalid actor, missing authority/profile/workflow/adoption/issuer, SHA drift, expired/tampered grant, unsigned or unmatched QA, journal unavailable, budget reached, or missing completion receipt/reviewer. Report `BLOCKED`, not a fake PASS.

## D. How to persist **after** legitimate authority reviews

1. **Authenticated actor binding:** server `loadProjectWorkspace('project:blueprint-os')` resolves `resolveWebActor()` and reads the canonical profile through `runtime.profiles.read(actor, projectId)`. This authenticates a read, **not** authorization to mutate or execute.
2. **Reviewer and governance preflight:** Project Authority or authorized System Owner verifies the current profile revision, one active package constraint, scope compatibility and source SHA. Constitutional Authority reviews compatibility with effective 1.3.0 if required by governance; this candidate does **not** ask for a new ratification.
3. **Quality Gate candidate creation:** on a trusted server context call `runtime.workQuality.createQualityGate(actor, gate)` for the four `not-ready` gates after checking duplicates and scoped IDs. Never insert SQL directly; no automatic PASS.
4. **Work Package creation:** call `runtime.workQuality.createWorkPackage(actor, workPackage)` with expected current project, scope, valid dependencies and actual server-authoritative `meta`. It enforces `PROJECT_MUTATE`, schema validation and dependency checks. Read it back using `runtime.workQuality.listWorkPackages(actor, projectId)` and record its real `recordVersion`. If any preceding gate fails, do not claim that the set is complete.
5. **Current UI limitation:** `apps/web/app/projects/[projectId]/roadmap/page.tsx` lists packages **read-only**. There is currently no verified user-facing canonical create form/action on that page and only `auth`/`sso` paths under `apps/web/app/api`. A minimal authenticated server action/adapter, separately reviewed and tested, is needed if the owner cannot invoke the existing application service through an approved tool. Do **not** expose direct database editing or create a second registry.
6. **Workflow adoption is separate:** create/review a **Blueprint-OS-owned** central candidate manifest with one `DISCOVER` node through the existing `prompt-workflows/` architecture, regenerate imports, test on exact SHA, and obtain actual approval. The existing workflow registry is metadata, not execution permission. Record manifest-digest adoption and Ed25519 issuer decision only through the existing guarded System Owner authority repository service; keep private key outside Git.
7. **Independent REVIEW and proof:** only an authorized `PROJECT_REVIEW` actor may call `runtime.workQuality.addGateEvidence` and `updateQualityGate`. It requires exact, persisted evidence and does not automatically PASS for Work Package completion. Durable journal/QA proof is necessary but does not automatically create the required signed completion receipt.
8. **Release stays separate:** no CI, signature, credential, Proposal or GitHub PR automatically grants Constitution ratification, real Project Authority, Production or merge.

## E. Responsibility / evidence matrix

| Gate | Real approving authority | Required proof | Current state |
|---|---|---|---|
| Authority | authenticated Project Authority for the Work Package; **System Owner** for workflow issuer/adoption decisions | verified Profile, source-bound reviewed workflow, exact adoption/issuer decisions, actor authorization | NOT_READY |
| Inspect | signed grant by authorized issuer; bounded Gateway + Worker | exact SHA and README bytes, one immutable claim/attempt, denies stale or replay | NOT_READY |
| QA | independent source-reading QA + PROJECT_REVIEW evaluator | separate QA read identity, digest match, immutable QA evidence readback, negative tests | NOT_READY |
| Receipt/review | designated trusted receipt issuer and authorized PROJECT_REVIEW actor | signed completion receipt with actual verified evidence + explicit gate decision | NOT_READY |

**Observed isolated PR #149 tests passing does not satisfy any of the four gates for this proposed canonical Work Package.**

## F. Single safe next action

Request a signed-in authorized System Owner/Project Authority to review the **existing canonical Profile and this precise proposal**, including the missing Blueprint-owned workflow and actual issuer/adoption path. If permission and a suitable server action are unavailable, open a bounded Draft engineering change for the authenticated form/adapter only. Do not dispatch or self-approve.
