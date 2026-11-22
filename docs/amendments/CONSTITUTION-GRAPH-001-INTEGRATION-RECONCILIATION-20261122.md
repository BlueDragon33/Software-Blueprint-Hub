# CONSTITUTION-GRAPH-001 — Integration and conflict reconciliation
Status: **PROPOSED_ONLY / NOT_RATIFIED / NO_PRODUCTION_AUTHORITY**
Baseline: `main@0d0d0bece3afa82aaf5792a64c0d4bab56dc9825` (observed 2026-11-22)
Constitution: `blueprint-os:universal-century-grade@1.3.0`
Scope: **design and exact-source reconciliation only**; no canonical writes, merge, ratification, production or paid services.

## 1. Existing law and non-negotiable inheritance
Do not replace `docs/UNIVERSAL-CONSTITUTION.md`, `control/universal-constitution.contract.json`, `control/universal-constitution-version.json`, templates or authority service with a second law registry. Preserve §1–9, R1–R32, §11 WCAG, B0–B5, E0–E3, S100/R200, source ownership, human authority, exact-revision evidence and project isolation. A constitutional graph is a **versioned projection of the existing normative/contract/authority bundle**, not a new authority.

## 2. Observed PR path intersections (live GitHub file lists, 2026-11-22)
| Cluster | PRs | Verified overlapping paths | Required reconciliation |
|---|---|---|---|
| Next Action core | #147 #152 #153 #161 | `apps/web/app/projects/[projectId]/page.tsx` (#147/#152), `apps/web/src/lib/hub-app-directory.ts` (#147/#152/#153), `packages/application/src/index.ts` (#152/#161), `apps/web/src/server/prompt-workflow.ts` (#147/#166) | Canonical goal/ready-work selector, unified projection, no second prompt engine; exact-base merge tests |
| Next Action UI | #152 #153 #161 | `apps/web/app/projects/[projectId]/_components/readiness-overview.tsx` (#152/#153), plus separate prompt panel in #161 | One project-aware CTA; Generate/Edit/Send distinguished from actual Execute/Resume |
| Next Action policy | #155 #156 #147 | Companion contract #155 referenced by #156; product-goal continuity #147 | Preserve explicit Send, bounded A–Z execution, human gates; no hidden host action |
| Reviewer | #163 #167 #171 #172 | `packages/application/src/reviewer-ab-contract.mjs` (#163/#167), `apps/web/src/server/prompt-workflow.ts` (#167/#147/#166), `packages/application/src/pattern-governance.ts` (#172) | Review authority, independence and evidence lineage; learning candidates cannot self-ratify |
| Graph | #166 #168 | #166 graph UI/server, #168 intelligence exchange/ledger; no direct file overlap observed in inspected lists | Reuse Evidence Graph; add read-only versioned reference edges without inventing runtime truth |
| UX | #164 #165 #166 | #165/#166 both change `.github/workflows/ci.yml`; #164 adds content-first candidate, #165 spatial candidate | Respect existing §11 contrast, preserve neural visual baseline where appropriate, no universal 3D mandate |
| Release policy | #170 and main | `control/development-runtime-policy.v1.json`, release policy draft; latest main is production-first profile for a specific product | Never infer global authorization from app-specific release profile |

This is **path-level overlap**, not yet a semantic conflict verdict. Full diff review, tests and exact-HEAD readback remain required.

## 3. Proposed modular constitutional nodes
- **CG-01..12**: immutable law IDs, typed edges, normative precedence, ownership, compatibility, amendment lifecycle, migration, review and conflict resolution.
- **SG-01..12**: goal→requirement→contract→work→test→evidence→outcome, dependency closure, root-cause lineage, truthful progress and graph projections.
- **ANA-01..06**: contextual action, continuous eligible execution, genuine intervention boundary, batched native interaction, durable checkpoints, honest button semantics.
- **EV-01..06**: reversible amendments, incremental regression, scorecards, candidate intake, compatibility window and constitutional drift detection.
- **ANA-UNIVERSAL-001**: cross-device, account/project-scoped continuity for iOS, Android, Windows, macOS, tablet and web. Same authenticated canonical state where supported; never claim to control ChatGPT host tabs, remote Work, background execution or PowerShell without actual capability. This **supersedes mobile-only proposal** without changing active law.

