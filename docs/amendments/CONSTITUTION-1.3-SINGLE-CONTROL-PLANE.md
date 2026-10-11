# Constitution 1.3 candidate annex — One Control Plane, Shared Device Approval and Coherent UX

Related amendment: `constitution-amendment:1.3-agent-change-reliability-20261009`
Candidate requirements: **R11–R14**
Active authority: **blueprint-os:universal-century-grade@1.2.0**
Candidate 1.3.0: **DRAFT / NOT RATIFIED / NOT ACTIVE**
Source decision: user request, 2026-10-11; constitutional publication still follows the governing protocol.
Implementation status: **DESIGN ONLY**. No central identity/device federation, client migration or runtime acceptance is asserted here.

## 1. Normative candidate outcome

Every application created under Blueprint OS must be discoverable and governable through Application-Management at its declared capability level. Application-Management is the single ecosystem operational management entry point: catalog, enrollment/approval policy, device overview, scoped access coordination and coherent navigation.

A user/device approved at Application-Management can enter covered apps without a separate personal account or repeating manual device approval in each app. Apps automatically enroll devices and accept independently verified central decisions within the applicable policy. New devices may be automatically approved when the central authorized policy allows it; otherwise their pending request is reviewed in that same central interface.

"Tự duyệt thiết bị" means **authorized central policy automation and automatic acceptance of verified central grants**. It does not mean an app can declare its own unknown device approved, silently enroll an administrator or ignore revocation.

The central approval workflow must be implemented and verified before claiming this experience exists. A repository manifest, connected catalog card or green build does not provide authentication.

## 2. Reuse and ownership

| Surface | Authoritative owner | Client responsibility |
| --- | --- | --- |
| Ecosystem membership, canonical device approval and delegations | Application-Management operational authority | Verify scoped current decision; keep app-specific binding as a projection |
| Control-plane operator-device registry | Application-Management | Never treat an ordinary approved client device as an operator |
| Local app device ID, sessions, entitlements and business audit | Owning client | Link to approved subject when needed; enforce app permissions and preserve audit |
| User business/learning/health/child/modem/quotation state | Owning client/local runtime | Export, protect, recover; do not upload to central approval service |
| Constitution and canonical engineering state | Blueprint OS / project authority as already defined | Adopt only published law and verified project gates |
| Professional/UX acceptance, quality gates and Production release | Existing qualified authorities | Central device approval does not satisfy these gates |

One decision has one owner. Central membership is not replicated as an independent approve/revoke authority in each app. Client projections must identify the central decision and version and cannot outrank a newer central block/revocation.

Keep existing app-scoped registries for local IDs, sessions, entitlements and domain audit as needed. Do not merge all client device rows into the existing operator-device table or collect invasive fingerprints to simulate universal identity.

## 3. App onboarding and bounded network topology

- Every new app publishes a versioned compatible management contract: stable application ID, parent where applicable, category, runtime/public/control origin, protocol/version, safe capabilities and actual readiness. Do not publish secrets.
- Add it through the existing Dynamic Catalog. No new app-ID switch, dashboard route, environment-variable name, approval website or auth stack solely to register another ordinary app.
- Capability flags remain false until a real supported backend is available and verified. Declare applicable states separately: catalog/discovery, enrollment, central-approval verification, session enforcement, automation and remote-admin readiness.
- Do not add unreviewed fields or invent endpoints in the current v1 contract and present them as supported. Design the federation seam/version and backward compatibility before implementation.
- Reuse an app's existing runtime and a shared generic adapter where practical. Separate origins or services may be justified by isolation, hardware, scale or offline ownership; record purpose, owner, cost, trust boundary and removal/exit path.
- Sub-clients/modules reuse an explicit parent integration. Central control must not bypass the parent to reach sub-clients without a declared delegated contract. Independent deployments may keep separate artifact/release identity without a duplicated login/approval authority.
- Public/anonymous static functions remain usable without artificial account gates. They still register with the catalog and accurately declare metadata-only or public access. If an app offers protected functions, its supported protected boundary must verify central scoped approval.
- A local-first app can use a local/self-controlled Application-Management adapter and bounded provisioned verification; it must not acquire a new mandatory always-online paid backend merely to satisfy this rule.

