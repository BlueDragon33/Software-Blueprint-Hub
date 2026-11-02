/**
 * STATIC contract validator for a sandbox THAT DOES NOT YET EXIST.
 * Never executes Docker/Podman/workerd/esbuild/pnpm hooks and never creates a sandbox.
 * Passing the static policy is not attestation of host or container isolation.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const expected=Object.freeze({
 baseline:"6b68024e08c6280e45cb6e5b58fb4a6f4edc8d70",
 esbuildElf:"e1698a3d5c6c0798fee4fd3b5cc816651f460c63d390a7a26ea4beb0b1884100",
 workerdElf:"b6aff93fcc97091fa38b4ba78c172276349c4940000694c5baf382c218b8e6ee",
 workerdRelease:"28e7942d0ca91c565ee7ef973725b558f96454bbb86ee5bd40802d723aeab909",
 esbuildScript:"612294e278914443bdcf81cb17f54afec34dbdd2ebd999a6ee187912320cc315",
 workerdScript:"c020655f335c6f9a4a1e8c8655fc71f37ce5aacd99c3eb7583ed5d60a0940768"
});
function assert(condition,reason) {
 if(!condition)throw Error("SANDBOX_PREFLIGHT_BLOCKED_"+reason);
}
function eq(actual,want,reason){assert(actual===want,reason);}
function empty(items,reason){assert(Array.isArray(items)&&items.length===0,reason);}
function denyFlags(flags,required,reason){for(const name of required)eq(flags?.[name],false,reason+"_"+name);}
function yesFlags(flags,required,reason){for(const name of required)eq(flags?.[name],true,reason+"_"+name);}
export function validateSandboxProposal(c,trust){
 assert(c&&typeof c==="object"&&!Array.isArray(c),"MISSING_MANIFEST");
 eq(c.schemaVersion,"1.0.0","SCHEMA_VERSION");
 eq(c.kind,"worker-local-sandbox-preflight-proposal","SCHEMA_KIND");
 eq(c.constitutionVersion,"1.3.0","CONSTITUTION");
 eq(c.status,"PROPOSED_NOT_AUTHORIZED","STATUS");
 eq(c.mode,"STATIC_VALIDATION_ONLY","MODE");
 eq(c.decision,"DENY_RUNTIME_AND_INSTALL_SCRIPT_EXECUTION","DECISION");
 denyFlags(c,["executionAuthorized","packageScriptsAuthorized","adapterRuntimeAuthorized","cloudResourcesAuthorized","productionAuthorized","canonicalDbAuthorized"],"EXECUTION_DENIAL");
 eq(c.reviewedBaseline?.repository,"BlueDragon33/Software-Blueprint-Hub","REPO");
 eq(c.reviewedBaseline.commitSha,expected.baseline,"REVIEWED_BASE_SHA");
 eq(c.reviewedBaseline.currentHeadBinding,"REQUIRED_AT_FUTURE_EXECUTION","HEAD_BINDING");
 eq(c.reviewedBaseline.boundExecutionHeadSha,null,"NO_LIVE_HEAD_APPROVAL");
 assert(trust?.installLifecycle?.decision==="DENY"&&
  Array.isArray(trust.installLifecycle.approvedBuildScripts)&&
  trust.installLifecycle.approvedBuildScripts.length===0&&
  trust.approvedForExecution===false&&
  trust.localRuntimeSandbox?.runCloudflareCLI===false,"TOOLCHAIN_TRUST_DENIED");
 const t=c.pinnedToolchain, n=t?.nativeLinuxX64,p=t?.postinstallSha256;
 for(const [key,val] of Object.entries({node:"24",pnpm:"12.4.0",next:"16.3.6",
  vinext:"1.4.0",openNext:"1.20.15",esbuild:"0.28.2",workerd:"1.20261023.1"}))eq(t?.[key],val,"TOOLCHAIN_"+key);
 eq(n?.esbuild?.npm,"@esbuild/linux-x64@0.28.2","ESBUILD_PACKAGE");
 eq(n?.workerd?.npm,"@cloudflare/workerd-linux-64@1.20261023.1","WORKERD_PACKAGE");
 eq(n.esbuild.elfSha256,expected.esbuildElf,"ESBUILD_ELF_PIN");
 eq(n.workerd.elfSha256,expected.workerdElf,"WORKERD_ELF_PIN");
 eq(n.workerd.releaseGzipSha256,expected.workerdRelease,"WORKERD_RELEASE_PIN");
 eq(p?.esbuild,expected.esbuildScript,"ESBUILD_SCRIPT_PIN");
 eq(p?.workerd,expected.workerdScript,"WORKERD_SCRIPT_PIN");
 const box=c.containerContract;
 eq(box?.status,"DESIGN_ONLY_NO_CONTAINER_LAUNCHED","CONTAINER_STATUS");
 eq(box?.platform,"linux/amd64","PLATFORM");
 eq(box?.imageDigest,null,"UNREVIEWED_IMAGE_DIGEST");
 const u=box?.user;
 eq(u?.uid,65532,"USER_UID");eq(u.gid,65532,"USER_GID");
 yesFlags(u,["userNamespaceRequired","noNewPrivileges"],"USER");
 denyFlags(u,["allowRoot","privileged","allowPtrace"],"USER");
 assert(JSON.stringify(u.capabilitiesDrop)==='["ALL"]',"CAPABILITIES");
 eq(u.seccomp,"RESTRICTIVE_PINNED_PROFILE_REQUIRED","SECCOMP");
 eq(u.seccompProfileSha256,null,"SECCOMP_SHA_UNREVIEWED");
 eq(u.apparmor,"RESTRICTIVE_PROFILE_REQUIRED","APPARMOR");
 const net=box?.network;
 eq(net?.mode,"none","NETWORK_MODE");
 denyFlags(net,["egress","dns","hostNetwork","allowProxy","allowServiceBindings"],"NETWORK");
 yesFlags(net,["loopbackOnly"],"NETWORK");
 const st=box?.storage;
 yesFlags(st,["rootReadonly","readOnlyCodeProjectionFromVerifiedArtifact","ephemeral","cleanupRequired"],"FS");
 denyFlags(st,["dockerSocketMount","sharedHomeMount","sshAgentMount","worktreeMount"],"FS");
 empty(st.hostMounts,"HOST_MOUNTS");
 assert(Array.isArray(st.tmpfs)&&st.tmpfs.length===1,"TMPFS");
 const tmp=st.tmpfs[0];eq(tmp.path,"/tmp","TMP_PATH");
 assert(Number.isInteger(tmp.sizeMiB)&&tmp.sizeMiB>0&&tmp.sizeMiB<=64,"TMP_SIZE");
 yesFlags(tmp,["noexec","nodev","nosuid"],"TMPFS");
 const cred=box?.credentials;
 denyFlags(cred,["inheritHostEnvironment","secretsMounted","sshKeysMounted",
  "cloudCredentials","productionEnvFiles","realOAuthSessions"],"CREDENTIAL");
 assert(Array.isArray(cred.envAllowlist)&&cred.envAllowlist.join(",")==="PATH,HOME,LANG,TZ","ENV_ALLOWLIST");
 for(const word of ["TOKEN","SECRET","KEY","PASSWORD","DATABASE","NEON","GITHUB","CLOUDFLARE","PROXY"])
  assert(cred.envDenyPatterns?.includes("*"+word+"*"),"ENV_DENY_"+word);
 const data=box?.data;
 denyFlags(data,["realPostgres","realNeon","d1","remoteBindings","allowDbMigration"],"DATA");
 yesFlags(data,["fixturesOnly","readOnlyFixtures"],"DATA");
 empty(data.socketMounts,"DATA_SOCKET");
 const lim=box?.limits;
 for(const [name,max] of Object.entries({cpus:1,memoryMiB:1024,pids:64,diskMiB:1024,wallClockSeconds:120,ulimitsNofile:1024}))
 assert(Number.isInteger(lim?.[name])&&lim[name]>0&&lim[name]<=max,"LIMIT_"+name);
 eq(lim.allowUnlimited,false,"UNLIMITED");
 const e=c?.evidenceGate;
 yesFlags(e,["provenanceRegistrySha512Required","nativeBinarySha256Required",
   "postinstallSha256Required","exactSourceShaRequired",
   "independentReviewerApprovalRequired","signatureVerificationRequired"],"EVIDENCE_REQUIRED");
 denyFlags(e,["signatureVerified","sourceReproducibleBuildVerified","containerProfileVerified",
   "hostIsolationVerified","networkDenyVerified","secretRedactionVerified"],"EVIDENCE_NOT_ATTESTED");
 eq(e.reviewerApprovalId,null,"REVIEWER_UNASSIGNED");
 eq(c.explicitNextAction,"LOCAL_SANDBOX_INDEPENDENT_ISOLATION_REVIEW","NEXT_ACTION");
 assert(Array.isArray(c.deniedCommands)&&c.deniedCommands.includes("workerd")&&
  c.deniedCommands.includes("esbuild")&&c.deniedCommands.includes("pnpm approve-builds")&&
  c.deniedCommands.includes("docker run"),"DENY_COMMAND_LIST");
 return {staticContractValid:true,hostIsolationTested:false,runtimeExecutionAuthorized:false,
  currentExecutionShaApproved:false,buildScriptApproval:false,
  reviewerApproval:false,releaseAllowed:false,status:"STATIC_CONTRACT_PASS_RUNTIME_BLOCKED"};
}
export function validateAuditWorkflow(source) {
 assert(typeof source==="string"&&source.length>200,"WORKFLOW_MISSING");
 assert(/^permissions:\s*\n\s+contents: read/m.test(source),"WORKFLOW_READONLY");
 assert(/^on:\s*\n\s+pull_request:/m.test(source),"WORKFLOW_NOT_PR_SCOPED");
 assert(/persist-credentials: false/.test(source),"WORKFLOW_GITHUB_CREDENTIAL");
 assert(/runs-on: ubuntu-24\.04/.test(source),"WORKFLOW_DISPOSABLE_RUNNER");
 assert(/timeout-minutes: 15/.test(source),"WORKFLOW_TIMEOUT");
 for(const forbidden of [/\bworkflow_dispatch\s*:/,/\benvironment\s*:/,
   /\bsecrets\./,/\bpermissions:\s*write/,/\bwrangler\s+deploy\b/,
   /\bpnpm\s+approve-builds\b/,/\bnpm\s+install\s+--ignore-scripts=false/]) {
   assert(!forbidden.test(source),"WORKFLOW_DISALLOWED_SIDE_EFFECT");
 }
 assert(source.includes("node scripts/validate-worker-local-sandbox-preflight.mjs"),"WORKFLOW_STATIC_GATE_MISSING");
 // A reporting JSON path must never become an executable shell line.
 const releaseStep=source.split("      - name: Compare workerd npm ELF with fixed public GitHub Release (bytes only)")[1]?.split("      - name: Pinned OpenNext")[0];
 const uploadStep=source.split("      - name: Preserve bounded untrusted tool observations for independent review")[1];
 const expectedReleaseOrder=["artifacts/workerd-release-parity.json","          rm -f artifacts/workerd-linux-64-release.gz"].join(String.fromCharCode(10));
 assert(releaseStep?.includes(expectedReleaseOrder),"WORKFLOW_RELEASE_COMMAND_UNEXPECTED");
 assert(!releaseStep?.includes("artifacts/worker-sandbox-static-preflight.json"),"WORKFLOW_ATTEMPTED_REPORT_EXECUTION");
 assert(uploadStep?.includes("artifacts/worker-sandbox-static-preflight.json"),"WORKFLOW_SANDBOX_REPORT_NOT_UPLOADED");
 return true;
}
function main(){
 const c=JSON.parse(readFileSync(new URL("../control/worker-local-sandbox-preflight.proposed.json",import.meta.url),"utf8"));
 const trust=JSON.parse(readFileSync(new URL("../control/worker-local-adapter-trust.proposed.json",import.meta.url),"utf8"));
 const wf=readFileSync(new URL("../.github/workflows/cloudflare-compatibility-local.yml",import.meta.url),"utf8");
 const report=validateSandboxProposal(c,trust);
 validateAuditWorkflow(wf);
 const out=process.argv[2]??"artifacts/worker-sandbox-static-preflight.json";
 writeFileSync(out,JSON.stringify({...report,sourceBaseline:c.reviewedBaseline.commitSha,
  artifactPins:c.pinnedToolchain.nativeLinuxX64,
  siteCreated:false,networkAccessTested:false,productionAuthorized:false},null,2)+"\n");
 console.log("[sandbox-preflight] STATIC_CONTRACT_PASS_RUNTIME_BLOCKED: no host/container, network or privileged runtime tested");
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
 try{main()}catch(e){console.error("[sandbox-preflight] "+e.message);process.exitCode=1;}
