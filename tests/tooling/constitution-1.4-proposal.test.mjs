import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {
 buildConstitution14Candidate,buildConstitution14Patch,
 testConstitution14Patch,CONSTITUTION_14_PATHS
} from "../../scripts/prepare-constitution-1.4-candidate.mjs";

const hash=x=>"sha256:"+createHash("sha256").update(x).digest("hex");
const candidate=buildConstitution14Candidate();
const patch=buildConstitution14Patch(candidate);
test("1.4.0 generator covers exactly eight canonical constitutional sources, never writes them",()=>{
 assert.equal(candidate.status,"CANDIDATE_NOT_RATIFIED");
 assert.equal(candidate.policyVersion,"1.4.0");
 assert.equal(candidate.current.size,8);
 assert.equal(candidate.proposed.size,8);
 assert.equal(CONSTITUTION_14_PATHS.length,8);
 assert.deepEqual([...candidate.proposed.keys()],CONSTITUTION_14_PATHS);
 for(const path of CONSTITUTION_14_PATHS){
  assert.equal(readFileSync(path,"utf8"),candidate.current.get(path));
  assert.notEqual(candidate.current.get(path),candidate.proposed.get(path));
 }
 assert.equal(JSON.parse(candidate.current.get(CONSTITUTION_14_PATHS[4])).policyVersion,"1.3.0");
 assert.equal(JSON.parse(candidate.proposed.get(CONSTITUTION_14_PATHS[4])).policyVersion,"1.4.0");
 assert.equal(JSON.parse(candidate.proposed.get(CONSTITUTION_14_PATHS[4])).productionReleaseAuthority,false);
});
test("all 34 rules are bound to the same existing constitutional pillars",()=>{
 const before=JSON.parse(candidate.current.get(CONSTITUTION_14_PATHS[1]));
 const after=JSON.parse(candidate.proposed.get(CONSTITUTION_14_PATHS[1]));
 assert.equal(before.executionRules.length,32);
 assert.equal(after.executionRules.length,34);
 assert.deepEqual(after.executionRules.slice(0,32),before.executionRules);
 assert.deepEqual(after.executionRules.slice(32).map(x=>x.id),["R33","R34"]);
 assert.deepEqual(after.pillars,before.pillars);
 assert.deepEqual(after.forbidden,before.forbidden);
 const doc=candidate.proposed.get(CONSTITUTION_14_PATHS[0]);
 assert.match(doc,/### 10\.R33/);assert.match(doc,/### 10\.R34/);
 assert.match(doc,/task-specific Action/i);
 assert.match(doc,/signed grant/i);
});
test("all three historical adoption/projection snapshots remain byte-preserved except one top-level policy version",()=>{
 for(const path of CONSTITUTION_14_PATHS.slice(5)){
  const key=path.includes("ecosystem")?"activePolicyVersion":"policyVersion";
  const before=candidate.current.get(path),after=candidate.proposed.get(path);
  assert.equal(after,before.replace('"'+key+'": "1.3.0"',
   '"'+key+'": "1.4.0"'));
  assert.equal(JSON.parse(after)[key],"1.4.0");
  if(path.includes("ecosystem"))assert.deepEqual(JSON.parse(after).repositories,
   JSON.parse(before).repositories);
  if(path.includes("compliance"))assert.deepEqual(JSON.parse(after).observations,
   JSON.parse(before).observations);
 }
});
test("Git-format patch hashes every source blob, strict native apply and reverse reconstruct exact originals",()=>{
 assert.equal((patch.match(/^diff --git /gm)||[]).length,8);
 assert.equal((patch.match(/^index [a-f0-9]{40}\.\.[a-f0-9]{40} 100644$/gm)||[]).length,8);
 const proof=testConstitution14Patch(candidate,patch);
 assert.equal(proof.status,"ISOLATED_EIGHT_SOURCE_REPLAY_ROLLBACK_PASS");
 assert.equal(proof.activePolicyUnchanged,true);
 assert.equal(proof.ratified,false);
 assert.equal(proof.published,false);
 assert.equal(proof.productionAuthorized,false);
 assert.deepEqual(candidate.sourceDigests.map(x=>x.before),
  CONSTITUTION_14_PATHS.map(path=>hash(candidate.current.get(path))));
});
test("truncated patch or changed original bytes fail closed without touching real files",()=>{
 const partial=patch.slice(patch.indexOf("\ndiff --git ",10)+1);
 assert.throws(()=>testConstitution14Patch(candidate,partial),/BLOCKED/);
 const altered={...candidate,
  current:new Map(candidate.current)};
 altered.current.set(CONSTITUTION_14_PATHS[0],
  altered.current.get(CONSTITUTION_14_PATHS[0]).replace("1.3.0","0.0.0"));
 assert.throws(()=>testConstitution14Patch(altered,patch),/BLOCKED/);
 assert.equal(readFileSync(CONSTITUTION_14_PATHS[0],"utf8"),
  candidate.current.get(CONSTITUTION_14_PATHS[0]));
});
