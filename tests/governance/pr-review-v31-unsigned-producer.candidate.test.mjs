import test from 'node:test';
import assert from 'node:assert/strict';
import {buildUnsignedHubPrV31Scope,REVIEW_V31_UNSIGNED_LIMITS} from '../../packages/application/src/pr-review-v31-unsigned-producer.candidate.mjs';
const A='a'.repeat(40),B='b'.repeat(40);
const make=(n=114)=>({
  repository:'BlueDragon33/Software-Blueprint-Hub',pullRequestNumber:173,
  baseSha:A,headSha:B,changedFiles:n,
  files:Array.from({length:n},(_,i)=>({
    path:i===100?'docs/evidence/atlas/long-patch.md':'src/file-'+String(i).padStart(3,'0')+'.mjs',
    patch:i===100?'@@ -1 +1 @@\n-old\n+'+'x'.repeat(55500)+'\n':
      '@@ -1 +1 @@\n-old\n+new'+i+'\n'+'x'.repeat(5000)
  }))
});
test('complete 114-file scope maps each source once within bounds; advisory ONLY',()=>{
 const p=buildUnsignedHubPrV31Scope(make());
 assert.equal(p.files.length,114);
 assert.equal(new Set(p.shards.flatMap(s=>s.paths)).size,114);
 assert.equal(p.shards.flatMap(s=>s.paths).length,114);
 assert.ok(p.shards.every(s=>s.paths.length<=10 && s.patchBytes<=64000));
 assert.equal(p.kind,'unsigned-pr-v31-source-proposal');
 assert.equal(p.provenanceVerified,false);assert.equal(p.canSignOrApprove,false);
 assert.equal(p.qualityGatePassed,false);assert.equal(p.humanApproved,false);
 assert.equal(p.productionAuthorized,false);
 assert.equal(p.schemaVersion,'3.1.0');
});
test('manifest deterministic across input permutation and differs when a byte changes',()=>{
 const s=make(),p=buildUnsignedHubPrV31Scope(s);
 const reversed=buildUnsignedHubPrV31Scope({...s,files:[...s.files].reverse()});
 assert.deepEqual(p.files,reversed.files);assert.deepEqual(p.shards,reversed.shards);
 assert.equal(p.sourceFingerprint,reversed.sourceFingerprint);
 const changed={...s,files:s.files.map((f,i)=>i===0?{...f,patch:f.patch+'!'}:f)};
 const alt=buildUnsignedHubPrV31Scope(changed);
 assert.notEqual(alt.sourceFingerprint,p.sourceFingerprint);
 assert.notEqual(alt.files.find(f=>f.path==='src/file-000.mjs').patchSha256,
   p.files.find(f=>f.path==='src/file-000.mjs').patchSha256);
});
test('reject omission, count drift, duplicate path, untrusted path',()=>{
 const s=make();
 for(const changed of [
  {...s,files:s.files.slice(1)},
  {...s,changedFiles:113},
  {...s,files:[...s.files.slice(0,-1),s.files[0]]},
  {...s,files:s.files.map((x,i)=>i===0?{...x,path:'../secrets'}:x)}
 ])assert.throws(()=>buildUnsignedHubPrV31Scope(changed));
});
test('fail closed for 129 files, oversized patch, total over 1MB',()=>{
 assert.throws(()=>buildUnsignedHubPrV31Scope(make(129)),/oversized/);
 const s=make();
 assert.throws(()=>buildUnsignedHubPrV31Scope({...s,files:s.files.map((x,i)=>i===0?{...x,patch:'x'.repeat(64001)}:x)}),/patch/);
 assert.throws(()=>buildUnsignedHubPrV31Scope({...s,files:s.files.map(x=>({...x,patch:'x'.repeat(10000)}))}),/aggregate/);
});
test('rejected identity is not accepted as source provenance or authority',()=>{
 const s=make();
 for(const changed of [
  {...s,headSha:A},
  {...s,repository:'OtherOrg/Software-Blueprint-Hub'},
  {...s,headSha:'c'.repeat(39)},
  {...s,pullRequestNumber:-1}
 ])assert.throws(()=>buildUnsignedHubPrV31Scope(changed),/identity/);
 assert.deepEqual(Object.keys(REVIEW_V31_UNSIGNED_LIMITS).includes('signingKey'),false);
});
