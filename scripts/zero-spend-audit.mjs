#!/usr/bin/env node
// Read-only local ZERO-SPEND inventory. Never executes workflows or contacts GitHub.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const AUTO=new Set(["push","pull_request","pull_request_target","workflow_run","schedule","repository_dispatch","issue_comment","issues","check_run","check_suite","merge_group","release","deployment","deployment_status","create","delete","discussion","discussion_comment","status","workflow_call"]);
const MANUAL=new Set(["workflow_dispatch"]);
const OMIT=new Set(["node_modules",".git",".next","dist",".venv","vendor","coverage"]);
export function events(source){
 const lines=source.replace(/\r/g,"").split("\n"),idx=lines.findIndex(x=>/^(?:on|["']on["']):\s*/.test(x));
 if(idx<0)return {names:[],kind:"UNKNOWN"};
 const literal=lines[idx].replace(/^(?:on|["']on["']):\s*/,"").split("#")[0].trim();
 let names=[];
 if(literal) names=literal.startsWith("[")?literal.replace(/[\[\]]/g,"").split(",").map(s=>s.trim().replace(/["']/g,"")).filter(Boolean):[literal.replace(/["']/g,"")];
 else for(const line of lines.slice(idx+1)){
  if(!line.trim()||/^\s*#/.test(line))continue;
  if(/^\S/.test(line))break;
  const m=line.match(/^ {2}([A-Za-z_][\w-]*):(?:\s|$)/)||line.match(/^ {2}-\s+([A-Za-z_][\w-]*)\s*$/);
  if(m)names.push(m[1]);
 }
 names=[...new Set(names)];
 return {names,kind:!names.length||names.some(e=>!AUTO.has(e)&&!MANUAL.has(e))?"UNKNOWN":names.some(e=>AUTO.has(e))?"AUTO_OR_REUSABLE":"MANUAL_ONLY"};
}
export function assess(source,visibility,file){
 const trigger=events(source);
 const runner=[...source.matchAll(/^\s*runs-on:\s*(.+)$/gm)].map(m=>m[1].trim()).join(" ").toLowerCase();
 const platforms=["macos","windows","ubuntu","self-hosted"].filter(t=>runner.includes(t));
 const dynamic=!runner||runner.includes("$"+"{")||!platforms.length;
 const large=/(?:macos-[xsl]|\d+-core|runner-group|larger-runner)/.test(runner);
 const risk=visibility==="private"&&trigger.kind!=="MANUAL_ONLY"?"PRIVATE_AUTO_REVIEW":trigger.kind==="UNKNOWN"?"UNKNOWN_TRIGGER_REVIEW":large?"POTENTIAL_BILLING_REVIEW":dynamic?"UNKNOWN_RUNNER_REVIEW":platforms.includes("self-hosted")?"SELF_HOSTED_SECURITY_REVIEW":visibility==="public"?"PUBLIC_STANDARD_CANDIDATE":"MANUAL_NOT_COST_FREE";
 return {file,events:trigger.names,triggerKind:trigger.kind,runnerTypes:platforms,risk,costUnknown:true,ciExecuted:false};
}
function locations(root){
 const found=new Map();
 function visit(dir,depth){
  const w=path.join(dir,".github","workflows");
  if(fs.existsSync(w)&&fs.statSync(w).isDirectory()){found.set(path.basename(dir).toLowerCase(),w);return;}
  if(depth>=2)return;
  let children=[];try{children=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
  for(const e of children)if(e.isDirectory()&&!e.isSymbolicLink()&&!OMIT.has(e.name))visit(path.join(dir,e.name),depth+1);
 }
 visit(root,0);return found;
}
export function audit(root,inventory){
 const dirs=locations(root);
 const repositories=inventory.repositories.map(repo=>{
  const d=dirs.get(repo.name.toLowerCase());
  if(!d)return {repository:repo.name,status:"NOT_CHECKED_LOCAL_REPO_MISSING",workflows:[]};
  const workflows=fs.readdirSync(d).filter(f=>/\.ya?ml$/i.test(f)&&fs.statSync(path.join(d,f)).isFile())
   .map(f=>assess(fs.readFileSync(path.join(d,f),"utf8"),repo.visibility,f));
  return {repository:repo.name,status:"STATIC_LOCAL_AUDIT_ONLY",visibility:repo.visibility,workflows};
 });
 return {schema:"blueprint-os/local-zero-spend-candidate/v1",status:"NOT_RATIFIED",
  githubHostedMinutesConsumedByAudit:0,billingNotVerifiedLive:true,sourceSHAReadback:false,
  inventoryCount:repositories.length,scanned:repositories.filter(x=>x.status==="STATIC_LOCAL_AUDIT_ONLY").length,
  workflowCount:repositories.reduce((n,r)=>n+r.workflows.length,0),repositories,
  hardStops:["NO_RUNNER_AUTO_START","NO_AUTO_BILLING","NO_FAKE_PASS","NO_UNREVIEWED_SELF_HOSTED_RUNNER","NO_MERGE_PUBLISH_RATIFY"]};
}
export function cli(args=process.argv.slice(2)){
 const opts={};
 for(let i=0;i<args.length;i++){
  if(!["--root","--output","--inventory"].includes(args[i])||!args[i+1])throw Error("Expected --root, --output, or --inventory values");
  opts[args[i++].slice(2)]=args[i];
 }
 if(!opts.root)throw Error("Missing --root local workspace path");
 const inv=opts.inventory||path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../control/zero-spend-repository-inventory.candidate.v1.json");
 const data=JSON.parse(fs.readFileSync(inv,"utf8"));
 if(!Array.isArray(data.repositories))throw Error("Invalid inventory");
 const result=audit(path.resolve(opts.root),data),txt=JSON.stringify(result,null,2)+"\n";
 if(opts.output){const file=path.resolve(opts.output);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,txt);}
 else process.stdout.write(txt);
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 try{cli();}catch(e){console.error("BLOCKED: "+e.message);process.exitCode=1;}
