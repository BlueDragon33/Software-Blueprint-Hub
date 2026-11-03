import {generateKeyPairSync,sign} from "node:crypto";
import {describe,it,expect} from "vitest";
import {
 buildPrReviewV3Scope,prReviewV3ManifestDigest,prReviewV3ShardPayload,
 prReviewV3SigningBytes,verifySignedPrReviewV3,
 type PrReviewV3ManifestPayload
} from "../../packages/application/src/pr-review-sharded-identity";

const kp=generateKeyPairSync("ed25519");
const pem=kp.publicKey.export({format:"pem",type:"spki"}).toString();
const now=new Date("2026-11-03T06:00:00.000Z");
const files=Array.from({length:32},(_,i)=>({
 path:"src/file-"+String(i).padStart(3,"0")+".ts",
 patch:"@@ -1 +1 @@\n-old\n+new"+String(i)+"\n"+"x".repeat(4500)
}));
const digest=(x:string)=>"sha256:"+x.repeat(64);
const scope=buildPrReviewV3Scope(files);
function signed(changes:Partial<PrReviewV3ManifestPayload>={}){
 const payload:PrReviewV3ManifestPayload={
  schemaVersion:"3.0.0",kind:"sharded-pr-review-manifest",
  requestId:digest("a"),projectId:"project:blueprint-os",
  repository:"BlueDragon33/Software-Blueprint-Hub",pullRequestNumber:153,
  baseSha:"b".repeat(40),headSha:"c".repeat(40),
  workflowDigest:digest("d"),canonicalDigest:digest("e"),
  policyVersion:"1.3.0",nonce:"f".repeat(32),
  issuedAt:"2026-11-03T05:59:00.000Z",
  expiresAt:"2026-11-03T06:10:00.000Z",
  files:scope.files,shards:scope.shards,...changes
 };
 const root={...payload,signature:sign(null,prReviewV3SigningBytes(payload),kp.privateKey).toString("base64")};
 const children=payload.shards.map(shard=>{
  const inspectionRequestId="sha256:"+shard.index.toString(16).padStart(64,"0");
  const body=prReviewV3ShardPayload(payload,shard,inspectionRequestId);
  return {...body,signature:sign(null,prReviewV3SigningBytes(body),kp.privateKey).toString("base64")};
 });
 const expected={
  requestId:payload.requestId,projectId:payload.projectId,
  repository:payload.repository,pullRequestNumber:payload.pullRequestNumber,
  baseSha:payload.baseSha,headSha:payload.headSha,
  workflowDigest:payload.workflowDigest,canonicalDigest:payload.canonicalDigest,
  policyVersion:payload.policyVersion,files
 };
 return {root,children,expected};
}
function authority(authorized=true){
 const claims=new Set<string>();
 return {gatewayPublicKey:async()=>pem,
  assertIssuerAuthorized:async()=>authorized,
  claim:async (key:string)=>{if(claims.has(key))return false;claims.add(key);return true;}
 };
}
describe("PR review v3 additive full-coverage signed shards",()=>{
 it("splits 32 files into bounded non-overlapping groups and preserves exact complete scope",()=>{
  expect(scope.files).toHaveLength(32);
  expect(scope.shards.length).toBeGreaterThan(3);
  const flat=scope.shards.flatMap(s=>[...s.paths]);
  expect(new Set(flat).size).toBe(32);
  expect(flat).toEqual(scope.files.map(f=>f.path));
  for(const s of scope.shards){
   expect(s.paths.length).toBeLessThanOrEqual(10);
   expect(s.patchBytes).toBeLessThanOrEqual(64000);
  }
 });
 it("verifies root and EVERY shard signature with atomic replay and no approval",async()=>{
  const x=signed(),auth=authority();
  const proof=await verifySignedPrReviewV3(x.root,x.children,x.expected,auth,now);
  expect(proof.status).toBe("SIGNED_SCOPE_VERIFIED_ONLY");
  expect(proof.coveredFiles).toBe(32);
  expect(proof.coveredShards).toBe(scope.shards.length);
  const {signature: _signature, ...payload} = x.root;
  expect(proof.manifestDigest).toBe(prReviewV3ManifestDigest(payload));
  expect(proof.humanApproved).toBe(false);
  expect(proof.qualityGatePassed).toBe(false);
  expect(proof.productionAuthorized).toBe(false);
  await expect(verifySignedPrReviewV3(x.root,x.children,x.expected,auth,now))
   .rejects.toThrow(/replay/);
 });
 it("blocks omitted/duplicated/overlapping/reordered shards and extra fields",async()=>{
  const x=signed(),cases:unknown[]=[
   x.children.slice(1),[...x.children,...x.children.slice(0,1)],
   [x.children[1],x.children[0],...x.children.slice(2)],
   x.children.map((c,i)=>i===0?{...c,paths:[...c.paths,c.paths[0]]}:c),
   x.children.map((c,i)=>i===1?{...c,diffDigest:digest("f")}:c),
   x.children.map((c,i)=>i===1?{...c,inspectionRequestId:x.children[0]!.inspectionRequestId}:c)
  ];
  for(const parts of cases){
   await expect(verifySignedPrReviewV3(x.root,parts,x.expected,authority(),now))
    .rejects.toThrow(/PR_REVIEW_V3_BLOCKED/);
  }
  await expect(verifySignedPrReviewV3({...x.root,qualityGatePassed:true},x.children,
   x.expected,authority(),now)).rejects.toThrow(/PR_REVIEW_V3_BLOCKED/);
 });
 it("rejects partial signed manifest, altered file bytes, SHA drift and changed PR number",async()=>{
  const x=signed();
  const wrongSources=[
   {...x.expected,files:x.expected.files.slice(0,31)},
   {...x.expected,files:x.expected.files.map((f,i)=>i===4?{...f,patch:"ALTERED"}:f)},
   {...x.expected,headSha:"0".repeat(40)},
   {...x.expected,baseSha:"0".repeat(40)},
   {...x.expected,pullRequestNumber:154}
  ];
  for(const expected of wrongSources)await expect(
   verifySignedPrReviewV3(x.root,x.children,expected,authority(),now)
  ).rejects.toThrow(/PR_REVIEW_V3_BLOCKED/);
 });
 it("rejects unsigned, forged, expired, revoked, and unavailable durable claim",async()=>{
  const x=signed();
  const fake=[{...x.root,nonce:"0".repeat(32)},{...x.root,signature:"A".repeat(86)+"=="}];
  for(const root of fake)await expect(
   verifySignedPrReviewV3(root,x.children,x.expected,authority(),now)
  ).rejects.toThrow(/PR_REVIEW_V3_BLOCKED/);
  await expect(verifySignedPrReviewV3(x.root,x.children,x.expected,authority(false),now))
   .rejects.toThrow(/issuer/);
  await expect(verifySignedPrReviewV3(x.root,x.children,x.expected,{
   ...authority(),claim:async()=>false
  },now)).rejects.toThrow(/claim/);
  await expect(verifySignedPrReviewV3(x.root,x.children,x.expected,authority(),
   new Date("2026-11-03T09:00:00Z"))).rejects.toThrow(/expiry/);
 });
 it("refuses oversized or duplicate file input rather than skipping it",()=>{
  expect(()=>buildPrReviewV3Scope([...files,files[0]!])).toThrow(/duplicate/);
  expect(()=>buildPrReviewV3Scope([...files,{path:"src/large.ts",patch:"x".repeat(32001)}]))
   .toThrow(/32000/);
  expect(()=>buildPrReviewV3Scope(files.map((f,i)=>i===0?{...f,path:"../secret"}:f)))
   .toThrow(/path/);
  expect(()=>buildPrReviewV3Scope(Array.from({length:101},(_,i)=>({
   path:"src/file-"+i+".ts",patch:"+ok"
  })))).toThrow(/100/);
 });
});
