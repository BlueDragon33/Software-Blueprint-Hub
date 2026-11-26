/**
 * Separate, no-dependency read-only review of the proposed isolation contract.
 * It NEVER probes a host, runs a container, installs packages or grants authority.
 * A green static test verifies that unsafe claims and config are refused; it does
 * not clear any security, human approval or Production gate.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const load = path => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const denied = (ok, code) => { if (!ok) throw new Error("ISOLATION_REVIEW_DENIED_" + code); };
const isFalse = (obj, fields, prefix) => {
  for(const field of fields) denied(obj?.[field] === false,prefix + "_" + field);
};
const isTrue = (obj, fields, prefix) => {
  for(const field of fields) denied(obj?.[field] === true,prefix + "_" + field);
};
const empty = (value, code) => denied(Array.isArray(value) && value.length===0,code);
const noApproval = (value,code) => denied(value===null,code);

export function independentlyReviewPolicy(contract, toolTrust) {
 denied(contract?.kind==="worker-local-sandbox-preflight-proposal","POLICY_KIND");
 denied(contract.status==="PROPOSED_NOT_AUTHORIZED" &&
  contract.mode==="STATIC_VALIDATION_ONLY" &&
  contract.decision==="DENY_RUNTIME_AND_INSTALL_SCRIPT_EXECUTION","POLICY_DENIAL");
 isFalse(contract,["executionAuthorized","packageScriptsAuthorized","adapterRuntimeAuthorized",
  "cloudResourcesAuthorized","productionAuthorized","canonicalDbAuthorized"],"AUTHORITY");
 denied(toolTrust?.approvedForExecution===false &&
  toolTrust?.installLifecycle?.decision==="DENY","TOOLCHAIN_DENIAL");
 empty(toolTrust?.installLifecycle?.approvedBuildScripts,"APPROVED_BUILD_SCRIPTS");

 const base=contract.reviewedBaseline;
 denied(base?.repository==="BlueDragon33/Software-Blueprint-Hub" &&
  /^[a-f0-9]{40}$/.test(base.commitSha) &&
  base.currentHeadBinding==="REQUIRED_AT_FUTURE_EXECUTION","BASELINE_IDENTITY");
 noApproval(base.boundExecutionHeadSha,"LIVE_SOURCE_SHA_NOT_AUTHORIZED");

 const c=contract.containerContract,u=c?.user,n=c?.network,fs=c?.storage,env=c?.credentials,
  db=c?.data,limits=c?.limits,gate=contract.evidenceGate;
 denied(c?.status==="DESIGN_ONLY_NO_CONTAINER_LAUNCHED","CONTAINER_LAUNCH_FALSE");
 denied(c.platform==="linux/amd64","ARCH");
 noApproval(c.imageDigest,"IMAGE_DIGEST_NOT_REVIEWED");
 denied(u?.uid===65532 && u?.gid===65532 &&
  u.userNamespaceRequired===true &&
  u.seccomp==="RESTRICTIVE_PINNED_PROFILE_REQUIRED" &&
  u.apparmor==="RESTRICTIVE_PROFILE_REQUIRED","USER_PROFILE");
 isFalse(u,["allowRoot","privileged","allowPtrace"],"USER");
 isTrue(u,["noNewPrivileges","userNamespaceRequired"],"USER");
 denied(JSON.stringify(u.capabilitiesDrop)==='["ALL"]',"CAPABILITIES");
 noApproval(u.seccompProfileSha256,"SECCOMP_DIGEST_NOT_REVIEWED");

 denied(n?.mode==="none" && n?.loopbackOnly===true,"NETWORK_MODE");
 isFalse(n,["egress","dns","hostNetwork","allowProxy","allowServiceBindings"],"NETWORK");
 isTrue(fs,["rootReadonly","readOnlyCodeProjectionFromVerifiedArtifact",
  "ephemeral","cleanupRequired"],"FILESYSTEM");
 isFalse(fs,["dockerSocketMount","sharedHomeMount","sshAgentMount","worktreeMount"],"FILESYSTEM");
 empty(fs.hostMounts,"HOST_MOUNTS");
 denied(fs.tmpfs?.length===1 && fs.tmpfs[0].path==="/tmp" &&
   fs.tmpfs[0].sizeMiB>0 && fs.tmpfs[0].sizeMiB<=64 &&
   fs.tmpfs[0].noexec===true && fs.tmpfs[0].nodev===true &&
   fs.tmpfs[0].nosuid===true,"TMPFS");

 isFalse(env,["inheritHostEnvironment","secretsMounted","sshKeysMounted",
  "cloudCredentials","productionEnvFiles","realOAuthSessions"],"SECRETS");
 denied(env.envAllowlist?.join(",")==="PATH,HOME,LANG,TZ","ENV_ALLOWLIST");
 for(const keyword of ["TOKEN","SECRET","KEY","PASSWORD","DATABASE","NEON",
  "GITHUB","CLOUDFLARE","AWS","PROXY"])
  denied(env.envDenyPatterns?.includes("*"+keyword+"*"),"ENV_PATTERN_"+keyword);

 isFalse(db,["realPostgres","realNeon","d1","remoteBindings","allowDbMigration"],"DATABASE");
 isTrue(db,["fixturesOnly","readOnlyFixtures"],"DATABASE");
 empty(db.socketMounts,"DATABASE_SOCKETS");

 for(const [key,max] of Object.entries({cpus:1,memoryMiB:1024,pids:64,
   diskMiB:1024,wallClockSeconds:120,ulimitsNofile:1024}))
  denied(Number.isInteger(limits?.[key])&&limits[key]>0&&limits[key]<=max,"LIMIT_"+key);
 denied(limits.allowUnlimited===false,"UNLIMITED_RESOURCES");

 const pins=contract.pinnedToolchain;
 denied(pins?.next==="16.3.6" && pins?.vinext==="1.4.0" &&
  pins?.openNext==="1.20.15" && pins?.esbuild==="0.28.2" &&
  pins?.workerd==="1.20261023.1","PIN_VERSION");
 for(const hash of [
  pins?.nativeLinuxX64?.esbuild?.elfSha256,
  pins?.nativeLinuxX64?.workerd?.elfSha256,
  pins?.nativeLinuxX64?.workerd?.releaseGzipSha256,
  pins?.postinstallSha256?.esbuild,pins?.postinstallSha256?.workerd
 ]) denied(/^[a-f0-9]{64}$/.test(hash??""),"ARTIFACT_SHA256");
 // Cross-check the immutable pins against the earlier independent tarball audit,
 // not merely their syntactic SHA256 shape.
 denied(pins.nativeLinuxX64.esbuild.elfSha256===
  "e1698a3d5c6c0798fee4fd3b5cc816651f460c63d390a7a26ea4beb0b1884100","ESBUILD_PIN_DRIFT");
 denied(pins.nativeLinuxX64.workerd.elfSha256===
  "b6aff93fcc97091fa38b4ba78c172276349c4940000694c5baf382c218b8e6ee","WORKERD_PIN_DRIFT");
 denied(pins.nativeLinuxX64.workerd.releaseGzipSha256===
  "28e7942d0ca91c565ee7ef973725b558f96454bbb86ee5bd40802d723aeab909","RELEASE_PIN_DRIFT");
 denied(pins.postinstallSha256.esbuild===
  "612294e278914443bdcf81cb17f54afec34dbdd2ebd999a6ee187912320cc315","ESBUILD_SCRIPT_DRIFT");
 denied(pins.postinstallSha256.workerd===
  "c020655f335c6f9a4a1e8c8655fc71f37ce5aacd99c3eb7583ed5d60a0940768","WORKERD_SCRIPT_DRIFT");

 isTrue(gate,["independentReviewerApprovalRequired","signatureVerificationRequired",
  "exactSourceShaRequired","nativeBinarySha256Required"],"REVIEW_REQUIRED");
 isFalse(gate,["signatureVerified","sourceReproducibleBuildVerified",
  "containerProfileVerified","hostIsolationVerified","networkDenyVerified",
  "secretRedactionVerified"],"UNVERIFIED_EVIDENCE");
 noApproval(gate.reviewerApprovalId,"REVIEWER_NOT_ASSIGNED");
 isFalse(toolTrust.localRuntimeSandbox,["runCloudflareCLI","postinstallPermissionGranted"],"TOOL_EXECUTION");
 denied(Array.isArray(contract.deniedCommands)&&
  ["docker run","podman run","workerd","esbuild","pnpm approve-builds"]
   .every(x=>contract.deniedCommands.includes(x)),"DENIED_COMMANDS");

 const gaps=[
  "NO_REVIEWED_CONTAINER_IMAGE_DIGEST",
  "NO_REVIEWED_SECCOMP_HASH_OR_APPARMOR_PROFILE",
  "HOST_ROOTLESS_AND_USER_NAMESPACE_UNOBSERVED",
  "NETWORK_NONE_EGRESS_AND_DNS_NOT_DYNAMICAL_TESTED",
  "ENVIRONMENT_AND_SECRET_NONINHERITANCE_UNOBSERVED",
  "READONLY_TMPFS_MOUNTS_AND_CLEANUP_UNOBSERVED",
  "CGROUP_CPU_MEMORY_PIDS_DISK_TIMEOUT_NOT_ENFORCEMENT_TESTED",
  "NO_EXECUTION_BOUND_HUB_HEAD",
  "NO_SIGNED_PUBLISHER_OR_REPRODUCIBLE_SOURCE_BUILD",
  "NO_AUTHORIZED_INDEPENDENT_HUMAN_REVIEW",
  "NO_GITHUB_BRANCH_PROTECTION_PROOF",
  "NATIVE_RUNTIME_AND_POSTINSTALL_EXECUTION_NOT_AUTHORIZED"
 ];
 return {schemaVersion:"1.0.0",kind:"independent-static-isolation-gap-review",
  staticDenyContractIntact:true,decision:"BLOCKED_MISSING_INDEPENDENT_ISOLATION_EVIDENCE",
  reviewedBaseline:base.commitSha,headForExecution:null,gaps,
  humanReviewerVerified:false,githubBranchProtectionVerified:false,
  containerImageVerified:false,seccompAppArmorVerified:false,
  hostIsolationVerified:false,noEgressVerified:false,secretIsolationVerified:false,
  actualResourceLimitsVerified:false,postinstallAllowed:false,workerdExecuted:false,
  nativeBinaryExecuted:false,cloudResourcesCreated:false,canonicalDatabaseTouched:false,
  signedAttestationCreated:false,productionAuthorized:false,
  note:"Static policy is a proposed contract, NOT an independently observed secure host or reviewer grant"};
}
function main(){
 const policy=load("../control/worker-local-sandbox-preflight.proposed.json");
 const trust=load("../control/worker-local-adapter-trust.proposed.json");
 const result=independentlyReviewPolicy(policy,trust);
 const file=resolve(process.argv[2]??"artifacts/worker-isolation-independent-review.json");
 mkdirSync(dirname(file),{recursive:true});
 writeFileSync(file,JSON.stringify(result,null,2)+"\n");
 console.log("[independent-isolation] STATIC_DENY_CONTRACT_INTACT; "+result.decision+
  "; missing="+result.gaps.length+"; NO SANDBOX OR BINARY EXECUTION");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 try{main()}catch(e){console.error("[independent-isolation] "+e.message);process.exitCode=1;}
