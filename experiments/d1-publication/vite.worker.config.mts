import {defineConfig} from "vite";
import vinext from "vinext";
import {cloudflare} from "@cloudflare/vite-plugin";
import {resolve,dirname,sep} from "node:path";
import {fileURLToPath} from "node:url";
import {localPublicationBuildRevision} from "../../packages/runtime/src/publication-runtime-revision.ts";
const repo=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const web=resolve(repo,"apps/web");
const runtime=resolve(web,"src/server/runtime");
const revision=localPublicationBuildRevision(web);
const virtualRevision="virtual:blueprint-worker-build-revision";
const resolvedRevision="\0"+virtualRevision;
if(process.env.EXPECTED_CANDIDATE_REVISION!==revision)throw Error("Exact Worker build revision required");
export default defineConfig({
 root:web,
 define:{"process.env.BLUEPRINT_LOCAL_RUNTIME_REVISION":JSON.stringify(revision)},
 resolve:{dedupe:["react","react-dom"]},
 plugins:[
   {name:"blueprint-native-d1-runtime",enforce:"pre",resolveId(source,importer){
     if(source===virtualRevision)return resolvedRevision;
     if(!importer||!source.startsWith("."))return null;
     const target=resolve(dirname(importer.split("?")[0]!),source);
     if(target===runtime||target===runtime+".ts")return runtime+".cloudflare.ts";
     return null;
   },load(id){if(id===resolvedRevision)return "export const workerBuildRevision = "+JSON.stringify(revision)+";";return null;}},
   vinext(),
   cloudflare({config:{
     name:"software-blueprint-hub",
     main:"./worker/index.mjs",
     compatibility_date:"2026-05-15",
     compatibility_flags:["nodejs_compat"],
     workers_dev:false,
     preview_urls:false,
     vars:{BLUEPRINT_PERSISTENCE_PROVIDER:"d1"},
     d1_databases:[{binding:"BLUEPRINT_CANONICAL_DB",database_name:"blueprint-d1-local-qa",database_id:"00000000-0000-0000-0000-000000000003",remote:false}]
   },viteEnvironment:{name:"rsc",childEnvironments:["ssr"]},inspectorPort:false})
 ]
});
