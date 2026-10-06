# Prompt Architecture v2

Status: **UNIVERSAL PROMPT GOVERNANCE BASELINE**

Prompts are projections. They coordinate work; they do not own truth or authority.

## Authority stack

```
Human Constitutional Authority
        ↓
Universal Constitution
        ↓
Project Profile + Resolved Blueprint
        ↓
Work Packages + Quality Gates + Evidence
        ↓
Stage-specific Prompt Projection
        ↓
AI / Human execution
        ↓
Proposed changes
        ↓
Trusted canonical mutation path
```

A lower layer cannot override a higher layer.

## Prompt families

### 1. Constitution Authority prompts
Global, stage-specific prompts for:
- amendment;
- impact;
- migration;
- ratification brief;
- publication;
- propagation;
- verification.

They may analyze/draft/propose. They cannot ratify, publish by themselves, PASS gates or authorize Production.

### 2. Project Execution prompts
Generated from one project's canonical Profile, resolved Blueprint, Work Packages, Quality Gates and evidence.

They may guide implementation but cannot mutate canonical state by their text alone.

### 3. Review prompts
Used for professional UX, architecture, security, migration or quality review.

They produce findings/evidence candidates, never automatic PASS.

### 4. Release prompts
Used to assemble exact-revision evidence and deployment preconditions.

They cannot infer deployment from merge/CI and cannot grant Production authority.

## Required prompt envelope

Every durable generated prompt must carry:

1. prompt family and template version;
2. project/amendment identity;
3. exact source revision/digest;
4. active Constitution policy version;
5. applicable Blueprint Level when project-scoped;
6. required modules/gates or affected law surface;
7. current Work Package/stage;
8. evidence already available;
9. blockers;
10. allowed actions;
11. forbidden actions;
12. required response/output structure;
13. stale/regeneration rule;
14. dependency posture: local/offline capability, external providers, cost class, data portability, degraded behavior, and exit path.

## Prompt precedence

When instructions conflict:

```
CONSTITUTION > BLUEPRINT > CANONICAL WORK/GATE STATE > PROMPT > CHAT CONVENIENCE
```

A prompt that contradicts a higher source is invalid and must be regenerated/corrected.

## Prompt lifecycle

```
CANONICAL STATE
    ↓
NORMALIZE
    ↓
SOURCE DIGEST
    ↓
GENERATE
    ↓
RECORD SNAPSHOT
    ↓
EXECUTE
    ↓
PROPOSE CHANGE / PRODUCE EVIDENCE
    ↓
TRUSTED MUTATION OR REVIEW
    ↓
CANONICAL STATE CHANGES
    ↓
OLD PROMPT BECOMES STALE
```

## Universal anti-patterns

Forbidden:
- one mega-prompt carrying hidden permanent business truth;
- editable prompt text becoming canonical state;
- prompts that self-authorize PASS/release/publication;
- prompts without source revision/digest;
- silently continuing after canonical source changed;
- embedding raw secrets;
- copying project-specific assumptions into Universal Constitution prompts;
- weakening tests/gates to satisfy an old prompt;
- introducing a mandatory paid/external provider without an explicit dependency budget and justified capability gap;
- treating Google Drive, a cloud database, hosting provider, AI vendor, or any other integration as canonical authority merely because it is convenient.

## Human authority

Human actions remain explicit where the Constitution requires them.

A prompt may prepare a ratification or review brief. It cannot simulate the authenticated human decision itself.
