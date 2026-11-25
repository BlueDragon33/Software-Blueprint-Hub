import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
if(Number(process.versions.node.split(".")[0])!==24)throw Error("D1_GATE_BLOCKED: Node24 required");
const {Miniflare}=await import("miniflare");
const host=readFileSync(new URL("../../apps/web/worker/d1-worker-host.mjs",import.meta.url),"utf8");
const scope=readFileSync(new URL("../../packages/runtime/src/d1/request-runtime-scope.mjs",import.meta.url),"utf8");
// Exact host and scope modules in workerd. The downstream fetch is a test
// fixture, not the full Vinext/Next app or an authenticated Owner session.
const fixture=`import {createD1WorkerHost} from "./host.mjs";
import {createRequestRuntimeScope} from "./scope.mjs";
const scope=createRequestRuntimeScope();
const handler={async fetch(request){await Promise.resolve();const db=scope.select("d1",()=>{throw Error("fallback forbidden")});const row=await db.prepare("SELECT value FROM fixture WHERE id=?").bind(new URL(request.url).pathname.slice(1)).first();return Response.json(row)}};
export default createD1WorkerHost(handler,(db,run)=>scope.run(db,run));`;
function emulator(binding,mode="d1"){
 return new Miniflare({modules:[{type:"ESModule",path:"worker.mjs",contents:fixture},{type:"ESModule",path:"host.mjs",contents:host},{type:"ESModule",path:"scope.mjs",contents:scope}],compatibilityDate:"2026-05-15",compatibilityFlags:["nodejs_compat"],host:"127.0.0.1",port:0,bindings:{BLUEPRINT_PERSISTENCE_PROVIDER:mode},...(binding?{d1Databases:{BLUEPRINT_CANONICAL_DB:"blueprint-host-fixture"},d1Persist:false}:{})});
}
test("actual workerd host delivers native D1 binding into isolated requests",async()=>{
 const mf=emulator(true);try{const db=await mf.getD1Database("BLUEPRINT_CANONICAL_DB");await db.batch([db.prepare("CREATE TABLE fixture(id TEXT PRIMARY KEY,value TEXT)"),db.prepare("INSERT INTO fixture VALUES('a','A'),('b','B')")]);
 const replies=await Promise.all(["a","b"].map(id=>mf.dispatchFetch("http://localhost/"+id,{headers:{"x-blueprint-provider":"postgres"}})));
 assert.deepEqual(replies.map(r=>r.status),[200,200]);assert.deepEqual(await Promise.all(replies.map(r=>r.json())),[{value:"A"},{value:"B"}]);}finally{await mf.dispose()}
});
test("missing native binding and wrong provider fail closed despite request header",async()=>{
 for(const [hasBinding,mode] of [[false,"d1"],[true,"postgres"]]){const mf=emulator(hasBinding,mode);try{const response=await mf.dispatchFetch("http://localhost/a",{headers:{"x-blueprint-provider":"d1","x-blueprint-db":"forged"}});assert.equal(response.status,503);assert.equal(response.headers.get("cache-control"),"private, no-store");assert.equal(await response.text(),"Canonical persistence unavailable");}finally{await mf.dispose()}}
});
