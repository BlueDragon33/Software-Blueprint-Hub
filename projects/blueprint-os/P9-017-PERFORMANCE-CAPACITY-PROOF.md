# P9-017 — Performance & Capacity Proof

Status: **ACTIVE / DEVELOPMENT CANDIDATE**

## Purpose

Replace vague “feels fast” claims with explicit, reproducible capacity budgets tied to current architecture.

## Phase 9 budgets

- Portfolio projection: up to **500 readable projects** in one authority-filtered metadata projection.
- Quality Evidence Graph: up to **4,000 nodes** and **8,000 edges** before pagination/storage architecture must be reconsidered.
- Synthetic 500-project Portfolio projection CPU: <= **250 ms** in CI.
- Synthetic 1,000-work-package Quality Evidence Graph projection CPU: <= **500 ms** in CI.
- Prompt history remains page-bounded to **20 snapshots + look-ahead**, as proven in P7-005.
- Project-wide Quality/Readiness/Prompt reads must remain on the batched Gate+Evidence path with no per-gate N+1 loop.

## Interpretation

CPU budgets are deliberately broad regression ceilings for deterministic in-process functions. They are **not** browser/network latency SLOs and do not claim Production performance.

If a record budget is exceeded, the system must fail the proof and require pagination/indexing/streaming or a revised architecture decision. It must not silently raise the limit.

## Gate

- capacity proof passes at documented target loads;
- over-budget inputs fail closed;
- P7-005 batch/N+1 regressions remain green;
- production build and desktop/tablet/mobile E2E remain green;
- exact PR-head Fast CI passes;
- exact merged revision passes full Release Gate;
- Production deployment remains a separate explicit decision.
