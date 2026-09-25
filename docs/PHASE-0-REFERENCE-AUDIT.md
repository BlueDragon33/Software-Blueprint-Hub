# Phase 0 — Repository & Reference Audit

## Software-Blueprint-Hub
Observed at bootstrap:
- repository: `BlueDragon33/Software-Blueprint-Hub`;
- default branch: `main`;
- initial size: 0;
- no legacy application implementation;
- therefore source-of-truth contracts can be established before feature code.

A minimal bootstrap commit exists only to anchor Git history. Substantial design belongs on the dedicated architecture branch.

## Bauman reference
Inspected:
- `BlueDragon33/Bauman-master-ai-system`
- branch `architecture/bauman-nextgen-blueprint-v1`
- draft PR #127, **Architecture Blueprint v1 · Bauman Next-Generation Platform**

The reference dossier demonstrates product charter, as-is/to-be architecture, foundation/contracts, extension model, UI/UX, security, deployment, quality, observability, migration, governance, dependency roadmap, gates, NFRs, data lifecycle, sequence flows, checklist and ADR discipline.

## Universal principles extracted
1. Core stability through contracts and intentional extension points.
2. Contract-first design with owner, version, authority, validation and migration.
3. Explicit dependency direction and forbidden dependency rules.
4. Source-of-truth separated from presentation.
5. Schema version, record/content version and release revision are distinct.
6. Authority boundaries are explicit; UI visibility is never authorization.
7. Security and data lifecycle begin at design time.
8. Professional UX uses information architecture, shared layout/component contracts and human acceptance.
9. CI green is necessary but insufficient for product PASS.
10. Defect loop: reproduce → classify → root cause → fix → regression → whole-system check.
11. Roadmaps are dependency-driven, not numbering-driven.
12. ADRs, deprecation and technical-debt records preserve long-term coherence.
13. Medium/large systems prove architecture through a realistic vertical slice before expansion.
14. Releases identify the exact artifact/revision being promoted.

## Bauman-specific rules that must NOT enter Universal Core
- learning-specific mastery/evidence semantics;
- subject/course/lesson as universal software entities;
- Bauman ID prefix conventions;
- Device Gate policy;
- Application Management ownership of Bauman shared control secrets;
- Cloudflare Worker/D1 topology;
- offline packaged learning as a universal requirement;
- Bauman-specific roles and control-plane behavior.

These belong in project-type templates, patterns, provider examples or the Bauman case study.

## Universal separation
```
UNIVERSAL ENGINEERING CORE
        ↓
PROJECT-TYPE / DOMAIN TEMPLATES
        ↓
PROJECT-SPECIFIC BLUEPRINT
```

## Promotion rule
A case-study rule may move into Universal Core only when it:
1. can be stated without project-specific nouns;
2. applies across multiple project types;
3. does not impose needless machinery on small projects;
4. has activation criteria derivable from Project Profile;
5. has clear owner/contract/gate consequences.
