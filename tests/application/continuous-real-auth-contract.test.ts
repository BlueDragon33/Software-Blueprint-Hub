import { describe,it,expect } from "vitest";
import { requireRealAuthEnvironment, assertRealSessionPrincipalBinding, ROLES } from "../e2e/continuous-authenticated-environment";
import { readFileSync } from "node:fs";

describe("real authenticated browser E2E prerequisites are fail-closed",()=>{
  const validStart:NodeJS.ProcessEnv={
    BLUEPRINT_REAL_AUTH_E2E:"true",
    BLUEPRINT_REAL_AUTH_E2E_BASE_URL:"http://127.0.0.1:3000/",
    DATABASE_URL:"postgresql://not-a-real-account@127.0.0.1:5432/blueprint_qa_test",
    BLUEPRINT_REAL_AUTH_E2E_PROJECT:"project:qa-localhost-only"
  };
  it("never treats a plain CI as a real authenticated E2E session",()=>{
    expect(()=>requireRealAuthEnvironment({})).toThrow("BLOCKED_REAL_AUTH_E2E_NOT_ENABLED");
    expect(()=>requireRealAuthEnvironment(validStart)).toThrow("BLOCKED_REAL_AUTH_E2E_REAL_OWNER_SESSION_REQUIRED");
  });
  it("rejects non-loopback browser target and non-throwaway PostgreSQL",()=>{
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
  it("rejects swapped, wrong-role or missing identity without minting any session",()=>{
    const principals={
      OWNER:"principal:"+"a".repeat(36),
      EDITOR:"principal:"+"b".repeat(36),
      VIEWER:"principal:"+"c".repeat(36)
    };
    for(const role of ROLES){
      expect(()=>assertRealSessionPrincipalBinding(
        role,principals[role],principals)).not.toThrow();
      expect(()=>assertRealSessionPrincipalBinding(
        role,null,principals)).toThrow(
          "BLOCKED_REAL_AUTH_E2E_"+role+"_SESSION_PRINCIPAL_MISMATCH");
      for(const wrong of ROLES.filter(value=>value!==role)){
        expect(()=>assertRealSessionPrincipalBinding(
          role,principals[wrong],principals)).toThrow(
            "BLOCKED_REAL_AUTH_E2E_"+role+"_SESSION_PRINCIPAL_MISMATCH");
      }
    }
  });
  it("server-only QA readback uses the authenticated actor and stays off in production",()=>{
    const source=readFileSync(
      new URL("../../apps/web/app/projects/[projectId]/page.tsx",import.meta.url),"utf8");
    expect(source).toContain('process.env.NODE_ENV !== "production"');
    expect(source).toContain('process.env.BLUEPRINT_REAL_AUTH_E2E === "true"');
    expect(source).toContain('db.pathname === "/blueprint_qa_test"');
    expect(source).toContain('data-principal-id={workspace.actor.principalId}');
    const testSource=readFileSync(
      new URL("../e2e/continuous-execution-authenticated.real.ts",import.meta.url),"utf8");
    expect(testSource).toContain('assertRealSessionPrincipalBinding(');
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
