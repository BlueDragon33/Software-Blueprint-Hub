// Focused integration only: isolated actual D1/workerd fixture, no live database.
import {createHash,generateKeyPairSync,sign} from "node:crypto";
import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {newD1Fixture} from "../d1-fixture";
import {createD1BlueprintServerRuntime} from "../../../packages/runtime/src/d1";
import {D1WorkQualityRepository} from "../../../packages/persistence/src/d1";
import {workflowManifestDigest} from "../../../packages/application/src/prompt-workflow-orchestration";
import {workflowExecutionGrantSigningPayload,type WorkflowExecutionGrantPayload} from "../../../packages/application/src/prompt-workflow-execution";
import {reviewOrderKey,validateReviewWorkOrder,type ReviewWorkOrder} from "../../../packages/application/src/reviewer-ab-contract.mjs";
import type {WorkPackage} from "../../../packages/contracts/src";
const sha=(s:string)=>"sha256:"+createHash("sha256").update(s).digest("hex");
describe("R3 D1 source admission composition — changed integration only",()=>{
  it("binds the v2 order to all four actual D1 ports, denies missing evidence, stale CAS and revoked issuer; never certifies B",async()=>{
    const f=await newD1Fixture();
    try{
      const rt=createD1BlueprintServerRuntime(f.binding,undefined,"a".repeat(40));
      const workflow={...JSON.parse(readFileSync(new URL("../../../prompt-workflows/projects/application-management.visa-recovery.v1.json",import.meta.url),"utf8")),status:"approved"};
      const now=new Date(),issued=new Date(now.getTime()-1000).toISOString(),expiry=new Date(now.getTime()+300000).toISOString();
      const projectId=workflow.project.id,repository=workflow.project.repo;
      const context={projectId,repository,appHead:"a".repeat(40),canonicalDigest:"sha256:"+"b".repeat(64),policyVersion:"1.3.0"};
      const workflowDigest=workflowManifestDigest(workflow);
      const {publicKey,privateKey}=generateKeyPairSync("ed25519");
      const payload:WorkflowExecutionGrantPayload={schemaVersion:"1.0.0",projectId,repository,workflowId:workflow.workflowId,workflowVersion:workflow.workflowVersion,workflowDigest,templateId:workflow.templateId,nodeId:"inventory",appHead:context.appHead,canonicalDigest:context.canonicalDigest,policyVersion:"1.3.0",issuerId:"fixture-r3-issuer",nonce:"0123456789abcdef0123456789abcdef",issuedAt:issued,expiresAt:expiry,mode:"inspect-scoped",allowedPaths:["src/form"],maxAttempts:1,maxFiles:1,maxTokenEstimate:1};
      const grant={...payload,signature:sign(null,Buffer.from(workflowExecutionGrantSigningPayload(payload)),privateKey).toString("base64")};
      const requestId=sha(workflowExecutionGrantSigningPayload(grant));
      const wp:WorkPackage={id:"work-package:r3-d1-qa",projectId,title:"R3 D1 fixture",purpose:"Verify scoped source admission through canonical ports.",dependencies:[],acceptanceCriteria:["No synthetic reviewer verdict"],qualityGateIds:[],status:"ready",meta:{schemaVersion:"1.0.0",recordVersion:1,createdAt:issued,updatedAt:issued}};
      const orderFields:ReviewWorkOrder={schemaVersion:"1.0.0",kind:"review-work-order",policyVersion:"1.3.0",projectId,repository,pullRequestNumber:163,workPackageId:wp.id,workPackageRecordVersion:1,workflowId:workflow.workflowId,workflowNodeId:"inventory",workflowDigest,sourceRevision:context.appHead,canonicalSourceRevision:context.canonicalDigest,expectedStateVersion:1,issuerGrantDigest:requestId,issuedAt:issued,expiresAt:expiry,scope:{allowedPaths:["src/form"],maxFiles:1,maxBytes:512000,maxAttempts:1,maxTokensUsed:0},orderKey:""};
      const order={...orderFields,orderKey:reviewOrderKey(orderFields)};
      // Independent v2 wire formula from the existing B bridge; not a new identity scheme.
      const expected=sha(JSON.stringify(["review-ab:2",order.policyVersion,order.projectId,order.repository,order.pullRequestNumber,order.workPackageId,order.workPackageRecordVersion,order.workflowId,order.workflowNodeId,order.workflowDigest,order.sourceRevision,order.canonicalSourceRevision,order.expectedStateVersion,order.issuerGrantDigest,order.issuedAt,order.expiresAt,[...order.scope.allowedPaths].sort(),order.scope.maxFiles,order.scope.maxBytes,order.scope.maxAttempts,order.scope.maxTokensUsed]));
      expect(order.orderKey).toBe(expected);
      expect(()=>validateReviewWorkOrder({...order,scope:{...order.scope,maxBytes:1}})).toThrow(/order key/);
      await f.db.prepare('INSERT INTO "Project"(id) VALUES(?)').bind(projectId).run();
      const work=new D1WorkQualityRepository(f.domain);
      await work.createWorkPackage(wp);
      const authority={projectId,workflowId:workflow.workflowId,policyVersion:"1.3.0",actorPrincipalId:f.admin.principalId};
      await rt.workflowExecutionAuthority.recordAdoption({...authority,workflowDigest,decision:"adopt"});
      const issuer={...authority,issuerId:payload.issuerId,publicKeyPem:publicKey.export({type:"spki",format:"pem"}).toString()};
      await rt.workflowExecutionAuthority.recordIssuer({...issuer,decision:"allow"});
      const input={order,grant,workflow,context,requestId,now};
      const service=rt.reviewerBSourceAdmission;
      await expect(service.verifySource(input)).rejects.toThrow(/durable/);
      const observationDigest="sha256:"+"c".repeat(64);
      await rt.workflowExecutionJournal.claim(requestId,expiry);
      await rt.workflowExecutionJournal.append(requestId,{attempt:1,outcome:"succeeded",observationDigest,evidenceReferences:["github:"+repository+"@"+context.appHead+"#src/form"],filesTouched:[],tokensUsed:0});
      await expect(service.verifySource(input)).rejects.toThrow(/readback/);
      await rt.workflowInspectionQaJournal.appendVerified({requestId,attempt:1,observationDigest,sourceRevision:context.appHead,verifiedFiles:1,verifierId:"pinned-independent-github-readback-v1"});
      expect(await service.verifySource(input)).toMatchObject({status:"SOURCE_AND_P3_QA_JOURNAL_VERIFIED",canonicalWorkPackageCASVerified:true,reviewerBPrincipalVerified:false,reviewerBReviewExecuted:false,authenticatedReviewEvidenceIssued:false,qualityGatePassed:false,productionAuthorized:false});
      await expect(service.verifySource({...input,requestId:sha("wrong")})).rejects.toThrow(/requestId/);
      await expect(service.verifySource({...input,context:{...context,policyVersion:"1.5.0"}})).rejects.toThrow(/policy mismatch/);
      await work.updateWorkPackage({...wp,meta:{...wp.meta,recordVersion:2,updatedAt:now.toISOString()}},1);
      await expect(service.verifySource(input)).rejects.toThrow(/WorkPackage CAS/);
      // Revocation is checked before journal admission even on the older order.
      await rt.workflowExecutionAuthority.recordIssuer({...issuer,decision:"revoke"});
      await expect(service.verifySource(input)).rejects.toThrow(/issuer/i);
    }finally{await f.dispose();}
  },15000);
});
