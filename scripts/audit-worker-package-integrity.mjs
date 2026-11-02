/**
 * Registry-declared SHA-512 vs independently downloaded npm package bytes.
 * No install, no execute, no automatic build-script authorization.
 * npm pack is called exclusively with --ignore-scripts in disposable CI;
 * tar is used with -O to read package.json WITHOUT unpacking/installing code.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const lifecycleNames = new Set(["preinstall","install","postinstall","prepare","prepack","postpack","prepublish","prepublishOnly"]);
export function validateProposal(policy) {
  if (policy?.kind !== "worker-local-adapter-build-trust-proposal" ||
      policy?.status !== "PROPOSED_NOT_APPROVED" ||
      policy?.approvedForExecution !== false ||
      policy?.cloudDeploymentAllowed !== false ||
      policy?.canonicalDatabaseAccessAllowed !== false ||
      policy?.installLifecycle?.decision !== "DENY" ||
      !Array.isArray(policy.installLifecycle.approvedBuildScripts) ||
      policy.installLifecycle.approvedBuildScripts.length !== 0 ||
      policy?.localRuntimeSandbox?.runCloudflareCLI !== false) {
    throw new Error("TRUST_PROPOSAL_MUST_DENY_ALL_PACKAGE_LIFECYCLE_SCRIPTS");
  }
  if (!Array.isArray(policy.packageSources) || policy.packageSources.length !== 7) {
    throw new Error("TRUST_PINS_INCOMPLETE");
  }
  const keys = policy.packageSources.map(p=>p.name+"@"+p.version);
  if (new Set(keys).size !== keys.length ||
      keys.some(x=>!/^(@[a-z0-9-]+\/[a-z0-9-]+|[a-z0-9-]+)@\d+\.\d+\.\d+$/.test(x))) {
    throw new Error("TRUST_PINS_INVALID_OR_DUPLICATE");
  }
  for (const expected of ["vinext@1.4.0","@opennextjs/cloudflare@1.20.15","next@16.3.6",
    "esbuild@0.28.2","@esbuild/linux-x64@0.28.2",
    "workerd@1.20261023.1","@cloudflare/workerd-linux-64@1.20261023.1"]) {
    if (!keys.includes(expected)) throw new Error("TRUST_PIN_MISSING: "+expected);
  }
  return true;
}
export function verifyRegistryTarball(pin, registry, archive, manifest, bytes) {
  if (registry?.name !== pin.name || registry?.version !== pin.version ||
      manifest?.name !== pin.name || manifest?.version !== pin.version) {
    throw new Error("TRUST_PACKAGE_IDENTITY_MISMATCH");
  }
  const declared = registry?.dist?.integrity;
  if (typeof declared !== "string" || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(declared)) {
    throw new Error("TRUST_NO_REGISTRY_SHA512");
  }
  const computed = "sha512-"+createHash("sha512").update(bytes).digest("base64");
  if (declared !== computed || (archive.integrity && archive.integrity !== declared)) {
    throw new Error("TRUST_SRI_MISMATCH");
  }
  const sha1=createHash("sha1").update(bytes).digest("hex");
  if (typeof registry.dist.shasum !== "string" || registry.dist.shasum !== sha1 ||
      (archive.shasum && archive.shasum !== sha1)) {
    throw new Error("TRUST_SHA1_METADATA_MISMATCH");
  }
  const scriptNames=Object.keys(manifest.scripts ?? {}).filter(x=>lifecycleNames.has(x)).sort();
  const registryScripts=registry.scripts ?? {};
  for(const name of scriptNames) {
    if (registryScripts[name] !== manifest.scripts[name]) {
      throw new Error("TRUST_LIFECYCLE_METADATA_MISMATCH");
    }
  }
  return {
    name: pin.name,version:pin.version,role:pin.role,
    integrity:declared,
    registryArchiveIntegrityVerified:true,
    lifecycleScriptNames:scriptNames,
    lifecycleScriptsExecuted:false,
    lifecycleApproval:"DENIED_PENDING_INDEPENDENT_REVIEW",
    nativeBinaryIndependentlyVerified:false
  };
}

function npm(args, timeout=90000) {
  return execFileSync("npm",args,{
    encoding:"utf8",timeout,maxBuffer:32*1024*1024,
    env:{...process.env,npm_config_ignore_scripts:"true",
      npm_config_audit:"false",npm_config_fund:"false",
      npm_config_update_notifier:"false"}
  });
}
async function main(){
  const policy=JSON.parse(readFileSync(new URL("../control/worker-local-adapter-trust.proposed.json",import.meta.url),"utf8"));
  validateProposal(policy);
  const dir=mkdtempSync(join(tmpdir(),"blueprint-trust-review-"));
  const details=[];
  try {
    for(const pin of policy.packageSources){
      const spec=pin.name+"@"+pin.version;
      const registry=JSON.parse(npm(["view",spec,"name","version","dist.integrity",
        "dist.shasum","scripts","engines","peerDependencies","--json"]));
      const packed=JSON.parse(npm(["pack",spec,"--ignore-scripts","--json","--pack-destination",dir],120000));
      if(!Array.isArray(packed)||packed.length!==1 || !/\.tgz$/.test(packed[0].filename)) {
        throw new Error("TRUST_UNEXPECTED_ARCHIVE_RESPONSE: "+spec);
      }
      const archive=packed[0],tarball=join(dir,archive.filename);
      const bytes=readFileSync(tarball);
      if(bytes.length===0||bytes.length>80*1024*1024)throw new Error("TRUST_PACKAGE_SIZE_LIMIT: "+spec);
      const manifest=JSON.parse(execFileSync("tar",["-xzOf",tarball,"package/package.json"],
        {encoding:"utf8",timeout:15000,maxBuffer:1024*1024}));
      const checked=verifyRegistryTarball(pin,registry,archive,manifest,bytes);
      details.push(checked);
      console.log("[worker-trust] SRI_MATCH_REGISTRY_NOT_PUBLISHER_ATTESTATION "+spec+
        " lifecycle="+checked.lifecycleScriptNames.join(","));
    }
  } finally { rmSync(dir,{recursive:true,force:true}); }
  const result={
    schemaVersion:"1.0.0",
    status:"REGISTRY_SRI_MATCH_ONLY_NO_SCRIPT_APPROVAL",
    packageCount:details.length,packages:details,
    registryTrustedPublisherIndependentlyVerified:false,
    packageSourceAudited:false,
    executableBuildScriptsApproved:false,
    workerdRuntimeVerified:false,
    adaptersCompatibleWithRunningHub:false,
    canonicalDatabaseMutated:false,
    cloudResourcesCreated:false,
    productionAuthorized:false,
    candidateAllowlistOnly:policy.installLifecycle.reviewOnlyCandidates,
    approvedBuildScripts:[],
    limitations:[
      "Matching registry-declared SRI is not proof of trusted publisher, safe source, or safe native binary",
      "npm pack --ignore-scripts fetches tarballs without running any package lifecycle hook",
      "Native platform binaries and transitively resolved version graph require separate review",
      "Workerd and esbuild lifecycle scripts remain DENIED; no approval automatically follows successful hashes"
    ]
  };
  const output=process.argv[2]??"artifacts/workers-toolchain-integrity.json";
  writeFileSync(output,JSON.stringify(result,null,2)+"\n");
  console.log("[worker-trust] "+result.status+" packages="+result.packageCount+"; ZERO BUILD SCRIPTS AUTHORIZED");
}
if(process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e=>{console.error("[worker-trust] BLOCKED: "+e.message);process.exitCode=1;});
}
