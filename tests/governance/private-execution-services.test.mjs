import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validatePrivateServices} from "../../scripts/check-private-execution-services.mjs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const input=read("control/private-execution-service-onboarding.v1.json");
const base=read("control/constitution-governed-repositories.json");
const publicQ=read("control/governance-onboarding-queue.v1.json");
const policy=read("control/universal-constitution-version.json");
const check=(o,b=base,q=publicQ)=>validatePrivateServices(o,b,q,policy);
test("3 private repo identities explicitly tracked without constitutional claims",()=>{assert.deepEqual(check(input),[]);assert.equal(input.entries.length,3);assert.ok(input.entries.every(x=>x.productionAuthority===false&&!x.liveCrossRepoVerified));});
test("rejects hidden credential bridge or invented cross-repo live status",()=>{const x=structuredClone(input);x.credentialBridgeStatus="CONFIGURED";x.entries[0].liveCrossRepoVerified=true;assert.ok(check(x).length>0);});
test("rejects duplicate repository, project ID and sealed baseline collision",()=>{
 for(const mode of ["repo","project","base"]){
  const x=structuredClone(input);
  if(mode==="repo")x.entries[1].repository=x.entries[0].repository;
  if(mode==="project")x.entries[1].projectId=x.entries[0].projectId;
  if(mode==="base")x.entries[0].repository=base.repositories[0].repository;
  assert.ok(check(x).length>0);
 }
});
test("rejects fake PASS/Production/Project Profile",()=>{const x=structuredClone(input);x.entries[0].complianceState="COMPLIANT";x.entries[0].productionAuthority=true;x.entries[0].canonicalProjectProfile=true;assert.ok(check(x).some(e=>e.includes("self-declared")));});
test("rejects source ref/branch/PR/CI spoofing",()=>{for(const change of [
 x=>x.entries[0].sourceRevision="main",
 x=>x.entries[0].branch="develop",
 x=>x.entries[0].adoptionPr="https://github.com/other/repo/pull/1",
 x=>x.entries[0].constitutionCi=x.entries[1].constitutionCi
 ]){const x=structuredClone(input);change(x);assert.ok(check(x).length>0);}});
test("rejects missing a private service",()=>{const x=structuredClone(input);x.entries.pop();assert.ok(check(x).length>0);});
