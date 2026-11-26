// P3 candidate preparation is quarantined pending historical authority recovery.
// Evidence JSON is an operator assertion, not proof of C0/C1 or a release grant.
// Known historical authority exists. An empty target DB is not a new system.
// No config or manifest may be emitted until an admitted continuity verifier
// is implemented and reviewed. Preserve the previous generator in Git history.
import {readFileSync} from "node:fs";
import {resolve,join} from "node:path";
import {execFileSync} from "node:child_process";
import {pathToFileURL} from "node:url";
export function prepareRemoteCandidate(local,evidence) {
  const need=(condition,message)=>{if(!condition)throw new Error(message);};
  const target={revision:"0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0",accountId:"f88a42260814230aa4a151abbfe5659d",worker:"software-blueprint-hub",host:"software-blueprint-hub.boiech-ai.workers.dev",database:"software-blueprint-hub-db",databaseId:"4f2a47a5-e250-45ae-8ed1-19afcb04415d"};
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
  // C0/C1 are known unresolved at this candidate revision. Neither arbitrary
  // evidence fields nor a GitHub ledger URL can authenticate prior authority.
  // Deliberately refuse even a syntactically complete C2 input. No override.
  throw new Error("CONTINUITY_AUTHORITY_NOT_ADMITTED: historical continuity must be resolved by a reviewed authenticated recovery mechanism before remote configuration preparation");
}

function main(){
  const [rootArg,evidenceArg]=process.argv.slice(2);
  if(!rootArg||!evidenceArg||process.argv.length!==4)throw Error("Usage: node prepare-remote-candidate.mjs <exact P1 checkout> <reviewed evidence JSON>");
  const root=resolve(rootArg);
  const expected="0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0";
  const git=(...args)=>execFileSync("git",args,{cwd:root,encoding:"utf8"}).trim();
  if(git("rev-parse","HEAD")!==expected||git("status","--porcelain=v1","--untracked-files=all")!=="")throw Error("Exact clean P1 checkout required");
  const original=join(root,"apps/web/dist/server/wrangler.json");
  const evidence=JSON.parse(readFileSync(resolve(evidenceArg),"utf8"));
  prepareRemoteCandidate(JSON.parse(readFileSync(original,"utf8")),evidence);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main();
