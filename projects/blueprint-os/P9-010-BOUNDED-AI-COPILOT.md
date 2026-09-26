# P9-010 — Bounded AI Copilot

Status: **DEVELOPMENT CANDIDATE**

## Purpose

Add AI-assisted analysis and drafting without allowing model output to silently become canonical engineering state.

## Laws

1. AI output is a proposal/projection, never canonical state.
2. Every proposal is bound to an exact source revision and actor.
3. Human review is mandatory before any canonical mutation path may be invoked.
4. AI cannot PASS Quality Gates or authorize Production release.
5. Raw secrets are rejected from AI context before invocation/projection.
6. Proposal identity and fingerprints are deterministic for auditability.
7. Provider execution and model choice remain outside canonical authority.

## Acceptance

P9-010 may complete only when:

- proposal envelopes are deterministic;
- source revision drift changes proposal identity;
- secret-bearing context fails closed;
- canonical/quality/release authority flags remain false;
- explicit acceptance remains required;
- source-of-truth contradiction gate stays green;
- exact PR-head Fast CI passes;
- full Release Gate passes before any Production publish decision.
