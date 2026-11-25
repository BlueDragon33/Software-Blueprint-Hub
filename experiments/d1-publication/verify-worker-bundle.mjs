import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync,statSync} from "node:fs";
import {resolve,dirname,join} from "node:path";
import {createHash} from "node:crypto";
const root=process.cwd(),path=resolve(root,"apps/web/dist/server/wrangler.json");
const cfg=JSON.parse(readFileSync(path,"utf8"));
assert.equal(cfg.name,"software-blueprint-hub");
assert.equal(cfg.preview_urls,false);
assert.equal(cfg.workers_dev,false);
assert.equal(cfg.vars.BLUEPRINT_PERSISTENCE_PROVIDER,"d1");
assert.deepEqual(cfg.d1_databases.map(x=>[x.binding,x.database_id,Boolean(x.remote)]),[["BLUEPRINT_CANONICAL_DB","00000000-0000-0000-0000-000000000003",false]]);
assert.ok(!cfg.account_id,"local artifact must not carry a real account");
const entry=resolve(dirname(path),cfg.main);
assert.ok(existsSync(entry),"generated entry does not exist");
const files=[];function walk(p){for(const n of readdirSync(p)){const f=join(p,n);if(statSync(f).isDirectory())walk(f);else if(/\.(m?js|cjs)$/.test(n))files.push(f);}}walk(dirname(path));
const sha=process.env.EXPECTED_CANDIDATE_REVISION;
assert.match(sha,/^[a-f0-9]{40}$/);
const contents=files.map(f=>readFileSync(f,"utf8"));
const proof={main:cfg.main,modules:files.length,shaModules:contents.filter(s=>s.includes(sha)).length,nativeModules:contents.filter(s=>s.includes("Canonical Cloudflare D1 binding unavailable")).length,hostModules:contents.filter(s=>s.includes("Canonical persistence unavailable")).length};
// plugin-rsc 0.5.26 emits literal cross-environment .js imports.
assert.equal(cfg.main,"index.js","RSC entry extension mismatch");
assert.ok(existsSync(resolve(dirname(path),"ssr/index.js")),"SSR entry extension mismatch");
let edges=0;
for(let i=0;i<files.length;i++){
  for(const m of contents[i].matchAll(/import\(\s*["'](\.{1,2}\/[^"']*index\.js)["']\s*\)/g)){
    assert.ok(existsSync(resolve(dirname(files[i]),m[1])), "Missing cross-environment entry "+m[1]);
    edges++;
  }
}
assert.ok(edges>0,"No cross-environment import verified");
console.log("WORKER_BUNDLE_PROOF",JSON.stringify({...proof,verifiedEntryEdges:edges}));
assert.ok(proof.nativeModules>0,"native D1 module missing from bundle");
assert.ok(proof.hostModules>0,"host entry missing from bundle");
assert.ok(proof.shaModules>0,"compiled exact revision missing");
console.log("LOCAL_WORKER_BUILD_VERIFIED",sha,"entrySHA256",createHash("sha256").update(readFileSync(entry)).digest("hex"),"modules",files.length);
// This is artifact verification only. Actual full app workerd smoke remains a gate.
