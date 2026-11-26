import {test} from "node:test";
import assert from "node:assert/strict";
import {prepareRemoteCandidate} from "./prepare-remote-candidate.mjs";

// Synthetic inputs only: none asserts actual provider or authority evidence.
const local=()=>({name:"software-blueprint-hub",workers_dev:false,preview_urls:false,main:"index.js",compatibility_flags:["nodejs_compat"],vars:{BLUEPRINT_PERSISTENCE_PROVIDER:"d1"},d1_databases:[{binding:"BLUEPRINT_CANONICAL_DB",database_id:"00000000-0000-0000-0000-000000000003"}]});
const evidence=()=>({revision:"0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0",accountId:"f88a42260814230aa4a151abbfe5659d",worker:"software-blueprint-hub",host:"software-blueprint-hub.boiech-ai.workers.dev",databaseId:"4f2a47a5-e250-45ae-8ed1-19afcb04415d",schemaReadback:true,exclusiveDatabase:true,accessProtected:true,previewUrls:false,workersDev:true,customRoutes:[],freePlan:true,existingBindings:[],deploymentId:"synthetic-not-a-deployment",evidenceRef:"https://github.com/BlueDragon33/Software-Blueprint-Hub/issues/159#issuecomment-000"});
const denied=/CONTINUITY_AUTHORITY_NOT_ADMITTED/;

test("complete C2-shaped input cannot prepare a remote configuration",()=>{
  const l=local(),e=evidence(),before=JSON.stringify([l,e]);
  assert.throws(()=>prepareRemoteCandidate(l,e),denied);
  assert.equal(JSON.stringify([l,e]),before);
});
test("caller-supplied continuity and authority claims do not grant admission",()=>{
  const e={...evidence(),continuityAdmitted:true,historicalPreservation:true,recoveryAuthorized:true,decision:{approved:true,actor:"Owner"},productionReleaseAuthority:true};
  assert.throws(()=>prepareRemoteCandidate(local(),e),denied);
});
test("existing exclusivity validation remains fail closed",()=>{
  assert.throws(()=>prepareRemoteCandidate(local(),{...evidence(),exclusiveDatabase:false}),/Remote preflight evidence incomplete/);
});
test("existing target and QA config checks remain fail closed",()=>{
  assert.throws(()=>prepareRemoteCandidate(local(),{...evidence(),databaseId:"wrong"}),/Remote target evidence mismatch/);
  const l=local();l.vars.BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT="synthetic";
  assert.throws(()=>prepareRemoteCandidate(l,evidence()),/Unexpected local variables/);
});
