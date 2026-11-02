# LOCAL-WORKER-SANDBOX-PREFLIGHT-GATE — Constitution 1.3.0

Date: 2026-11-02. Scope: Hub Draft PR #154; QA Worker Draft PR #5. This is a **static security contract**, **not** an execution plan that grants authority. No sandbox image/container or Cloudflare service is created.

## Decision

**STATIC CONTRACT MAY PASS; ACTUAL HOST ISOLATION / WORKER RUNTIME / POSTINSTALL = BLOCKED.** The machine-readable policy is `control/worker-local-sandbox-preflight.proposed.json`, the pure validator is `scripts/validate-worker-local-sandbox-preflight.mjs`, and the adversarial cases are `tests/governance/worker-local-sandbox-preflight.test.mjs`. The existing `control/worker-local-adapter-trust.proposed.json` remains authoritative DENY for execution and requires a separate human/security approval.

## Proposed isolation constraints (not deployed or tested)

| Boundary | Mandatory contract | Verification in this stage |
| --- | --- | --- |
| Host/process | Linux amd64; unprivileged UID/GID 65532; user namespace; no new privileges; drop ALL capabilities; no ptrace or privileged containers; independent pinned seccomp/AppArmor profiles required | **Only JSON policy + adversarial tests; runtime NOT VERIFIED** |
| Network | Network mode none; no DNS, outbound HTTP, host network, proxies or service bindings; loopback only | **Only policy; real deny test NOT RUN** |
| Files | Read-only rootfs, no host/worktree/home/SSH agent/docker socket mounts, throwaway noexec/nosuid/nodev tmpfs at /tmp capped 64 MiB, mandatory cleanup | **Only policy; no mount namespace created** |
| Secrets | Inherit no host environment; only PATH/HOME/LANG/TZ allowed; reject token, secret, key, password, database, Neon, GitHub, Cloudflare and proxy variables; no real OAuth sessions | **Only policy; secret-leak test NOT RUN** |
| Data | Neither real Neon nor real PostgreSQL, D1, migrations, remote bindings or Unix socket mounts; only synthetic read-only fixtures | **Only policy; no DB connection attempted** |
| Resources | Max 1 CPU, 1024 MiB memory, 64 processes, 1024 MiB ephemeral disk, 120s wall time, 1024 open files; no unlimited values | **Only policy; actual cgroup enforcement NOT VERIFIED** |
| Source | Exact immutable source commit required at execution; reviewed baseline SHA `6b68024e08c6280e45cb6e5b58fb4a6f4edc8d70` is recorded as historical review input, **NOT** as approved execution HEAD | **Execution source SHA intentionally unset; gate BLOCKED** |
| Native binaries | esbuild 0.28.2 ELF SHA-256 `e1698a3d5c6c0798fee4fd3b5cc816651f460c63d390a7a26ea4beb0b1884100`; workerd 1.20261023.1 ELF SHA-256 `b6aff93fcc97091fa38b4ba78c172276349c4940000694c5baf382c218b8e6ee` | **Byte parity proven in preceding audit, NOT runtime safety** |
| Published scripts | esbuild install.js SHA-256 `612294e278914443bdcf81cb17f54afec34dbdd2ebd999a6ee187912320cc315`; workerd install.js SHA-256 `c020655f335c6f9a4a1e8c8655fc71f37ce5aacd99c3eb7583ed5d60a0940768` | **Static digests pinned; execution DENIED** |
| Independent review | Reviewer grant, trusted container image digest, seccomp profile hash, issuer identity and signed build source provenance required before any authorization | **All absent or false, so BLOCKED** |

The GH Action has `contents:read`, checks out without persisted credentials, runs in an ephemeral `ubuntu-24.04` runner, and executes static policy checks **before** existing typechecks and registry artifact audits. It performs **no** `docker run`, `podman run`, `workerd`, `esbuild` binary execution or package lifecycle permission change in this stage. These controls defend against unintended changes to the checked-in policy; **they do not prove the actual host will enforce a single control**.

## Explicit fail-closed gates

- Reject any change to `approvedBuildScripts:[]`, any supposed owner/self-review approval, or a bound execution SHA without independent authority and revalidation.
- Reject privilege/root, missing user namespace, unpinned seccomp profile, added host mounts, shared Docker socket, enabled egress/DNS, inherited environment/credentials, real database access, over-budget limits, writable rootfs, executable tmpfs, missing cleanup or altered native/source hashes.
- Reject workflow changes that introduce cloud secrets, environment deployment, manual dispatch, write permission, Docker/Worker release commands or script trust bypass.
- If all static checks pass, output **`STATIC_CONTRACT_PASS_RUNTIME_BLOCKED`**, with `hostIsolationTested:false`, `runtimeExecutionAuthorized:false`, `currentExecutionShaApproved:false`, `reviewerApproval:false`, `releaseAllowed:false`.
- **No claim** that network denial, runtime isolation, no-secret or cgroup enforcement was dynamically tested. The proposed policy includes image/seccomp SHA placeholders explicitly null to ensure no silent certification.

## Bounded future gate

**LOCAL-SANDBOX-INDEPENDENT-ISOLATION-REVIEW**: inspect the proposed sandbox profile and independent reviewer authority, then *separately* decide how to prove no-egress/no-secret/CPU/memory limits without using any native Worker/adapters. If a truthful host-isolation test cannot be designed or authorized, remain BLOCKED. No host, cloud, domain, callback, canonical database, production, merge or human-approval mutation in this work.
