import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { selectGraphConsumerLifecyclePinsCandidate } from '../../apps/web/src/server/graph-consumer-lifecycle.candidate.mjs';
import { inspectLifecycleBoundHubGraphCandidate } from '../../apps/web/src/server/graph-read-lifecycle.candidate.mjs';

const NOW = 1800000000;
const PROJECT = 'project:blueprint-os';
const OTHER = 'project:another';
const KID = 'c32-active-key';
const OLD_KID = 'c32-old-key';
const privateActive = generateKeyPairSync('ec',{ namedCurve:'prime256v1' });
const privateOld = generateKeyPairSync('ec',{ namedCurve:'prime256v1' });
const publicOf = p => p.publicKey.export({format:'jwk'});
const pinOf = p => 'sha256:' + createHash('sha256').update(p.publicKey.export({format:'der',type:'spki'})).digest('hex');
const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
const claims = (projectId = PROJECT, jti = 'abcdefghijklmnopqrstuvwx') => ({
  iss:'BlueDragon33/Application-Management',sub:'BlueDragon33/Application-Management',
  aud:'BlueDragon33/Software-Blueprint-Hub',scope:'graph:read:project',
  projectId,resource:'hub-canonical-graph',method:'GET',
  iat:NOW-10,nbf:NOW-10,exp:NOW+40,jti,
});
function token(kid=KID,pair=privateActive,projectId=PROJECT,jti='abcdefghijklmnopqrstuvwx') {
  const input=b64({alg:'ES256',typ:'BLUEPRINT-GRAPH-READ-CANDIDATE',kid})+'.'+b64(claims(projectId,jti));
  return input+'.'+sign('sha256',Buffer.from(input,'ascii'),{key:pair.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
}
function record(pair=privateActive, state='active') {
  return {
    state,
    publicJwk:publicOf(pair), spkiSha256:pinOf(pair),projectIds:[PROJECT],
    validFromSeconds:NOW-100,validUntilSeconds:NOW+3600,
    revokedAtSeconds:state==='revoked'?NOW:null,
    overlapFromSeconds:state==='overlap'?NOW-30:null,
    overlapUntilSeconds:state==='overlap'?NOW+30:null,
  };
}
function registry(active=record()) { return new Map([[KID,active]]); }
const deny = result => {
  assert.equal(result.ok,false);
  assert.equal(result.transportEnabled,false);
  assert.equal(result.canReadGraphExternally,false);
};
function fakeNonceDb() {
  const consumed=new Set();
  return async (_sql,params) => {
    const key=params.slice(0,3).join(':');
    if(consumed.has(key))return {rowCount:0,rows:[]};
    consumed.add(key);return {rowCount:1,rows:[{nonce:params[2]}]};
  };
}
const HASH='sha256:'+'a'.repeat(64),REV='b'.repeat(40);
function graph(projectId=PROJECT) {
  return {schemaVersion:'1.0.0',projectId,policyVersion:'1.3.0',fingerprint:HASH,
    sourceCodeRevision:REV,intelligence:'deterministic-rules-not-llm',
    canonicalMutationAllowed:false,qualityGateMutationAllowed:false,
    releaseAuthority:false,agentDispatchAllowed:false,
    nodes:[{id:'wp1',label:'One source node',kind:'work-package',domain:'workflow',
      verification:'unverified',approval:'not-conferred',source:{kind:'canonical-record',
      reference:'work-package:wp1',revision:REV,digest:HASH,
      codePath:'packages/application/src/graph-intelligence.ts'}}],edges:[]};
}
const load=async encoded=>{
  const id=decodeURIComponent(encoded);
  return {state:'ready',profile:{projectId:id},graph:graph(id)};
};
function call(patch={}) {
  return inspectLifecycleBoundHubGraphCandidate({trustedLifecycle:registry(),
    compactJws:token(),projectId:PROJECT,nowSeconds:NOW,
    executeNonceSql:fakeNonceDb(),loadTrustedGraph:load,
    projectAudience:new Set([PROJECT]),...patch});
}

test('active unexpired pin selects internally with no external grants',()=>{
  const r=selectGraphConsumerLifecyclePinsCandidate({trustedLifecycle:registry(),projectId:PROJECT,nowSeconds:NOW});
  assert.equal(r.ok,true);
  assert.equal(r.status,'INTERNAL_PIN_SELECTION_ONLY_NOT_AUTHORIZED');
  assert.equal(r.pins.size,1);assert.equal(r.pins.has(KID),true);
  assert.equal(r.transportEnabled,false);assert.equal(r.canReadGraphExternally,false);
});

test('real local signature and internal graph composition remain NOT AUTHORIZED',async()=>{
  const r=await call();
  assert.equal(r.ok,true);
  assert.equal(r.status,'INTERNAL_COMPOSITION_VALIDATED_NOT_AUTHORIZED');
  assert.equal(r.nodeCount,1);assert.equal(r.edgeCount,0);
  for(const name of ['transportEnabled','canReadGraphExternally','canonicalMutationAllowed',
    'gateMutationAllowed','releaseAuthority','agentDispatchAllowed'])assert.equal(r[name],false);
  assert.equal(Object.hasOwn(r,'nodes'),false);
});

test('revoked key is rejected immediately even if the token is not yet expired',async()=>{
  let sqlCalls=0,loadCalls=0;
  const denied=await call({trustedLifecycle:registry(record(privateActive,'revoked')),
    executeNonceSql:async()=>{sqlCalls++;return {rowCount:1,rows:[]}},
    loadTrustedGraph:async()=>{loadCalls++;return load(encodeURIComponent(PROJECT))}});
  deny(denied);assert.equal(sqlCalls,0);assert.equal(loadCalls,0);
});

test('retired and expired keys cannot authenticate',async()=>{
  deny(await call({trustedLifecycle:registry(record(privateActive,'retired'))}));
  deny(await call({trustedLifecycle:registry({...record(),validUntilSeconds:NOW})}));
  deny(await call({trustedLifecycle:registry({...record(),validFromSeconds:NOW+1})}));
});

test('rotation overlap allows a bounded old key ONLY with one active new key',async()=>{
  const old=record(privateOld,'overlap');
  const keys=registry();keys.set(OLD_KID,old);
  const r=selectGraphConsumerLifecyclePinsCandidate({trustedLifecycle:keys,projectId:PROJECT,nowSeconds:NOW});
  assert.equal(r.ok,true);assert.equal(r.pins.size,2);
  const signedOld=token(OLD_KID,privateOld);
  const ok=await call({trustedLifecycle:keys,compactJws:signedOld});
  assert.equal(ok.ok,true);assert.equal(ok.canReadGraphExternally,false);
});

test('bounded overlap closes at end time with no grace after revocation',async()=>{
  const keys=registry();keys.set(OLD_KID,record(privateOld,'overlap'));
  let result=selectGraphConsumerLifecyclePinsCandidate({trustedLifecycle:keys,projectId:PROJECT,nowSeconds:NOW+30});
  assert.equal(result.ok,true);assert.equal(result.pins.has(OLD_KID),false);
  keys.set(OLD_KID,{...record(privateOld,'revoked'),overlapFromSeconds:null,overlapUntilSeconds:null});
  deny(await call({trustedLifecycle:keys,compactJws:token(OLD_KID,privateOld)}));
});

test('overlap-only or two active keys is refused to prevent indefinite trust forks',()=>{
  deny(selectGraphConsumerLifecyclePinsCandidate({trustedLifecycle:new Map([[OLD_KID,record(privateOld,'overlap')]]),projectId:PROJECT,nowSeconds:NOW}));
  const keys=registry();keys.set(OLD_KID,record(privateOld));
  deny(selectGraphConsumerLifecyclePinsCandidate({trustedLifecycle:keys,projectId:PROJECT,nowSeconds:NOW}));
});

test('overlap longer than two minutes or invalid overlap chronology is denied',()=>{
  const old=record(privateOld,'overlap');
  for(const patch of [{overlapUntilSeconds:NOW+250},{overlapFromSeconds:NOW+35},
    {overlapFromSeconds:NOW-1000},{overlapUntilSeconds:NOW+3700}]){
    const keys=registry();keys.set(OLD_KID,{...old,...patch});
    deny(selectGraphConsumerLifecyclePinsCandidate({trustedLifecycle:keys,projectId:PROJECT,nowSeconds:NOW}));
  }
});

test('registry poisoning, unknown fields and duplicate SPKI aliases deny',()=>{
  const base=record();
  for(const change of [{evil:'owner'},{spkiSha256:'sha256:0'},{projectIds:[PROJECT,PROJECT]},
    {publicJwk:{...base.publicJwk,d:'private'}},{state:'approved'},{overlapFromSeconds:NOW-2}]){
    deny(selectGraphConsumerLifecyclePinsCandidate({trustedLifecycle:registry({...base,...change}),projectId:PROJECT,nowSeconds:NOW}));
  }
  const keys=registry();keys.set(OLD_KID,{...record(),state:'retired'});
  deny(selectGraphConsumerLifecyclePinsCandidate({trustedLifecycle:keys,projectId:PROJECT,nowSeconds:NOW}));
});

test('cross-project audience is never inferred from signed public key',async()=>{
  const keys=registry({...record(),projectIds:[OTHER]});
  deny(await call({trustedLifecycle:keys}));
  deny(await call({projectAudience:new Set([OTHER])}));
});

test('forbidden Hub PROJECT_READ still denies after valid rotation keys',async()=>{
  deny(await call({loadTrustedGraph:async()=>({state:'forbidden'})}));
  deny(await call({loadTrustedGraph:async()=>({state:'ready',profile:{projectId:OTHER},graph:graph(OTHER)})}));
});

test('nonce replay stays global and rejects repeat even under valid lifecycle',async()=>{
  const db=fakeNonceDb();
  assert.equal((await call({executeNonceSql:db})).ok,true);
  deny(await call({executeNonceSql:db}));
});

test('invalid registry and non-integer clock fail closed before I/O',async()=>{
  for(const patch of [{trustedLifecycle:null},{trustedLifecycle:new Map()},
    {nowSeconds:NaN},{nowSeconds:-1},{nowSeconds:NOW+0.4},
    {projectId:'project:blueprint-os\n'}, {trustedLifecycle:new Map([['!bad',record()]])}]){
    let sql=0,reads=0;
    const r=await call({...patch,executeNonceSql:async()=>{sql++;return {}},
      loadTrustedGraph:async()=>{reads++;return load(encodeURIComponent(PROJECT))}});
    deny(r);assert.equal(sql,0);assert.equal(reads,0);
  }
});

test('lifecycle and wrapper have no external endpoint or request-time trust bootstrap',async()=>{
  const {readFileSync}=await import('node:fs');
  const {dirname,resolve}=await import('node:path');
  const {fileURLToPath}=await import('node:url');
  const dir=dirname(fileURLToPath(import.meta.url));
  const names=['graph-consumer-lifecycle.candidate.mjs','graph-read-lifecycle.candidate.mjs'];
  for(const name of names){
    const src=readFileSync(resolve(dir,'../../apps/web/src/server',name),'utf8');
    assert.doesNotMatch(src,/export\s+async\s+function\s+(GET|POST)|\bfetch\s*\(|Response\.json\s*\(/);
  }
});
