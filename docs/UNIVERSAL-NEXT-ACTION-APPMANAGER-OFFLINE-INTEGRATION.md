# Universal Next Action → Application-Management: offline-only integration decision (Draft)

> Scope: advisory-only integration proposal for [Hub Draft PR #151](https://github.com/BlueDragon33/Software-Blueprint-Hub/pull/151). **NOT AN ENROLLED APP CONTRACT, NOT READY, NOT AN EXECUTION PERMISSION**. Constitution 1.3.0 remains in force. No code/manifest or schema changes in Application-Management.

## Grounded sources, not a new registry

- Hub authoritative current branch checkpoint: `cd01fb3c2178393628ce968af209db082227d2c4`; PR #151 is a separate unmerged Draft. Hub uses `ProjectProfile`, `runtime.readiness.read(actor, projectId, requiredGates)` and Work/Quality canonical data.
- Hub owner-only `/ecosystem` reads 18 entries from `control/governance-current-view.v1.json` plus 3 pending private services. Exact status matters: `pending-onboarding` is NOT eligible for execution even if a related Profile exists.
- Application-Management source inspected at `BlueDragon33/Application-Management@93906a7fff0f3925139ab63dc01312e8d18caf17`: `app/project-registry.ts`, `app/managed-contract-discovery.server.ts`, `docs/UNIVERSAL_MANAGEMENT_CONTRACT_V1.md`, `docs/LOCAL_FIRST_RELEASE_STANDARD.md`.
- Its own project repository ID `software-blueprint-hub` represents **Hub project `project:blueprint-os`**; other AM IDs can differ too. Never join by display name, URL, inferred projectId or guessed repository. Use exact repository identity and separately authenticated canonical mapping.
- Application Management's `application-management.contract/v1` has dynamic Catalog and a legacy fallback. Its capability discovery is **metadata**, not proof of authorization or an execution grant.

## Product behavior (same two actions)

| Canonical information available? | Button 1 | Button 2 | Truthful status |
|---|---|---|---|
| Valid authenticated Hub Profile and current read-only readiness | Open project's actual next-work target (Quality/Roadmap/Release Orchestration) | Open independent gate/work register | Guidance only; no execute |
| Repository tracked, Profile absent | Open Profile onboarding instructions | Open verified exact repository locator | `ONBOARDING_REQUIRED` |
| Pending onboarding even if Profile exists | Open validated Profile review | Open source/approval checklist | `ONBOARDING_REQUIRED`; no READY |
| Hub offline/unreachable, expired snapshot or access denied | Recheck local Hub connection/readiness | Open local onboarding/help | `UNAVAILABLE`; no inference |
| Authorized signed Gateway/Worker/QA path eventually proven | Separate future gate must assess scoped grant, actor, source SHA, QA and receipt | Existing advisory buttons retained | This PR DOES NOT introduce an execute button |

## Preferred interface: read-only extension of existing managed-app contract

**Do not build a new central registry, shared database, per-project hardcoded buttons or arbitrary online bridge.**

1. An authenticated *local-only* Hub management contract can eventually expose optional advisory capability `nextActionRead` and a protected read endpoint (e.g. `/api/control/next-action`) **only when implemented, tested and authorized**. This path is a proposal, not an assertion that an API already exists. Without it the capability must be absent/false.
2. The payload must include only authorized metadata: exact `projectId`, repository identity, `state` (`CANONICAL_GUIDANCE` / `ONBOARDING_REQUIRED` / `UNAVAILABLE`), current `readiness.nextAction.kind`, localized label/reason, *relative* Hub route names, canonical source/profile recordVersion and trusted observed/readback timestamp. No session, bearer, issuer/private key, medical/family data or business document content.
3. Consumer authenticates to Hub with a bounded app-scoped credential; check a real canonical ProjectProfile/role, source revision and snapshot TTL. Never grant cross-project access from Application-Management's own local session. Only server adapter may resolve links to allowed loopback origin; never concatenate arbitrary browser-origin strings or leak credentials. Treat `connected` and `READY` as different concepts.
4. Avoid `fetch` from a hosted-only origin or Vercel. Hub-local failure must degrade to truthful `UNAVAILABLE` while Application-Management launcher remains usable offline; each application remains owner of its data and permissions.
5. A new Hub endpoint/AM capability MUST go through separate Draft, security/privacy review and actual localhost acceptance. Do not flip flags by simply editing manifest; maintain `capability=false` until verified.
6. One-time UI and contract tests must include source-SHA drift, unauthenticated reader, Viewer denied for protected info, missing Profile, pending registry, disconnected Hub and expired advisory evidence. Never claim a validated 3-service signed execution path from advisory availability.

## Representative offline acceptance and honest scope

PR #151 has a new narrow Chromium smoke for actual shared React + global CSS at mobile width: a canonical Profile's two navigation URLs, one pending repository's onboarding/source URLs, focus order and never an executable button.

**The smoke does not start the full authenticated Next.js server, click through real routes, or prove Application-Management's Windows loopback runtime.** Separately run authorized local acceptance with one Profile and one pending repository using real source at exact reviewed SHAs. Do not merge this Draft, deploy online or propagate to daughter apps on CI green alone.

## Next technical gate

After owner/independent review of PR #151, create one narrowly scoped Draft **metadata-only local contract consumer** in Application-Management against an authenticated Hub-local read endpoint *if the endpoint is approved and implemented*. Preserve no-credential/no-Profile fail-closed behavior. Do not start bulk daughter-app UI edits, no contract activation by inference and no Production publication.
