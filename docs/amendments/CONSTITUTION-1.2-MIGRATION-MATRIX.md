# Constitution 1.2 Migration Matrix — Governed Projects

Target policy: `blueprint-os:universal-century-grade@1.2.0`

Status: **PRE-PUBLICATION MIGRATION PLAN**

This matrix defines expected project posture after ratification/publication. It does not mark any project compliant in advance.

| Repository | Level | Current posture | Constitution 1.2 migration focus | Google role | Hard constraints |
| --- | --- | --- | --- | --- | --- |
| Software-Blueprint-Hub | B4 | Constitutional authority + platform | Add sovereignty pillar, dependency-budget model, prompt envelope, ecosystem propagation | Optional evidence/archive only | Constitution authority and Production authority stay separate |
| Bauman-master-ai-system | B4 | Learning platform with Cloudflare runtime experiments | Make learner runtime local/browser-first where practical; demote Containers to optional provider; portable learning state; offline study shell | Drive for optional sync/backup/content exchange; Apps Script only lightweight bridge | Mastery/canonical curriculum cannot be owned by Drive/AI |
| Application-Management | B4 | Central app/control management | Preserve local admin capability; remote integration optional; provider registry and dependency budget | Drive for optional backup/export; Apps Script for low-risk personal coordination | Never place secrets/private keys/control bearer tokens in Sheets/Drive plaintext |
| BOIECH_AI | B3 | Learning/content app | Core lessons usable without AI/cloud; AI enhancement optional; content portable | Drive for media/content backup and cross-device sync | AI cannot silently become canonical teaching truth |
| GrowUP_MyChildren | B5 | Child-development records | Local canonical child state; offline-first; explicit sync/conflict model; encrypted backup | Drive only as encrypted/controlled backup/sync adapter | Child/personal data requires least privilege, deletion/export, no raw public Sheets |
| RU_LIFE | B3 | Personal Russia-life app | Offline reference and personal planning; cloud only for sync/update | Drive useful for documents, notes, backup; Apps Script optional | Credentials/identity documents require sensitive-data handling |
| Health_Care | B5 | Sensitive health/family records | Local canonical sensitive state, explicit provenance, strong backup/recovery, AI advisory only | Drive only with client-side encryption or equivalent controls for sensitive backup | Raw medical data/secrets must not default to Sheets; AI never canonical diagnosis authority |
| Hardware_Simulation | B2 | Engineering simulation/tooling | Local compute first; external compute optional capability adapter | Drive for project-file backup/export | Simulation correctness cannot depend on remote availability |
| MPC_PID_System | B3 | Control/simulation system | Local deterministic control/simulation; offline operation; remote telemetry optional | Drive for reports/config backup only | Live control authority must not transit Drive/Sheets |
| CAD_CAM_3D | B2 | Design/CAD/CAM tooling | Local model/project ownership; cloud rendering/generation optional | Drive for project assets/export/backup | Canonical CAD artifacts require portable formats |
| PriceReport_Tunggiabao | B3 | Quotation/business app | Local-first quotation creation; portable business data; optional cross-device sync | Drive/Sheets are strong optional fit for backup/catalog/projection | Sheets must not become hidden transactional authority without conflict/version controls |
| NC03_Modem | B4 | Local modem/admin control | LAN/local operation remains primary; remote cloud is optional and isolated | Drive only for sanitized backup/report, not runtime control | No modem credentials, tokens or private control state in Drive/Sheets plaintext |
| Math_Bauman | B2 | Learning PWA | Offline-capable lessons/simulations; local progress; optional sync | Drive for progress/content backup and cross-device restore | Mathematical truth/content remains canonical in project data/contracts |
| ROS-1-2 | B3 | Robot/ROS runtime | On-device/local network execution; no cloud required for robot core | Drive only for logs/maps/config archives when useful | Robot control loop must never require Drive/Apps Script; add missing adoption manifest |
| pc-manager-desktop | B4 | Privileged desktop system manager | Fully local privileged actions; cloud optional for reports/settings backup only | Drive optional for encrypted settings/report backup | No destructive system authority, credentials or sensitive scan state delegated to Drive; add adoption manifest |

## Cross-project dependency classes

Every project migration should classify each major integration:

- `LOCAL_CORE`
- `OPTIONAL_SYNC`
- `OPTIONAL_INTELLIGENCE`
- `OPTIONAL_PUBLISH`
- `EXTERNAL_ESSENTIAL`

`EXTERNAL_ESSENTIAL` requires explicit justification and human acceptance.

## Standard propagation edits

After Constitution 1.2 is published, every governed repository must:

1. set `.blueprint/constitution-adoption.json.policyVersion = 1.2.0`;
2. add `operational-sovereignty-dependency-minimization` to `inheritedPillars`;
3. keep `disabledPillars=[]`;
4. keep `constitutionalWaivers=[]`;
5. add/update a project dependency-budget document or equivalent canonical record;
6. update durable project prompts to include dependency posture;
7. re-run Constitution compliance;
8. retain truthful blockers for actual hard dependencies not yet migrated.

## Special migration: ROS-1-2

Repository is already listed as governed but does not currently expose the standard adoption manifest on the active branch.

Required after publication:
- add `.blueprint/constitution-adoption.json`;
- projectId `project:ros-1-2`;
- Blueprint Level `B3`;
- inherit all seven pillars;
- add reusable Constitution CI if missing.

## Special migration: pc-manager-desktop

Newly added to governed repository registry.

Required after publication:
- add `.blueprint/constitution-adoption.json`;
- projectId `project:pc-manager-desktop`;
- Blueprint Level `B4`;
- inherit all seven pillars;
- add reusable Constitution CI if missing;
- preserve local-only authority for privileged machine mutations.

## Bauman Python correction

The current Cloudflare Containers implementation remains valuable engineering evidence, but Constitution 1.2 changes its role:

- it must not be a mandatory personal-learning runtime merely because it already exists;
- browser/local Python becomes the preferred canonical personal-learning execution path where requirements can be met safely;
- Cloudflare Containers may remain an optional high-fidelity/advanced provider;
- PYTHON04–PYTHON06 require selective revalidation only for provider/runtime assumptions touched by this migration;
- existing curriculum/assessment truth is not discarded.

## Propagation order

1. Software-Blueprint-Hub publication;
2. Bauman-master-ai-system + Application-Management;
3. B5 personal-data projects: Health_Care + GrowUP_MyChildren;
4. network/privileged projects: NC03_Modem + pc-manager-desktop + ROS-1-2;
5. learning/content apps: Math_Bauman + BOIECH_AI + RU_LIFE;
6. engineering/business tools: MPC_PID_System + Hardware_Simulation + CAD_CAM_3D + PriceReport_Tunggiabao;
7. ecosystem verification snapshot.

No project is marked compliant before its own evidence is available.
