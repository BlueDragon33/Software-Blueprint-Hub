// P3 candidate-only configuration preparation; no deploy, no network, no SQL.
// Keep this tool outside the exact P1 checkout. Evidence JSON is operator
// assertion, not independent proof or a deployment grant. Review ledger first.
import {readFileSync,writeFileSync,readdirSync,lstatSync,existsSync} from "node:fs";
import {resolve,join,relative} from "node:path";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {pathToFileURL} from "node:url";
export function prepareRemoteCandidate(local,evidence) {
  const need=(condition,message)=>{if(!condition)throw new Error(message);};
  const target={revision:"0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0",accountId:"f88a42260814230aa4a151abbfe5659d",worker:"software-blueprint-hub",host:"software-blueprint-hub.boiech-ai.workers.dev",database:"software-blueprint-hub-db",databaseId:"4f2a47a5-e250-45ae-8ed1-19afcb04415d",subject:"297152795"};
  need(local&&typeof local==="object"&&local.name===target.worker,"Wrong local Worker");
  need(local.workers_dev===false&&local.preview_urls===false&&!local.account_id,"Expected isolated QA config");
  need(local.main==="index.js"&&local.compatibility_flags?.includes("nodejs_compat"),"Unexpected Worker entry or compatibility");
  need(Object.keys(local.vars??{}).length===1&&local.vars.BLUEPRINT_PERSISTENCE_PROVIDER==="d1","Unexpected local variables");
  need(Array.isArray(local.d1_databases)&&local.d1_databases.length===1,"Expected one local D1 binding");
  const db=local.d1_databases[0];
  need(db.binding==="BLUEPRINT_CANONICAL_DB"&&db.database_id==="00000000-0000-0000-0000-000000000003"&&db.remote!==true,"Expected dummy QA D1 binding");
  need(!local.routes?.length&&!local.route&&!local.env,"Unexpected local route or environment override");
  need(evidence?.revision===target.revision&&evidence.accountId===target.accountId&&evidence.worker===target.worker&&evidence.host===target.host&&evidence.databaseId===target.databaseId,"Remote target evidence mismatch");
  need(evidence.schemaReadback===true&&evidence.exclusiveDatabase===true&&evidence.accessProtected===true&&evidence.previewUrls===false&&evidence.workersDev===true&&Array.isArray(evidence.customRoutes)&&evidence.customRoutes.length===0&&evidence.freePlan===true,"Remote preflight evidence incomplete");
  need(Array.isArray(evidence.existingBindings)&&evidence.existingBindings.length===0,"Existing bindings require explicit reconciliation");
  need(typeof evidence.deploymentId==="string"&&evidence.deploymentId.trim().length>0,"Existing deployment ID required");
  need(typeof evidence.evidenceRef==="string"&&evidence.evidenceRef.startsWith("https://github.com/BlueDragon33/Software-Blueprint-Hub/issues/159#issuecomment-"),"Existing ledger evidence reference required");
  return {...local,account_id:target.accountId,workers_dev:true,preview_urls:false,vars:{BLUEPRINT_PERSISTENCE_PROVIDER:"d1",BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER:"github",BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT:target.subject},d1_databases:[{binding:"BLUEPRINT_CANONICAL_DB",database_name:target.database,database_id:target.databaseId}]};
}

function main(){
  const [rootArg,evidenceArg]=process.argv.slice(2);
  if(!rootArg||!evidenceArg||process.argv.length!==4)throw Error("Usage: node prepare-remote-candidate.mjs <exact P1 checkout> <reviewed evidence JSON>");
  const root=resolve(rootArg);
  const expected="0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0";
  const git=(...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8"}).trim();
  if(git("rev-parse","HEAD")!==expected||git("status","--porcelain=v1","--untracked-files=all")!=="")throw Error("Exact clean P1 checkout required");
  execFileSync(process.execPath,["experiments/d1-publication/verify-worker-bundle.mjs"],{cwd:root,env:{...process.env,EXPECTED_CANDIDATE_REVISION:expected},stdio:"inherit"});
  const dist=join(root,"apps/web/dist"),dir=join(dist,"server");
  const original=join(dir,"wrangler.json"),out=join(dir,"wrangler.remote-candidate.json"),manifest=join(dir,"remote-candidate-manifest.json");
  if(existsSync(out)||existsSync(manifest))throw Error("Existing candidate output; reconcile manually");
  const config=prepareRemoteCandidate(JSON.parse(readFileSync(original,"utf8")),JSON.parse(readFileSync(resolve(evidenceArg),"utf8")));
  const hash=(b)=>createHash("sha256").update(b).digest("hex");
  const files=[];
  function walk(p){for(const name of readdirSync(p).sort()){const f=join(p,name),st=lstatSync(f);if(st.isSymbolicLink())throw Error("Unexpected bundle symlink");if(st.isDirectory())walk(f);else if(st.isFile())files.push({path:relative(dist,f).replaceAll("\\\\","/"),size:st.size,sha256:hash(readFileSync(f))});else throw Error("Unexpected bundle entry");}}
  walk(dist);
  const bytes=JSON.stringify(config,null,2)+"\n";
  const record={status:"REMOTE_CONFIG_CANDIDATE_ONLY",revision:expected,originalConfigSHA256:hash(readFileSync(original)),remoteConfigSHA256:hash(bytes),files,requiredSecrets:["AUTH_SECRET","GITHUB_ID","GITHUB_SECRET"],deployed:false,releaseAuthority:false};
  writeFileSync(out,bytes,{flag:"wx"});
  writeFileSync(manifest,JSON.stringify(record,null,2)+"\n",{flag:"wx"});
  console.log(JSON.stringify({status:record.status,revision:expected,files:files.length,remoteConfigSHA256:record.remoteConfigSHA256,deployed:false,releaseAuthority:false}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main();