## 4. Device, identity and approval sequence

1. **App registration:** register and validate application/environment/parent/capabilities in the central catalog. A URL or manifest does not automatically create trusted issuer/credential registration.
2. **Device enrollment:** verify subject and device proof using the implemented authenticated mechanism, bind the intended app/environment and store a minimal auditable request. Deduplicate retries; an app display name, browser user-agent, viewport or caller-supplied device ID is not identity.
3. **Central decision:** apply an authorized current automatic policy or record the central operator's manual decision. Defaults for unknown policies/devices are pending; approvals specify allowed ordinary access, constraints and revocation behavior.
4. **Secure handoff:** the existing identity broker/approved exchange obtains an app-audience grant. Different origins must not copy signing private keys, reuse a cross-app master session token, put bearer tokens in URLs/logs or assume shared cookies.
5. **Client verification:** independently check registered issuer/trust anchor, integrity, intended audience/app and environment, subject/device binding, proof where required, issued/expiry times, challenge/nonce replay controls and current policy/revocation version. Authenticate at the server or an appropriate trusted boundary.
6. **Scoped session:** create/refresh a local app session/entitlement projection without asking the user to create another personal account or reapprove the same covered device. Do not use a grant for app A directly in app B; obtain a grant for B under the same central policy.
7. **Observation and readback:** central UI shows confirmed states with revision, source and last verification. HTTP success alone does not prove enrollment, approval or block persisted.
8. **Revocation/recovery:** central block, expiry, key compromise or device replacement stops new grants and invalidates relevant existing sessions within a documented risk-based maximum freshness window. Retry and recovery are idempotent, version-safe and auditable.

The candidate defines requirements, not a new home-made authentication protocol. Select/reuse existing tested primitives, trust-key lifecycle and handoff adapters after threat review. Endpoint names and token format are unresolved implementation contracts, not capabilities provided by this document.

Approval is membership plus policy-scoped permission. It does not grant unrelated admin actions, paid features, access to another person's records or a privileged desktop command.

## 5. Outage, privacy and local core

- Declare grant lifetime, maximum stale-decision/revocation window, clock-skew handling and protected-operation outage behavior. Expired/unverifiable grants cannot be silently renewed.
- Already provisioned low-risk local workflows may continue within a documented bounded offline entitlement. Sensitive/privileged operations require stricter freshness and cannot be allowed by a stale UI cache.
- Present pending, revoked, expired, unavailable and bounded-offline states distinctly. A local learning workflow must not be destroyed by a catalog service outage.
- Keep private user data, local modem credentials and app signing/private device keys in their owning boundary. Central collection is limited to the membership/delegation metadata needed for management and audit, with retention/export/deletion rules.
- Use app-scoped/pairwise identifiers where practical to limit unnecessary cross-app tracking. Do not expose the operational approval ledger through public repository contracts.
- Recovery and key rotation must preserve verified identity continuity or require re-enrollment when identity changes; clearing local storage cannot erase a central block.

## 6. Coherent presentation

The central presentation profile supplies versioned design tokens, status vocabulary, navigation/breadcrumb conventions and approved management surfaces. It stays a UI contract, never a remote code-execution or permission channel.

| Device/input profile | Expected adaptation | Consistency invariant |
| --- | --- | --- |
| Desktop / keyboard + pointer | Task-appropriate density and navigation | Same status/permission meaning and named actions |
| Tablet / touch + optional keyboard | Reflow and accessible touch targets | Same canonical state and scope |
| Phone / touch | Prioritized one-column tasks and compact navigation | No duplicate approval/login surface; no hover-only critical action |
| Offline desktop / hardware-specific app | Native/local workflow suited to actual capabilities | Same lifecycle vocabulary and truthful connectivity |

These layouts are task-specific, not mandatory identical dashboards or arbitrary universal breakpoints. Use existing tokens/components and progressive disclosure instead of card accumulation. Capability/viewport detection selects presentation only; permission remains enforced independently.

