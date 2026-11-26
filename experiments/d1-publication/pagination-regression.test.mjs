import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectC2} from './collect-c2-inventory.mjs';
const worker='software-blueprint-hub';
const version='e72a8886-0000-4000-8000-000000000001';
const deployment='00000000-0000-4000-8000-000000000002';
const target='4f2a47a5-e250-45ae-8ed1-19afcb04415d';
function fixture({versionPage={page:0,total_pages:9},scriptPage={page:1,total_pages:1},deploymentPage={page:1,total_pages:9},binding=false}={}){
  const calls=[];
  const fetchImpl=async(url,options)=>{
    assert.equal(options.method,'GET');
    const path=new URL(url).pathname.split('/scripts')[1]+new URL(url).search;
    calls.push(path);
    let result,result_info;
    if(path===''){result=[{id:worker}];result_info=scriptPage;}
    else if(path.endsWith('/versions?deployable=true')){result={items:[{id:version}]};result_info=versionPage;}
    else if(path.endsWith('/deployments?per_page=1')){result={deployments:[{id:deployment,versions:[{version_id:version}]}]};result_info=deploymentPage;}
    else if(path.endsWith('/versions/'+version)){result={id:version,resources:{bindings:binding?[{type:'d1',id:target}]:[]}};}
    else throw Error('unexpected path');
    return {ok:true,json:async()=>({success:true,result,result_info})};
  };
  return {calls,run:()=>collectC2({token:'fixture-only',fetchImpl})};
}
test('deployable endpoint ignores pagination metadata; inspect exact version',async()=>{
  const f=fixture();const r=await f.run();
  assert.equal(r.result,'NO_TARGET_IN_OBSERVED_STANDARD_VERSIONS');
  assert.equal(r.c2,'PARTIAL_NOT_ADMITTED');assert.equal(r.authority,'NOT_EVALUATED');
  assert.deepEqual(r.gaps,[]);assert.equal(r.observations[0].versions[0].versionId,version);
  assert.equal(r.requests,7);
});
test('deployable metadata cannot hide a target binding',async()=>{
  const r=await fixture({binding:true,versionPage:{page:1,total_pages:5}}).run();
  assert.equal(r.result,'TARGET_REFERENCE_FOUND');assert.equal(r.targetReferences[0].count,1);
});
test('ordinary script list still rejects incomplete pages',async()=>{
  const r=await fixture({scriptPage:{page:1,total_pages:2}}).run();
  assert.equal(r.result,'INCOMPLETE');assert.equal(r.gaps[0].code,'INCOMPLETE_PAGE');assert.equal(r.requests,1);
});
test('current deployment still rejects a non-first page',async()=>{
  const r=await fixture({deploymentPage:{page:2,total_pages:9}}).run();
  assert.equal(r.result,'INCOMPLETE');assert.equal(r.gaps[0].code,'INCOMPLETE_PAGE');
});
