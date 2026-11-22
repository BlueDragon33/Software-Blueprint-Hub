import test from "node:test";
import assert from "node:assert/strict";
import {
  createIntelligenceManifest, encodeIntelligenceManifest, TECH_PRODUCER,
  DEFENSE_PRODUCER, HUB_REPOSITORY
} from "../../packages/contracts/src/intelligence-exchange.mjs";
import { projectExternalIntelligenceReferences as project } from "../../packages/application/src/graph-external-intelligence.candidate.mjs";

const projectId = "project:blueprint-os";
const observedAt = Date.parse("2026-11-19T12:00:00.000Z");
const graph = () => ({
  projectId,
  nodes: [{ kind:"project", domain:"projects", id:"graph:project" }],
  canonicalMutationAllowed:false,qualityGateMutationAllowed:false,
  releaseAuthority:false,agentDispatchAllowed:false
});
const packet = (producer = TECH_PRODUCER, evidenceId = "b6b535a3-6aa3-4ea4-921c-a5692c6adc0b") =>
  createIntelligenceManifest({
    producer, evidenceId, contentRevision:2,sourceRevision:"a".repeat(40),
    timestamp:"2026-11-19T00:00:00.000Z",
    outcome:producer===TECH_PRODUCER?"RESEARCH_HYPOTHESIS_FALSIFIED":"DEFENSE_MITIGATION_VERIFIED"
  });
