import { describe,it,expect } from "vitest";
import { requireRealAuthEnvironment } from "../e2e/continuous-authenticated-environment";
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
