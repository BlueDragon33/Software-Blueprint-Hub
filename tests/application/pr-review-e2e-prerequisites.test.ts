import {describe,expect,it,vi} from "vitest";
import {inspectCanonicalPrReviewPrerequisites} from "../../packages/runtime/src/pr-review-e2e-prerequisites";

const digest="sha256:"+"a".repeat(64);
const actor={principalId:"principal:trusted"};
const input={
 actor,projectId:"project:blueprint-os",workPackageId:"work:review-scoped",
 workflowId:"signed-readonly-review",workflowDigest:digest,
 issuerId:"qualified-issuer",policyVersion:"1.3.0"
};
type Sources=Parameters<typeof inspectCanonicalPrReviewPrerequisites>[1];
const wp={
 id:input.workPackageId,projectId:input.projectId,status:"ready",
 meta:{schemaVersion:"1.0.0",recordVersion:1,createdAt:"2026-11-02T00:00:00Z",
 updatedAt:"2026-11-02T00:00:00Z"},
 dependencies:[],
 acceptanceCriteria:["Independent QA verified at exact HEAD"],
 qualityGateIds:["gate:review:qa"]
};
const gate={id:"gate:review:qa",projectId:input.projectId,status:"not-ready"};
function harness(change:{
 profile?:unknown;packages?:unknown;gates?:unknown;adoption?:unknown;issuer?:unknown;
}={}){
 const profile=change.profile===undefined?{profile:{projectId:input.projectId,
  meta:{recordVersion:1}}}:change.profile;
 const packages=change.packages===undefined?[wp]:change.packages;
 const gates=change.gates===undefined?[{gate,evidence:[]}]:change.gates;
 const adoption=change.adoption===undefined?{decision:"adopt",policyVersion:"1.3.0"}:change.adoption;
 const issuer=change.issuer===undefined?{decision:"allow",policyVersion:"1.3.0",
  publicKeyPem:"-----BEGIN PUBLIC KEY-----"}:change.issuer;
 const readers={
  sessionAuthority:{require:vi.fn(async()=>undefined)},
  profile:{read:vi.fn(async()=>profile)},
  work:{
   listWorkPackages:vi.fn(async()=>packages),
   listQualityGates:vi.fn(async()=>gates)
  },
  decisions:{
   latestAdoption:vi.fn(async()=>adoption),
   latestIssuer:vi.fn(async()=>issuer)
  }
 };
 return readers as unknown as Sources & {
  profile:{read:ReturnType<typeof vi.fn>};
  sessionAuthority:{require:ReturnType<typeof vi.fn>};
  work:{listWorkPackages:ReturnType<typeof vi.fn>;listQualityGates:ReturnType<typeof vi.fn>};
  decisions:{latestIssuer:ReturnType<typeof vi.fn>;latestAdoption:ReturnType<typeof vi.fn>};
 };
}
describe("authenticated read-only preflight protects missing canonical grant",()=>{
 it("valid canonical fixture is only OBSERVED and never accepted as E2E or gate PASS",async()=>{
  const readers=harness();
  const result=await inspectCanonicalPrReviewPrerequisites(input,readers);
  expect(readers.sessionAuthority.require).toHaveBeenCalledWith(actor,input.projectId,"PROJECT_MUTATE");
  expect(result).toMatchObject({status:"CANONICAL_PREREQUISITES_OBSERVED_ONLY",
   gateCount:1,recordVersion:1,authenticatedE2EVerified:false,
   humanApproved:false,qualityGatePassed:false,productionAuthorized:false});
 });
 it("missing authenticated actor blocks without reading the private canonical project",async()=>{
  const readers=harness();
  await expect(inspectCanonicalPrReviewPrerequisites({...input,actor:null},readers))
   .rejects.toThrow(/authenticated actor/);
  expect(readers.profile.read).not.toHaveBeenCalled();
 });
 it("rejected PROJECT_MUTATE blocks all canonical metadata reads and never claims authorization",async()=>{
  const readers=harness();
  readers.sessionAuthority.require.mockRejectedValueOnce(Error("AUTHORIZATION_DENIED: PROJECT_MUTATE"));
  await expect(inspectCanonicalPrReviewPrerequisites(input,readers))
   .rejects.toThrow(/AUTHORIZATION_DENIED/);
  expect(readers.profile.read).not.toHaveBeenCalled();
  expect(readers.work.listWorkPackages).not.toHaveBeenCalled();
  expect(readers.work.listQualityGates).not.toHaveBeenCalled();
  expect(readers.decisions.latestIssuer).not.toHaveBeenCalled();
  expect(readers.decisions.latestAdoption).not.toHaveBeenCalled();
 });
 it("Hub session authority outage fails closed without reading canonical evidence",async()=>{
  const readers=harness();
  readers.sessionAuthority.require.mockRejectedValueOnce(Error("SESSION_AUTHORITY_UNAVAILABLE"));
  await expect(inspectCanonicalPrReviewPrerequisites(input,readers))
   .rejects.toThrow(/SESSION_AUTHORITY_UNAVAILABLE/);
  expect(readers.profile.read).not.toHaveBeenCalled();
 });
 it("no Work Package, blocked package, missing gate or failed gate blocks",async()=>{
  const changes=[
   {packages:[]},{packages:[{...wp,status:"blocked"}]},
   {packages:[{...wp,qualityGateIds:[]}]},
   {packages:[{...wp,projectId:"project:another"}]},
   {packages:[{...wp,dependencies:["work:missing"]}]},
   {packages:[{...wp,dependencies:[wp.id]}]},
   {packages:[{...wp,dependencies:["work:blocked"]},
    {id:"work:blocked",projectId:input.projectId,status:"in-progress"}]},
   {packages:[{...wp,dependencies:["work:foreign"]},
    {id:"work:foreign",projectId:"project:other",status:"completed"}]},
   {gates:[]},{gates:[{gate:{...gate,status:"fail"},evidence:[]}]},
   {gates:[{gate:{...gate,projectId:"project:other"},evidence:[]}]}
  ];
  for(const change of changes){
   await expect(inspectCanonicalPrReviewPrerequisites(input,harness(change)))
    .rejects.toThrow(/AUTHENTICATED_PR_E2E_BLOCKED/);
  }
 });
 it("no profile or missing/stale issuer/adoption cannot issue a false PASS",async()=>{
  const changes=[
   {profile:null},{adoption:null},{issuer:null},
   {adoption:{decision:"revoke",policyVersion:"1.3.0"}},
   {issuer:{decision:"revoke",policyVersion:"1.3.0"}},
   {issuer:{decision:"allow",policyVersion:"1.2.0",
    publicKeyPem:"-----BEGIN PUBLIC KEY-----"}}
  ];
  for(const change of changes){
   await expect(inspectCanonicalPrReviewPrerequisites(input,harness(change)))
    .rejects.toThrow(/AUTHENTICATED_PR_E2E_BLOCKED/);
  }
 });
 it("reader failure cannot be reclassified as an approved E2E",async()=>{
  const sources=harness();
  sources.profile.read.mockRejectedValueOnce(Error("DB_UNAVAILABLE"));
  await expect(inspectCanonicalPrReviewPrerequisites(input,sources))
   .rejects.toThrow(/DB_UNAVAILABLE/);
 });
});
