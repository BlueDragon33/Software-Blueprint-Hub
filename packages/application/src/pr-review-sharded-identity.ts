/**
 * Proposed PR review scope v3. Full-PR manifest + separately signed bounded
 * shards; additive to v2, NEVER a constitutional ratification or approval.
 * Signing keys and issuer/adoption decisions are external to this module.
 */
import {createHash, createPublicKey, verify} from "node:crypto";

const DIGEST=/^sha256:[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const REPO=/^BlueDragon33\/[A-Za-z0-9_.-]+$/;
const PATH=/^[A-Za-z0-9_./-]{2,240}$/;
const record=(x:unknown): x is Record<string,unknown> =>
 x!==null&&typeof x==="object"&&!Array.isArray(x);
const fail=(reason:string):never=>{throw new Error("PR_REVIEW_V3_BLOCKED: "+reason);};
const need=(ok:unknown,reason:string):void=>{if(!ok)fail(reason);};
const digest=(domain:string,value:string):string=>"sha256:"+createHash("sha256")
 .update(domain+"\0").update(value).digest("hex");
const pathOk=(p:unknown):p is string=>typeof p==="string"&&PATH.test(p)&&
 p.split("/").every(x=>x!==""&&x!=="."&&x!=="..");
const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;
function canonical(x:unknown):unknown{
 if(Array.isArray(x))return x.map(canonical);
 if(record(x))return Object.fromEntries(Object.entries(x)
  .sort(([a],[b])=>compare(a,b)).map(([k,v])=>[k,canonical(v)]));
 return x;
}
export const prReviewV3SigningBytes=(payload:unknown):Buffer=>
 Buffer.from(JSON.stringify(canonical(payload)),"utf8");

export interface PrReviewV3File {
 readonly path:string;readonly patchSha256:string;readonly patchBytes:number;
}
export interface PrReviewV3Shard {
 readonly index:number;readonly paths:readonly string[];
 readonly patchBytes:number;readonly diffDigest:string;
}
export interface PrReviewV3Scope {
 readonly files:readonly PrReviewV3File[];
 readonly shards:readonly PrReviewV3Shard[];
}
export interface PrReviewV3SourceFile {
 readonly path:string;readonly patch:string;
}
export function buildPrReviewV3Scope(files:readonly PrReviewV3SourceFile[]):PrReviewV3Scope{
 need(Array.isArray(files)&&files.length>=1&&files.length<=100,"file count exceeds 100");
 const ordered=files.map(file=>{
  need(record(file)&&pathOk(file.path)&&typeof file.patch==="string",
   "invalid file or path");
  const bytes=Buffer.byteLength(file.patch,"utf8");
  need(bytes>0&&bytes<=32000,"file patch exceeds 32000 bytes");
  return {path:file.path,patchSha256:digest("blueprint-os:pr-review-patch:v3",file.patch),
   patchBytes:bytes};
 }).sort((a,b)=>compare(a.path,b.path));
 const seen=new Set<string>();let total=0;
 for(const f of ordered){
  need(!seen.has(f.path),"duplicate file path");
  seen.add(f.path);total+=f.patchBytes;
 }
 need(total<=1000000,"aggregate patch exceeds 1000000 bytes");
 const groups:PrReviewV3File[][]=[];let active:PrReviewV3File[]=[];let size=0;
 for(const file of ordered){
  if(active.length&&(active.length>=10||size+file.patchBytes>64000)){
   groups.push(active);active=[];size=0;
  }
  active.push(file);size+=file.patchBytes;
 }
 if(active.length)groups.push(active);
 const shards=groups.map((group,index)=>{
  const patchBytes=group.reduce((s,file)=>s+file.patchBytes,0);
  return Object.freeze({
   index,paths:Object.freeze(group.map(file=>file.path)),patchBytes,
   diffDigest:digest("blueprint-os:pr-review-shard-files:v3",
    JSON.stringify(group))
  });
 });
 need(shards.length<=100,"too many review shards");
 return Object.freeze({
  files:Object.freeze(ordered.map(x=>Object.freeze(x))),
  shards:Object.freeze(shards)
 });
}
export interface PrReviewV3ManifestPayload extends PrReviewV3Scope {
 readonly schemaVersion:"3.0.0";readonly kind:"sharded-pr-review-manifest";
 readonly requestId:string;readonly projectId:string;readonly repository:string;
 readonly pullRequestNumber:number;readonly baseSha:string;readonly headSha:string;
 readonly workflowDigest:string;readonly canonicalDigest:string;
 readonly policyVersion:"1.3.0";readonly nonce:string;
 readonly issuedAt:string;readonly expiresAt:string;
}
export interface SignedPrReviewV3Manifest extends PrReviewV3ManifestPayload{
 readonly signature:string;
}
export interface PrReviewV3ShardPayload extends PrReviewV3Shard {
 readonly schemaVersion:"3.0.0";readonly kind:"signed-pr-review-shard";
 readonly manifestDigest:string;readonly requestId:string;
 readonly repository:string;readonly pullRequestNumber:number;
 readonly baseSha:string;readonly headSha:string;
}
export interface SignedPrReviewV3Shard extends PrReviewV3ShardPayload{
 readonly signature:string;
}
export const prReviewV3ManifestDigest=(payload:PrReviewV3ManifestPayload):string=>
 digest("blueprint-os:pr-review-manifest:v3",prReviewV3SigningBytes(payload).toString("utf8"));
export function prReviewV3ShardPayload(
 payload:PrReviewV3ManifestPayload,shard:PrReviewV3Shard
):PrReviewV3ShardPayload{
 return {
  schemaVersion:"3.0.0",kind:"signed-pr-review-shard",
  manifestDigest:prReviewV3ManifestDigest(payload),
  requestId:payload.requestId,repository:payload.repository,
  pullRequestNumber:payload.pullRequestNumber,
  baseSha:payload.baseSha,headSha:payload.headSha,
  index:shard.index,paths:[...shard.paths],
  patchBytes:shard.patchBytes,diffDigest:shard.diffDigest
 };
}
export interface PrReviewV3Expectation{
 readonly requestId:string;readonly projectId:string;
 readonly repository:string;readonly pullRequestNumber:number;
 readonly baseSha:string;readonly headSha:string;
 readonly workflowDigest:string;readonly canonicalDigest:string;
 readonly policyVersion:string;
 readonly files:readonly PrReviewV3SourceFile[];
}
const rootKeys=["schemaVersion","kind","requestId","projectId","repository",
 "pullRequestNumber","baseSha","headSha","workflowDigest","canonicalDigest",
 "policyVersion","nonce","issuedAt","expiresAt","files","shards","signature"];
const shardKeys=["schemaVersion","kind","manifestDigest","requestId","repository",
 "pullRequestNumber","baseSha","headSha","index","paths","patchBytes","diffDigest","signature"];
function exact(x:unknown,keys:readonly string[]):x is Record<string,unknown>{
 return record(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
}
function signatureOk(payload:unknown,signature:string,key:string):boolean{
 try{
  if(!/^[A-Za-z0-9+/]{86}==$/.test(signature))return false;
  const bytes=Buffer.from(signature,"base64");
  return bytes.length===64&&verify(null,prReviewV3SigningBytes(payload),
   createPublicKey(key),bytes);
 }catch{return false;}
}
/**
 * Verify WHOLE live PR scope and all independently signed shard bindings
 * before spending a single-use durable claim. No partial success is returned.
 * Caller must obtain expectation.files from an independent pinned GitHub read.
 */
export async function verifySignedPrReviewV3(
 root:unknown,children:unknown,expected:PrReviewV3Expectation,
 authority:{
  readonly gatewayPublicKey:()=>Promise<string|null>;
  readonly assertIssuerAuthorized:(binding:{
   projectId:string;repository:string;requestId:string
  })=>Promise<boolean>;
  readonly claim:(key:string,expiry:string)=>Promise<boolean>;
 },now:Date
):Promise<Readonly<{manifestDigest:string;coveredFiles:number;coveredShards:number;
 readonly status:"SIGNED_SCOPE_VERIFIED_ONLY";
 readonly humanApproved:false;readonly qualityGatePassed:false;
 readonly productionAuthorized:false;}>>{
 need(exact(root,rootKeys),"invalid signed root fields");
 const r=root as unknown as SignedPrReviewV3Manifest;
 need(r.schemaVersion==="3.0.0"&&r.kind==="sharded-pr-review-manifest"&&
  r.policyVersion==="1.3.0"&&DIGEST.test(r.requestId)&&
  /^project:[a-z0-9][a-z0-9-]{1,90}$/.test(r.projectId)&&
  REPO.test(r.repository)&&SHA.test(r.baseSha)&&SHA.test(r.headSha)&&
  r.baseSha!==r.headSha&&DIGEST.test(r.workflowDigest)&&
  DIGEST.test(r.canonicalDigest)&&/^[a-f0-9]{32,64}$/.test(r.nonce)&&
  Number.isSafeInteger(r.pullRequestNumber)&&r.pullRequestNumber>0&&
  r.pullRequestNumber<=10000000,"invalid signed root identity");
 need(expected&&r.requestId===expected.requestId&&
  r.projectId===expected.projectId&&r.repository===expected.repository&&
  r.pullRequestNumber===expected.pullRequestNumber&&
  r.baseSha===expected.baseSha&&r.headSha===expected.headSha&&
  r.workflowDigest===expected.workflowDigest&&
  r.canonicalDigest===expected.canonicalDigest&&
  r.policyVersion===expected.policyVersion,"identity/source mismatch");
 const issued=Date.parse(r.issuedAt),expires=Date.parse(r.expiresAt);
 need(Number.isFinite(issued)&&Number.isFinite(expires)&&
  Number.isFinite(now.getTime())&&issued<=now.getTime()+60000&&
  expires>now.getTime()&&expires>issued&&expires-issued<=3600000,
  "invalid expiry or issuance");
 const scope=buildPrReviewV3Scope(expected.files);
 need(JSON.stringify(r.files)===JSON.stringify(scope.files)&&
  JSON.stringify(r.shards)===JSON.stringify(scope.shards),"incomplete/overlapping/stale PR scope");
 need(Array.isArray(children)&&children.length===scope.shards.length,
  "missing or excess signed shard");
 need(authority&&typeof authority.gatewayPublicKey==="function"&&
  typeof authority.assertIssuerAuthorized==="function"&&
  typeof authority.claim==="function","missing issuer/replay authority");
 const key=await authority.gatewayPublicKey();
 need(typeof key==="string"&&key.startsWith("-----BEGIN PUBLIC KEY-----"),
  "missing pinned public key");
 const {signature,...payload}=r;
 need(signatureOk(payload,signature,key),"invalid root signature");
 const proof=prReviewV3ManifestDigest(payload);
 for(let i=0;i<scope.shards.length;i++){
  const child=children[i];
  need(exact(child,shardKeys),"missing or malformed signed shard");
  const actual=child as unknown as SignedPrReviewV3Shard;
  const {signature:sig,...childPayload}=actual;
  const expectedPayload=prReviewV3ShardPayload(payload,scope.shards[i]!);
  need(JSON.stringify(canonical(childPayload))===
   JSON.stringify(canonical(expectedPayload)),"shard scope/index/root mismatch");
  need(actual.manifestDigest===proof&&signatureOk(childPayload,sig,key),
   "invalid signed shard signature");
 }
 need(await authority.assertIssuerAuthorized({
  projectId:r.projectId,repository:r.repository,requestId:r.requestId
 })===true,"issuer unavailable or revoked");
 const replay=digest("blueprint-os:pr-review-request:v3",r.requestId);
 need(await authority.claim(replay,r.expiresAt)===true,
  "replay or durable claim unavailable");
 return Object.freeze({
  status:"SIGNED_SCOPE_VERIFIED_ONLY",manifestDigest:proof,
  coveredFiles:scope.files.length,coveredShards:scope.shards.length,
  humanApproved:false,qualityGatePassed:false,productionAuthorized:false
 });
}
