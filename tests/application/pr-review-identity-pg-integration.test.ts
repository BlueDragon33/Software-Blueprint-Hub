import {createHash, generateKeyPairSync, sign} from "node:crypto";
import {afterAll, beforeAll, describe, expect, it} from "vitest";
import {AuthorityService} from "../../packages/core/src";
import {createPrismaClient, PostgresAuthorityRepository,
 PostgresWorkflowExecutionAuthorityRepository} from "../../packages/persistence/src";
import {prReviewIdentitySigningPayload,
 type PrReviewIdentityPayload} from "../../packages/application/src/pr-review-identity";
import {PostgresPrReviewIdentityAuthority} from "../../packages/runtime/src/pr-review-identity-authority";
import {PostgresWorkflowExecutionJournal} from "../../packages/runtime/src/workflow-execution-journal";

const databaseUrl=process.env.DATABASE_URL;
const suite=databaseUrl && process.env.BLUEPRINT_QA_DB_INTEGRATION==="true" ?
 describe : describe.skip;
const projectId="project:pr-identity-v2-postgres";
const policyVersion="1.3.0";
const digest=x=>"sha256:"+x.repeat(64);
const pair=generateKeyPairSync("ed25519");
const pem=pair.publicKey.export({format:"pem",type:"spki"}).toString();
const other=generateKeyPairSync("ed25519");
const otherPem=other.publicKey.export({format:"pem",type:"spki"}).toString();
const repository="BlueDragon33/Software-Blueprint-Hub";

