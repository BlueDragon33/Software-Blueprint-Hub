/**
 * No-exec package provenance inspection.
 * Reads only two exact npm postinstall payloads and two platform ELF files.
 * No npm install, no lifecycle scripts, no binary execution, no real tokens.
 */
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyRegistryTarball,normalizeNpmView } from "./audit-worker-package-integrity.mjs";

export const sourceIndicators = Object.freeze({
  subprocess: /\b(?:execSync|execFileSync|spawnSync|exec|spawn)\s*\(/,
  secondaryInstall: /npm install(?: --|\s)|installUsingNPM|installUsingNpm/,
  networkFetch: /https\.get|https\.request|\bfetch\s*\(|registry\.npmjs\.org/,
  fileMutation: /\b(?:writeFileSync|renameSync|linkSync|unlinkSync|mkdirSync|rmdirSync)\s*\(/,
  envOverride: /process\.env|npm_config_global|ESBUILD_BINARY_PATH|WORKERD_BINARY_PATH/,
  binaryVersionExec: /validateBinaryVersion|--version/,
  redirectHandling: /statusCode\s*===\s*30[12]|headers\.location/,
});
const pinned = Object.freeze([
  {name:"esbuild",version:"0.28.2",role:"postinstall",path:"package/install.js"},
  {name:"workerd",version:"1.20261023.1",role:"postinstall",path:"package/install.js"},
  {name:"@esbuild/linux-x64",version:"0.28.2",role:"ELF",path:"package/bin/esbuild"},
  {name:"@cloudflare/workerd-linux-64",version:"1.20261023.1",role:"ELF",path:"package/bin/workerd"}
]);

export function inspectInstallSource(name,contents) {
  if(!["esbuild","workerd"].includes(name)||typeof contents!=="string"||
    contents.length<1000||contents.length>250000||!contents.includes("validateBinaryVersion"))
    throw Error("SOURCE_NOT_EXACT_EXPECTED_INSTALL_SCRIPT");
  const patterns=Object.fromEntries(Object.entries(sourceIndicators)
    .map(([id,regex])=>[id,regex.test(contents)]));
  const absent=Object.entries(patterns).filter(([,x])=>!x).map(([id])=>id);
  if(absent.length)throw Error("POSTINSTALL_INDICATOR_DRIFT: "+absent.join(","));
  return {package:name,sha256:createHash("sha256").update(contents).digest("hex"),
    length:Buffer.byteLength(contents),observedIndicators:patterns,
    inspectedWithoutExecution:true,compiledUpstreamEquivalenceVerified:false,
    executionApproved:false};
}
export function verifyElf64Amd64(bytes,pkg) {
  if(!Buffer.isBuffer(bytes)||bytes.length<64||bytes[0]!==0x7f||
      bytes.toString("ascii",1,4)!=="ELF"||bytes[4]!==2||bytes[5]!==1||
      bytes.readUInt16LE(18)!==62)
    throw Error("NATIVE_BINARY_NOT_LINUX_ELF_X86_64: "+pkg);
  return {name:pkg,sizeBytes:bytes.length,
    sha256:createHash("sha256").update(bytes).digest("hex"),
    elf64:true,x86_64:true,executed:false,
    upstreamReleaseByteParityVerified:false};
}
function npm(args,timeout=120000){
 return execFileSync("npm",args,{encoding:"utf8",timeout,maxBuffer:16*1024*1024,
  env:{...process.env,npm_config_ignore_scripts:"true",npm_config_audit:"false",
   npm_config_fund:"false",npm_config_update_notifier:"false"}});
}
async function tarBytes(path,member,maxBytes){
 return new Promise((done,fail)=>{
  const p=spawn("tar",["-xzOf",path,member],{stdio:["ignore","pipe","pipe"]});
  const data=[];let count=0,stderr="",failed=false;
  const deny=e=>{if(!failed){failed=true;p.kill("SIGKILL");fail(e);}};
  p.stdout.on("data",part=>{
   count+=part.length;
   if(count>maxBytes)return deny(Error("TARBALL_MEMBER_SIZE_BOUND_EXCEEDED"));
   data.push(part);
  });
  p.stderr.on("data",part=>{stderr+=(part.toString()).slice(0,180);});
  p.on("error",deny);
  p.on("close",code=>{if(failed)return;
   if(code!==0||count===0)return deny(Error("TAR_MEMBER_MISSING_OR_INVALID: "+member+" "+stderr));
   done(Buffer.concat(data,count));
  });
 });
}
async function main(){
 const policy=JSON.parse(readFileSync(new URL("../control/worker-local-adapter-trust.proposed.json",import.meta.url),"utf8"));
 if(policy.approvedForExecution!==false||policy.installLifecycle.decision!=="DENY"||
  policy.installLifecycle.approvedBuildScripts.length!==0)
   throw Error("TRUST_EXECUTION_NOT_DENIED");
 const dir=mkdtempSync(join(tmpdir(),"blueprint-native-provenance-"));
 const findings=[];
 try{
  for(const pin of pinned) {
   const spec=pin.name+"@"+pin.version;
   const metadata=normalizeNpmView(JSON.parse(npm(["view",spec,"name","version",
     "dist.integrity","dist.shasum","scripts","--json"])));
   const packs=JSON.parse(npm(["pack",spec,"--ignore-scripts","--json","--pack-destination",dir]));
   if(packs.length!==1)throw Error("NATIVE_BAD_PACK_RESPONSE");
   const archive=packs[0],path=join(dir,archive.filename);
   const bytes=readFileSync(path);
   const manifest=JSON.parse(execFileSync("tar",["-xzOf",path,"package/package.json"],
    {encoding:"utf8",maxBuffer:1024*1024}));
   verifyRegistryTarball(pin,metadata,archive,manifest,bytes);
   const target=await tarBytes(path,pin.path,pin.role==="ELF"?230*1024*1024:250000);
   const summary=pin.role==="ELF"?verifyElf64Amd64(target,spec):
     inspectInstallSource(pin.name,target.toString("utf8"));
   findings.push({spec,role:pin.role,registryTarballIntegrityVerified:true,...summary});
   console.log("[postinstall-provenance] READ_ONLY "+spec+" role="+pin.role+
     " sourceOrBinarySHA256="+summary.sha256+" executed=false");
  }
 }finally{rmSync(dir,{recursive:true,force:true});}
 const esbuild=findings.find(x=>x.spec==="@esbuild/linux-x64@0.28.2");
 // Public upstream esbuild source at v0.28.2, npm/esbuild/package.json,
 // explicitly pins this linux-x64 ELF SHA256 (outside npm registry metadata).
 const officialEsbuildHash="e1698a3d5c6c0798fee4fd3b5cc816651f460c63d390a7a26ea4beb0b1884100";
 if(esbuild.sha256!==officialEsbuildHash)throw Error("ESBUILD_BINARY_UPSTREAM_SOURCE_SHA256_MISMATCH");
 esbuild.upstreamSourceHashMatch=true;
 const result={kind:"source-and-native-package-read-only-provenance",
  status:"PACKAGE_SOURCE_INSPECTED_NATIVE_PROVENANCE_PARTIAL",
  findings,upstreamEsbuildSourceRevision:"evanw/esbuild/v0.28.2/npm/esbuild/package.json",
  workerdUpstreamBinaryIndependentMatch:false,
  allNativeBinariesIndependentlyVerified:false,
  sourceCodeEquivalentToPublishedPostinstall:false,
  packagePublisherSignatureVerified:false,
  scriptsApproved:false,scriptsExecuted:false,workerdExecuted:false,
  cloudDeployment:false,realDatabaseUsed:false,productionAuthorized:false,
  nextGate:"VERIFY_WORKERD_RELEASE_GZIP_SHA256_AND_DECOMPRESSED_BINARY_PARITY"};
 const output=process.argv[2]??"artifacts/workers-native-provenance.json";
 writeFileSync(output,JSON.stringify(result,null,2)+"\n");
 console.log("[postinstall-provenance] ESBUILD_UPSTREAM_SOURCE_SHA256_MATCH; WORKERD_UPSTREAM_MATCH_UNVERIFIED; ZERO EXECUTION");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error("[postinstall-provenance] BLOCKED "+e.message);process.exitCode=1;});
