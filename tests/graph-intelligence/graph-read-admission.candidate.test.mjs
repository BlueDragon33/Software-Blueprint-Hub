import test from "node:test";
import assert from "node:assert/strict";
import { inspectInternalProjectGraphCandidate } from "../../apps/web/src/server/graph-read-admission.candidate.mjs";

const PROJECT = "project:blueprint-os";
const ENCODED = encodeURIComponent(PROJECT);
const REV = "b".repeat(40), HASH = "sha256:" + "a".repeat(64);
const graph = (projectId = PROJECT) => ({
  schemaVersion: "1.0.0", projectId, policyVersion: "1.3.0",
  fingerprint: HASH, sourceCodeRevision: REV,
  intelligence: "deterministic-rules-not-llm",
  canonicalMutationAllowed: false, qualityGateMutationAllowed: false,
  releaseAuthority: false, agentDispatchAllowed: false,
  nodes: [{
    id: "wp1", kind: "work-package", label: "Gated work package",
    domain: "workflows", verification: "unverified", approval: "not-conferred",
    source: {kind:"canonical-record",reference:"WorkPackage/wp1",
      revision:REV,digest:HASH,codePath:"packages/application/src/graph-intelligence.ts"},
  }],
  edges: [],
});
const ready = (projectId = PROJECT) => ({
  state: "ready", profile: {projectId}, graph: graph(projectId),
});
const call = (loader = async () => ready(), encoded = ENCODED) =>
  inspectInternalProjectGraphCandidate(encoded, loader);

test("already PROJECT_READ-authorized Hub result can be shape-inspected but never exported", async () => {
  const seen=[];
  const result=await call(async id => {seen.push(id);return ready();});
  assert.deepEqual(seen,[ENCODED]);
  assert.equal(result.ok,true);
  assert.equal(result.projectId,PROJECT);
  assert.equal(result.transportEnabled,false);
  assert.equal(result.canReadGraphExternally,false);
  assert.equal(result.canonicalMutationAllowed,false);
  assert.equal(result.gateMutationAllowed,false);
  assert.equal(result.releaseAuthority,false);
  assert.equal(result.agentDispatchAllowed,false);
  assert.ok(Object.isFrozen(result));
});

test("anonymous, forbidden, not-found and unavailable return indistinguishable denial", async () => {
  const states=["signed-out","forbidden","not-found","unavailable"];
  const responses=await Promise.all(states.map(state => call(async () => ({state,projectId:PROJECT}))));
  assert.ok(responses.every(r=>r.ok===false&&r.code==="PROJECT_GRAPH_READ_NOT_ADMITTED"));
  assert.deepEqual(responses.slice(1),responses.slice(0,1).map(()=>responses[0]).concat(responses.slice(2).map(()=>responses[0])));
  assert.ok(responses.every(r=>!Object.hasOwn(r,"projectId")&&!Object.hasOwn(r,"nodes")));
});

test("loader error does not leak internal error text, authentication or source data", async () => {
  const out=await call(async () => {throw Error("PRIVATE DB credentials and user context");});
  assert.equal(out.status,"UNVERIFIED");
  assert.equal(out.code,"PROJECT_GRAPH_READ_NOT_ADMITTED");
  assert.equal(JSON.stringify(out).includes("PRIVATE"),false);
  assert.equal(out.transportEnabled,false);
});

test("no loader, malformed input and invalid percent encoding deny before invoking loader", async () => {
  let calls=0;
  const loader=async () => {calls++;return ready();};
  for(const bad of [
    "",null,undefined,[],{},123,"project:blueprint-os",
    "project%3Ablueprint-os%0A","%zz","<svg>","project%253Ablueprint-os",
    "x".repeat(513),
  ]) {
    const result=await call(loader,bad);
    assert.equal(result.ok,false,JSON.stringify(bad));
  }
  assert.equal(calls,0);
  assert.equal((await inspectInternalProjectGraphCandidate(ENCODED,null)).ok,false);
});

test("wrong owner scope, even with ready status and valid graph, never crosses project boundary", async () => {
  const foreign="project:another";
  for(const mismatch of [
    {...ready(),profile:{projectId:foreign}},
    {...ready(),graph:graph(foreign)},
    {state:"ready",profile:{projectId:foreign},graph:graph(foreign)},
    {...ready(),profile:null},
    {...ready(),graph:null},
  ]) {
    const out=await call(async()=>mismatch);
    assert.equal(out.ok,false);
    assert.equal(out.canReadGraphExternally,false);
  }
});

test("fake external entitlement from a mocked loader is rejected by the canonical wire check", async () => {
  const forged=graph();
  forged.releaseAuthority=true;
  assert.equal((await call(async()=>({...ready(),graph:forged}))).ok,false);
  forged.releaseAuthority=false;
  forged.agentDispatchAllowed=true;
  assert.equal((await call(async()=>({...ready(),graph:forged}))).ok,false);
});

test("a missing, bad or oversized graph cannot make an external endpoint appear", async () => {
  for(const wrong of [null,[],{},false,{...graph(),fingerprint:"fake"}]) {
    const out=await call(async()=>({...ready(),graph:wrong}));
    assert.equal(out.ok,false);
    assert.equal(out.transportEnabled,false);
  }
});

test("per-request project isolation does not re-use another request's profile or graph", async () => {
  const other="project:another";
  const loader=async encoded => {
    const id=decodeURIComponent(encoded);
    return ready(id);
  };
  const [one,two]=await Promise.all([
    inspectInternalProjectGraphCandidate(ENCODED,loader),
    inspectInternalProjectGraphCandidate(encodeURIComponent(other),loader),
  ]);
  assert.equal(one.ok,true);assert.equal(two.ok,true);
  assert.notEqual(one.projectId,two.projectId);
  assert.equal(one.transportEnabled,false);assert.equal(two.transportEnabled,false);
});

test("public Hub canonical loader is named explicitly, never an app-supplied token or URL", async () => {
  const fs=await import("node:fs");
  const source=fs.readFileSync(new URL("../../apps/web/src/server/graph-read-admission.candidate.mjs",import.meta.url),"utf8");
  const existing=fs.readFileSync(new URL("../../apps/web/src/server/graph-intelligence.ts",import.meta.url),"utf8");
  assert.match(source,/loadTrustedGraph\(encodedProjectId\)/);
  assert.match(existing,/loadProjectWorkspace\(encodedProjectId\)/);
  assert.match(existing,/runtime\.workQuality\.listWorkPackages\(actor, projectId\)/);
  assert.match(existing,/runtime\.workQuality\.listQualityGates\(actor, projectId\)/);
  assert.doesNotMatch(source,/fetch\(|Response\.json\(|export async function (GET|POST)/);
});
