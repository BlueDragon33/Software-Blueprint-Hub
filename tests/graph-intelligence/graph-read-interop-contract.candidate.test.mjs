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
