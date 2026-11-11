/**
 * Blueprint OS 1.3.0 — bounded Reviewer A/B contract.
 * Candidate-only bridge to existing Prompt Workflow and canonical WorkPackage.
 * No scheduler, executor, receipt signer, new ledger, Quality Gate or release write.
 */
import {createHash} from "node:crypto";
const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^sha256:[a-f0-9]{64}$/;
const PROJECT=/^project:[a-z][a-z0-9-]{1,110}$/;
const REPO=/^BlueDragon33\/[A-Za-z0-9_.-]{1,100}$/;
const ID=/^[a-z][a-z0-9-]{1,79}$/;
const PATH=/^[A-Za-z0-9_.\/-]{2,240}$/;
const ACTOR=/^[A-Za-z0-9_.:@/-]{3,120}$/;
const ORDER_KEYS=["schemaVersion","kind","policyVersion","projectId","repository",
  "pullRequestNumber","workPackageId","workPackageRecordVersion","workflowId",
  "workflowNodeId","workflowDigest","sourceRevision","canonicalSourceRevision",
  "expectedStateVersion","issuerGrantDigest","issuedAt","expiresAt","scope","orderKey"];
const SCOPE_KEYS=["allowedPaths","maxFiles","maxBytes","maxAttempts","maxTokensUsed"];
const EVIDENCE_KEYS=["schemaVersion","kind","role","reviewerActorId","credentialFingerprint",
  "projectId","repository","pullRequestNumber","workPackageId","workflowId",
  "workflowDigest","sourceRevision","canonicalSourceRevision","orderKey","sourceDigest",
  "evidenceDigest","checkRunId","observedAt","verdict","findings","evidenceRefs"];
const FINDING_KEYS=["path","line","severity","code"];
const B_VERDICTS=new Set(["ACCEPT","ACCEPT_WITH_NOTES","REQUEST_CHANGES","BLOCKED"]);
const positive=x=>Number.isSafeInteger(x)&&x>0;
const record=x=>x!==null&&typeof x==="object"&&!Array.isArray(x);
function check(ok,reason){if(!ok)throw new TypeError("REVIEW_AB_BLOCKED: "+reason);}
function exact(x,keys,label){
  check(record(x)&&Object.getPrototypeOf(x)===Object.prototype&&
    Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k)),label+" fields invalid");
}
function timestamp(x){return typeof x==="string"&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x)&&
  Number.isFinite(Date.parse(x))&&new Date(x).toISOString()===x;}
