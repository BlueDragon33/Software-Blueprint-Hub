import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {collectC2} from './collect-c2-inventory.mjs';
const W='software-blueprint-hub',V='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',OLD='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',D='cccccccc-cccc-cccc-cccc-cccccccccccc',TARGET='4f2a47a5-e250-45ae-8ed1-19afcb04415d',SECRET='fixture-secret-never-print';
const ok=result=>({ok:true,json:async()=>({success:true,result})});
function fixture(overrides={}){
  const calls=[];
  const fetchImpl=async(url,opts)=>{
    const path=new URL(url).pathname.split('/workers/scripts')[1]+new URL(url).search;
    calls.push(path);assert.equal(new URL(url).origin,'https://api.cloudflare.com');assert.equal(opts.method,'GET');assert.equal(opts.redirect,'error');assert.equal(opts.headers.Authorization,'Bearer '+SECRET);
    if(overrides[path])return overrides[path](calls);
    if(path==='')return ok([{id:W,author_email:SECRET}]);
    if(path.endsWith('/versions?deployable=true'))return ok({items:[{id:V}]});
    if(path.endsWith('/deployments?per_page=1'))return ok({deployments:[{id:D,versions:[{version_id:OLD}]}]});
    if(path.endsWith('/'+V)||path.endsWith('/'+OLD))return ok({id:path.split('/').at(-1),resources:{bindings:[{type:'secret_text',text:SECRET}]}});
    throw Error('unexpected request');
  };
  return {calls,run:opts=>collectC2({token:SECRET,fetchImpl,...opts})};
}
const p='/'+W;
const version=(id,bindings)=>ok({id,resources:{bindings}});
const check=r=>{assert.equal(r.c2,'PARTIAL_NOT_ADMITTED');assert.equal(r.authority,'NOT_EVALUATED');assert.doesNotMatch(JSON.stringify(r),new RegExp(SECRET));};
test('collects active plus deployable versions, redacts and never claims C2 pass',async()=>{const f=fixture(),r=await f.run();check(r);assert.equal(r.result,'NO_TARGET_IN_OBSERVED_STANDARD_VERSIONS');assert.equal(r.observations[0].versions.length,2);assert.equal(r.requests,8);assert.ok(r.remaining.length);});
test('historical deployable target binding is reported',async()=>{const r=await fixture({[p+'/versions/'+V]:()=>version(V,[{type:'d1',database_id:TARGET}])}).run();check(r);assert.equal(r.result,'TARGET_REFERENCE_FOUND');assert.equal(r.targetReferences[0].versionId,V);});
test('active version missing from deployable list is still inspected',async()=>{const r=await fixture({[p+'/versions/'+OLD]:()=>version(OLD,[{type:'d1',id:TARGET.toUpperCase()}])}).run();check(r);assert.equal(r.targetReferences[0].versionId,OLD);});
test('missing binding array cannot become an empty binding list',async()=>{const r=await fixture({[p+'/versions/'+V]:()=>ok({id:V,resources:{}})}).run();check(r);assert.equal(r.result,'INCOMPLETE');assert.ok(r.gaps.some(x=>x.code==='VERSION_BINDINGS_UNAVAILABLE'));});
test('unknown and conflicting D1 IDs are gaps, not absence',async()=>{const r=await fixture({[p+'/versions/'+V]:()=>version(V,[{type:'d1'},{type:'d1',database_id:V,id:TARGET},null])}).run();check(r);assert.equal(r.result,'INCOMPLETE');assert.equal(r.observations[0].versions.find(x=>x.versionId===V).unresolvedBindingCount,3);});
test('version response must identify requested version',async()=>{const r=await fixture({[p+'/versions/'+V]:()=>version(OLD,[])}).run();check(r);assert.equal(r.result,'INCOMPLETE');});
test('missing scope / denied credential cannot become zero references',async()=>{const r=await fixture({'':()=>({ok:false,status:403,json:async()=>({secret:SECRET})})}).run();check(r);assert.equal(r.result,'INCOMPLETE');assert.equal(r.gaps[0].code,'READ_ACCESS_DENIED');});
test('missing token issues zero requests',async()=>{const f=fixture(),r=await f.run({token:''});check(r);assert.equal(f.calls.length,0);assert.equal(r.gaps[0].code,'READ_TOKEN_UNAVAILABLE');});
test('network or redirect errors do not leak raw message',async()=>{const r=await fixture({'':()=>{throw Error(SECRET)}}).run();check(r);assert.equal(r.gaps[0].code,'NETWORK_OR_REDIRECT');});
test('malformed provider JSON and pagination are incomplete',async()=>{for(const response of [{ok:true,json:async()=>{throw Error(SECRET)}},{ok:true,json:async()=>({success:true,result:[{id:W}],result_info:{total_pages:2}})}]){const r=await fixture({'':()=>response}).run();check(r);assert.equal(r.result,'INCOMPLETE');}});
test('changed version set is detected during observation',async()=>{const r=await fixture({[p+'/versions?deployable=true']:calls=>ok({items:[{id:calls.filter(x=>x===p+'/versions?deployable=true').length===1?V:OLD}]})}).run();check(r);assert.ok(r.gaps.some(x=>x.code==='VERSION_SET_CHANGED'));});
test('missing expected Worker and request bound are incomplete',async()=>{const r=await fixture({'':()=>ok([])}).run();check(r);assert.ok(r.gaps.some(x=>x.code==='EXPECTED_WORKER_NOT_VISIBLE'));const limited=await fixture().run({maxRequests:2});check(limited);assert.equal(limited.requests,2);assert.ok(limited.gaps.some(x=>x.code==='REQUEST_LIMIT'));});
test('operator can discover instructions or get a safe missing-token report',()=>{const script=fileURLToPath(new URL('./collect-c2-inventory.mjs',import.meta.url));const h=spawnSync(process.execPath,[script,'--help'],{encoding:'utf8'});assert.equal(h.status,0);assert.match(h.stdout,/Only GET/);assert.match(h.stdout,/Do not paste token/);const r=spawnSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,CLOUDFLARE_API_TOKEN:''}});assert.equal(r.status,2);assert.equal(r.stderr,'');const j=JSON.parse(r.stdout);check(j);assert.equal(j.gaps[0].code,'READ_TOKEN_UNAVAILABLE');});
test('current deployment query may have historical pages; only first is required',async()=>{const r=await fixture({[p+'/deployments?per_page=1']:()=>({ok:true,json:async()=>({success:true,result:{deployments:[{id:D,versions:[{version_id:OLD}]}]},result_info:{page:1,per_page:1,total_pages:4}})})}).run();check(r);assert.equal(r.result,'NO_TARGET_IN_OBSERVED_STANDARD_VERSIONS');assert.equal(r.observations[0].deploymentId,D);});