## 7. Migration and compatibility

1. Inventory the actual current central catalog, app device/session owners, issuer keys, client gates, topology, login dependencies and scoped automation contracts. Never bulk-approve existing rows just because a legacy status says approved.
2. Design a backward-compatible/versioned federation seam, authority/scope matrix, privacy inventory, threat model and bounded outage/revocation budgets. Review the current Application-Management topology's "no shared device registry" rule explicitly.
3. Implement in isolated Preview with fixture identities and a real central decision path. Start with one low-risk app and the existing management runtime; no Production rollout by constitutional draft alone.
4. Link existing verified identities under an audited migration. Resolve collisions, pending/revoked records and conflicting permissions; conflicting decisions remain restricted/pending rather than "approved wins".
5. Demonstrate the user journey: central approval once → covered app opens without another account → second covered app opens through its own valid scope → central block invalidates both within budget.
6. Test explicit parent/sub-client delegation. Extend in waves; B5 private-record apps and privileged/hardware clients retain stronger project-specific gates.
7. Retire duplicate personal-account/approval paths only after real parity and rollback/recovery are demonstrated. Compatibility adapters have a removal trigger and never become a second long-term authority.
8. Ratify/publish the atomic constitutional version set and propagate templates/contracts/adoption in the approved order. Do not edit clients' adoption version before published authority exists; do not mark a client compliant solely because its manifest is present.

A mandatory central-identity change may alter existing security/availability semantics. The constitutional minor/major and federation contract version need explicit impact review; candidate "1.3.0" is provisional and must be coordinated with draft PR #97.

## 8. Planned acceptance cases — NOT EXECUTED

| Case | Required scenario | Expected evidence |
| --- | --- | --- |
| CP-01 | Add a new compatible app through Dynamic Catalog | Appears without a central source-code change; no fake capabilities |
| CP-02 | Centrally approved device enters two covered apps | No separate personal accounts/manual reapproval; distinct correct-audience grants |
| CP-03 | New verified device meets configured central auto-approval policy | One auditable idempotent approval/readback; outside policy remains pending |
| CP-04 | Unknown app/device, forged issuer, expired or wrong-environment grant | Protected access denied; no fabricated connected/approved state |
| CP-05 | Replay a handoff, substitute device proof or reuse app-A grant in B | Denied without corrupted registry/session state |
| CP-06 | Block/revoke centrally with cached/open client sessions | Affected access invalidated within explicit risk budget; stale cache never shows LIVE |
| CP-07 | Ordinary approved client attempts central admin or privileged command | Denied unless a separate appropriate capability is granted |
| CP-08 | Central service outage and later recovery | Documented bounded local use, expiry enforcement and truthful unavailable state |
| CP-09 | Device reset/identity collision/rotation, legacy migration conflict | No silent privilege recovery; audited resolution/re-enrollment and rollback |
| CP-10 | Parent/sub-client app attempts undelegated control | Denied; legitimate delegated ordinary access works without a new approval center |
| CP-11 | Save policy partially succeeds across apps | Per-field confirmed readback and correct partial result; no all-success claim |
| CP-12 | Desktop/tablet/phone/input-mode journeys | Consistent status/navigation, appropriate responsive layout and human UX evidence |
| CP-13 | Contract-only or local-only app, private/child/modem data | Truthful metadata/local readiness; no remote control or private-data/key leakage |

Evidence must identify both central and client exact revisions, compatible contract version, fixture scope, environment, actual run/jobs and artifact provenance. The existing pure agent evaluator's 39 synthetic tests **do not execute any CP case**.

## 9. Status and next safe work

This annex adds a reviewable constitutional requirement. It does not change active 1.2 law, contracts, templates, other repositories, existing approval settings, user accounts or deployments.

Next: impact/threat/compatibility review; authorized isolated implementation plan; real Preview integration and critical-journey evidence; exact candidate ratification/publication under the governing protocol. The observation-only K1–K5 pilot remains separate and cannot certify this identity/control extension.
