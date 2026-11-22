import test from "node:test";
import assert from "node:assert/strict";
import { prepareGraphReadWireCandidate } from "../../packages/application/src/graph-read-wire.candidate.mjs";

const HASH = "sha256:" + "a".repeat(64);
const REV = "b".repeat(40);
const node = (id, extra = {}) => ({
  id, label: "Registered WorkPackage " + id, kind: "work-package",
  domain: "workflows", verification: "recorded-pass", approval: "not-conferred",
  source: {
    kind: "canonical-record", reference: "WorkPackage/" + id,
    revision: REV, digest: HASH, codePath: "packages/application/src/graph-intelligence.ts",
  },
  ...extra,
});
const graph = () => ({
  schemaVersion: "1.0.0", projectId: "project:blueprint-os",
  policyVersion: "1.3.0", fingerprint: HASH, sourceCodeRevision: REV,
  intelligence: "deterministic-rules-not-llm",
  canonicalMutationAllowed: false, qualityGateMutationAllowed: false,
  releaseAuthority: false, agentDispatchAllowed: false,
  nodes: [node("wp1"),node("wp2",{verification:"unverified"})],
  edges: [{id:"edge1",from:"wp1",to:"wp2",kind:"depends-on",
    relation:"dependency",provenance:"canonical"}],
});
const read = (g = graph(), scope = "project:blueprint-os") =>
  prepareGraphReadWireCandidate(g, scope);

test("internal shape-valid projection never activates external Graph transport or approvals", () => {
  const result=read();
  assert.equal(result.ok,true);
  assert.equal(result.status,"INTERNAL_SHAPE_VALIDATED");
  assert.equal(result.transportEnabled,false);
  assert.equal(result.canReadGraphExternally,false);
  assert.equal(result.canonicalMutationAllowed,false);
  assert.equal(result.gateMutationAllowed,false);
  assert.equal(result.releaseAuthority,false);
  assert.equal(result.agentDispatchAllowed,false);
  assert.equal(result.nodes.length,2);
  assert.equal(result.edges.length,1);
  assert.equal(result.nodes[0].verification,"recorded-pass");
  assert.equal(result.nodes[1].verification,"unverified");
});

test("never returns raw private details, owner, execution, contract or findings", () => {
  const g=graph();
  g.nodes[0]={...g.nodes[0],details:["private"],owner:"secret",execution:"RUNNING",contract:"sensitive"};
  g.findings=[{id:"private",reason:"internal"}];
  const result=read(g);
  assert.equal(result.ok,true);
  for (const key of ["details","owner","execution","contract"])
    assert.equal(Object.hasOwn(result.nodes[0],key),false);
  assert.equal(Object.hasOwn(result,"findings"),false);
});

test("requires exact project isolation and denies cross-project source", () => {
  const other=read(graph(),"project:another");
  assert.equal(other.ok,false);
  assert.equal(other.status,"UNVERIFIED");
  assert.equal(other.nodes,undefined);
  assert.equal(read({...graph(),projectId:"project:another"}).ok,false);
});

test("malformed schema, missing proof fingerprint or wrong AI mode are denied", () => {
  for (const patch of [
    {schemaVersion:"2.0.0"}, {fingerprint:"wrong"}, {fingerprint:null},
    {policyVersion:"ACTIVE"}, {sourceCodeRevision:"main"},
    {intelligence:"LLM-invented"}, {sourceCodeRevision:"0".repeat(39)},
  ]) {
    const out=read({...graph(),...patch});
    assert.equal(out.ok,false,JSON.stringify(patch));
    assert.equal(out.nodes,undefined);
  }
});

test("canonical mutation, QualityGate, release and AI dispatch flags can never elevate", () => {
  for (const key of [
    "canonicalMutationAllowed","qualityGateMutationAllowed","releaseAuthority","agentDispatchAllowed",
  ]) {
    assert.equal(read({...graph(),[key]:true}).ok,false,key);
  }
});

test("source attribution, digest, revision, verification and approval are constrained", () => {
  const mutations=[
    {source:{...node("wp1").source,digest:"unknown"}},
    {source:{...node("wp1").source,revision:"branch-main"}},
    {source:{...node("wp1").source,kind:"unsigned"}},
    {source:{...node("wp1").source,reference:"<script>"}},
    {verification:"PASS"}, {approval:"self-approved"}, {kind:"any"},
    {label:"<svg onload=alert(1)>"},
  ];
  for (const patch of mutations) {
    const g=graph();g.nodes[0]={...g.nodes[0],...patch};
    assert.equal(read(g).ok,false,JSON.stringify(patch));
  }
});

test("dangling edges, false relations, duplicate identities and spoofed provenance fail closed", () => {
  const changes=[
    {edges:[{...graph().edges[0],to:"private-node"}]},
    {edges:[{...graph().edges[0],relation:"self-approved"}]},
    {edges:[{...graph().edges[0],provenance:"unsigned"}]},
    {edges:[graph().edges[0],graph().edges[0]]},
    {nodes:[node("wp1"),node("wp1")]},
  ];
  for (const patch of changes) assert.equal(read({...graph(),...patch}).ok,false);
});

test("max 256 nodes, 1024 edges; reject over-limit inputs rather than silently trimming", () => {
  const nodes=Array.from({length:257},(_,i)=>node("n"+i));
  assert.equal(read({...graph(),nodes,edges:[]}).ok,false);
  const manyEdges=Array.from({length:1025},(_,i)=>({
    id:"edge-"+i,from:"wp1",to:"wp2",kind:"depends-on",
    relation:"dependency",provenance:"canonical",
  }));
  assert.equal(read({...graph(),edges:manyEdges}).ok,false);
});

test("output is deep frozen, so consumers cannot accidentally forge a PASS", () => {
  const result=read();
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.nodes));
  assert.ok(Object.isFrozen(result.nodes[0]));
  assert.ok(Object.isFrozen(result.nodes[0].source));
  assert.ok(Object.isFrozen(result.edges[0]));
  assert.throws(()=>{result.nodes[0].verification="recorded-fail";},TypeError);
  assert.throws(()=>{result.transportEnabled=true;},TypeError);
});

test("missing graph and unsafe scope ID cannot be interpreted as authorization", () => {
  for (const g of [null,undefined,[],{},true])
    assert.equal(prepareGraphReadWireCandidate(g, "project:blueprint-os").ok,false);
  for (const scope of ["",null,"<script>","project:blueprint-os\n"])
    assert.equal(read(graph(),scope).ok,false);
});
