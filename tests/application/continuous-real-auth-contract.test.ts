import { describe,it,expect } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { qaActorReadbackDigest } from "../../apps/web/src/auth/qa-actor-readback";
import { requireRealAuthEnvironment, assertRealSessionPrincipalBinding, ROLES } from "../e2e/continuous-authenticated-environment";

describe("real authenticated browser E2E prerequisites are fail-closed",()=>{
  const validStart:NodeJS.ProcessEnv={
    BLUEPRINT_REAL_AUTH_E2E:"true",
    BLUEPRINT_REAL_AUTH_E2E_BASE_URL:"http://127.0.0.1:3000/",
    DATABASE_URL:"postgresql://not-a-real-account@127.0.0.1:5432/blueprint_qa_test",
    BLUEPRINT_REAL_AUTH_E2E_PROJECT:"project:qa-localhost-only"
  };
  const principals={
    OWNER:"principal:"+"a".repeat(36),
    EDITOR:"principal:"+"b".repeat(36),
    VIEWER:"principal:"+"c".repeat(36)
  };
  const digest=(principal:string)=>
    createHash("sha256").update(principal).digest("hex");
  const qaReadback={
    nodeEnv:"development",
    enabled:"true",
    qaProjectId:"project:qa-localhost-only",
    projectId:"project:qa-localhost-only",
    databaseUrl:"postgresql://local-qa@127.0.0.1:55432/blueprint_qa_test",
    baseUrl:"http://127.0.0.1:3000/",
    requestHost:"127.0.0.1:3000",
    principalId:principals.OWNER
  };
  it("never treats plain CI as a real authenticated E2E session",()=>{
    expect(()=>requireRealAuthEnvironment({})).toThrow("BLOCKED_REAL_AUTH_E2E_NOT_ENABLED");
    expect(()=>requireRealAuthEnvironment(validStart)).toThrow("BLOCKED_REAL_AUTH_E2E_REAL_OWNER_SESSION_REQUIRED");
  });
  it("rejects non-loopback browser target and non-disposable PostgreSQL",()=>{
    expect(()=>requireRealAuthEnvironment({...validStart,
      BLUEPRINT_REAL_AUTH_E2E_BASE_URL:"https://github.com/"}))
      .toThrow("BLOCKED_REAL_AUTH_E2E_REQUIRES_LOCALHOST");
    expect(()=>requireRealAuthEnvironment({...validStart,
      DATABASE_URL:"postgresql://127.0.0.1:5432/blueprint_production"}))
      .toThrow("BLOCKED_REAL_AUTH_E2E_REQUIRES_DISPOSABLE_POSTGRES");
    expect(()=>requireRealAuthEnvironment({...validStart,
      BLUEPRINT_REAL_AUTH_E2E_PROJECT:"project:unverified-production"}))
      .toThrow("BLOCKED_REAL_AUTH_E2E_CANONICAL_PROJECT_REQUIRED");
  });
  it("reads a server-derived QA identity digest, never a raw Principal ID",()=>{
    expect(qaActorReadbackDigest(qaReadback)).toBe(digest(principals.OWNER));
    expect(qaActorReadbackDigest({...qaReadback,nodeEnv:"test"}))
      .toBe(digest(principals.OWNER));
    expect(qaActorReadbackDigest(qaReadback)).not.toContain(principals.OWNER);
    const source=readFileSync(
      new URL("../../apps/web/app/projects/[projectId]/page.tsx",import.meta.url),"utf8");
    expect(source).toContain('data-qa-principal-digest={qaPrincipalDigest}');
    expect(source).not.toContain('data-principal-id=');
    expect(source).toContain('qaActorReadbackDigest(');
    const testSource=readFileSync(
      new URL("../e2e/continuous-execution-authenticated.real.ts",import.meta.url),"utf8");
    expect(testSource).toContain('data-qa-principal-digest');
    expect(testSource).toContain('assertRealSessionPrincipalBinding(');
  });
  it("never exposes a QA fingerprint on Production or without explicit opt-in",()=>{
    for(const input of [
      {nodeEnv:"production"},
      {nodeEnv:"staging"},
      {nodeEnv:undefined},
      {enabled:"false"},
      {enabled:undefined}
    ]) {
      expect(qaActorReadbackDigest({...qaReadback,...input})).toBeNull();
    }
  });
  it("fails closed for wrong project, database, web origin and request Host",()=>{
    for(const input of [
      {qaProjectId:"project:qa-unrelated"},
      {qaProjectId:undefined},
      {projectId:"project:production"},
      {databaseUrl:"postgresql://127.0.0.1:55432/blueprint_production"},
      {databaseUrl:"postgresql://db.example:55432/blueprint_qa_test"},
      {databaseUrl:"http://127.0.0.1:55432/blueprint_qa_test"},
      {databaseUrl:undefined},
      {baseUrl:"https://qa.example/"},
      {baseUrl:"http://127.0.0.1:3000/extra"},
      {baseUrl:"http://someone:secret@127.0.0.1:3000/"},
      {baseUrl:undefined},
      {requestHost:"qa.example"},
      {requestHost:"localhost:3000"},
      {requestHost:null},
      {principalId:"principal:wrong"}
    ]) {
      expect(qaActorReadbackDigest({...qaReadback,...input})).toBeNull();
    }
  });
  it("rejects swapped, wrong-role, forged or missing digests without minting sessions",()=>{
    for(const role of ROLES){
      expect(()=>assertRealSessionPrincipalBinding(
        role,digest(principals[role]),principals)).not.toThrow();
      for(const wrongValue of [null,principals[role],"a".repeat(64),...ROLES
        .filter(value=>value!==role).map(value=>digest(principals[value]))]){
        expect(()=>assertRealSessionPrincipalBinding(
          role,wrongValue,principals)).toThrow(
            "BLOCKED_REAL_AUTH_E2E_"+role+"_SESSION_PRINCIPAL_MISMATCH");
      }
    }
  });
  it("does not mint an Auth.js token or bypass the real SSO provider",()=>{
    const source=readFileSync(
      new URL("../e2e/continuous-execution-authenticated.real.ts",import.meta.url),"utf8");
    const config=readFileSync(
      new URL("../../playwright.real-auth.config.ts",import.meta.url),"utf8");
    expect(source).toContain("storageState:env.states.OWNER");
    expect(source).toContain("storageState:env.states.EDITOR");
    expect(source).toContain("storageState:env.states.VIEWER");
    expect(source).toContain("verifyPersistedActors");
    expect(source).not.toMatch(/sealSsoCookie|encodeJWT|bootstrapOwner|createSession|jwt\.sign/);
    expect(config).not.toContain("webServer:");
    expect(config).toContain("requireRealAuthEnvironment()");
  });
});
