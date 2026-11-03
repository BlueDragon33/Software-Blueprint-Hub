import {describe,expect,it} from "vitest";
import {validateContract} from "../../packages/contracts/src/validation";
import {
 prepareP2PrReviewAdmissionProposal, P2_PR_REVIEW_WORK_PACKAGE_ID,
 P2_PR_REVIEW_GATE_ID
} from "../../packages/application/src/pr-review-admission-proposal";

describe("unadmitted P2 Work Package and Gate preview (NO mutations)",()=>{
 it("prepares valid canonical contracts with blocked, not-ready default and no approval",()=>{
  const proposal=prepareP2PrReviewAdmissionProposal(new Date("2026-11-02T09:00:00.000Z"));
  expect(validateContract("WorkPackage",proposal.workPackage).valid).toBe(true);
  expect(validateContract("QualityGate",proposal.qualityGate).valid).toBe(true);
  expect(proposal.workPackage).toMatchObject({
   id:P2_PR_REVIEW_WORK_PACKAGE_ID,projectId:"project:blueprint-os",
   status:"blocked",dependencies:[],qualityGateIds:[P2_PR_REVIEW_GATE_ID],
   meta:{schemaVersion:"1.0.0",recordVersion:1}
  });
  expect(proposal.qualityGate).toMatchObject({
   id:P2_PR_REVIEW_GATE_ID,projectId:"project:blueprint-os",
   status:"not-ready",evidenceIds:[],meta:{recordVersion:1}
  });
  expect(proposal).toMatchObject({proposalOnly:true,admitted:false,
   humanApproved:false,qualityGatePassed:false,productionAuthorized:false});
  expect(proposal.workPackage.acceptanceCriteria.some(x=>x.includes("PROJECT_MUTATE"))).toBe(true);
  expect(proposal.qualityGate.requirements.some(x=>x.includes("Professional reviewer"))).toBe(true);
 });
 it("is deterministic and has no source of live owner grant, DB credential, or journal claim",()=>{
  const a=prepareP2PrReviewAdmissionProposal(new Date("2026-11-02T09:00:00.000Z"));
  const b=prepareP2PrReviewAdmissionProposal(new Date("2026-11-02T09:00:00.000Z"));
  expect(a).toEqual(b);
  expect(Object.isFrozen(a)).toBe(true);
  expect(Object.isFrozen(a.workPackage)).toBe(true);
  expect(Object.isFrozen(a.qualityGate)).toBe(true);
  expect(JSON.stringify(a)).not.toMatch(/privateKey|secret|apiToken|issuerId|approvalGranted/);
 });
 it("rejects malformed requested creation times rather than issuing invalid canonical records",()=>{
  expect(()=>prepareP2PrReviewAdmissionProposal(new Date(Number.NaN))).toThrow(/timestamp/);
 });
});
