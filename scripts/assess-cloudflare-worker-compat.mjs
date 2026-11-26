/**
 * Source-only Cloudflare compatibility evidence for EXISTING Blueprint Hub.
 * No cloud SDK, browser, environment secrets, database connection or network.
 * Dynamic CLI probes (vinext/OpenNext) are separate isolated CI steps.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const locate=p=>join(root,p);
const read=p=>readFileSync(locate(p),"utf8");
const web=JSON.parse(read("apps/web/package.json"));
const persistence=JSON.parse(read("packages/persistence/package.json"));
const nextConfig=read("apps/web/next.config.ts");
const appSso=read("apps/web/src/auth/appmanage-sso.ts");
const actor=read("apps/web/src/auth/server-actor.ts");
const prisma=read("packages/persistence/src/client.ts");
const runtime=read("packages/runtime/src/index.ts");
const appPaths=[];
const rootScan="apps/web/app";
function collect(dir){
 for(const ent of readdirSync(locate(dir),{withFileTypes:true})){
  const p=dir+"/"+ent.name;
  if(ent.isDirectory())collect(p);
  else if(ent.isFile()&&/\.(?:ts|tsx|mts|js|mjs)$/.test(ent.name))appPaths.push(p);
 }
}
collect(rootScan);
const appText=appPaths.map(read).join("\n");
const allPaths=[];
for(const dir of ["apps/web/src","packages/runtime/src","packages/persistence/src"]){
 if(!existsSync(locate(dir)))continue;
 function scan(p){for(const ent of readdirSync(locate(p),{withFileTypes:true})){
  if(ent.name==="generated"||ent.name==="node_modules")continue;
  const n=p+"/"+ent.name;
  if(ent.isDirectory())scan(n);
  else if(ent.isFile()&&/\.(?:ts|tsx|mjs|js)$/.test(ent.name))allPaths.push(n);
 }}
 scan(dir);
}
const imports=new Map();
for(const path of [...appPaths,...allPaths]){
 const data=read(path);
 const found=[...data.matchAll(/(?:from\s*|import\s*\(|require\s*\()\s*["'](node:[^"']+|@prisma\/[^"']+|pg|next\/[^"']+|@auth\/[^"']+)["']/g)];
 for(const f of found){const v=f[1];if(!imports.has(v))imports.set(v,[]);const a=imports.get(v);if(a.length<7)a.push(path);}
}
const checks=[
 ["NEXT_16",/^16\./.test(web.dependencies?.next??""),"Version gate, not a Workers runtime PASS"],
 ["APP_ROUTER_ROUTES",appPaths.some(p=>p.endsWith("/page.tsx"))&&appPaths.some(p=>p.endsWith("/route.ts")),"Route handlers and SSR must run under workerd"],
 ["SERVER_ACTIONS",appText.includes('"use server"')||appText.includes("'use server'"),"Mutation and cache revalidation require real adapter check"],
 ["PRISMA_POSTGRES",/PrismaPg/.test(prisma)&&/@prisma\/adapter-pg/.test(JSON.stringify(persistence.dependencies)),"PostgreSQL TCP/driver and pooling must be demonstrated in workerd"],
 ["AUTHJS_JWT",actor.includes('getToken')&&actor.includes('next/headers'),"Auth.js JWT, request headers, secure cookies and origin in workerd"],
 ["SSO_EXACT_ORIGIN",appSso.includes("BLUEPRINT_SSO_APPROVED_ORIGIN")&&appSso.includes("allowedSsoRequestOrigin"),"Separate approved HTTPS callback, never generated during test"],
 ["NODE_STANDALONE",nextConfig.includes('output: "standalone"'),"Node target exists; vinext/OpenNext output equivalence NOT established"],
 ["IMMUTABLE_REVISION",runtime.includes("BLUEPRINT_DEPLOYMENT_REVISION"),"Revision is only an input; must bind to independently observed running artifact"],
 ["NO_WORKERS_DEPLOY",!existsSync(locate("apps/web/wrangler.jsonc"))&&!existsSync(locate("apps/web/wrangler.toml"))&&!existsSync(locate("wrangler.toml")),"No Worker/Pages site or config was provisioned"]
].map(([id,observed,meaning])=>({id,sourceObserved:Boolean(observed),meaning,status:observed?"SOURCE_EVIDENCE_ONLY":"BLOCKED_OR_NOT_OBSERVED"}));
const invalid=checks.filter(x=>!x.sourceObserved).map(x=>x.id);
const report={
 schemaVersion:"1.0.0",
 kind:"blueprint-local-cloudflare-compatibility-evidence-only",
 providerRuntimeVerified:false,
 vinextRuntimeVerified:false,
 openNextRuntimeVerified:false,
 authenticatedHubSessionVerified:false,
 prismaPostgresWorkerRuntimeVerified:false,
 cloudflareProjectCreated:false,
 domainOrCallbackChanged:false,
 productionAuthorized:false,
 status:"ADAPTER_RUNTIME_NOT_VERIFIED",
 nextVersion:web.dependencies?.next,
 nodeEngine:JSON.parse(read("package.json")).engines?.node,
 prismaVersion:persistence.dependencies?.["@prisma/client"],
 authVersion:web.dependencies?.["@auth/core"],
 routeCount:appPaths.filter(x=>x.endsWith("/route.ts")).length,
 serverActionsCount:appPaths.filter(x=>read(x).includes('"use server"')).length,
 nodeAndAdapterImportEvidence:Object.fromEntries([...imports].sort(([a],[b])=>a.localeCompare(b))),
 checks,unobservedSourceMarkers:invalid,
 constraints:[
 "vinext is beta; check output does not prove Workers runtime",
 "OpenNext adapter needs explicit local workerd build, not metadata alone",
 "node:crypto, streams, PrismaPg and Auth.js require actual local Workers parity",
 "No direct Neon access, remote bindings, production secrets, deployment, new callback, human approval or Quality Gate PASS"
 ]
};
const output=process.argv[2]??"artifacts/cloudflare-compatibility-source.json";
mkdirSync(dirname(locate(output)),{recursive:true});
writeFileSync(locate(output),JSON.stringify(report,null,2)+"\n");
console.log("[workers-compat] SOURCE_OBSERVED_ONLY: "+checks.filter(x=>x.sourceObserved).length+"/"+checks.length+
  "; "+report.routeCount+" route handlers; "+report.serverActionsCount+" action modules; Workers runtime UNVERIFIED");
for(const [name,paths] of imports){if(name.startsWith("node:"))console.log("[workers-compat] Node API: "+name+" ("+paths.length+" sampled files)");}
if(invalid.length){console.error("[workers-compat] missing expected source markers: "+invalid.join(","));process.exitCode=1;}
