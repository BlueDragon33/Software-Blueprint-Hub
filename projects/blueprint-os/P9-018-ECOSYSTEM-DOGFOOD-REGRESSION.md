# P9-018 — Ecosystem Dogfood Regression

Status: **ACTIVE / DEVELOPMENT CANDIDATE**

## Purpose

Use Blueprint OS as its own customer and exercise the same bootstrap/architecture rules against multiple heterogeneous software classes.

## Dogfood set

1. Blueprint OS itself — engineering platform / B4.
2. Local-first device tool — offline write / B3.
3. Learning product — persistent confidential product / B2.
4. Critical policy-controlled system — restricted critical system / B5.

Each case carries a unique semantic sentinel. A case may contain its own sentinel but must never contain another project's sentinel. This makes shared mutable state and semantic contamination observable.

## Gate

- all cases receive unique deterministic project identities;
- expected engineering depth differs according to explicit risk/complexity signals;
- no cross-project semantic sentinel leaks into another bootstrap plan;
- no dogfood run gains canonical mutation, cross-project merge or Production release authority;
- existing Bauman Reference Case isolation test remains green, proving reference material stays outside Universal Core;
- exact PR-head Fast CI passes;
- exact merged revision passes full Release Gate;
- Production deployment remains separate.