function safePath(x){return typeof x==="string"&&PATH.test(x)&&x.split("/").every(p=>p&&p!=="."&&p!=="..");}
function unique(a){return Array.isArray(a)&&new Set(a).size===a.length;}
function digest(x){return "sha256:"+createHash("sha256").update(x).digest("hex");}
export function reviewOrderKey(o){
  return digest(JSON.stringify(["review-ab:1",o.projectId,o.repository,o.pullRequestNumber,
    o.workPackageId,o.workPackageRecordVersion,o.workflowId,o.workflowNodeId,
    o.workflowDigest,o.sourceRevision,o.canonicalSourceRevision]));
}
export function validateReviewWorkOrder(o){
  exact(o,ORDER_KEYS,"work order");
  check(o.schemaVersion==="1.0.0"&&o.kind==="review-work-order"&&o.policyVersion==="1.3.0",
    "must preserve published Constitution 1.3.0");
  check(PROJECT.test(o.projectId)&&REPO.test(o.repository),"project/repository identity");
  check(positive(o.pullRequestNumber)&&positive(o.workPackageRecordVersion)&&positive(o.expectedStateVersion),
    "PR/workPackage record and canonical CAS version");
  check(ID.test(o.workPackageId)&&ID.test(o.workflowId)&&ID.test(o.workflowNodeId),
    "unknown workflow or WorkPackage IDs");
  check(SHA.test(o.sourceRevision)&&DIGEST.test(o.canonicalSourceRevision)&&
    DIGEST.test(o.workflowDigest)&&DIGEST.test(o.issuerGrantDigest),
    "Git SHA, canonical revision, workflow and issuer are distinct pinned identities");
  exact(o.scope,SCOPE_KEYS,"inspection scope");
  const s=o.scope;
  check(unique(s.allowedPaths)&&s.allowedPaths.length>=1&&s.allowedPaths.length<=10&&
    s.allowedPaths.every(safePath),"paths must be unique, bounded and safe");
  check(positive(s.maxFiles)&&s.maxFiles>=s.allowedPaths.length&&s.maxFiles<=10&&
    positive(s.maxBytes)&&s.maxBytes<=512000&&positive(s.maxAttempts)&&
    s.maxAttempts<=3&&s.maxTokensUsed===0,"source-only inspection budget; no AI spend grant");
  check(timestamp(o.issuedAt)&&timestamp(o.expiresAt)&&
    Date.parse(o.expiresAt)>Date.parse(o.issuedAt)&&
    Date.parse(o.expiresAt)-Date.parse(o.issuedAt)<=600000,"issuer grant time window");
  check(o.orderKey===reviewOrderKey(o),"stale idempotency/order key");
  return Object.freeze({valid:true,advisoryOnly:true,canonicalMutationAllowed:false,
    qualityGatePassed:false,productionAuthorized:false});
}
export function validateReviewEvidence(o,e){
  validateReviewWorkOrder(o);
  exact(e,EVIDENCE_KEYS,"review evidence");
  check(e.schemaVersion==="1.0.0"&&e.kind==="review-evidence"&&["A","B"].includes(e.role),
    "invalid review evidence role");
  check(ACTOR.test(e.reviewerActorId)&&DIGEST.test(e.credentialFingerprint),
    "identity claim requires independently verified credential");
  for(const field of ["projectId","repository","pullRequestNumber","workPackageId",
    "workflowId","workflowDigest","sourceRevision","canonicalSourceRevision","orderKey"]){
    check(e[field]===o[field],"evidence scope mismatch: "+field);
  }
  check(DIGEST.test(e.sourceDigest)&&DIGEST.test(e.evidenceDigest)&&positive(e.checkRunId)&&
    timestamp(e.observedAt)&&Date.parse(e.observedAt)>=Date.parse(o.issuedAt)&&
    Date.parse(e.observedAt)<Date.parse(o.expiresAt),"source-bound test evidence and timing");
  check(e.role==="A"?["HANDOFF","BLOCKED"].includes(e.verdict):B_VERDICTS.has(e.verdict),
    "role-specific verdict");
  check(unique(e.evidenceRefs)&&e.evidenceRefs.length>=1&&e.evidenceRefs.length<=12&&
    e.evidenceRefs.every(x=>typeof x==="string"&&
      /^https:\/\/github\.com\/BlueDragon33\/[A-Za-z0-9_.-]+\/(?:actions\/runs\/\d+|issues\/\d+(?:#issuecomment-\d+)?|pull\/\d+)$/.test(x)),
    "bounded GitHub evidence references");
  check(Array.isArray(e.findings)&&e.findings.length<=30,"bounded findings");
  for(const f of e.findings){
    exact(f,FINDING_KEYS,"finding");
    check(o.scope.allowedPaths.includes(f.path)&&positive(f.line)&&f.line<=1000000&&
      ["P0","P1","P2","P3"].includes(f.severity)&&
      typeof f.code==="string"&&/^[A-Z][A-Z0-9_-]{2,40}$/.test(f.code),
      "finding must have scoped path:line and severity");
  }
  check(e.verdict!=="REQUEST_CHANGES"||e.findings.length>0,"request changes needs actual finding");
  return Object.freeze({valid:true,advisoryOnly:true,independenceUnverified:true});
}
function result(status,reason,o){
  return Object.freeze({status,reason,orderKey:o?.orderKey??null,
    expectedStateVersion:o?.expectedStateVersion??null,advisoryOnly:true,
    authenticatedCASRequired:true,qualityGatePassed:false,ownerApproved:false,
    productionAuthorized:false});
}
/**
 * Trust must be a server-owned, independently authenticated adapter.
 * Its verifyReviewEvidence reads own exact-SHA bytes, run logs and credential identity.
 * No caller-supplied boolean, self-signed packet or successful CI is trusted here.
 * All outputs are proposals; the Hub's existing journal/CAS owns every mutation.
 */
export async function assessReviewHandoff({order,aEvidence=null,bEvidence=null,now},trust){
  try{
    validateReviewWorkOrder(order);
    check(timestamp(now)&&Date.parse(now)>=Date.parse(order.issuedAt)&&
      Date.parse(now)<Date.parse(order.expiresAt),"expired or not-yet-effective grant");
    check(trust&&typeof trust.verifyIssuerGrant==="function"&&
      typeof trust.readCanonicalSnapshot==="function"&&
      typeof trust.verifyReviewEvidence==="function"&&
      typeof trust.verifyIndependentBReadback==="function","independent trust adapter unavailable");
    check((await trust.verifyIssuerGrant(order))===true,"unverified issuer grant");
    const state=await trust.readCanonicalSnapshot(order);
    for(const key of ["projectId","repository","pullRequestNumber","workPackageId",
      "workPackageRecordVersion","workflowId","workflowDigest","sourceRevision",
      "canonicalSourceRevision","issuerGrantDigest"]){
      check(record(state)&&state[key]===order[key],"stale canonical readback: "+key);
    }
    check(state.stateVersion===order.expectedStateVersion,"stale CAS state version");
    if(!aEvidence)return result("A_REVIEW_REQUIRED","A execution NOT_RUN",order);
    validateReviewEvidence(order,aEvidence);
    check(Date.parse(aEvidence.observedAt)<=Date.parse(now),"A evidence from the future");
    check(aEvidence.role==="A"&&(await trust.verifyReviewEvidence(aEvidence,"A"))===true,
      "A source/actor/test evidence not independently verified");
    if(aEvidence.verdict==="BLOCKED")return result("BLOCKED","A reports blocker",order);
    if(!bEvidence)return result("B_REVIEW_REQUIRED","A handoff verified; B execution NOT_RUN",order);
    validateReviewEvidence(order,bEvidence);
    check(Date.parse(bEvidence.observedAt)>=Date.parse(aEvidence.observedAt)&&
      Date.parse(bEvidence.observedAt)<=Date.parse(now),"B must independently follow A");
    check(bEvidence.role==="B"&&
      bEvidence.reviewerActorId!==aEvidence.reviewerActorId&&
      bEvidence.credentialFingerprint!==aEvidence.credentialFingerprint&&
      bEvidence.checkRunId!==aEvidence.checkRunId&&
      bEvidence.evidenceDigest!==aEvidence.evidenceDigest,
      "B actor, credentials, run and report must differ from A");
    check(bEvidence.sourceDigest===aEvidence.sourceDigest,
      "independently read source bytes mismatch");
    check((await trust.verifyReviewEvidence(bEvidence,"B"))===true&&
      (await trust.verifyIndependentBReadback(order,bEvidence))===true,
      "B independent source readback unverified");
    if(bEvidence.verdict==="BLOCKED")return result("BLOCKED","B reports blocker",order);
    if(bEvidence.verdict==="REQUEST_CHANGES")
      return result("A_REPAIR_REQUIRED","B identified path:line findings",order);
    return result("OWNER_REVIEW_CANDIDATE",
      "A+B evidence advisory only; canonical Quality Gates and human decision still required",order);
  }catch(e){
    return result("BLOCKED",e instanceof Error?e.message:"unverified boundary",order);
  }
}