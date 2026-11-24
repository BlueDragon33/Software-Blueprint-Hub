# C6 — Windows silent-hang incident, full candidate Node QA and constitutional interaction discipline
Date: 2026-11-22. Draft PR #173, branch `proposal/constitutional-graph-integration-20261122`.
ACTIVE Constitution remains 1.3.0. No merge/ratify/publish/actions or paid resources.

## Windows incident observed from Owner
The previously downloaded `qa-pr173-offline-first.ps1` was invoked with `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ...` and then appeared to hang without a new report. Direct inspection of the uploaded script confirms external `git fetch` and package commands redirected all output to log files with neither heartbeat nor an explicit timeout. The preceding Windows evidence had shown Git HTTPS TLS `unexpected eof while reading` and HEAD verification failure. **No inference is made that Windows tests ran successfully, nor that the remote process stopped.** This interaction was premature under existing R19–R22.

## Repaired source in this PR
- `scripts/qa-pr173-one-shot.ps1` now uses per-command timeouts, periodic progress messages, one bounded fetch with HTTPS HTTP/1.1/Schannel if a pinned local object is absent, prompts disabled, offline package installation, isolated worktree and single summary. Previously unbounded `git ls-remote` was removed.
- Important: the uploaded old download is **not retroactively changed** by a GitHub commit. The revised source has not been run on Windows and is not a verified remediation of the owner's active process.
- `tests/application/universal-next-action-frontier.candidate.test.mjs`: corrected 5 invalid one-character fixture IDs that violated the real selector contract.
- `packages/application/src/universal-next-action-frontier.candidate.mjs`: unavailable native capability remains false unless explicitly present (`nativeWindows !== true`); mandatory human authority gate takes priority over any claimed completion.
- `packages/application/src/atlas-graph.candidate.mjs`: rejects unknown root fields and oversized graph before traversing untrusted arrays.
- `packages/application/src/atlas-graph.candidate.schema.json`: now aligns identifier and title bounds with validator; dedicated schema consistency negative tests.

## Real executable QA (candidate scope only)
Tool: Node v22.16.0 `node --test`. Isolated reconstruction at `/mnt/data/atlas-exact`, rebuilt from **GitHub-verified exact blob bytes**; each test and module SHA independently compared with GitHub connector outputs. Test summary **50 PASS, 0 FAIL, 0 SKIP** (five candidate test files). TAP SHA256 `86c75dbb0fab28a22fd5902783aca20c729f81ef36a78fb11b9d65cbc82cbc41`. Python `jsonschema` Draft 2020-12 schema meta-check PASS, exact synthetic fixture PASS with zero schema errors. Git blob manifest:
```
d58a05f0b445962840e8655210fcdd673b2dec90  packages/application/src/atlas-graph.candidate.mjs
569b098f5b1191281650ee69b57062b4fe2d5461  packages/application/src/atlas-graph.candidate.schema.json
a8f407c250de013e001264dcf8a0d3cc085ec57b  packages/application/src/atlas-live-events.candidate.mjs
399bc6ac5230ccbdebc20870479b86480b710b14  packages/application/src/universal-next-action-frontier.candidate.mjs
a68c92384b987bfb14672dadbbb7b1aa1eaa0ddf  packages/application/src/atlas-next-action-adapter.candidate.mjs
b7917d286169a07fa85e34ae60376c151149be1c  tests/fixtures/atlas-graph.candidate.fixture.json
4628eb72800e45923bd97d6a6ecbd6d5a601b831  tests/application/atlas-graph.candidate.test.mjs
b503c54b525584e9d04792f9b9405e3db8046a71  tests/application/atlas-live-events.candidate.test.mjs
424538efb6063727826d4f4c8aad9429aad91225  tests/application/universal-next-action-frontier.candidate.test.mjs
1128ec9360043930753ea6372db5e035d0f66e5b  tests/application/universal-next-action-intervention.candidate.test.mjs
8c37d64a9cd7a635e6c7060a17977996f51d7549  tests/application/atlas-next-action-adapter.candidate.test.mjs
```

## NOT YET VERIFIED
Not an exact full repository checkout: no dependency install, TS typecheck, Next.js build, Postgres, Playwright/browser, iOS/Android, authenticated durable intake, real Codex runner/live SSE, independent reviewer A/B or production evidence. A successful five-file isolated Node suite is source-level only and confers no product PASS. Integration with draft #166 and #161 remains necessary.

## Binding operational rule (already exists in ACTIVE §10.R19–R22)
Exhaust connected authorized capabilities first. Do not ask for repeated PowerShell commands or small progress logs. Native interaction is only a genuine capability boundary, after a **complete bounded package** is prepared, with one run and one consolidated readback. No more client PowerShell requests in this checkpoint.

## Next engineering slice
Continue resolving existing Graph Studio/Prompt Workspace integration, authenticated durable 2-stream intake and truthful agent status through connected GitHub and local isolated tooling. Ask for a single Windows batch only if the remaining acceptance genuinely depends on a capability not available here, and after the other eligible engineering is finished.
