import { describe,expect,it } from "vitest";
import { readFileSync } from "node:fs";
import { assertContinuousMutationOrigin } from "../../apps/web/src/auth/continuous-mutation-origin";

const good={origin:"http://127.0.0.1:3000",host:"127.0.0.1:3000",fetchSite:"same-origin"};
describe("continuous mutation Origin/CSRF security, without fake login",()=>{
  it("accepts only the exact explicitly allowed loopback origin",()=>{
    expect(()=>assertContinuousMutationOrigin(good,true)).not.toThrow();
    expect(()=>assertContinuousMutationOrigin(good,false)).toThrow(/UNSAFE_SCHEME/);
    expect(()=>assertContinuousMutationOrigin({
      origin:"https://hub.example",host:"hub.example",fetchSite:"same-origin"
    },false)).not.toThrow();
  });
  it.each([
    [{...good,origin:null},/ORIGIN_REQUIRED/],
    [{...good,host:null},/ORIGIN_REQUIRED/],
    [{...good,fetchSite:"cross-site"},/ORIGIN_REQUIRED/],
    [{...good,origin:"https://attacker.invalid"},/ORIGIN_MISMATCH/],
    [{...good,origin:"http://localhost:3000"},/ORIGIN_MISMATCH/],
    [{...good,origin:"http://127.0.0.1:3001"},/ORIGIN_MISMATCH/],
    [{...good,origin:"https://127.0.0.1:3000@evil.invalid"},/ORIGIN_MISMATCH/],
    [{...good,origin:"null"},/ORIGIN_INVALID/],
    [{...good,origin:"http://127.0.0.1:3000/evil"},/ORIGIN_MISMATCH/],
    [{...good,origin:"http://127.0.0.1:3000?foo=bar"},/ORIGIN_MISMATCH/],
    [{...good,origin:"http://127.0.0.1:3000, https://evil.invalid"},/ORIGIN_REQUIRED/]
  ])("rejects malformed, cross-site or missing Origin %j", (input,error)=>{
    expect(()=>assertContinuousMutationOrigin(input,true)).toThrow(error);
  });
  it("guards each sensitive Server Action before any canonical read or mutation",()=>{
    const source=readFileSync(
      new URL("../../apps/web/app/projects/[projectId]/continuous-execution-action.ts",
        import.meta.url),"utf8");
    const names=[
      "recheckContinuousExecutionPreflight","retryContinuousSourceRead",
      "confirmCreateMissingQualityGate","executeSignedContinuousDiscovery",
      "confirmCreatePlannedWorkPackage","confirmPromotePlannedWorkToReady",
      "confirmContinuousPreflightDecision"
    ];
    for(const name of names){
      const start=source.indexOf("export async function "+name+"(");
      expect(start).toBeGreaterThan(-1);
      const first=source.indexOf("await requireContinuousSameOrigin();",start);
      const next=source.indexOf("export async function ",start+5);
      expect(first).toBeGreaterThan(start);
      expect(next<0 || first<next).toBe(true);
      const prefix=source.slice(start,first);
      expect(prefix).not.toMatch(/await (?:loadProjectWorkspace|readAuthenticatedContinuousPreflight)/);
    }
  });
});