suite("signed PR v2 uses real disposable PostgreSQL authority and atomic workflow journal",()=>{
 const prisma=createPrismaClient(databaseUrl!);
 const prismaOther=createPrismaClient(databaseUrl!);
 const system=new AuthorityService(new PostgresAuthorityRepository(prisma));
 const decisions=new PostgresWorkflowExecutionAuthorityRepository(prisma);
 const decisionsOther=new PostgresWorkflowExecutionAuthorityRepository(prismaOther);
 const journal=new PostgresWorkflowExecutionJournal(prisma);
 const otherJournal=new PostgresWorkflowExecutionJournal(prismaOther);
 const v2=new PostgresPrReviewIdentityAuthority(decisions,journal);
 const v2Other=new PostgresPrReviewIdentityAuthority(decisionsOther,otherJournal);
 const workflowDigest=digest("c"),canonicalDigest=digest("d");
 let ownerId="";
 let seq=0;
 const fixture=(workflowId:string,options:{
  requestId?:string;nonce?:string;headSha?:string;baseSha?:string;paths?:string[];
 }={})=>{
  const now=new Date();
  const issuedAt=new Date(now.getTime()-15_000).toISOString();
  const expiresAt=new Date(now.getTime()+5*60_000).toISOString();
  const requestId=options.requestId??digest((++seq).toString(16).padStart(1,"0").slice(-1));
  const payload:PrReviewIdentityPayload={
   schemaVersion:"2.0.0",kind:"bounded-pr-review-identity",
   requestId,projectId,repository,pullRequestNumber:154,
   baseSha:options.baseSha??"a".repeat(40),
   headSha:options.headSha??"b".repeat(40),
   allowedPaths:options.paths??["src/pr-review-identity.ts"],
   workflowDigest,canonicalDigest,policyVersion,
   nonce:options.nonce??"e".repeat(32),issuedAt,expiresAt
  };
  const identity={...payload,signature:sign(null,Buffer.from(
   prReviewIdentitySigningPayload(payload)),pair.privateKey).toString("base64")};
  const expected={
   requestId:payload.requestId,projectId,repository,
   pullRequestNumber:payload.pullRequestNumber,headSha:payload.headSha,
   allowedPaths:payload.allowedPaths,workflowDigest,canonicalDigest,policyVersion
  };
  const request={identity,expected,workflowId,issuerId:"trusted-owner",now};
  return {request,payload,identity,expected};
 };
 async function adopt(workflowId:string){
  await decisions.recordAdoption({projectId,workflowId,workflowDigest,policyVersion,
   decision:"adopt",actorPrincipalId:ownerId});
  await decisions.recordIssuer({projectId,workflowId,issuerId:"trusted-owner",
   publicKeyPem:pem,policyVersion,decision:"allow",actorPrincipalId:ownerId});
 }
 beforeAll(async()=>{
  const owner=await system.bootstrapOwner({provider:"github",
   providerSubject:"pr-v2-postgres-owner"});
  ownerId=owner.id;
  await prisma.project.create({data:{id:projectId}});
 });
 afterAll(async()=>{await prismaOther.$disconnect();await prisma.$disconnect();});

 it("single signed request yields one durable atomic claim across separate database clients",async()=>{
  const workflowId="pr-v2-concurrent";
  await adopt(workflowId);
  const {request,identity}=fixture(workflowId);
  const results=await Promise.allSettled([v2.verify(request),v2Other.verify(request)]);
  expect(results.filter(x=>x.status==="fulfilled")).toHaveLength(1);
  expect(results.filter(x=>x.status==="rejected")).toHaveLength(1);
  const winner=results.find(x=>x.status==="fulfilled");
  if(winner?.status==="fulfilled"){
   expect(winner.value.productionAuthorized).toBe(false);
   expect(winner.value.qualityGatePassed).toBe(false);
   expect(winner.value.humanApproved).toBe(false);
  }
  const requestKey="sha256:"+createHash("sha256")
   .update("blueprint-os:pr-review-request:v2\0")
   .update(identity.requestId).digest("hex");
  expect(await prisma.workflowExecutionClaim.count({where:{requestId:requestKey}})).toBe(1);
  const rotated=fixture(workflowId,{requestId:identity.requestId,nonce:"f".repeat(32)});
  await expect(v2Other.verify(rotated.request)).rejects.toThrow(/replay/);
 });
 it("rejects issuer revocation for a distinct signed request",async()=>{
  const workflowId="pr-v2-revocation";
  await adopt(workflowId);
  await expect(v2.verify(fixture(workflowId).request)).resolves.toMatchObject({
   humanApproved:false,qualityGatePassed:false,productionAuthorized:false
  });
  await decisions.recordIssuer({projectId,workflowId,issuerId:"trusted-owner",
   publicKeyPem:pem,policyVersion,decision:"revoke",actorPrincipalId:ownerId});
  await expect(v2Other.verify(fixture(workflowId).request)).rejects.toThrow(/revoked\/unavailable/);
  expect(await decisions.latestIssuer(projectId,workflowId,"trusted-owner"))
   .toMatchObject({decision:"revoke"});
 });
 it("rejects canonical adoption revocation even with valid Ed25519 signature",async()=>{
  const workflowId="pr-v2-adoption-revoked";
  await adopt(workflowId);
  await decisions.recordAdoption({projectId,workflowId,workflowDigest,
   policyVersion,decision:"revoke",actorPrincipalId:ownerId});
  await expect(v2.verify(fixture(workflowId).request)).rejects.toThrow(/revoked\/unavailable/);
 });
 it("rejects unauthorized, stale, forged or rotated key with no claim",async()=>{
  const workflowId="pr-v2-negative";
  await adopt(workflowId);
  const x=fixture(workflowId);
  const bad={...x.request,identity:{...x.identity,baseSha:"0".repeat(40)}};
  await expect(v2.verify(bad)).rejects.toThrow(/signature/);
  const wrong={...x.request,expected:{...x.expected,canonicalDigest:digest("0")}};
  await expect(v2.verify(wrong)).rejects.toThrow(/scope/);
  const invalidIssuer={...x.request,issuerId:"unknown-issuer"};
  await expect(v2.verify(invalidIssuer)).rejects.toThrow(/revoked\/unavailable/);
  await decisions.recordIssuer({projectId,workflowId,issuerId:"trusted-owner",
   publicKeyPem:otherPem,policyVersion,decision:"allow",actorPrincipalId:ownerId});
  await expect(v2.verify(x.request)).rejects.toThrow(/signature/);
  const claimKey="sha256:"+createHash("sha256")
   .update("blueprint-os:pr-review-request:v2\0")
   .update(x.identity.requestId).digest("hex");
  expect(await prisma.workflowExecutionClaim.count({where:{requestId:claimKey}})).toBe(0);
 });
 it("fails closed when database claim cannot be persisted and after claim revocation",async()=>{
  const workflowId="pr-v2-claim-failure";
  await adopt(workflowId);
  const x=fixture(workflowId);
  const broken=new PostgresPrReviewIdentityAuthority(decisions,{
   claim:async()=>{throw Error("DISPOSABLE_PG_UNAVAILABLE");}
  });
  await expect(broken.verify(x.request)).rejects.toThrow(/DISPOSABLE_PG_UNAVAILABLE/);
  const changed=new PostgresPrReviewIdentityAuthority(decisions,{
   claim:async(key,expiry)=>{
    const claimed=await journal.claim(key,expiry);
    await decisions.recordIssuer({projectId,workflowId,issuerId:"trusted-owner",
     publicKeyPem:pem,policyVersion,decision:"revoke",actorPrincipalId:ownerId});
    return claimed;
   }
  });
  await expect(changed.verify(x.request)).rejects.toThrow(/revoked\/unavailable/);
 });
});
