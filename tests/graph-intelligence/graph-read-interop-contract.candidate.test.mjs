import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const candidate=JSON.parse(fs.readFileSync(
  new URL("../../docs/contracts/graph-read-interop-v0.candidate.json",import.meta.url),"utf8"));
const active=JSON.parse(fs.readFileSync(
  new URL("../../control/application-management.contract.json",import.meta.url),"utf8"));

test("candidate Graph read is explicitly disabled, versioned and has no public URL",()=>{
  assert.equal(candidate.schema,"blueprint-os.graph-read-wire.candidate/v0");
  assert.equal(candidate.status,"DRAFT_NOT_AUTHORIZED");
  assert.equal(candidate.enabled,false);
  assert.equal(candidate.publicEndpoint,null);
  assert.equal(candidate.transport,"internal-server-shape-check-only");
});

test("no external Graph/QA/mutation/dispatch authority is granted",()=>{
  const forbidden=candidate.forbiddenAuthority;
  for(const key of ["canReadGraphExternally","mutation","qualityGatePass","productionRelease","aiAgentDispatch"])
    assert.equal(forbidden[key],false);
  assert.equal(candidate.requiredGates.independentSignedConsumerIdentity,"NOT_IMPLEMENTED");
  assert.equal(candidate.requiredGates.ownerProductionRelease,"NOT_GRANTED");
});

test("a versioned draft cannot replace the active metadata-only app contract",()=>{
  assert.equal(candidate.compatibility.replacesActiveAppContract,false);
  assert.equal(active.schema,"application-management.contract/v1");
  assert.equal(active.policy.metadataOnly,true);
  assert.deepEqual(active.endpoints,{});
  assert.equal(active.policy.applicationManagementMayMutateCanonicalBlueprintState,false);
  assert.equal(active.policy.applicationManagementMayPassQualityGates,false);
  assert.equal(active.policy.applicationManagementMayAuthorizeProductionRelease,false);
});

test("schema scope is bounded; no cross-project or executable endpoint is implied",()=>{
  assert.equal(candidate.maxNodes,256);
  assert.equal(candidate.maxEdges,1024);
  assert.equal(candidate.ownerRepository,"BlueDragon33/Software-Blueprint-Hub");
  assert.equal(candidate.consumerRepository,"BlueDragon33/Application-Management");
  assert.deepEqual(candidate.operations,["READ_PROJECTION_CANDIDATE"]);
  assert.equal(candidate.requiredGates.projectScopedHubRead,"REQUIRED_AT_CALL_SITE");
  assert.equal(candidate.requiredGates.privateCrossProjectRedaction,"NOT_ACCEPTED");
  assert.equal(candidate.compatibility.noImplicitV0ToV1Migration,true);
});

test("Hub internal loader wiring is SOURCE_PRESENT only, never an auth or transport PASS", () => {
  const c=candidate.internalComposition;
  assert.equal(c.status,"SOURCE_PRESENT_RUNTIME_NOT_VERIFIED");
  assert.equal(c.fullRuntimeAcceptance,"NOT_RUN");
  assert.equal(c.externalConsumerIdentity,"NOT_VERIFIED");
  assert.equal(c.externalTransportEnabled,false);
  assert.equal(c.executionPrerequisite,"AUTHENTICATED_PROJECT_READ_IN_EXISTING_HUB_LOADER");
  assert.equal(c.hubLoader,"apps/web/src/server/graph-intelligence.ts");
  assert.equal(c.guardedServerBinding,"apps/web/src/server/graph-read-handoff.candidate.ts");
  assert.equal(candidate.enabled,false);
  assert.equal(candidate.publicEndpoint,null);
});

