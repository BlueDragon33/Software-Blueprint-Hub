# Issue #133 — public envelope for private onboarding (candidate, unratified)

**Status: PROPOSAL ONLY / BLOCKED_NOT_REVIEWED.** This is a bounded offline-first, zero-runner-spend design experiment, not an authorized onboarding workflow, approved privacy policy, constitutional amendment or admission record.

The public Hub must not collect or publish private repository name, organization, commit SHA, GitHub CI/PR link, access token, credential reference, source files, model artifacts or an identifier derived from any of those values. A syntactically valid opaque handle is not proof of unpredictability: a future authorized intake process must generate a random UUID v4 independently and check its provenance, collisions and retention policy. Do not publish even the handle for a real application without the owner's explicit visibility decision.

`inspectPrivateOnboardingEnvelope` in `scripts/check-private-onboarding-envelope.mjs` is a pure, strict, fail-closed shape check. It emits only constant diagnostics and the immutable result `decision: BLOCKED_NOT_REVIEWED`, `canonicalAuthority: false`. It neither accesses any private repository nor queries credentials nor writes to a canonical database. Its self-test uses a **synthetic** handle only.

Private evidence storage, authenticated identity mapping, scope-limited read access, expiry, encryption, authorized reviewer and approved private→public disclosure policy **do not yet exist in this proposal**. Those are prerequisites for actual onboarding; never simulate them. Keep both `control/governance-onboarding-queue.v1.json` (historical `recordedAt` preserved) and `control/governance-registration-ledger.v1.json` unchanged. This candidate does not amend the sealed Constitution 1.3.0 registry, grant a Project Profile, mark Quality Gate PASS or allow Production.

Prior public commits or issue history may already contain private metadata. A new candidate cannot retroactively erase that exposure; resolve historical privacy/visibility with an authorized owner decision, not a silent rewrite of sealed history.

Offline, zero-dependency candidate regression: `node --test tests/governance/private-onboarding-envelope.test.mjs`. A PASS proves the local pure validator and synthetic fixtures only; it does **not** constitute independent code review, private evidence verification, or canonical acceptance.
