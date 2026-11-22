import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { verifyGraphConsumerProofCandidate } from "../../apps/web/src/server/graph-consumer-proof.candidate.mjs";

const ISSUER="BlueDragon33/Application-Management";
const AUDIENCE="BlueDragon33/Software-Blueprint-Hub";
const NOW=1800000000, PROJECT="project:blueprint-os", KID="c29-test-key";
const A=generateKeyPairSync("ec",{namedCurve:"prime256v1"});
const B=generateKeyPairSync("ec",{namedCurve:"prime256v1"});
const trusted=new Map([[KID,A.publicKey.export({format:"jwk"})]]);
const b64=obj=>Buffer.from(JSON.stringify(obj)).toString("base64url");
const header=()=>({alg:"ES256",typ:"BLUEPRINT-GRAPH-READ-CANDIDATE",kid:KID});
const payload=()=>({
  iss:ISSUER,sub:ISSUER,aud:AUDIENCE,scope:"graph:read:project",
  projectId:PROJECT,resource:"hub-canonical-graph",method:"GET",
  iat:NOW-10,nbf:NOW-10,exp:NOW+40,jti:"abcdefghabcdefghabcdefgh",
});
function token(head=header(),body=payload(),key=A.privateKey) {
  const unsigned=b64(head)+"."+b64(body);
  const signature=sign("sha256",Buffer.from(unsigned,"ascii"),
    {key,dsaEncoding:"ieee-p1363"}).toString("base64url");
  return unsigned+"."+signature;
}
const good=()=>token();
const fixed=()=>({compactJws:good(),expectedProjectId:PROJECT,
  trustedPublicKeys:trusted,nowSeconds:NOW});
function once() {
  const seen=new Set();
  return async claim=>{
    const id=claim.issuer+":"+claim.keyId+":"+claim.nonce;
    if(seen.has(id))return false;
    seen.add(id);return true;
  };
}
const verify=(patch={},nonce=once())=>verifyGraphConsumerProofCandidate(
  {...fixed(),consumeReplayNonce:nonce,...patch});

test("ES256 proof of ephemeral TEST key returns no transport, graph, QA, release or Agent rights",async()=>{
  const out=await verify();
  assert.equal(out.ok,true);
  assert.equal(out.status,"CRYPTO_PROOF_VALID_ONLY_NOT_AUTHORIZED");
  assert.equal(out.projectId,PROJECT);
  for(const key of ["canReadGraphExternally","transportEnabled","canonicalMutationAllowed",
    "gateMutationAllowed","releaseAuthority","agentDispatchAllowed"])assert.equal(out[key],false);
  assert.equal(Object.isFrozen(out),true);
});

test("cryptographic signature tampering is rejected before nonce consumption",async()=>{
  let calls=0;
  const original=good(),parts=original.split(".");
  const decoded=payload();decoded.projectId="project:other";
  const mutated=parts[0]+"."+b64(decoded)+"."+parts[2];
  const out=await verify({compactJws:mutated,expectedProjectId:"project:other"},
    async()=>{calls++;return true});
  assert.equal(out.ok,false);
  assert.equal(calls,0);
});

test("same key ID with a different private key cannot impersonate app",async()=>{
  assert.equal((await verify({compactJws:token(header(),payload(),B.privateKey)})).ok,false);
});

test("replayed nonce fails closed; hook errors or non-boolean response also deny",async()=>{
  const nonce=once(),input=fixed();
  assert.equal((await verifyGraphConsumerProofCandidate({...input,consumeReplayNonce:nonce})).ok,true);
  assert.equal((await verifyGraphConsumerProofCandidate({...input,consumeReplayNonce:nonce})).ok,false);
  assert.equal((await verify({},async()=>{throw Error("DB unavailable")})).ok,false);
  assert.equal((await verify({},async()=>({success:true}))).ok,false);
  assert.equal((await verify({},async()=>false)).ok,false);
});

test("missing approved key or missing atomic nonce repository never verifies identity",async()=>{
  assert.equal((await verify({trustedPublicKeys:new Map()})).ok,false);
  assert.equal((await verify({trustedPublicKeys:null})).ok,false);
  assert.equal((await verify({consumeReplayNonce:null})).ok,false);
  assert.equal((await verify({trustedPublicKeys:new Map([[KID,{}]])})).ok,false);
});