test("C29 ES256 proof source is NOT an approved App identity or Graph release",()=>{
  const proof=candidate.consumerProofCandidate;
  assert.equal(proof.status,"SOURCE_PRESENT_NOT_PROVISIONED");
  assert.equal(proof.module,"apps/web/src/server/graph-consumer-proof.candidate.mjs");
  assert.equal(proof.algorithm,"ES256/P-256");
  assert.equal(proof.exactIssuer,"BlueDragon33/Application-Management");
  assert.equal(proof.exactAudience,"BlueDragon33/Software-Blueprint-Hub");
  assert.equal(proof.exactScope,"graph:read:project");
  assert.equal(proof.maxLifetimeSeconds,60);
  assert.equal(proof.approvedTrustedKeys,"NONE_PROVISIONED");
  assert.equal(proof.serverSideTrustRegistry,"NOT_IMPLEMENTED");
  assert.equal(proof.durableAtomicReplayStore,"NOT_IMPLEMENTED");
  assert.equal(proof.externalAppIdentityAccepted,false);
  assert.equal(proof.actualSignedProofFromApp,"NOT_TESTED");
  assert.equal(proof.fullNode24RuntimeAcceptance,"NOT_RUN");
  assert.equal(proof.enabled,false);
  assert.equal(proof.externalTransportEnabled,false);
  assert.equal(candidate.enabled,false);
  assert.equal(candidate.publicEndpoint,null);
  assert.deepEqual(active.endpoints,{});
});

test("C30 trust pinning and nonce have no real provisioning or Graph grant", () => {
  const candidateSecurity = candidate.c30TrustPinAndReplay;
  assert.equal(candidateSecurity.status, "SOURCE_ONLY_NOT_PROVISIONED");
  assert.equal(candidateSecurity.publicKeyPinningModule,
    "apps/web/src/server/graph-consumer-trust.candidate.mjs");
  assert.equal(candidateSecurity.pinAlgorithm, "SPKI-SHA256");
  assert.equal(candidateSecurity.pinTrustRoot, "NO_APPROVED_KEYS");
  assert.equal(candidateSecurity.pinRotationPolicy, "HUMAN_REVIEW_REQUIRED");
  assert.equal(candidateSecurity.nonceInsertModule,
    "apps/web/src/server/graph-consumer-nonce.candidate.mjs");
  assert.equal(candidateSecurity.nonceSqlSchema,
    "docs/contracts/graph-consumer-nonce-schema.candidate.sql");
  assert.equal(candidateSecurity.dbSchemaApplied, false);
  assert.equal(candidateSecurity.postgresConcurrencyAcceptance, "NOT_RUN");
  assert.equal(candidateSecurity.durableAtomicNonceStore, "NOT_PROVISIONED");
  assert.equal(candidateSecurity.sourceOnlyCryptoTests, "SCOPED_NODE22");
  assert.equal(candidateSecurity.identityAccepted, false);
  assert.equal(candidateSecurity.enabled, false);
  assert.equal(candidateSecurity.activeGraphTransport, false);
  assert.equal(candidateSecurity.gateApproval, "PENDING");
  assert.equal(candidate.enabled, false);
  assert.equal(candidate.publicEndpoint, null);
  assert.deepEqual(active.endpoints, {});
});

test("C31 internal composition is no external identity or release grant", () => {
  const c = candidate.c31Composition;
  assert.equal(c.status, "INTERNAL_COMPOSITION_SOURCE_ONLY");
  assert.equal(c.module, "apps/web/src/server/graph-read-composition.candidate.mjs");
  assert.equal(c.authorization, "EXISTING_HUB_PROJECT_READ_LOADER_REQUIRED");
  assert.equal(c.audience, "INJECTED_PROJECT_AUDIENCE_NOT_APPROVED");
  assert.equal(c.returnsRawNodes, false);
  assert.equal(c.returnsOnlyProjectCountsAndFingerprint, true);
  assert.equal(c.canReadGraphExternally, false);
  assert.equal(c.publicRoute, null);
  assert.equal(c.identityAccepted, false);
  assert.equal(c.actualPgConcurrencyQa, "NOT_RUN");
  assert.equal(c.authenticatedCandidateBrowserQa, "NOT_RUN");
  assert.equal(c.reviewers, "PENDING");
  assert.equal(c.enabled, false);
  assert.equal(candidate.enabled, false);
  assert.equal(candidate.publicEndpoint, null);
  assert.deepEqual(active.endpoints, {});
});
