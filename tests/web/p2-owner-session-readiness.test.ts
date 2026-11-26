import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({
 resolveWebIdentity:vi.fn(),
 getBlueprintServerRuntime:vi.fn()
}));
vi.mock("../../apps/web/src/auth/server-actor",()=>({
 resolveWebIdentity:mocks.resolveWebIdentity
}));
vi.mock("../../apps/web/src/server/runtime",()=>({
 getBlueprintServerRuntime:mocks.getBlueprintServerRuntime
}));

import {AuthorizationDeniedError} from "../../packages/core/src/authority";
import {GET} from "../../apps/web/app/api/authority/p2-session/route";
import {
 inspectExistingP2OwnerSession
} from "../../apps/web/src/server/p2-owner-session-readiness";

const identity={provider:"github",providerSubject:"297152795",email:null};
function runtime(){
 const principal={findUnique:vi.fn(async()=>({id:"principal:owner"}))};
 const project={findUnique:vi.fn(async()=>({id:"project:blueprint-os"}))};
 const authority={require:vi.fn(async()=>undefined)};
 const value={prisma:{principal,project},authority};
 mocks.getBlueprintServerRuntime.mockReturnValue(value);
 return {principal,project,authority};
}
beforeEach(()=>{
 vi.clearAllMocks();
 mocks.resolveWebIdentity.mockResolvedValue(identity);
});

describe("Owner JWT capability GET — credential-free, no persistence, nonapproval",()=>{
 it("checks EXISTING canonical principal, PROJECT_MUTATE and project; returns no identity/secrets",async()=>{
  const {principal,project,authority}=runtime();
  const response=await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("vary")).toBe("Cookie");
  expect(principal.findUnique).toHaveBeenCalledWith({
   where:{provider_providerSubject:{provider:"github",providerSubject:identity.providerSubject}},
   select:{id:true}
  });
  expect(authority.require).toHaveBeenCalledWith(
   {principalId:"principal:owner"},"project:blueprint-os","PROJECT_MUTATE"
  );
  expect(project.findUnique).toHaveBeenCalledWith({
   where:{id:"project:blueprint-os"},select:{id:true}
  });
  const json=await response.json();
  expect(json).toMatchObject({
   status:"PROJECT_MUTATE_SESSION_VERIFIED",
   projectId:"project:blueprint-os",capability:"PROJECT_MUTATE",
   activeCodePolicyVersion:"1.3.0",diagnosticOnly:true,
   admissionApproved:false,humanApproved:false,
   qualityGatePassed:false,authenticatedE2EVerified:false,productionAuthorized:false
  });
  const text=JSON.stringify(json);
  expect(text).not.toMatch(/297152795|principal:owner|access_token|cookie|secret|privateKey/i);
  expect(valueKeys(principal)).toEqual(["findUnique"]);
  expect(valueKeys(project)).toEqual(["findUnique"]);
 });
 it("anonymous JWT returns 401 without accessing canonical runtime",async()=>{
  mocks.resolveWebIdentity.mockResolvedValueOnce(null);
  const response=await GET();
  expect(response.status).toBe(401);
  expect(mocks.getBlueprintServerRuntime).not.toHaveBeenCalled();
 });
 it("SSO or unrecognized provider returns 401 rather than accepting owner label",async()=>{
  mocks.resolveWebIdentity.mockResolvedValueOnce({provider:"application-management",providerSubject:"owner"});
  expect((await GET()).status).toBe(401);
  expect(mocks.getBlueprintServerRuntime).not.toHaveBeenCalled();
 });
 it("signed-in identity absent from canonical Principal fails closed without creating it",async()=>{
  const {principal,project,authority}=runtime();
  principal.findUnique.mockResolvedValueOnce(null);
  const response=await GET();
  expect(response.status).toBe(403);
  expect(authority.require).not.toHaveBeenCalled();
  expect(project.findUnique).not.toHaveBeenCalled();
 });
 it("authenticated but not PROJECT_MUTATE returns 403 with no internal details",async()=>{
  const {authority,project}=runtime();
  authority.require.mockRejectedValueOnce(new AuthorizationDeniedError(
   "PROJECT_MUTATE","project:blueprint-os"
  ));
  const response=await GET();
  expect(response.status).toBe(403);
  expect(project.findUnique).not.toHaveBeenCalled();
  expect(JSON.stringify(await response.json())).not.toContain("principal:");
 });
 it("missing project returns 403; authority/database outage returns 503 without leak",async()=>{
  const {project,authority}=runtime();
  project.findUnique.mockResolvedValueOnce(null);
  expect((await GET()).status).toBe(403);
  project.findUnique.mockResolvedValue({id:"project:blueprint-os"});
  authority.require.mockRejectedValueOnce(new Error("DATABASE_CREDENTIALS_DO_NOT_ECHO"));
  const response=await GET();
  expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).not.toContain("DATABASE_CREDENTIALS");
 });
 it("offline pure helper rejects malformed subject before any canonical read",async()=>{
  const lookup=vi.fn();
  await expect(inspectExistingP2OwnerSession(
   {provider:"github",providerSubject:"fake-owner"},
   {lookupExistingPrincipal:lookup,requireProjectMutate:vi.fn(),projectExists:vi.fn()}
  )).rejects.toThrow(/P2_SESSION_DENIED/);
  expect(lookup).not.toHaveBeenCalled();
 });
});
function valueKeys(x:object){return Object.keys(x).sort()}
