import {createHash, generateKeyPairSync, sign} from "node:crypto";
import {describe, expect, it} from "vitest";
import {prReviewIdentitySigningPayload, verifyPrReviewIdentity,
 type PrReviewIdentityPayload} from "../../packages/application/src/pr-review-identity";

const key=generateKeyPairSync("ed25519");
const pem=key.publicKey.export({format:"pem",type:"spki"}).toString();
const now=new Date("2026-11-02T08:00:00.000Z");
const grant={
 requestId:"sha256:"+"a".repeat(64), projectId:"project:blueprint-os",
 repository:"BlueDragon33/Software-Blueprint-Hub", pullRequestNumber:41,
 headSha:"b".repeat(40),allowedPaths:["src/qa.mjs"],
 workflowDigest:"sha256:"+"c".repeat(64),
 canonicalDigest:"sha256:"+"d".repeat(64),policyVersion:"1.3.0"
};
function issued(overrides:Partial<PrReviewIdentityPayload>={}) {
 const payload:PrReviewIdentityPayload={
  schemaVersion:"2.0.0",kind:"bounded-pr-review-identity",
  ...grant,baseSha:"e".repeat(40),nonce:"f".repeat(32),
  issuedAt:"2026-11-02T07:59:00.000Z",
  expiresAt:"2026-11-02T08:05:00.000Z",
  ...overrides
 } as PrReviewIdentityPayload;
 return {...payload,signature:sign(null,Buffer.from(prReviewIdentitySigningPayload(payload)),key.privateKey).toString("base64")};
}
function durable(){
 const seen=new Set<string>();
 return {claim:async(id:string)=>{
  if(seen.has(id))return false;seen.add(id);return true;
 }};
}
describe("bounded PR identity v2 (distinct from v1 grants and release)",()=>{
 it("verifies exact signed identity then rejects replay",async()=>{
  const x=issued(),db=durable();
  const r=await verifyPrReviewIdentity(x,grant,pem,db,now);
  expect(r.identity.baseSha).toBe("e".repeat(40));
  expect(r.bindingId).toMatch(/^sha256:[a-f0-9]{64}$/);
  await expect(verifyPrReviewIdentity(x,grant,pem,db,now)).rejects.toThrow(/replay/);
 });
 it("blocks PR number, base/head revisions, signed path, workflow, canonical and policy tampering",async()=>{
  const valid=issued();
  const altered=[
   {...valid,pullRequestNumber:42},
   {...valid,baseSha:"0".repeat(40)},
   {...valid,headSha:"0".repeat(40)},
   {...valid,allowedPaths:["src/other.mjs"]},
   {...valid,workflowDigest:"sha256:"+"0".repeat(64)},
   {...valid,canonicalDigest:"sha256:"+"0".repeat(64)},
   {...valid,policyVersion:"1.2.0"},
   {...valid,kind:"untrusted"}, {...valid,schemaVersion:"1.0.0"},
   {...valid,productionAuthorized:true}
  ];
  for(const x of altered)await expect(verifyPrReviewIdentity(x,grant,pem,durable(),now))
   .rejects.toThrow(/PR_REVIEW_IDENTITY_BLOCKED/);
 });
 it("rejects different expected scope with a valid signature",async()=>{
  const x=issued();
  for(const expected of [
   {...grant,pullRequestNumber:42},
   {...grant,headSha:"0".repeat(40)},
   {...grant,allowedPaths:["other/file.ts"]},
   {...grant,workflowDigest:"sha256:"+"0".repeat(64)}
  ])await expect(verifyPrReviewIdentity(x,expected,pem,durable(),now))
   .rejects.toThrow(/scope/);
 });
 it("rejects expiry, future issuance and missing durable replay store",async()=>{
  for(const d of [
   {expiresAt:"2026-11-02T07:59:59.000Z"},
   {issuedAt:"2026-11-02T08:04:00.000Z"},
   {expiresAt:"2026-11-02T10:00:00.000Z"}
  ])await expect(verifyPrReviewIdentity(issued(d),grant,pem,durable(),now))
   .rejects.toThrow(/validity/);
  await expect(verifyPrReviewIdentity(issued(),grant,pem,
   {claim:async()=>false},now)).rejects.toThrow(/replay/);
 });
 it("binds canonical bytes independently from JS key insertion order",()=>{
  const p=issued(),{signature,...payload}=p;
  const reversed=Object.fromEntries(Object.entries(payload).reverse());
  expect(prReviewIdentitySigningPayload(payload)).toBe(
   prReviewIdentitySigningPayload(reversed as unknown as PrReviewIdentityPayload));
  expect(createHash("sha256").update(prReviewIdentitySigningPayload(payload)).digest("hex")).toHaveLength(64);
 });
});
