import {strict as assert} from "node:assert";
import {test} from "node:test";
import {
  localDbTarget, latestUnambiguous, preliminaryBlockers, run
} from "../../scripts/check-local-e2e-authority.mjs";

test("only the explicitly acknowledged disposable loopback PostgreSQL target is inspectable",()=>{
  assert.equal(localDbTarget("postgresql://blueprint:test@127.0.0.1:55432/blueprint_qa",true),null);
  for(const bad of [
    "postgresql://blueprint:test@localhost:55432/blueprint_qa",
    "postgresql://blueprint:test@127.0.0.1:5432/blueprint_qa",
    "postgresql://blueprint:test@203.0.113.1:55432/blueprint_qa",
    "postgresql://blueprint:test@127.0.0.1:55432/postgres?sslmode=disable",
    "not-a-database-url"
  ]) {
    assert.notEqual(localDbTarget(bad,true),null);
  }
  assert.equal(localDbTarget("postgresql://blueprint:test@127.0.0.1:55432/blueprint_qa",false),
    "DISPOSABLE_DB_NOT_ACKNOWLEDGED");
});

test("refuses to resolve tied latest adoption/issuer decisions with random UUID ordering",()=>{
  const time="2026-10-17T00:00:00.000Z";
  assert.equal(latestUnambiguous([
    {decision:"allow",decidedAt:time},
    {decision:"revoke",decidedAt:time}
  ]),null);
  assert.equal(latestUnambiguous([]),null);
  assert.equal(latestUnambiguous([
    {decision:"revoke",decidedAt:"2026-10-17T00:00:01.000Z"},
    {decision:"allow",decidedAt:time}
  ]).decision,"revoke");
});

test("Git revision, clean checkout, Node 24 and isolated DB acknowledgment gate any read",()=>{
  const expected="5".repeat(40);
  const base={
    expectedHead:expected,actualHead:expected,clean:true,
    databaseUrl:"postgresql://blueprint:test@127.0.0.1:55432/blueprint_qa",
    disposableAcknowledged:true,nodeMajor:24
  };
  assert.deepEqual(preliminaryBlockers(base),[]);
  assert.ok(preliminaryBlockers({...base,actualHead:"6".repeat(40)}).includes("EXACT_GIT_HEAD_MISMATCH"));
  assert.ok(preliminaryBlockers({...base,clean:false}).includes("WORKTREE_NOT_CLEAN"));
  assert.ok(preliminaryBlockers({...base,nodeMajor:22}).includes("NODE_24_REQUIRED"));
  assert.ok(preliminaryBlockers({...base,disposableAcknowledged:false}).includes("DISPOSABLE_DB_NOT_ACKNOWLEDGED"));
});

test("preflight never prints or re-exports OAuth, Postgres or signing secrets",async()=>{
  const uniqueSecret="very-private-auth-token-do-not-print";
  const report=await run({
    BLUEPRINT_E2E_EXPECTED_HEAD:"not-a-head",
    BLUEPRINT_E2E_DISPOSABLE_DB:"false",
    DATABASE_URL:"postgresql://user:"+uniqueSecret+"@127.0.0.1:55432/blueprint_qa",
    AUTH_SECRET:uniqueSecret,GITHUB_ID:uniqueSecret,
    GITHUB_SECRET:uniqueSecret,
    BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER:"github",
    BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT:uniqueSecret,
    BLUEPRINT_E2E_ISSUER_PRIVATE_KEY:uniqueSecret
  });
  const serialized=JSON.stringify(report);
  assert.equal(report.status,"BLOCKED");
  assert.equal(report.e2e,"NOT_RUN");
  assert.equal(report.releaseAuthority,false);
  assert.ok(!serialized.includes(uniqueSecret));
  assert.ok(report.blockers.includes("EXPECTED_HEAD_MISSING"));
  assert.ok(report.blockers.includes("DISPOSABLE_DB_NOT_ACKNOWLEDGED"));
  assert.equal(report.genuineOwnerSession,"NOT_VERIFIED_BY_READ_ONLY_CLI");
  assert.equal(report.signedEd25519Grant,"NOT_VERIFIED_BY_READ_ONLY_CLI");
});