test("signed different project cannot serve requested project",async()=>{
  assert.equal((await verify({expectedProjectId:"project:other"})).ok,false);
  assert.equal((await verify({compactJws:token(header(),{...payload(),projectId:"project:other"})})).ok,false);
});

test("signed issuer/audience, scope, resource and method are exact allowlists",async()=>{
  for(const changes of [
    {iss:"other"},{sub:"user:someone"},{aud:"fake-hub"},
    {scope:"graph:write"},{resource:"release"},{method:"POST"},
  ]) {
    const out=await verify({compactJws:token(header(),{...payload(),...changes})});
    assert.equal(out.ok,false,JSON.stringify(changes));
  }
});

test("no alg none, wrong typ, wrong kid or additional header field",async()=>{
  for(const h of [
    {...header(),alg:"none"},{...header(),alg:"RS256"},
    {...header(),typ:"JWT"},{...header(),kid:"attacker"},
    {...header(),crit:["exp"]},
  ])assert.equal((await verify({compactJws:token(h)})).ok,false);
});

test("no unsigned extra payload fields can elevate roles or claimed approvals",async()=>{
  for(const extra of [{admin:true},{releaseAuthority:true},{agentDispatchAllowed:true},
    {role:"owner"},{userId:"owner"}]) {
    assert.equal((await verify({compactJws:token(header(),{...payload(),...extra})})).ok,false);
  }
});

test("expiry, far future, malformed times and excessive validity duration are rejected",async()=>{
  for(const changes of [
    {exp:NOW},{exp:NOW-1},{iat:NOW+8},{nbf:NOW+8},
    {iat:NOW-1000,exp:NOW+40},{nbf:NOW+6},
    {exp:"tomorrow"},{iat:1.2},{iat:-1},
  ])assert.equal((await verify({compactJws:token(header(),{...payload(),...changes})})).ok,false);
});

test("malformed token encoding, bad ECDSA signatures and oversized input denied",async()=>{
  const value=good();
  for(const compactJws of ["",null,undefined,"a.b","a.b.c.d",
    "%%%."+value.split(".").slice(1).join("."),
    value.slice(0,-1)+"!", "x".repeat(4097)]) {
    const out=await verify({compactJws});
    assert.equal(out.ok,false,String(compactJws).slice(0,25));
  }
});

test("invalid path/double-encoded and control-character project IDs cannot pass",async()=>{
  for(const expectedProjectId of ["",null,undefined,"project%3Ablueprint-os",
    "project/blueprint-os","project:blueprint-os\\other","project:blueprint-os\n",
    "project:blueprint-os\r","project:blueprint-os\u0000","x".repeat(257)]) {
    assert.equal((await verify({expectedProjectId})).ok,false,JSON.stringify(expectedProjectId));
  }
});

test("nonce consumption happens once and only after all cryptographic checks",async()=>{
  let consumed=0;const hook=async value=>{
    consumed++;
    assert.equal(value.issuer,ISSUER);
    assert.equal(value.keyId,KID);
    assert.equal(value.nonce,payload().jti);
    assert.equal(value.projectId,PROJECT);
    assert.equal(value.expiresAtSeconds,NOW+40);
    return true;
  };
  assert.equal((await verify({},hook)).ok,true);
  assert.equal(consumed,1);
  assert.equal((await verify({compactJws:token(header(),{...payload(),scope:"*"} )},hook)).ok,false);
  assert.equal(consumed,1);
});

test("no HTTP route or trusted-key bootstrap is contained in candidate",async()=>{
  const {readFileSync}=await import("node:fs");
  const src=readFileSync(new URL("../../apps/web/src/server/graph-consumer-proof.candidate.mjs",import.meta.url),"utf8");
  assert.doesNotMatch(src,/export\s+async\s+function\s+(GET|POST)\b/);
  assert.doesNotMatch(src,/\bfetch\(/);
  assert.match(src,/consumeReplayNonce/);
  assert.match(src,/createPublicKey/);
  assert.match(src,/dsaEncoding: "ieee-p1363"/);
});
