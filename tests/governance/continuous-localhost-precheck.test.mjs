import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname,resolve } from "node:path";
import {
  classifyLocalE2eConfig,safeLocalhostUrl,safeDisposablePostgres,
  classifyPnpmAvailability,localDisposablePostgresProbe,postgresSslReplyAccepted,probeLocalPostgresProtocol,
  matchesBlueprintLandingPage
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
test("web readiness demands Blueprint OS HTML metadata, not unrelated 200",()=>{
  const valid='<html><head><title>Blueprint OS</title><meta name="application-name" content="Blueprint OS"/></head><body><main>Trung tâm ứng dụng</main></body></html>';
  assert.equal(matchesBlueprintLandingPage("text/html; charset=utf-8",valid),true);
  assert.equal(matchesBlueprintLandingPage("text/html",valid.replace('name="application-name" content="Blueprint OS"','content="Blueprint OS" name="application-name"')),true);
  for(const html of [
    '<html><head><title>Unrelated app</title><meta name="application-name" content="Other"/></head></html>',
    '<html><head><title>Blueprint OS</title></head></html>',
    '<html><head><meta name="application-name" content="Blueprint OS"/></head></html>',
    '<html><head><title>Blueprint OS Fake</title><meta name="application-name" content="Blueprint OS"/></head></html>',
    ""
  ]) assert.equal(matchesBlueprintLandingPage("text/html",html),false);
  assert.equal(matchesBlueprintLandingPage("application/json",valid),false);
  assert.equal(matchesBlueprintLandingPage("text/html"," ".repeat(512001)),false);
});
test("CLI cannot mark unknown localhost HTTP server as authenticated Blueprint",()=>{
  const source=readFileSync(new URL("../../scripts/continuous-localhost-precheck.mjs",import.meta.url),"utf8");
  assert.ok(source.includes('if(response.status!==200)return false'));
  assert.ok(source.includes('matchesBlueprintLandingPage(response.headers.get("content-type")??"",body)'));
  assert.equal(source.includes("response.status>=200 && response.status<500"),false);
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
test("custom localhost PostgreSQL port 55432 does not become a false Windows blocker",()=>{
  const configured="postgresql://qa:secret@127.0.0.1:55432/blueprint_qa_test";
  assert.deepEqual(localDisposablePostgresProbe(configured),{
    host:"127.0.0.1",port:55432
  });
  assert.deepEqual(localDisposablePostgresProbe(
    "postgresql://qa:secret@localhost/blueprint_qa_test"),{
      host:"127.0.0.1",port:5432
  });
  for(const url of [
    "postgresql://qa:secret@remote.example:55432/blueprint_qa_test",
    "postgresql://qa:secret@127.0.0.1:55432/blueprint_production",
    "postgresql://qa:secret@127.0.0.1:99999/blueprint_qa_test"
  ])assert.equal(localDisposablePostgresProbe(url),null);
});
test("Windows runner CLI uses validated disposable database port, never printed credentials",()=>{
  const source=readFileSync(
    new URL("../../scripts/continuous-localhost-precheck.mjs",import.meta.url),"utf8");
  assert.match(source,/localDisposablePostgresProbe\(process\.env\.DATABASE_URL\)/);
  assert.match(source,/await tcp\(dbProbe\.host,dbProbe\.port\)/);
  assert.doesNotMatch(source,/console\.log\([^\n]*process\.env\.DATABASE_URL/);
});
test("PostgreSQL SSLRequest response recognizes ONLY one-byte S/N",()=>{
  assert.equal(postgresSslReplyAccepted(Buffer.from("S")),true);
  assert.equal(postgresSslReplyAccepted(Buffer.from("N")),true);
  for(const payload of ["E","S\\n","HTTP/1.1 200 OK","","0"])
    assert.equal(postgresSslReplyAccepted(Buffer.from(payload)),false,payload);
  assert.equal(postgresSslReplyAccepted("S"),false);
});
test("read-only wire probe refuses remote or malformed endpoint before connecting",async()=>{
  for(const endpoint of [
    {host:"db.example",port:5432},
    {host:"192.168.1.20",port:5432},
    {host:"127.0.0.1",port:0},
    {host:"127.0.0.1",port:99999},
    null
  ])assert.equal(await probeLocalPostgresProtocol(endpoint),false);
});
test("CLI no longer treats missing docker/psql PATH as proof localhost lacks PostgreSQL",()=>{
  const source=readFileSync(
    new URL("../../scripts/continuous-localhost-precheck.mjs",import.meta.url),"utf8");
  assert.ok(source.includes("await probeLocalPostgresProtocol(dbProbe)"));
  assert.ok(source.includes("localDbTools||postgresWireProtocol"));
  assert.ok(source.includes("PostgreSQL protocol localhost"));
  assert.equal(source.includes("console.log(process.env.DATABASE_URL"),false);
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
