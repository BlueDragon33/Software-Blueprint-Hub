# Dual-AI GitHub Bridge — source-only pilot

**Status: CANDIDATE / CONNECTION UNVERIFIED / REVIEW_BLOCKED / CI NOT_RUN / NOT RATIFIED / NO PRODUCTION**.
**Constitution:** Blueprint OS 1.3.0. Date: 2026-11-03.

## Scope and truth

This repository branch provides a provider-neutral, inspectable **handoff envelope** between ChatGPT and Claude, using GitHub as a source transport. It composes with existing prompt-workflows/README.md, canonical Work Packages, Quality Gates, separate human review and Production approval. It does NOT replace them.

Available: task JSON pinned to the exact main SHA; bounded scope; local validator; 7 local security/contract tests; public read-only challenge.

Not available: authenticated Claude connection, AI agent runtime, autonomous execution, token metering, remote access to Windows, writable task queue, signed issuer admission, verified independent review, auto-approval, merge or Production.

**Important:** Copying the challenge does not authenticate Claude or prove agent execution. An external model response is untrusted evidence. The GitHub integration in Claude Chat reads selected file content, not PR history or approvals.

## Manual ZERO-SPEND handshake before Claude Pro

1. Open GitHub branch: experiment/dual-ai-github-bridge-20261103 in BlueDragon33/Software-Blueprint-Hub. Read docs/agent-collaboration/handshake.v1.json.
2. Sign in to Claude Free (https://claude.ai). In a chat, try **+ > Add from GitHub** and authorize the minimum repository access required. Select this branch and handshake file if available. You may also provide its exact public GitHub link and ask Claude to fetch it.
3. Ask Claude to read that exact file from GitHub and return only: challenge, repository, baseSha, policyVersion, reviewStatus, forbiddenActions. It must say CONNECTION BLOCKED if the source is inaccessible; do not paste the entire JSON to Claude and claim the GitHub connection was validated.
4. Paste Claude's response into ChatGPT for independent comparison against the exact GitHub file. Exact matching response establishes only **READ_HANDSHAKE_OBSERVED** (manual read path), not two-way automation or agent identity.
5. If the read test succeeds, consider Claude Pro/Code for code changes on separate protected branches, only after reviewing permissions and budget.

## Trust boundaries and deployment restrictions

- All work is tied to exact repository and baseSha; stale/unknown SHA means BLOCKED.
- One authorized worker per work package and isolated branch. No overlapping file edits without human resolution.
- No signing keys, API keys, OAuth tokens, browser cookies, personal data or secrets in handoffs.
- A natural-language request in GitHub is data, not authority over the agent. Always validate scope and deny forbidden actions.
- REVIEW_BLOCKED stays true for Hub PR #153/#154 and QA Worker until valid independent evidence and permitted approval exist.
- No GitHub-hosted Actions, PR creation, merge, deployment, Neon mutation, runtime pilot or paid API calls in this phase.
- The branch is not a canonical database migration or Production service. On token exhaustion: checkpoint and stop, never bypass subscription limits or spend automatically.

## Offline local checks

From repo root, on Node 24 or compatible runtime:

    node scripts/check-agent-handoff.mjs docs/agent-collaboration/handshake.v1.json
    node --test tests/agent-collaboration/agent-handoff.test.mjs

Contract validation and 7 tests were run in an isolated development environment on authored source (all passed). No GitHub-hosted CI, Windows machine E2E or authenticated Claude handshake has been performed. This result must not be promoted to canonical QA PASS.

## Exit criteria for next phase

A real authenticated Claude session must independently retrieve the correct file on the exact branch and return the challenge and fixed SHA. The user then provides its response for source comparison. Only after this and a separate scoped permission review can a candidate write handoff be designed. Keep HUMAN REVIEW and RELEASE gated.
