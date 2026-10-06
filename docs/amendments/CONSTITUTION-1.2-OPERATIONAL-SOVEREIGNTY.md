# Constitution Amendment 1.2.0 — Operational Sovereignty & Dependency Minimization

Amendment ID: `constitution-amendment:1.2-operational-sovereignty-20261006`

Base policy: `blueprint-os:universal-century-grade@1.1.0`

Target policy: `blueprint-os:universal-century-grade@1.2.0`

State: **RATIFICATION READY — NOT PUBLISHED**

Production authority: **NONE**

## Problem

The existing Constitution strongly protects architectural longevity and provider replaceability, but it does not explicitly prevent personal/core workflows from becoming unnecessarily dependent on paid cloud runtimes, hosted databases, AI providers or external services when a local/browser/offline-capable design is practical.

Recent Python runtime work demonstrated the risk clearly: a technically valid capability could become blocked by a paid cloud runtime even though the user's product goal favors a self-controlled, low-dependency personal system.

## Constitutional objective

Add a seventh mandatory inherited construction quality:

`operational-sovereignty-dependency-minimization`

The new pillar requires projects to:
- prefer local/browser/desktop/on-device execution where practical;
- preserve offline or degraded operation when the capability itself does not inherently require a network;
- prefer free/open/local options when quality/security are equivalent;
- treat cloud/AI/database/hosting providers as replaceable adapters by default;
- document dependency cost, data boundary, portability and exit path;
- keep canonical user data portable and recoverable;
- require explicit approval before a paid provider becomes mandatory for core personal operation.

## What this amendment does NOT do

It does not:
- ban cloud services;
- ban paid services;
- force Google Drive onto every project;
- weaken security in order to avoid cost;
- require every runtime to work offline when the capability intrinsically requires remote infrastructure;
- grant AI, Google Drive, GitHub, Cloudflare or Application Management canonical authority;
- authorize any Production deployment.

## Target implementation model

### Preferred hierarchy

`LOCAL/ON-DEVICE → OPEN/SELF-CONTROLLED → FREE EXTERNAL → PAID EXTERNAL WHEN JUSTIFIED`

### Google services

Google Drive/Sheets/Apps Script become approved optional adapters for:
- sync;
- backup;
- simple remote access;
- lightweight coordination.

They are not universal runtime owners.

### AI

ChatGPT may be the preferred intelligence assistant, but core canonical state and non-AI workflows remain independently durable unless the product charter explicitly defines AI as essential.

## Affected authority surface

### New pillar
- `operational-sovereignty-dependency-minimization`

### New module
- `module:architecture:operational-sovereignty`

### New gate
- `gate:operations:dependency-sovereignty`

### Updated canonical components
- `docs/UNIVERSAL-CONSTITUTION.md`
- `control/universal-constitution.contract.json`
- `control/universal-constitution-version.json`
- `packages/application/src/foundation-templates.ts`
- `packages/application/src/constitution-authority.ts`
- `packages/application/src/constitutional-compliance.ts`

### Supporting policy
- `docs/DEPENDENCY-SOVEREIGNTY-POLICY.v1.md`

## Compatibility risk

Classification: **MEDIUM**

Reason:
- no existing product capability is deleted;
- no data schema is forcibly migrated by publication itself;
- every governed repository becomes stale until adoption is updated;
- some projects will gain legitimate work to remove or demote avoidable hard cloud dependencies.

## Migration rule

No repository receives fabricated PASS.

After publication:
1. update adoption manifest to policy 1.2.0;
2. inherit the seventh pillar;
3. record project dependency budget;
4. classify cloud/AI/sync providers;
5. define local/offline/degraded behavior;
6. revalidate project-specific sovereignty gate;
7. only then claim current constitutional compliance.

## Ratification condition

This amendment may be published only after an authenticated human authority explicitly ratifies the exact PR/revision carrying:
- normative Constitution;
- machine contract;
- version registry;
- universal template;
- policy source;
- compliance model;
- regression tests;
- migration matrix.

A chat instruction alone is not recorded as canonical ratification.

## Current authority statement

This document is a proposal/evidence package.

It does **not** ratify, publish, propagate or deploy anything by itself.