Proposed edge kinds: `INHERITS`, `REFINES`, `DEPENDS_ON`, `CONSTRAINS`, `IMPLEMENTED_BY`, `VERIFIED_BY`, `SUPERSEDES`, `CONFLICTS_WITH`. Edge metadata: `from,to,type,sourceRevision,owner,scope,versionRange,rationale,evidenceRef`. Distinguish causal hypotheses from verified causes.

## 4. Universal work graph, not fixed waves
Derive work packages from verified requirements and dependency graph. No mandatory 12-round/48-step quota. Every package must have `id,goalId,owner,inputs,outputs,dependsOn,acceptance,tests,evidence,gate,rollback,revision,status`. Reject orphan goals, ambiguous owners, hard dependency cycles and invalid status promotion. READY tasks may proceed independently. Completed source tests do not imply browser acceptance, reviewer PASS, merge or deployed production.

Design gates: D0 reality baseline; D1 goals; D2 ontology; D3 interfaces/trust/data; D4 dependency closure; D5 delivery graph; D6 failure/rollback; D7 visual/accessibility; D8 acceptance/authority. Any changed upstream node invalidates downstream evidence only where the revision/dependency closure requires it.

## 5. Next Action contract and stopping rules
Input: authenticated project + tab context, canonical goal/work/permissions, pinned HEAD, exact evidence/gates, available tools, device capability, last checkpoint.
Output: one primary action (alternatives only if useful), human-readable editable prompt, executable plan **only if supported**, expected evidence, native batch script if needed, stop predicates, checkpoint.
- Auto-continue **all authorized READY work** across technical steps, scoped repair and regression. Do not request routine approvals every few minutes.
- Only stop for nondelegable authority, unapproved spend/risk, unavailable host/device, real unresolved ambiguity, mandatory human review, exhausted scope or platform limit.
- Native PowerShell: preflight ownership and `E:\BaumanWeb` checkout, verify exact HEAD, batch dependent commands, stop on failure, capture exit codes and logs, return one paste/readback request. Do not silently clone to C:.
- Button labels and semantics: `Generate`, `Edit`, `Send`, `Execute`, `Resume`; never misrepresent `copy` as `run`. Cross-device continuation is a canonical-state requirement, not a claim of automatic ChatGPT-host synchronization.

## 6. Change management and constitutional evolution
Every amendment: proposal → pin baseline → node diff → backward/forward impact → conflict resolution → migration/rollback → negative and regression tests → independent review → authenticated Owner ratification → atomic normative/contract/version/template publication → staged adoption and readback. Keep old IDs as historical aliases, record `SUPERSEDES` and semver; never mutate the past. Review conflicts with existing pending amendments before choosing a successor version.

## 7. Mandatory negative tests
Orphan node; duplicate ID; cycle; stale evidence SHA; self-review masquerading as independent; false PASS/DEPLOYED; unauthorized ratification; contract break without consumer migration; mobile-to-desktop state loss; prompt context loss; spurious PowerShell requests; missing host capability; duplicate canonical registry; WCAG regression; false AI runtime activity; rollback failure; cross-project data leak. Use exact-SHA real runtime and human UX evidence before claiming PASS.

## 8. Execution order and explicit gates
1. Diff/reconcile #147/#152/#153/#155/#156/#161 with existing Prompt Workspace, without bulk cherry-pick.
2. Diff/reconcile #163/#167/#171/#172 for reviewer identity, separation and independent evidence.
3. Diff/reconcile #166/#168 with existing Evidence Graph, plus #164/#165 visual/contrast rules.
4. Produce machine-readable impact matrix and single-source contract extension on **separate candidate branch**.
5. Implement one vertical slice: project goal → Next Action → READY work → checkpoint → defect lineage → Graph view; verify web/mobile/desktop with genuine capabilities.
6. Reviewer A/B, constitutional authority and release remain **independent human gates**. Do not merge, ratify, publish or deploy from this document.

## 9. Evidence and status
Evidence here: GitHub `main` latest commit, ACTIVE normative/version/contract fetched; 25 open PRs and selected PR changed-path lists inspected. **No exact-head combined build/test or authenticated browser QA run in this design pass**. No claims of complete semantic reconciliation, production functionality, or ratification. One next action: review exact diffs for the intersecting Next Action core files and produce a tested conflict-resolution patch on a separate branch.
