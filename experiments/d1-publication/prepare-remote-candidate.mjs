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

const help = `Recovery candidate helper — read-only, quarantined
Usage: node prepare-remote-candidate.mjs <exact P1 checkout> <reviewed evidence JSON>
       node prepare-remote-candidate.mjs --help
       node prepare-remote-candidate.mjs --status
--status describes this candidate, not live Cloudflare or current Owner authority.
No configuration, grant, upload, or publication can be produced by this revision.
Next: use existing Hub Issue #159 to reconcile historical authority or a separately constituted prospective foundation. Do not submit credentials or repeat Owner request 7200334604.`;
const guidance = new Map([
  ["Wrong local Worker", "Check the intended isolated P1 Worker."],
  ["Expected isolated QA config", "Use the existing isolated P1 QA configuration."],
  ["Unexpected Worker entry or compatibility", "Reconcile the exact P1 build configuration."],
  ["Unexpected local variables", "Use only the expected QA variables; do not supply bootstrap credentials."],
  ["Expected one local D1 binding", "Check the isolated QA binding inventory."],
  ["Expected dummy QA D1 binding", "Use the dummy QA binding, never a live database."],
  ["Unexpected local route or environment override", "Remove unexpected overrides from the isolated input."],
  ["Remote target evidence mismatch", "Reconcile the exact target and revision with existing read-only evidence."],
  ["Remote preflight evidence incomplete", "Collect missing C2 evidence from the existing Cloudflare account."],
  ["Existing bindings require explicit reconciliation", "Reconcile bindings before any remote operation."],
  ["Existing deployment ID required", "Read the existing deployment ID and rollback version."],
  ["Existing ledger evidence reference required", "Reference existing Hub Issue #159 evidence."],
  ["CONTINUITY_AUTHORITY_NOT_ADMITTED", "Establish legitimate continuity or a separately constituted foundation; no repeat Owner request."],
  ["CHECKOUT_UNAVAILABLE", "Open the existing exact P1 checkout; do not create or deploy resources."],
  ["CHECKOUT_MISMATCH", "Use the exact clean P1 checkout; preserve existing local changes."],
  ["INPUT_UNREADABLE", "Check that the two local JSON files exist and contain valid JSON; do not paste their contents into chat."],
  ["USAGE", "Run with --help for the permitted invocation."],
]);
function fail(code){throw new Error(code);}
function readJson(path){try{return JSON.parse(readFileSync(path,"utf8"));}catch{fail("INPUT_UNREADABLE");}}
function main(args){
  if(args.length===1&&args[0]==="--help"){console.log(help);return;}
  if(args.length===1&&args[0]==="--status"){
    console.log("CANDIDATE_QUARANTINED: C0/C1 not admitted at this revision; C2 live status unverified by this command. No config or authority issued. Next: "+guidance.get("CONTINUITY_AUTHORITY_NOT_ADMITTED"));return;
  }
  const [rootArg,evidenceArg]=args;
  if(!rootArg||!evidenceArg||args.length!==2||args.some(a=>a.startsWith("--")))fail("USAGE");
  const root=resolve(rootArg);
  const expected="0c2243342f0bb787fd93d3351c1a1a1d7f30e4f0";
  const git=(...args)=>{try{return execFileSync("git",args,{cwd:root,encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();}catch{fail("CHECKOUT_UNAVAILABLE");}};
  if(git("rev-parse","HEAD")!==expected||git("status","--porcelain=v1","--untracked-files=all")!=="")fail("CHECKOUT_MISMATCH");
  const original=join(root,"apps/web/dist/server/wrangler.json");
  const evidence=readJson(resolve(evidenceArg));
  prepareRemoteCandidate(readJson(original),evidence);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{main(process.argv.slice(2));}catch(error){
    const message=error instanceof Error?error.message:"";
    const code=message.startsWith("CONTINUITY_AUTHORITY_NOT_ADMITTED:")?"CONTINUITY_AUTHORITY_NOT_ADMITTED":guidance.has(message)?message:"UNEXPECTED_INPUT";
    console.error("BLOCKED ["+code+"] — "+(guidance.get(code)??"Check input shape and report the error category without secrets.")+" No configuration or authority issued.");
    process.exitCode=2;
  }
}
