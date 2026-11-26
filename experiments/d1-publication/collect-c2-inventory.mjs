// Read-only evidence collector, not an admission or authority verifier.
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const ACCOUNT='f88a42260814230aa4a151abbfe5659d';
const WORKER='software-blueprint-hub';
const TARGET='4f2a47a5-e250-45ae-8ed1-19afcb04415d';
const ROOT='https://api.cloudflare.com/client/v4/accounts/'+ACCOUNT+'/workers/scripts';
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v);
const name=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,128}$/.test(v);
function uniqueIds(items,valid,key){
  if(!Array.isArray(items))throw Error('MISSING_LIST');
  const ids=items.map(x=>x?.[key]);
  if(!ids.every(valid)||new Set(ids).size!==ids.length)throw Error('INVALID_OR_DUPLICATE_ID');
  return ids.sort();
}
function snapshot(versions,deployments){
  const deployable=uniqueIds(versions?.items,uuid,'id');
  if(!Array.isArray(deployments?.deployments))throw Error('MISSING_DEPLOYMENTS');
  const latest=deployments.deployments[0];
  if(latest&&(!uuid(latest.id)||!Array.isArray(latest.versions)||!latest.versions.length))throw Error('INVALID_DEPLOYMENT');
  const active=latest?uniqueIds(latest.versions,uuid,'version_id'):[];
  return {deployable,active,deploymentId:latest?.id??null};
}
function inspectVersion(result,id){
  if(result?.id!==id||!Array.isArray(result?.resources?.bindings))throw Error('VERSION_BINDINGS_UNAVAILABLE');
  let hits=0,unknown=0;
  for(const b of result.resources.bindings){
    if(!b||typeof b.type!=='string'){unknown++;continue;}
    if(b.type!=='d1')continue;
    if((b.database_id!==undefined&&!uuid(b.database_id))||(b.id!==undefined&&!uuid(b.id))||(!b.database_id&&!b.id)||(b.database_id&&b.id&&b.database_id.toLowerCase()!==b.id.toLowerCase())){unknown++;continue;}
    if((b.database_id??b.id).toLowerCase()===TARGET)hits++;
  }
  return {versionId:id,targetBindingCount:hits,unresolvedBindingCount:unknown};
}
export async function collectC2({token,fetchImpl=globalThis.fetch,maxRequests=1000}={}){
  const startedAt=new Date().toISOString();
  const report={schema:'blueprint-c2-observation-v1',accountId:ACCOUNT,targetDatabaseId:TARGET,worker:WORKER,startedAt,scope:'standard Worker scripts returned to the supplied credential; active and deployable versions only',c2:'PARTIAL_NOT_ADMITTED',authority:'NOT_EVALUATED',observations:[],gaps:[],requests:0};
  const gap=(code,worker)=>report.gaps.push(worker?{code,worker}:{code});
  async function get(path,{firstOnly=false}={}){
    if(report.requests>=maxRequests)throw Error('REQUEST_LIMIT');
    report.requests++;
    let r,j;try{r=await fetchImpl(ROOT+path,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(15000)});}catch{throw Error('NETWORK_OR_REDIRECT');}
    if(!r?.ok)throw Error(r?.status===401||r?.status===403?'READ_ACCESS_DENIED':'HTTP_FAILURE');
    try{j=await r.json();}catch{throw Error('INVALID_JSON');}
    if(j?.success!==true)throw Error('API_FAILURE');
    // Cloudflare documents deployable=true as ignoring pagination; keep all other checks.
    if(!path.endsWith('/versions?deployable=true')&&((j.result_info?.page!==undefined&&j.result_info.page!==1)||(!firstOnly&&j.result_info?.total_pages>1)))throw Error('INCOMPLETE_PAGE');
    return j.result;
  }
  const known=new Set(['REQUEST_LIMIT','NETWORK_OR_REDIRECT','READ_ACCESS_DENIED','HTTP_FAILURE','INVALID_JSON','API_FAILURE','INCOMPLETE_PAGE','MISSING_LIST','INVALID_OR_DUPLICATE_ID','MISSING_DEPLOYMENTS','INVALID_DEPLOYMENT','VERSION_BINDINGS_UNAVAILABLE']);
  const safe=e=>known.has(e?.message)?e.message:'UNEXPECTED_RESPONSE';
  if(typeof token!=='string'||!token.trim())gap('READ_TOKEN_UNAVAILABLE');
  else try{
    const scripts=uniqueIds(await get(''),name,'id');
    if(!scripts.includes(WORKER))gap('EXPECTED_WORKER_NOT_VISIBLE');
    for(const worker of scripts){
      const p='/'+encodeURIComponent(worker);
      try{
        const read=async()=>snapshot(await get(p+'/versions?deployable=true'),await get(p+'/deployments?per_page=1',{firstOnly:true}));
        const before=await read();
        if(!before.deployable.length&&!before.active.length)gap('NO_VISIBLE_VERSION',worker);
        if(worker===WORKER&&!before.deploymentId)gap('TARGET_DEPLOYMENT_NOT_VISIBLE',worker);
        const versions=[];
        for(const id of [...new Set([...before.deployable,...before.active])].sort()){
          try{const item=inspectVersion(await get(p+'/versions/'+id),id);versions.push(item);if(item.unresolvedBindingCount)gap('UNRESOLVED_BINDING',worker);}catch(e){gap(safe(e),worker);}
        }
        const after=await read();
        if(JSON.stringify(before)!==JSON.stringify(after))gap('VERSION_SET_CHANGED',worker);
        report.observations.push({worker,...before,versions});
      }catch(e){gap(safe(e),worker);}
    }
    if(JSON.stringify(scripts)!==JSON.stringify(uniqueIds(await get(''),name,'id')))gap('WORKER_SET_CHANGED');
  }catch(e){gap(safe(e));}
  report.finishedAt=new Date().toISOString();
  const hits=report.observations.flatMap(w=>w.versions.filter(v=>v.targetBindingCount>0).map(v=>({worker:w.worker,versionId:v.versionId,count:v.targetBindingCount})));
  report.targetReferences=hits;
  report.result=hits.length?'TARGET_REFERENCE_FOUND':report.gaps.length?'INCOMPLETE':'NO_TARGET_IN_OBSERVED_STANDARD_VERSIONS';
  report.remaining=['credential coverage and nonstandard Worker surfaces','non-atomic observation and freshness','Access/routes/preview, plan, D1 schema and storage, retained artifact and rollback admission','C0/C1 and protected authority'];
  return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  if(process.argv.length===3&&process.argv[2]==='--help')console.log('Read-only C2 inventory. Run with an existing account-scoped Cloudflare Workers read token in CLOUDFLARE_API_TOKEN. Do not paste token into chat. Only GET; output is redacted observation, never admission.');
  else if(process.argv.length!==2){console.error('Invalid arguments. Use --help.');process.exitCode=2;}
  else {const report=await collectC2({token:process.env.CLOUDFLARE_API_TOKEN});console.log(JSON.stringify(report,null,2));if(report.gaps.length||report.targetReferences.length)process.exitCode=2;}
}
