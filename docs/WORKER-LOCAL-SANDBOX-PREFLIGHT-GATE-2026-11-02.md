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

## Independent static isolation and reviewer authority review (2026-11-02)

A second, separate **static** reviewer implementation is `scripts/audit-worker-independent-isolation.mjs`, tested by `tests/governance/worker-independent-isolation-review.test.mjs`. Its [dedicated workflow](../.github/workflows/worker-sandbox-independent-static.yml) checks out the exact PR HEAD SHA (not GitHub's synthetic merge commit), uses only Node built-ins with `contents:read`; it does not install packages, execute binaries or create a container. A passing test means the **denial contract remains intact**; its report always returns `BLOCKED_MISSING_INDEPENDENT_ISOLATION_EVIDENCE`. This reviewer is technical **advisory-only**, not a human approval.

**Required but absent external evidence:**

| Control | External proof still required | Why static policy cannot grant PASS |
| --- | --- | --- |
| Image | Immutable `image@sha256:...` actually pulled from authenticated source; inspected image config, root user and digest; current `imageDigest=null` | No image has been selected or independently verified |
| Seccomp | Reviewed seccomp JSON SHA256 + default action and syscall rule review, demonstrated installed/enforced profile; current `seccompProfileSha256=null` | A string `RESTRICTIVE_PINNED_PROFILE_REQUIRED` is not a loaded kernel filter |
| AppArmor | Named, loaded and enforcing non-`unconfined` profile + exact content provenance; currently only placeholder string | AppArmor enforcement depends on the Linux host/daemon |
| Userns | Host rootless-daemon or mapped-user evidence, actual `uid_map` / `gid_map`, no-new-privs and capabilities after launch | Container UID 65532 is **not** proof that the daemon is rootless or the host UID is remapped |
| Network | Actual independent no-egress/no-DNS probe, no inherited proxy or service binding, only loopback | `network: none` is a design assertion until the runtime enforces it |
| Secrets | Process environment and /proc/mount inspection in a separately approved safe sandbox; no token/cookie/.env/SSH/Docker socket | `envAllowlist` does not prove the host did not inject secrets |
| Storage | Actual rootfs read-only, ephemeral noexec tmpfs, no host mounts, cleanup proof | Config alone cannot prove mount enforcement or artifact removal |
| Resources | cgroup v2 cpu.max, memory.max, pids.max + observed kill/timeout; separate disk quota evidence | JSON CPU/RAM/disk/time limits do not automatically enforce themselves |
| Source/provenance | Actual execution HEAD and independent image/profile signature or reproducible source validation | Recorded baseline is historical review evidence, never execution authorization |
| Reviewer | Real GitHub identity/permission, exact-head submitted review and constitutional scope of authority | Advisory QA, bot comments and static test success cannot approve a security/Production gate |

**Read-only repository observation at original review HEAD `2a0af7a9077a463764cb8b27b08ff70bfd568284`:** Hub PR #154 had zero submitted reviews, zero requested reviewers and remained Draft. No CODEOWNERS file was found in the inspected Hub tree. GitHub branch-protection inspection was rejected with HTTP 403 by integration; hence whether `main` has required-review protection is **UNKNOWN**, not disabled or satisfied. GitHub Docs explain that Draft PRs do not automatically request Code Owner reviews, required review rules apply to authorized reviewers and PR authors cannot approve their own PRs. Do not fabricate reviewer accounts or mutate protection settings to satisfy the gate.

External technical references reviewed:
- https://docs.docker.com/engine/security/rootless/ — rootless daemon and rootless container vs userns-remap are different
- https://docs.docker.com/engine/security/userns-remap/
- https://docs.docker.com/engine/network/drivers/none/ — loopback with no external network
- https://docs.docker.com/engine/security/seccomp/ and https://docs.docker.com/engine/security/apparmor/
- https://docs.github.com/en/pull-requests/reference/pull-requests — Draft reviewers
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

**Disposition:** `STATIC_DENY_CONTRACT=VERIFIED` only where exact-head CI actually passed; `INDEPENDENT_HUMAN_REVIEW=BLOCKED`; `RUNTIME_HOST_ISOLATION=UNVERIFIED`; `BUILD_SCRIPTS=DENIED`; `WORKER_RUNTIME=NOT_RUN`. Passing independent static checks does **not** change the authorization state.

**One subsequent bounded task: `ISOLATION-REVIEWER-AUTHORITY-EVIDENCE`** — verify the actual reviewer/branch-protection authority through authorized read-only repository access and evaluate independently attested image/seccomp/AppArmor provenance *only when supplied*. No execution, deployment, review impersonation or automatic change of gates.


## Read-only reviewer and signed isolation evidence — 2026-11-02

**Observation source:** live GitHub REST metadata, with `Hub PR #154` source HEAD `b92c9a203d91d5a16992e473983e1bea9393283e`, `QA Worker PR #5` source HEAD `b7a25d600dc649d4486643cc205436af69540942`. This is a dated observation only, **not** an authorization. A later commit changes the candidate HEAD and requires another exact-head read.

| Read-only check | Hub #154 | QA Worker #5 | Security verdict |
| --- | --- | --- | --- |
| Draft/open/unmerged | Yes | Yes | No review/merge implied |
| PR author | `BlueDragon33` | `BlueDragon33` | Same principal cannot provide independent approval for own PR |
| Review submissions | **0** | **0** | `REVIEW_BLOCKED` |
| Requested reviewers and requested review teams | **0 / 0** | **0 / 0** | No assigned independent reviewer |
| `CODEOWNERS` at Draft and `main` source trees | **not present**, both complete trees (not truncated) | **not present**, both complete trees (not truncated) | No code-owner source of independent review |
| Branch protection API (`main`) | HTTP **403**, integration cannot read | HTTP **403**, integration cannot read | **UNKNOWN**, never equate inaccessible with disabled |
| Repository rulesets collection | Readable, **0 returned** | HTTP **403** (GitHub private-repository feature/plan restriction) | Hub list 0 does not prove absence of legacy branch protection; QA rulesets UNKNOWN |
| Connected GitHub principal | `BlueDragon33`, repo `admin` | `BlueDragon33`, repo `admin` | Administration access is **not** a review submission, separate identity or ratification |
| Other collaborators/authorized reviewer list | Not exposed by current connected read-only API | Not exposed by current connected read-only API | **UNKNOWN**, do not guess a reviewer |
| Image digest | `containerContract.imageDigest=null` | No signed image manifest in inspected tree | **NOT SUPPLIED** |
| Seccomp SHA256 | `seccompProfileSha256=null` | No pinned profile in inspected tree | **NOT SUPPLIED** |
| AppArmor enforcement/source | Placeholder `RESTRICTIVE_PROFILE_REQUIRED` only | No enforceable profile/evidence file | **NOT SUPPLIED** |
| Signed image/profile provenance | No attestation/signature/source proof in examined tracked trees | No attestation/signature/source proof in examined tracked trees | **UNVERIFIED**, cannot validate absent artifact |

The current Hub constitution 1.3.0 source explicitly distinguishes **Project Authority**, **Constitutional Authority** and **Production Authority**. The connected owner's repository-admin permission is not evidence of authority to substitute for an independent protected reviewer or to ratify this security/Production gate. QA Worker `expert-reviewer` is permitted to produce advisory technical findings; it cannot impersonate a human, create GitHub review submissions or grant protected approval. Do not appoint a guessed collaborator, auto-approve with the same PR author, forge an identity, or weaken rules to get PASS.

**Required evidence before reconsideration:** a real distinct, consenting GitHub reviewer with readably verified repository role and exact-head `APPROVED` review (plus project security/constitutional scope if separately required); readable branch protection/ruleset requirements from a genuinely authorized source; a selected content-addressed container image and separately published verifiable signature/attestation; actual seccomp profile bytes and pinned SHA256; a documented, loaded and enforcing AppArmor profile; and separately authorized host-isolation evidence for rootless/userns, egress, environment secrets, mounts and cgroups. A supplied digest alone is not proof of signature validity or kernel enforcement.

**Fail-closed state at this observation:** `REVIEW_BLOCKED`; `BRANCH_PROTECTION_UNKNOWN`; `IMAGE_SIGNATURE_UNVERIFIED`; `SECCOMP_PROFILE_NOT_SUPPLIED`; `APPARMOR_ENFORCEMENT_UNVERIFIED`; `POSTINSTALL_DENIED`; `WORKER_RUNTIME_NOT_RUN`; `PRODUCTION_NOT_AUTHORIZED`.

**Exactly one follow-on action — `REVIEWER-AND-HOST-EVIDENCE-ACCESS-GATE`:** obtain **read-only** GitHub branch-protection/approved reviewer metadata and actual signed image/seccomp/AppArmor evidence from authorized existing sources if available, then re-run verification against a new exact HEAD. If permissions or artifacts remain absent, stop at `REVIEW_BLOCKED`, with no container execution, fake approval, merge, cloud/Production or database mutation.
