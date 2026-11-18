import test from "node:test";
import assert from "node:assert/strict";
import {reviewOrderKey,reviewSourceDigestV1,validateReviewWorkOrder,validateReviewEvidence,assessReviewHandoff}
  from "../../packages/application/src/reviewer-ab-contract.mjs";

const sha="a".repeat(40),d1="sha256:"+"b".repeat(64),d2="sha256:"+"c".repeat(64);
function workOrder(){
  const o={schemaVersion:"1.0.0",kind:"review-work-order",policyVersion:"1.3.0",
    projectId:"project:blueprint-os",repository:"BlueDragon33/Software-Blueprint-Hub",
    pullRequestNumber:161,workPackageId:"r2-r3-qa",workPackageRecordVersion:4,
    workflowId:"ab-review",workflowNodeId:"review",workflowDigest:d1,
    sourceRevision:sha,canonicalSourceRevision:d2,expectedStateVersion:4,
    issuerGrantDigest:d1,issuedAt:"2026-11-11T09:00:00.000Z",
    expiresAt:"2026-11-11T09:09:00.000Z",
    scope:{allowedPaths:["src/example.ts"],maxFiles:1,maxBytes:65536,maxAttempts:3,maxTokensUsed:0},
    orderKey:""};
  o.orderKey=reviewOrderKey(o);return o;
}
function report(o,role="A",patch={}){
  return {schemaVersion:"1.0.0",kind:"review-evidence",role,
    reviewerActorId:role==="A"?"agent:A":"agent:B",
    credentialFingerprint:role==="A"?d1:d2,
    projectId:o.projectId,repository:o.repository,pullRequestNumber:o.pullRequestNumber,
    workPackageId:o.workPackageId,workflowId:o.workflowId,workflowDigest:o.workflowDigest,
    sourceRevision:o.sourceRevision,canonicalSourceRevision:o.canonicalSourceRevision,
    orderKey:o.orderKey,sourceDigest:d1,evidenceDigest:role==="A"?d1:d2,
    checkRunId:role==="A"?123:456,observedAt:"2026-11-11T09:01:00.000Z",
    verdict:role==="A"?"HANDOFF":"ACCEPT",findings:[],
    evidenceRefs:["https://github.com/BlueDragon33/Software-Blueprint-Hub/actions/runs/123"],...patch};
}
function trust(o,patch={}){
  return {verifyIssuerGrant:async()=>true,
    readCanonicalSnapshot:async()=>({
      projectId:o.projectId,repository:o.repository,pullRequestNumber:o.pullRequestNumber,
      workPackageId:o.workPackageId,workPackageRecordVersion:o.workPackageRecordVersion,
      workflowId:o.workflowId,workflowNodeId:o.workflowNodeId,workflowDigest:o.workflowDigest,sourceRevision:o.sourceRevision,
      canonicalSourceRevision:o.canonicalSourceRevision,issuerGrantDigest:o.issuerGrantDigest,
      stateVersion:o.expectedStateVersion}),
    verifyReviewEvidence:async()=>true,verifyIndependentBReadback:async()=>true,...patch};
}
const at="2026-11-11T09:02:00.000Z";
async function assess(o=workOrder(),a=report(o),b=report(o,"B"),t=trust(o),now=at){
  return assessReviewHandoff({order:o,aEvidence:a,bEvidence:b,now},t);
}
async function blocked(p){assert.equal((await p).status,"BLOCKED");}
test("valid signed-grant shape remains advisory; no quality/release authority",()=>{
  const v=validateReviewWorkOrder(workOrder());
  assert.equal(v.valid,true);assert.equal(v.productionAuthorized,false);
  assert.equal(v.canonicalMutationAllowed,false);
});
test("role packets are claims, not verified independent attestation",()=>{
  const o=workOrder();
  assert.equal(validateReviewEvidence(o,report(o,"B")).independenceUnverified,true);
});
test("idempotency binds PR + exact SHA + workflow + record version",()=>{
  const o=workOrder();
  assert.equal(reviewOrderKey(o),o.orderKey);
  assert.notEqual(reviewOrderKey({...o,sourceRevision:"d".repeat(40)}),o.orderKey);
});
test("unknown authorization fields in order or evidence fail closed",()=>{
  const o=workOrder();
  assert.throws(()=>validateReviewWorkOrder({...o,productionAuthorized:true}),/fields invalid/);
  assert.throws(()=>validateReviewEvidence(o,{...report(o),ownerApproved:true}),/fields invalid/);
});
test("never relabel git commit as canonical sha256 revision",()=>{
  const o=workOrder();o.canonicalSourceRevision=o.sourceRevision;
  assert.throws(()=>validateReviewWorkOrder(o),/distinct pinned identities/);
});
test("canonical sha256 digest is not a Git SHA",()=>{
  const o=workOrder();o.sourceRevision=o.canonicalSourceRevision;
  assert.throws(()=>validateReviewWorkOrder(o),/distinct pinned identities/);
});
test("stale idempotency after record version changes is rejected",()=>{
  const o=workOrder();o.workPackageRecordVersion++;o.expectedStateVersion++;
  assert.throws(()=>validateReviewWorkOrder(o),/idempotency/);
});
test("out-of-governance repository rejected",()=>{
  const o=workOrder();o.repository="OtherCo/Test";
  assert.throws(()=>validateReviewWorkOrder(o),/identity/);
});
test("duplicate, traversal and unbounded path lists are denied",()=>{
  const o=workOrder();o.scope.allowedPaths=["src/example.ts","src/example.ts"];
  assert.throws(()=>validateReviewWorkOrder(o),/paths/);
  o.scope.allowedPaths=["src/..\/secret.env"];
  assert.throws(()=>validateReviewWorkOrder(o),/paths/);
});
test("no extra spending or unbounded repair budget",()=>{
  const o=workOrder();o.scope.maxAttempts=4;
  assert.throws(()=>validateReviewWorkOrder(o),/budget/);
  o.scope.maxAttempts=3;o.scope.maxTokensUsed=100;
  assert.throws(()=>validateReviewWorkOrder(o),/budget/);
});
test("grant lifetime bound to ten minutes",()=>{
  const o=workOrder();o.expiresAt="2026-11-11T10:00:00.000Z";
  assert.throws(()=>validateReviewWorkOrder(o),/time window/);
});
test("cross-project reviewer packet denied",()=>{
  const o=workOrder();
  assert.throws(()=>validateReviewEvidence(o,report(o,"B",{projectId:"project:other"})),/mismatch/);
});
test("stale reviewer SHA denied",()=>{
  const o=workOrder();
  assert.throws(()=>validateReviewEvidence(o,report(o,"B",{sourceRevision:"f".repeat(40)})),/sourceRevision/);
});
test("A cannot issue B ACCEPT verdict",()=>{
  const o=workOrder();
  assert.throws(()=>validateReviewEvidence(o,report(o,"A",{verdict:"ACCEPT"})),/role-specific/);
});
test("B REQUEST_CHANGES requires scoped path:line",()=>{
  const o=workOrder();
  assert.throws(()=>validateReviewEvidence(o,report(o,"B",{verdict:"REQUEST_CHANGES"})),/finding/);
});
test("forged out-of-scope path finding denied",()=>{
  const o=workOrder();
  assert.throws(()=>validateReviewEvidence(o,report(o,"B",{
    findings:[{path:"other/file.ts",line:4,severity:"P1",code:"AUTH_BYPASS"}]
  })),/scoped path/);
});
test("untrusted artifact URL is denied",()=>{
  const o=workOrder();
  assert.throws(()=>validateReviewEvidence(o,report(o,"B",{
    evidenceRefs:["https://attacker.invalid/review"]
  })),/GitHub evidence/);
});
test("without a server-owned trust adapter even two reports are blocked",async()=>{
  await blocked(assess(workOrder(),undefined,undefined,{}));
});
test("expired grant cannot use old A/B proofs",async()=>{
  const o=workOrder();
  await blocked(assess(o,report(o),report(o,"B"),trust(o),"2026-11-11T09:10:00.000Z"));
});
test("issuer must be independently authenticated",async()=>{
  const o=workOrder();
  await blocked(assess(o,report(o),report(o,"B"),trust(o,{verifyIssuerGrant:async()=>false})));
});
test("stale canonical source and CAS version cannot pass",async()=>{
  const o=workOrder(),t=trust(o),get=t.readCanonicalSnapshot;
  await blocked(assess(o,report(o),report(o,"B"),{
    ...t,readCanonicalSnapshot:async()=>({...await get(),sourceRevision:"f".repeat(40)})}));
  await blocked(assess(o,report(o),report(o,"B"),{
    ...t,readCanonicalSnapshot:async()=>({...await get(),stateVersion:8})}));
});
test("no A evidence returns A_REVIEW_REQUIRED, never fake PASS",async()=>{
  const o=workOrder(),x=await assess(o,null,null);
  assert.equal(x.status,"A_REVIEW_REQUIRED");assert.equal(x.qualityGatePassed,false);
});
test("A handoff alone cannot certify B",async()=>{
  const o=workOrder(),x=await assess(o,report(o),null);
  assert.equal(x.status,"B_REVIEW_REQUIRED");assert.match(x.reason,/NOT_RUN/);
});
test("A reported blocker remains BLOCKED",async()=>{
  const o=workOrder();
  await blocked(assess(o,report(o,"A",{verdict:"BLOCKED"}),null));
});
test("B cannot reuse A actor, credentials, run ID or evidence digest",async()=>{
  const o=workOrder();
  for(const p of [{reviewerActorId:"agent:A"},{credentialFingerprint:d1},
    {checkRunId:123},{evidenceDigest:d1}]){
    await blocked(assess(o,report(o),report(o,"B",p)));
  }
});
test("B mismatching source bytes fail closed",async()=>{
  const o=workOrder();
  await blocked(assess(o,report(o),report(o,"B",{sourceDigest:d2})));
});
test("B independent verification cannot be self-asserted",async()=>{
  const o=workOrder();
  await blocked(assess(o,report(o),report(o,"B"),trust(o,{
    verifyIndependentBReadback:async()=>false
  })));
});
test("a forged B independent report cannot use A tests",async()=>{
  const o=workOrder();
  await blocked(assess(o,report(o),report(o,"B"),trust(o,{
    verifyReviewEvidence:async(_e,role)=>role!=="B"
  })));
});
test("future and out-of-order B timestamps denied",async()=>{
  const o=workOrder();
  await blocked(assess(o,report(o),report(o,"B",{observedAt:"2026-11-11T09:05:00.000Z"})));
  await blocked(assess(o,report(o,"A",{observedAt:"2026-11-11T09:01:30.000Z"}),
    report(o,"B",{observedAt:"2026-11-11T09:01:00.000Z"})));
});
test("B REQUEST_CHANGES only creates A repair proposal",async()=>{
  const o=workOrder(),f={path:"src/example.ts",line:25,severity:"P1",code:"AUTH_BYPASS"};
  const x=await assess(o,report(o),report(o,"B",{verdict:"REQUEST_CHANGES",findings:[f]}));
  assert.equal(x.status,"A_REPAIR_REQUIRED");assert.equal(x.productionAuthorized,false);
});
test("B ACCEPT waits for canonical gates without creating an Owner candidate",async()=>{
  const x=await assess();
  assert.equal(x.status,"CANONICAL_GATES_REQUIRED");
  assert.equal(x.authenticatedCASRequired,true);
  assert.equal(x.qualityGatePassed,false);assert.equal(x.ownerApproved,false);
  assert.equal(x.productionAuthorized,false);
});
test("issuer, exact scope, budget and authorization window changes invalidate old evidence",async()=>{
  const original=workOrder(),a=report(original),b=report(original,"B");
  for(const changed of [
    {issuerGrantDigest:d2},
    {scope:{...original.scope,allowedPaths:["src/other.ts"]}},
    {scope:{...original.scope,maxBytes:65535}},
    {expiresAt:"2026-11-11T09:08:00.000Z"},
    {issuedAt:"2026-11-11T09:00:01.000Z"}
  ]){
    const current={...original,...changed};current.orderKey=reviewOrderKey(current);
    assert.notEqual(current.orderKey,original.orderKey);
    await blocked(assess(current,a,b,trust(current)));
  }
});
test("legacy v1 key is denied; scope-set ordering stays deterministic",()=>{
  const o=workOrder(),scope={...o.scope,allowedPaths:["aa.txt","bb.txt"],maxFiles:2};
  assert.equal(reviewOrderKey({...o,scope}),reviewOrderKey({...o,scope:{...scope,allowedPaths:[...scope.allowedPaths].reverse()}}));
  assert.throws(()=>validateReviewWorkOrder({...o,orderKey:d2}),/idempotency/);
});
test("authority-bound v2 key matches the actual Reviewer B shared fixture",()=>{
  const original=workOrder();
  const o={...original,pullRequestNumber:163,issuedAt:"2026-11-14T12:00:00.000Z",
    expiresAt:"2026-11-14T12:05:00.000Z",scope:{...original.scope,maxBytes:4096}};
  assert.equal(reviewOrderKey(o),
    "sha256:42280246406da6cbfe110d0880cee062e8bbb49a0fe713c5285a853a17408193");
});
test("accepting verdict cannot hide P0 or P1 findings",async()=>{
  const o=workOrder();
  for(const severity of ["P0","P1"]){
    for(const verdict of ["ACCEPT","ACCEPT_WITH_NOTES"]){
      const b=report(o,"B",{verdict,findings:[{path:"src/example.ts",line:1,severity,code:"AUTH_BYPASS"}]});
      assert.throws(()=>validateReviewEvidence(o,b),/blocking findings/);
      await blocked(assess(o,report(o),b));
    }
  }
});
test("issuer revocation during B verification invalidates result",async()=>{
  const o=workOrder();let active=true;
  await blocked(assess(o,report(o),report(o,"B"),trust(o,{
    verifyIssuerGrant:async()=>active,
    verifyIndependentBReadback:async()=>{active=false;return true;}
  })));
});
test("A-only handoff cannot advance after issuer revocation or canonical drift",async()=>{
  const o=workOrder(),t=trust(o);
  for(const mode of ["issuer","CAS"]){
    let active=true;
    await blocked(assess(o,report(o),null,{...t,
      verifyIssuerGrant:async()=>mode!=="issuer"||active,
      readCanonicalSnapshot:async()=>({...await t.readCanonicalSnapshot(),
        stateVersion:mode==="CAS"&&!active?5:4}),
      verifyReviewEvidence:async()=>{active=false;return true;}
    }));
  }
});
test("canonical state change during B verification invalidates result",async()=>{
  const o=workOrder(),t=trust(o);let reads=0;
  await blocked(assess(o,report(o),report(o,"B"),{...t,
    readCanonicalSnapshot:async()=>({...await t.readCanonicalSnapshot(),stateVersion:++reads===1?4:5})
  }));
});
test("an expired grant is denied after asynchronous verification completes",async()=>{
  const o=workOrder();o.expiresAt="2026-11-11T09:02:00.020Z";o.orderKey=reviewOrderKey(o);
  await blocked(assess(o,report(o),report(o,"B"),trust(o,{
    verifyIndependentBReadback:async()=>{
      await new Promise(resolve=>setTimeout(resolve,35));return true;
    }
  })));
});
test("asynchronous trust cannot replace the admitted request via caller mutation",async()=>{
  const o=workOrder(),a=report(o),b=report(o,"B");let checkedB=false;
  const x=await assess(o,a,b,trust(o,{
    verifyReviewEvidence:async(e,role)=>{
      if(role==="A"){b.verdict="REQUEST_CHANGES";o.scope.allowedPaths[0]="src/replaced.ts";}
      if(role==="B"){checkedB=true;assert.equal(e.verdict,"ACCEPT");assert.ok(Object.isFrozen(e));}
      return true;
    },
    readCanonicalSnapshot:async order=>({...await trust(workOrder()).readCanonicalSnapshot(order)})
  }));
  assert.equal(checkedB,true);assert.equal(x.status,"CANONICAL_GATES_REQUIRED");
});
test("B BLOCKED remains blocked regardless of successful CI claims",async()=>{
  const o=workOrder();await blocked(assess(o,report(o),report(o,"B",{verdict:"BLOCKED"})));
});
test("canonical source manifest digest matches Reviewer B exact cross-repo v1 fixture",()=>{
  const files=[
    {path:"z.txt",bytes:3,sha256:"sha256:"+"b".repeat(64)},
    {path:"src/example.ts",bytes:12,sha256:"sha256:"+"a".repeat(64)}
  ];
  assert.equal(reviewSourceDigestV1(files),
    "sha256:2b6e337df69380382d6f968697356a5747719aa98a15ab120de5749c51250f03");
  assert.equal(reviewSourceDigestV1(files),reviewSourceDigestV1([...files].reverse()));
  assert.notEqual(reviewSourceDigestV1(files),reviewSourceDigestV1([
    {...files[0],bytes:4},files[1]
  ]));
});
test("source manifest cannot claim duplicate path, traversal, invalid digest or unlimited bytes",()=>{
  const f={path:"src/example.ts",bytes:12,sha256:"sha256:"+"a".repeat(64)};
  assert.throws(()=>reviewSourceDigestV1([f,f]),/duplicate/);
  assert.throws(()=>reviewSourceDigestV1([{...f,path:"src/../escape"}]),/invalid source/);
  assert.throws(()=>reviewSourceDigestV1([{...f,sha256:"a".repeat(40)}]),/invalid source/);
  assert.throws(()=>reviewSourceDigestV1([{...f,bytes:512001}]),/invalid source/);
});
test("WorkOrder cannot invent a second CAS state separate from WorkPackage recordVersion",()=>{
  const o=workOrder();o.expectedStateVersion++;
  assert.throws(()=>validateReviewWorkOrder(o),/WorkPackage.meta.recordVersion/);
});