function trustFor(manifest, overrides={}) {
  return { projectId,id:manifest.id,producer:manifest.producer,consumer:HUB_REPOSITORY,
    readAllowed:true,currentSource:{sourceRevision:manifest.sourceRevision,
      integrityDigest:manifest.integrityDigest,expiresAt:observedAt+30000,revoked:false},
    previousReference:null,...overrides };
}
function options(manifest, overrides={}) {
  return { observedAt,readTrust:async identity=>{
    assert.equal(identity.projectId,projectId);
    assert.equal(identity.consumer,HUB_REPOSITORY);
    return trustFor(manifest);
  },...overrides };
}
const wire = m => encodeIntelligenceManifest(m);
test("bounded tech and defense references remain only admitted metadata",async()=>{
  const a=packet(),b=packet(DEFENSE_PRODUCER,"f02c445c-e6ce-474f-93ee-3c8ee2328757");
  const out=await project(graph(),[wire(b),wire(a)],{
    observedAt,readTrust:async identity=>trustFor(identity.producer===TECH_PRODUCER?a:b)
  });
  assert.equal(out.status,"READ_ONLY_ADVISORY");
  assert.equal(out.references.length,2);
  assert.deepEqual(out.references.map(r=>r.id),[a.id,b.id].sort());
  assert.equal(out.runtimeVerified,false); assert.equal(out.releaseAuthority,false);
  assert.equal(out.canonicalMutationAllowed,false);assert.equal(out.qualityGateMutationAllowed,false);
  assert.equal(out.agentDispatchAllowed,false);
  assert.ok(out.references.every(r=>r.gatePass===false && r.reviewerApproved===false && r.agentDispatch===false));
  assert.ok(Object.isFrozen(out)&&Object.isFrozen(out.references)&&Object.isFrozen(out.references[0]));
});
test("cannot interpret private references as canonical QA or owner approval",async()=>{
  const m=packet(),o=await project(graph(),[wire(m)],options(m));
  assert.equal(Object.hasOwn(o.references[0],"qualityGate"),false);
  assert.equal(Object.hasOwn(o.references[0],"approval"),false);
  assert.equal(Object.hasOwn(o.references[0],"privateData"),false);
  assert.equal(Object.hasOwn(o.references[0],"wire"),false);
  assert.equal(Object.hasOwn(o.references[0],"trust"),false);
  assert.equal(o.references[0].verified,"admitted-by-caller-trust-only");
});
test("cross-project graph or incomplete authority flags cannot be treated as valid",async()=>{
  const m=packet();
  await assert.rejects(project({...graph(),projectId:"other"},[wire(m)],options(m)),{code:"GRAPH_PROJECT_AUTHORITY_REQUIRED"});
  await assert.rejects(project({...graph(),agentDispatchAllowed:true},[wire(m)],options(m)),{code:"GRAPH_PROJECT_AUTHORITY_REQUIRED"});
  await assert.rejects(project({...graph(),qualityGateMutationAllowed:true},[wire(m)],options(m)),{code:"GRAPH_PROJECT_AUTHORITY_REQUIRED"});
});
test("separate trust callback must be bound to same canonical project",async()=>{
  const m=packet();
  await assert.rejects(project(graph(),[wire(m)],options(m,{readTrust:async()=>trustFor(m,{projectId:"project:foreign"})})),{code:"TRUST_UNAVAILABLE"});
});
test("forged producer and denied scope stay rejected",async()=>{
  const m=packet();
  await assert.rejects(project(graph(),[wire(m)],options(m,{readTrust:async()=>trustFor(m,{readAllowed:false})})),{code:"SCOPE_DENIED"});
  await assert.rejects(project(graph(),[wire(m)],options(m,{readTrust:async()=>trustFor(m,{producer:DEFENSE_PRODUCER})})),{code:"SCOPE_DENIED"});
});
test("no source pin or revoked pin can admit a reference",async()=>{
  const m=packet();
  await assert.rejects(project(graph(),[wire(m)],options(m,{readTrust:async()=>trustFor(m,{currentSource:null})})),{code:"SOURCE_PIN_REQUIRED"});
  await assert.rejects(project(graph(),[wire(m)],options(m,{readTrust:async()=>trustFor(m,{currentSource:{...trustFor(m).currentSource,revoked:true}})})),{code:"SOURCE_PIN_REQUIRED"});
});
test("batch is bounded and duplicate id is rejected before any result is returned",async()=>{
  const m=packet();
  await assert.rejects(project(graph(),Array(33).fill(wire(m)),options(m)),{code:"REFERENCE_BATCH_INVALID"});
  await assert.rejects(project(graph(),[wire(m),wire(m)],options(m)),{code:"DUPLICATE_REFERENCE_IN_BATCH"});
});
test("noncanonical wire is rejected without invoking trust service",async()=>{
  const m=packet();let calls=0;
  await assert.rejects(project(graph(),[" "+wire(m)],options(m,{readTrust:async()=>{calls++;return trustFor(m)}})),{code:"NON_CANONICAL_WIRE"});
  assert.equal(calls,0);
});
test("expired manifest or trust pin rejected",async()=>{
  const m=packet();
  await assert.rejects(project(graph(),[wire(m)],options(m,{observedAt:Date.parse("2026-12-19T00:00:00.000Z")})),{code:"MANIFEST_OUTSIDE_RETENTION"});
  await assert.rejects(project(graph(),[wire(m)],options(m,{observedAt:observedAt+30000})),{code:"SOURCE_PIN_REQUIRED"});
});
test("previous reference idempotency cannot add a second Graph advisory item",async()=>{
  const m=packet(),prior=await project(graph(),[wire(m)],options(m));
  const first=prior.references[0];
  const duplicate=await project(graph(),[wire(m)],options(m,{readTrust:async()=>trustFor(m,{previousReference:{
    id:m.id,contentRevision:m.contentRevision,integrityDigest:m.integrityDigest
  }})}));
  assert.equal(duplicate.duplicates,1);assert.deepEqual(duplicate.references,[]);
  assert.equal(first.id,m.id);
});
test("readTrust outage fails closed, not a partially accepted result",async()=>{
  const a=packet(),b=packet(DEFENSE_PRODUCER,"f02c445c-e6ce-474f-93ee-3c8ee2328757");
  await assert.rejects(project(graph(),[wire(a),wire(b)],options(a,{readTrust:async identity=>{
    if(identity.producer===DEFENSE_PRODUCER)throw Error("offline");
    return trustFor(a);
  }})),{code:"TRUST_UNAVAILABLE"});
});
test("missing independently trusted read port rejects even an empty batch",async()=>{
  await assert.rejects(project(graph(),[],{observedAt}),{code:"TRUST_CONTEXT_REQUIRED"});
});
