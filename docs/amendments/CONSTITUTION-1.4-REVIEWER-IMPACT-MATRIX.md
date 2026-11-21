# Independent Reviewer A/B — Constitution 1.4 Impact & Migration Matrix (DRAFT)

**Candidate law:** `blueprint-os:universal-century-grade@1.4.0` — **NOT ACTIVE / NOT RATIFIED**  
**ACTIVE law:** `1.3.0` at Hub baseline `0d0d0bece3afa82aaf5792a64c0d4bab56dc9825`  
**Source-of-truth inventory:** `control/constitution-governed-repositories.json` (15 sealed baseline projects).  
**Proposal:** `docs/amendments/CONSTITUTION-1.4-INDEPENDENT-REVIEW-LEARNING-PROPOSAL.md`.

**Status discipline:** A repository being in the sealed baseline is **not** evidence of current 1.4 adoption; all adoption rows are `UNVERIFIED`. The historical 1.2 observations in the ecosystem snapshot are not silently rewritten.

## Project adoption inventory

| Project ID | Repo | Managed branch | Blueprint | Execution profile | 1.4 adoption | Per-project migration prerequisite |
| --- | --- | --- | --- | --- | --- | --- |
| `project:blueprint-os` | `BlueDragon33/Software-Blueprint-Hub` | `main` | B4 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:bauman-master-ai-system` | `BlueDragon33/Bauman-master-ai-system` | `main` | B4 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:application-management` | `BlueDragon33/Application-Management` | `main` | B4 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:boiech-ai` | `BlueDragon33/BOIECH_AI` | `main` | B3 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:ru-life` | `BlueDragon33/RU_LIFE` | `main` | B3 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:health-care` | `BlueDragon33/Health_Care` | `main` | B5 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:nc03-modem` | `BlueDragon33/NC03_Modem` | `main` | B4 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:ros-1-2` | `BlueDragon33/ROS-1-2` | `ros2` | B3 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:math-bauman` | `BlueDragon33/Math_Bauman` | `main` | B2 | COMPACT | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:growup-mychildren` | `BlueDragon33/GrowUP_MyChildren` | `main` | B5 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:hardware-simulation` | `BlueDragon33/Hardware_Simulation` | `main` | B2 | COMPACT | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:mpc-pid-system` | `BlueDragon33/MPC_PID_System` | `main` | B3 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:cad-cam-3d` | `BlueDragon33/CAD_CAM_3D` | `main` | B2 | COMPACT | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:pricereport-tunggiabao` | `BlueDragon33/PriceReport_Tunggiabao` | `main` | B3 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |
| `project:pc-manager-desktop` | `BlueDragon33/pc-manager-desktop` | `main` | B4 | STRUCTURED | UNVERIFIED | Verify owner + exact HEAD, applicable independent-review risk, knowledge privacy, existing adoption and rollback evidence |

## Reviewer components outside the sealed baseline

| Repository | Owner role | Existing proposal | 1.4 adoption |
| --- | --- | --- | --- |
| `BlueDragon33/Software-Blueprint-Reviewer-A` | Engineering A / self-review | [Draft #6](https://github.com/BlueDragon33/Software-Blueprint-Reviewer-A/pull/6) | NOT_ADOPTED / pending authenticated authority |
| `BlueDragon33/Software-Blueprint-QA-Worker` | Independent technical B | [Draft #10](https://github.com/BlueDragon33/Software-Blueprint-QA-Worker/pull/10) | NOT_ADOPTED / pending authenticated B runtime |

## Applicability / coverage decision

- **All B0–B5:** enforce provenance, exact SHA, non-fabricated evidence, bounded permissions and current policy version; no agent may self-approve its work.
- **COMPACT (B0–B2):** focused source/test review proportional to actual changes and risk. Elevated data, financial, remote device, identity or destructive operations must still invoke stronger gates.
- **STRUCTURED (B3–B5):** require independent QA coverage of relevant security/privacy, persistence, architecture, performance, accessibility, operations/rollback and real user journeys; specify required/NA/NOT_RUN with evidence.
- **E0–E3:** topology dimension affects cross-repository change impact, but E-level is not evidence of deployed integration or permission.
- **Data/privacy:** learning case metadata must remain scoped to its authorized owner. The publicly visible Hub must not ingest secrets, user records or private source dumps; knowledge publication uses authorized, redactable summaries and provenance.
- **Run authority:** Reviewer B's application installation and journal are not established merely by an existing workflow YAML, signed fixture or shared GitHub connector.
- **Publication:** ratified normative text, machine contract, template and authority source version must be committed and attested atomically via the existing constitutional publication protocol, then adoption propagated with project-specific receipts.

## Evidence needed to promote each row

1. Current governed project profile/owner/branch/head readback and recorded B-level/impact analysis.
2. Signed/revocable issuer and scoped A/B reviewer identity (if material change requires B); evidence of B's own source byte readback, not copied from A.
3. Exact test/risk evidence and canonical WorkPackage/Quality Gate status, including non-represented tests marked NOT_RUN.
4. Published Constitution attestation digest and proof that the repository adopted the exact active authority set; migration and incompatibility status truthful.
5. For applications: independently authorized release workflow and rollback; A/B acceptance never triggers Production.
6. For the learning loop: human-reviewed independently verified cases from >=2 distinct projects before universal knowledge promotion; held-out evaluation before claiming quality improvement.

## Critical sequencing (no bypass)

`G3 real independent A/B proof` → `real learning-case and retrieval QA` → `migration compatibility impact review` → `canonical Owner ratification` → `atomic 1.4 publication` → `per-app propagation` → `independent adoption readbacks`.

**Do not mark every app COMPLIANT merely because the branch exists or the global PR is merged.** The Hub is the constitutional brain, Application-Management manages app operations, and apps remain independent owners of their business data and releases.

**Evidence status at matrix creation:** inventory derived from the existing canonical manifest; per-app live HEAD, adopter and runtime compliance NOT_RUN; G3 runtime journal and B-owned signed pilot BLOCKED. No hidden pass or release.
