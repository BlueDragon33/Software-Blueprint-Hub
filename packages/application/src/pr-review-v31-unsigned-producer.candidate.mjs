/**
 * Hub-side Reviewer B v3.1 unsigned producer candidate.
 * Builds ONLY reproducible source scope from a caller-supplied snapshot;
 * does NOT verify the caller's GitHub provenance, sign, allocate keys,
 * grant issuer/role rights, claim nonce, or approve any release.
 * Must remain unconnected to production routes until separately admitted.
 */
import {createHash} from 'node:crypto';

const SHA = /^[a-f0-9]{40}$/;
const REPO = /^BlueDragon33\/[A-Za-z0-9_.-]+$/;
const PATH = /^[A-Za-z0-9_[\]./-]{2,240}$/;
const SEGMENT = /^(?:[A-Za-z0-9_.-]+|\[[A-Za-z][A-Za-z0-9]*\])$/;
const fail = reason => {throw new Error('HUB_PR_V31_UNSIGNED_BLOCKED: '+reason);};
const requireTrue = (value,reason) => {if(!value)fail(reason);};
const hash = (domain,value) => 'sha256:'+createHash('sha256').update(domain+'\0').update(value).digest('hex');
const validPath = path => typeof path==='string' && PATH.test(path) &&
  path.split('/').every(part => part!=='' && part!=='.' && part!=='..' && SEGMENT.test(part));
const order = (a,b) => a<b?-1:a>b?1:0;

/** Separate version declaration; this candidate never lowers the original v3.0 limits. */
export const REVIEW_V31_UNSIGNED_LIMITS = Object.freeze({
  schemaVersion:'3.1.0', maxFiles:128, maxPatchBytes:64000,
  maxTotalBytes:1000000, maxShardFiles:10, maxShardBytes:64000, maxShards:100
});

/**
 * Snapshot must be read from the trusted exact HEAD by a separate adapter.
 * Source metadata here is UNTRUSTED: digest is integrity fingerprint, not an attestation.
 */
export function buildUnsignedHubPrV31Scope(snapshot) {
  const cap=REVIEW_V31_UNSIGNED_LIMITS;
  requireTrue(snapshot && typeof snapshot==='object' && !Array.isArray(snapshot), 'missing snapshot');
  requireTrue(REPO.test(snapshot.repository??'') &&
    Number.isSafeInteger(snapshot.pullRequestNumber) && snapshot.pullRequestNumber>0 &&
    SHA.test(snapshot.baseSha??'') && SHA.test(snapshot.headSha??'') &&
    snapshot.baseSha!==snapshot.headSha, 'invalid PR identity');
  requireTrue(Number.isSafeInteger(snapshot.changedFiles) &&
    snapshot.changedFiles>0 && snapshot.changedFiles<=cap.maxFiles &&
    Array.isArray(snapshot.files) && snapshot.files.length===snapshot.changedFiles,
    'incomplete or oversized PR listing');
  const files=[]; const seen=new Set();let totalBytes=0;
  for (const raw of snapshot.files) {
    requireTrue(raw && typeof raw==='object' && validPath(raw.path) &&
      !seen.has(raw.path) && typeof raw.patch==='string',
      'duplicate or unsafe path/patch');
    const bytes=Buffer.byteLength(raw.patch,'utf8');
    requireTrue(bytes>0 && bytes<=cap.maxPatchBytes, 'patch exceeds v3.1 budget');
    totalBytes+=bytes;
    requireTrue(totalBytes<=cap.maxTotalBytes, 'aggregate patch exceeds v3.1 budget');
    seen.add(raw.path);
    files.push({path:raw.path,patchSha256:hash('blueprint-os:pr-review-patch:v3',raw.patch),patchBytes:bytes});
  }
  files.sort((a,b)=>order(a.path,b.path));
  const groups=[];let active=[];let currentBytes=0;
  for(const f of files){
    if(active.length && (active.length>=cap.maxShardFiles ||
      currentBytes+f.patchBytes>cap.maxShardBytes)){
      groups.push(active);active=[];currentBytes=0;
    }
    active.push(f);currentBytes+=f.patchBytes;
  }
  if(active.length)groups.push(active);
  requireTrue(groups.length<=cap.maxShards, 'too many shards');
  const shards=groups.map((group,index)=>Object.freeze({
    index,paths:Object.freeze(group.map(f=>f.path)),
    patchBytes:group.reduce((sum,f)=>sum+f.patchBytes,0),
    diffDigest:hash('blueprint-os:pr-review-shard-files:v3',JSON.stringify(group))
  }));
  const safeFiles=Object.freeze(files.map(f=>Object.freeze(f)));
  const fileNames=Object.freeze(safeFiles.map(f=>f.path));
  const sourceFingerprint=hash('blueprint-os:pr-review-unsigned-source:v31',
    JSON.stringify({repository:snapshot.repository,pullRequestNumber:snapshot.pullRequestNumber,
      baseSha:snapshot.baseSha,headSha:snapshot.headSha,changedFiles:snapshot.changedFiles,
      files:safeFiles}));
  return Object.freeze({
    kind:'unsigned-pr-v31-source-proposal',schemaVersion:cap.schemaVersion,
    proposalOnly:true,provenanceVerified:false,canSignOrApprove:false,
    qualityGatePassed:false,humanApproved:false,productionAuthorized:false,
    repository:snapshot.repository,pullRequestNumber:snapshot.pullRequestNumber,
    baseSha:snapshot.baseSha,headSha:snapshot.headSha,
    changedFiles:snapshot.changedFiles,totalPatchBytes:totalBytes,
    sourceFingerprint,fileNames,files:safeFiles,shards:Object.freeze(shards)
  });
}
