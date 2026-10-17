import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname,resolve } from "node:path";
import {
  classifyLocalE2eConfig,safeLocalhostUrl,safeDisposablePostgres,
  classifyPnpmAvailability
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


test("Windows Corepack fallback accepts exact cached pnpm 12.4.0 without admin shims",()=>{
  assert.deepEqual(classifyPnpmAvailability(null,"12.4.0"),{
    ready:true,method:"corepack"
  });
  assert.deepEqual(classifyPnpmAvailability("11.19.0","12.4.0"),{
    ready:true,method:"corepack"
  });
  assert.deepEqual(classifyPnpmAvailability("12.4.0",null),{
    ready:true,method:"direct"
  });
  for(const versions of [[null,null],["12.3.0",null],
    ["12.5.0","12.3.0"],[null,"v12.4.0"]]){
    assert.deepEqual(classifyPnpmAvailability(...versions),{
      ready:false,method:null
    });
  }
});
test("Corepack read-only probe neither downloads nor pins nor needs Program Files",()=>{
  const f=readFileSync(new URL("../../scripts/continuous-localhost-precheck.mjs",import.meta.url),"utf8");
  assert.match(f,/COREPACK_ENABLE_NETWORK:"0"/);
  assert.match(f,/COREPACK_ENABLE_AUTO_PIN:"0"/);
  assert.match(f,/corepack pnpm --version/);
  assert.match(f,/classifyPnpmAvailability/);
  assert.doesNotMatch(f,/corepack enable|pnpm add -g|corepack prepare/);
});
