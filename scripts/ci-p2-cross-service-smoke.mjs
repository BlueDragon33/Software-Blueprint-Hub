#!/usr/bin/env node
// CI-only cross-component smoke: real signed modules + real independently
// fetched SHA-pinned GitHub bytes. The seeded issuer/adoption and journals are
// test fixtures, NOT authenticated canonical authority or persistent E2E.
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const blocked = (why) => { throw new Error("P2_CI_BLOCKED: " + why); };
const sha256 = (x) => "sha256:" + createHash("sha256").update(x).digest("hex");
const shaPattern = /^[a-f0-9]{40}$/;
const root = process.env.GITHUB_WORKSPACE;
const hubHead = process.env.GITHUB_SHA;
const refName = process.env.GITHUB_REF_NAME;
const executionToken = process.env.BLUEPRINT_EXECUTION_READ_TOKEN;
const qaToken = process.env.BLUEPRINT_QA_READ_TOKEN;
if (!root || !shaPattern.test(hubHead || "") || !refName || !executionToken || !qaToken || executionToken === qaToken) {
  blocked("missing CI checkout, exact hub SHA/ref or distinct read-only App credentials");
}
const pins = {
  gateway: process.env.GATEWAY_SHA,
  worker: process.env.WORKER_SHA,
  qa: process.env.QA_SHA
};
for (const [name, expected] of Object.entries(pins)) {
  if (!shaPattern.test(expected || "")) blocked("unverified " + name + " SHA");
  const actual = execFileSync("git", ["-C", resolve(root, name), "rev-parse", "HEAD"], {encoding:"utf8"}).trim();
  if (actual !== expected) blocked(name + " checkout revision drift");
}
const moduleAt = async (name, file) => import(pathToFileURL(resolve(root, name, "src", file)).href);
const [{authorizeInspectionGrant,canonicalDispatchPayload},
 {executeInspection},
 {independentlyVerifyInspection}] = await Promise.all([
  moduleAt("gateway", "gateway.mjs"),
  moduleAt("worker", "worker.mjs"),
  moduleAt("qa", "qa.mjs")
]);
const target = "BlueDragon33/Software-Blueprint-Hub";
const now = new Date();
const issuer = generateKeyPairSync("ed25519");
const gateway = generateKeyPairSync("ed25519");
const pem = (key) => key.export({type:"spki",format:"pem"}).toString();
const canonical = (value) => JSON.stringify(normalize(value));
function normalize(v) {
  if (Array.isArray(v)) return v.map(normalize);
  if (v && typeof v === "object") return Object.fromEntries(
    Object.entries(v).sort(([a],[b]) => a.localeCompare(b)).map(([k,x]) => [k,normalize(x)])
  );
  return v;
}
const gitApi = async (path, token) => {
  const response = await fetch("https://api.github.com" + path, {
    redirect:"error", cache:"no-store", signal:AbortSignal.timeout(8000),
    headers: {Authorization:"Bearer " + token, Accept:"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28", "User-Agent":"blueprint-p2-scoped-ci"}
  });
  if (!response.ok) blocked("GitHub read-only transport failed: HTTP " + response.status);
  return response.json();
};
const currentRef = async (token = executionToken) => {
  // Never accept a stale HEAD: the bound reference must still point to this SHA.
  const actual = await gitApi("/repos/" + target + "/commits/" + encodeURIComponent(refName), token);
  if (actual.sha !== hubHead) blocked("source branch advanced after CI checkout");
};
const readPinned = async (repo, sha, path, token) => {
  if (repo !== target || sha !== hubHead || path !== "package.json") blocked("source outside CI allowlist");
  const data = await gitApi("/repos/" + target + "/contents/package.json?ref=" + sha, token);
  if (data.type !== "file" || data.path !== path || data.encoding !== "base64") blocked("not pinned file");
  return {type:data.type,path:data.path,encoding:data.encoding,size:data.size,content:data.content};
};
await currentRef();
const payload = {
  schemaVersion:"1.0.0", projectId:"project:ci-only-component-contract",
  repository:target, appHead:hubHead, workflowId:"ci-contract-smoke",
  workflowDigest:sha256("ci-only unsigned workflow fixture v1"),
  canonicalDigest:sha256("ci-only constitutional binding fixture v1"),
  nodeId:"source-inspection",policyVersion:"1.3.0",mode:"inspect-scoped",
  issuerId:"ci-fixture-only", nonce:createHash("sha256").update(hubHead + String(now.getTime())).digest("hex"),
  issuedAt:new Date(now.getTime()-2000).toISOString(),
  expiresAt:new Date(now.getTime()+120000).toISOString(),
  allowedPaths:["package.json"], maxFiles:1,maxBytes:8192
};
const grant = {...payload,signature:sign(null,Buffer.from(canonical(payload)),issuer.privateKey).toString("base64")};
const gatewayClaims = new Set(),workerClaims = new Set(),attempts = new Map(),qaProofs = new Map();
const gatewayTrust = {
  issuerPublicKey:async()=>pem(issuer.publicKey),
  // Synthetic test-only decisions are intentionally NOT canonical identity/adoption.
  assertAdopted:async()=>{}, assertFreshCanonical:async()=>{}, assertPermission:async()=>{},
  assertFreshSource:()=>currentRef(executionToken),
  claimDurably:async id=>{if(gatewayClaims.has(id))return false;gatewayClaims.add(id);return true;},
  signDispatch:async data=>sign(null,Buffer.from(data),gateway.privateKey).toString("base64")
};
const dispatch = await authorizeInspectionGrant(grant,gatewayTrust,now);
assert.equal(dispatch.workflowDigest,payload.workflowDigest);
const workerTrust = {
  gatewayPublicKey:async()=>pem(gateway.publicKey),
  assertFreshSource:()=>currentRef(executionToken),
  claimDispatchDurably:async id=>{if(workerClaims.has(id))return false;workerClaims.add(id);return true;},
  readPinnedFile:(repo, sha, path)=>readPinned(repo, sha, path, executionToken),
  appendObservation:async(id,v)=>{if(attempts.has(id))blocked("duplicate attempt"); attempts.set(id,v);},
  readObservation:async(id)=>attempts.get(id)??null
};
const observation = await executeInspection(dispatch,workerTrust,now);
assert.equal(observation.outcome,"succeeded");
const qaTrust = {
  gatewayPublicKey:async()=>pem(gateway.publicKey),
  readCanonicalObservation:async(id)=>attempts.get(id)??null,
  assertFreshSource:()=>currentRef(qaToken),
  readPinnedFileIndependent:(repo, sha, path)=>readPinned(repo, sha, path, qaToken),
  persistQaResult:async proof=>{if(qaProofs.has(proof.requestId))blocked("duplicate QA proof");qaProofs.set(proof.requestId,proof);},
  readQaResult:async id=>qaProofs.get(id)??null
};
const verified = await independentlyVerifyInspection(dispatch,observation,qaTrust,now);
assert.equal(verified.status,"verified-inspection-bytes");
assert.equal(verified.qualityGatePassed,false);
assert.equal(verified.completionReceiptIssued,false);
assert.equal(verified.productionAuthorized,false);
await assert.rejects(authorizeInspectionGrant(grant,gatewayTrust,now),/replay/);
await assert.rejects(executeInspection(dispatch,workerTrust,now),/consumed/);
await assert.rejects(independentlyVerifyInspection(dispatch,{...observation,filesTouched:["package.json"]},qaTrust,now),/QA_BLOCKED/);
await assert.rejects(executeInspection({...dispatch,appHead:"f".repeat(40)},workerTrust,now),/signature invalid/);
const summary = {
  kind:"P2_EPHEMERAL_CROSS_COMPONENT_CONTRACT_SMOKE",
  status:"COMPONENT_SMOKE_PASSED",
  canonicalAuthorization:"CI_FIXTURE_ONLY_NOT_VERIFIED",
  durableHubJournal:"NOT_TESTED_BY_THIS_SCRIPT",
  authenticatedCrossPrivateRuntime:"NOT_VERIFIED",
  sourceReadCredentials:"separate-selected-repository-app-tokens",
  productionAuthority:false,qualityGatePassed:false,completionReceiptIssued:false,
  hubHead,serviceHeads:pins,source:target+"@"+hubHead+"#package.json",
  requestId:dispatch.requestId,observationDigest:observation.observationDigest,
  independentQaByteVerification:verified.status,
  negativeChecks:["issuer-grant-replay","worker-dispatch-replay","tampered-qa-observation","tampered-signed-dispatch"]
};
const artifact = resolve(process.env.RUNNER_TEMP||root,"p2-provider-neutral-contract-evidence.json");
mkdirSync(resolve(artifact,".."),{recursive:true});
writeFileSync(artifact,JSON.stringify(summary,null,2)+"\n",{mode:0o600});
console.log(JSON.stringify({status:summary.status,source:summary.source,
  canonicalAuthorization:summary.canonicalAuthorization,
  durableHubJournal:summary.durableHubJournal,
  authenticatedCrossPrivateRuntime:summary.authenticatedCrossPrivateRuntime,
  evidenceSha256:sha256(JSON.stringify(summary,null,2)+"\n")}));
