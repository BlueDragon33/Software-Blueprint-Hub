import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname,resolve } from "node:path";
import {
  classifyLocalE2eConfig,safeLocalhostUrl,safeDisposablePostgres
} from "../../scripts/continuous-localhost-precheck-core.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
test("only exact loopback URLs, reject Preview/Production and credential-in-URL",()=>{
  for(const u of ["http://127.0.0.1:3000/","https://localhost:3443/"])
    assert.equal(safeLocalhostUrl(u),true);
  for(const u of ["http://localhost.evil.org/","https://blueprint.example/",
    "http://user:password@localhost:3000/","http://localhost:3000/login",
    "http://127.0.0.1:3000?x=1","file:///localhost"])
    assert.equal(safeLocalhostUrl(u),false,u);
});
test("database scope cannot be remote, production or other projects",()=>{
  assert.equal(safeDisposablePostgres(
    "postgresql://test:secret@127.0.0.1:5432/blueprint_qa_test"),true);
  for(const u of ["postgresql://127.0.0.1:5432/blueprint_production",
    "postgresql://db.example/blueprint_qa_test",
    "https://127.0.0.1:5432/blueprint_qa_test"]){
    assert.equal(safeDisposablePostgres(u),false);
  }
});
test("never mark real-auth prerequisites ready with absent SSO credentials",()=>{
  const result=classifyLocalE2eConfig({},root);
  assert.equal(result.filter(x=>x.status==="READY").length,0);
  assert.ok(result.some(x=>x.id==="owner-session" && x.status==="BLOCKED"));
  assert.ok(result.some(x=>x.id==="editor-session" && x.status==="BLOCKED"));
  assert.ok(result.some(x=>x.id==="viewer-session" && x.status==="BLOCKED"));
  assert.ok(result.some(x=>x.id==="explicit-auth-e2e-opt-in" && x.status==="BLOCKED"));
});
test("source checker never mints cookies, performs POST or changes local DB",()=>{
  const f=readFileSync(new URL("../../scripts/continuous-localhost-precheck.mjs",import.meta.url),"utf8");
  assert.match(f,/method:"GET"/);
  assert.doesNotMatch(f,/createPrismaClient|cookieJar|writeFile|sealSsoCookie|signJwt|fetch\([^\n]+method:"POST"/);
});
