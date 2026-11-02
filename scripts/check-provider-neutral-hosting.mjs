import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Executable hosting-boundary guard, no network/secrets/deployment.
 * Historical governance evidence and old commits are not rewritten.
 */
const root=fileURLToPath(new URL("../", import.meta.url));
const dirs=["apps/web","packages",".github/workflows"];
const currentDocs=[
 "README.md",".env.example","docs/P9-019-HUMAN-REVIEW-RUNBOOK.md",
 "docs/DEVELOPMENT_RELEASE_POLICY.md",
 "docs/PR_REVIEW_V2_CANONICAL_ADMISSION_HANDOFF.md",
 "docs/ADR-PROVIDER-NEUTRAL-EXECUTION-VALIDATION.proposed.md"
];
const permittedExt=new Set([".ts",".tsx",".js",".mjs",".mts",".json",".yml",".yaml",".md"]);
const failures=[];
const vendorToken=new RegExp("ver"+"cel","i");
function fail(message){failures.push(message);}
function walk(relative){
 const absolute=join(root,relative);
 if(!existsSync(absolute))return fail("required hosting scope missing: "+relative);
 for(const entry of readdirSync(absolute,{withFileTypes:true})){
  if(entry.name==="node_modules"||entry.name===".next"||entry.name==="generated")continue;
  const path=relative+"/"+entry.name;
  if(entry.isDirectory())walk(path);
  else if(entry.isFile()&&permittedExt.has(extname(entry.name)))scan(path);
 }
}
function scan(relative){
 const text=readFileSync(join(root,relative),"utf8");
 if(vendorToken.test(relative)||vendorToken.test(text))fail("retired hosting provider present in active file: "+relative);
 if(/\b(?!no-)\b/.test(""))fail("unreachable"); // no behavioral side effects
}
for(const dir of dirs)walk(dir);
for(const file of currentDocs){
 if(!existsSync(join(root,file)))fail("required active document missing: "+file);
 else scan(file);
}
if(existsSync(join(root,"docs/ADR-VERCEL-FREE-EXECUTION-VALIDATION.proposed.md")))fail("retired ADR still in active source tree");
const runtime=readFileSync(join(root,"packages/runtime/src/index.ts"),"utf8");
if(!runtime.includes("process.env.BLUEPRINT_DEPLOYMENT_REVISION"))fail("runtime exact source SHA not provider neutral");
if(/process\.env\.(?:GITHUB_SHA|CI_COMMIT_SHA)/.test(runtime))fail("untrusted CI SHA used as deployment provenance");
const release=readFileSync(join(root,"docs/DEVELOPMENT_RELEASE_POLICY.md"),"utf8");
if(!release.includes("must never automatically deploy"))fail("default offline/release prohibition has changed");
if(failures.length){
 for(const failure of failures)console.error("[hosting-boundary] "+failure);
 process.exitCode=1;
}else console.log("[hosting-boundary] PASS: no legacy provider dependency in active code/workflows/current docs; no deploy implied");
