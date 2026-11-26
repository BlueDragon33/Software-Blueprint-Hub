# D1 authority continuity — proposed recovery disposition

Status: PROPOSED_ONLY / P2_CONTINUITY_OPEN / NO_CUTOVER_AUTHORITY.
This is a review package, not an exception, a canonical decision, a migration
result, an amendment to active law, or an authorization to publish. It does
not modify the P1 migration plan or the P1 executable candidate.

## Bound evidence

- Active law 1.3.0; observed main b6699207612ea836c14dd4a9c1ea59549f7de2bb.
- Exact P1 0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0; integration
  45768983568: 72 browser and 26 D1 parity passed. Preserve all seals.
- P1 README blob 652126f5ca07f178bd30f5ac523db49685abe972 explicitly blocks
  cutover if canonical source cannot be read. This proposal cannot clear it.
- Governing protocol blob 775247bf2c3bf2b00dac1a3587eaf32883e404e6:
  immutable published history, authenticated append-only human decisions,
  separate constitutional/project/production authority.
- Historical PR #98 records amendment
  amendment:79521378-d2c1-44f8-a0f3-2265a911a6a0, RATIFIED v5,
  authenticated approval 2026-10-13T00:19:14.003Z, production authority false.
  It records canonical main d09940caff014fb7314370da2510774aa580c3ec and
  eight sealed paths, but explicitly says backend publication was pending
  with zero publication rows at that observation. Do not reinterpret that
  as absence of all history today or as a new authenticated decision.
- Ledger #159: 7185875396 (historical evidence), 7185917125 (Owner direction:
  fresh ratification), 7191886555 (operator retained bundle), 7192105655
  (operator schema inventory), 7192457401 (staged-upload capability),
  7192721075 (Worker overview and continuity review).
- New D1 software-blueprint-hub-db UUID
  4f2a47a5-e250-45ae-8ed1-19afcb04415d. Operator reports 28 application
  tables plus _cf_KV, 59 indexes, 31 triggers, zero authority rows.
  This is new-target evidence, not old-source absence evidence.

## Recovery decision proposed for review

Prefer a new operational authority epoch only if an authorized review
establishes a lawful recovery path despite unavailable old-source readback.
Leave the historical database and existing Git evidence untouched. The
historical database is NOT proven empty, deleted, migrated or superseded.
Record unavailable/unmigrated operational history explicitly, including
principals, revocations, decisions, publications, project and gate records.
Do not reconstruct canonical rows from PR descriptions, logs, screenshots
or chat. Preserve 1.3.0 as active law and do not re-ratify it solely to
fabricate missing history. No legacy provider reconnection unless separately
required and authorized; no paid service.

The review must determine whether unavailable principals/revocations,
pending decisions, work packages and journals make a fresh epoch unsafe.
A new login must not automatically reinstate old project permissions.
If this risk cannot be resolved under the existing protocol, retain
P2_CONTINUITY_OPEN. Authorized reviewers must explicitly identify the
governing recovery mechanism and exact evidence; an Owner preference or a
new README alone does not supersede the P2 stop condition.

## Admission sequence and acceptance

| Boundary | Required evidence | Failure action |
| --- | --- | --- |
| C0 historical preservation | Historical source disposition, immutable evidence references, explicit unresolved inventory, no destructive action | Keep P2 open |
| C1 continuity authority | Reviewed recovery mechanism, exact scope and authenticated authorized decision; no fabricated old records or waiver of governing law | Block canonical cutover |
| C2 remote preflight | Current Worker Access, route/preview settings, free plan, exclusive D1 binding inventory, prior deployment ID and rollback version; actual retained bundle manifest | No upload/promotion until applicable admission |
| C3 isolated candidate preparation | Existing helper emits target config and hashes for exact P1 bundle; secure secret handling and dry-run; no live traffic change | Reconcile actual error, no rebuild unless measured need |
| C4 runtime promotion | Separate exact-version release authority, C0-C3 satisfied, rollback plan, no canonical state replacement before continuity admission | Do not promote |
| C5 fresh authority | Actual GitHub OAuth subject 297152795, authorized bootstrap, append-only audit and live journal/readback; no inherited permissions by inference | Fail closed |
| C6 R33 | Fresh exact amendment and authenticated ratification, sealed Full Gate 45475370038, real artifact read; approved publication and exact canonical runtime activation | Keep ACTIVE 1.3.0 until valid issuance |
| C7 successor | 1.4.0 ACTIVE verified, successor exact protected evidence and fresh authenticated decision, 1.5.0 publication and actual adoption | No premature successor activation |

Runtime rollback after any canonical write must account for persistence
compatibility and journal preservation; switching code versions alone is
not proof of safe rollback. Do not delete or reset either database.
Staged upload is not promotion or canonical cutover; even non-serving upload
requires its own admitted scope and secure inputs. No hosted Preview.

A: exact technical evidence and migration/authority invariants.
B: actual Owner acceptance and ability to complete the intended lawful
publication workflow. Both are presently incomplete for remote recovery.
Do not rerun already passed P1 or R33 tests merely to prepare this review.
Next action: resolve C0/C1 through the governing process while completing
independently eligible C2 evidence collection. This draft grants no rights.
