import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateSandboxProposal,validateAuditWorkflow} from "../../scripts/validate-worker-local-sandbox-preflight.mjs";
const proposal=JSON.parse(readFileSync(new URL("../../control/worker-local-sandbox-preflight.proposed.json",import.meta.url),"utf8"));
const trust=JSON.parse(readFileSync(new URL("../../control/worker-local-adapter-trust.proposed.json",import.meta.url),"utf8"));
const workflow=readFileSync(new URL("../../.github/workflows/cloudflare-compatibility-local.yml",import.meta.url),"utf8");
const cloned=()=>structuredClone(proposal);
function rejects(modify,needle){
 const c=cloned();modify(c);assert.throws(()=>validateSandboxProposal(c,trust),new RegExp("SANDBOX_PREFLIGHT_BLOCKED_"+needle));
}
test("Static sandbox contract passes while runtime, approvals and execution remain explicitly BLOCKED",()=>{
 const r=validateSandboxProposal(proposal,trust);
 assert.equal(r.staticContractValid,true);
 for(const field of ["hostIsolationTested","runtimeExecutionAuthorized","currentExecutionShaApproved","buildScriptApproval","reviewerApproval","releaseAllowed"])
   assert.equal(r[field],false);
 assert.equal(r.status,"STATIC_CONTRACT_PASS_RUNTIME_BLOCKED");
 assert.equal(validateAuditWorkflow(workflow),true);
});
test("Unsafe root/privilege/user namespace or seccomp changes are rejected",()=>{
 rejects(c=>{c.containerContract.user.uid=0},"USER_UID");
 rejects(c=>{c.containerContract.user.privileged=true},"USER_privileged");
 rejects(c=>{c.containerContract.user.userNamespaceRequired=false},"USER_userNamespaceRequired");
 rejects(c=>{c.containerContract.user.capabilitiesDrop=[]},"CAPABILITIES");
 rejects(c=>{c.containerContract.user.seccomp="unconfined"},"SECCOMP");
 rejects(c=>{c.containerContract.user.noNewPrivileges=false},"USER_noNewPrivileges");
});
test("Networking, host mounts and socket access cannot be silently widened",()=>{
 rejects(c=>{c.containerContract.network.mode="bridge"},"NETWORK_MODE");
 rejects(c=>{c.containerContract.network.egress=true},"NETWORK_egress");
 rejects(c=>{c.containerContract.network.dns=true},"NETWORK_dns");
 rejects(c=>{c.containerContract.storage.hostMounts.push("/var/run/docker.sock")},"HOST_MOUNTS");
 rejects(c=>{c.containerContract.storage.dockerSocketMount=true},"FS_dockerSocketMount");
 rejects(c=>{c.containerContract.data.socketMounts.push("/run/postgresql")},"DATA_SOCKET");
});
test("No secrets, cloud credentials, OAuth or canonical database access",()=>{
 rejects(c=>{c.containerContract.credentials.inheritHostEnvironment=true},"CREDENTIAL_inheritHostEnvironment");
 rejects(c=>{c.containerContract.credentials.envAllowlist.push("GITHUB_TOKEN")},"ENV_ALLOWLIST");
 rejects(c=>{c.containerContract.credentials.envDenyPatterns=[]},"ENV_DENY");
 rejects(c=>{c.containerContract.credentials.productionEnvFiles=true},"CREDENTIAL_productionEnvFiles");
 rejects(c=>{c.containerContract.data.realNeon=true},"DATA_realNeon");
 rejects(c=>{c.containerContract.data.realPostgres=true},"DATA_realPostgres");
 rejects(c=>{c.containerContract.data.allowDbMigration=true},"DATA_allowDbMigration");
});
test("Disposable root filesystem, tmpfs safety and limits must stay bounded",()=>{
 rejects(c=>{c.containerContract.storage.rootReadonly=false},"FS_rootReadonly");
 rejects(c=>{c.containerContract.storage.ephemeral=false},"FS_ephemeral");
 rejects(c=>{c.containerContract.storage.tmpfs[0].noexec=false},"TMPFS_noexec");
 rejects(c=>{c.containerContract.storage.tmpfs[0].sizeMiB=4096},"TMP_SIZE");
 rejects(c=>{c.containerContract.limits.cpus=8},"LIMIT_cpus");
 rejects(c=>{c.containerContract.limits.memoryMiB=8192},"LIMIT_memoryMiB");
 rejects(c=>{c.containerContract.limits.pids=0},"LIMIT_pids");
 rejects(c=>{c.containerContract.limits.wallClockSeconds=10000},"LIMIT_wallClockSeconds");
});
test("Fail closed on source, native binary and published postinstall SHA drift",()=>{
 rejects(c=>{c.reviewedBaseline.commitSha="f".repeat(40)},"REVIEWED_BASE_SHA");
 rejects(c=>{c.reviewedBaseline.boundExecutionHeadSha="f".repeat(40)},"NO_LIVE_HEAD_APPROVAL");
 rejects(c=>{c.pinnedToolchain.nativeLinuxX64.esbuild.elfSha256="0".repeat(64)},"ESBUILD_ELF_PIN");
 rejects(c=>{c.pinnedToolchain.nativeLinuxX64.workerd.elfSha256="0".repeat(64)},"WORKERD_ELF_PIN");
 rejects(c=>{c.pinnedToolchain.nativeLinuxX64.workerd.releaseGzipSha256="0".repeat(64)},"WORKERD_RELEASE_PIN");
 rejects(c=>{c.pinnedToolchain.postinstallSha256.workerd="0".repeat(64)},"WORKERD_SCRIPT_PIN");
 rejects(c=>{c.pinnedToolchain.next="16.4.1"},"TOOLCHAIN_next");
});
test("No fake reviewer acceptance, trusted host profile or release approval",()=>{
 rejects(c=>{c.evidenceGate.reviewerApprovalId="SELF"},"REVIEWER_UNASSIGNED");
 rejects(c=>{c.evidenceGate.containerProfileVerified=true},"EVIDENCE_NOT_ATTESTED_containerProfileVerified");
 rejects(c=>{c.evidenceGate.networkDenyVerified=true},"EVIDENCE_NOT_ATTESTED_networkDenyVerified");
 rejects(c=>{c.executionAuthorized=true},"EXECUTION_DENIAL_executionAuthorized");
 rejects(c=>{c.adapterRuntimeAuthorized=true},"EXECUTION_DENIAL_adapterRuntimeAuthorized");
 assert.throws(()=>validateSandboxProposal(proposal,{...trust,installLifecycle:{...trust.installLifecycle,approvedBuildScripts:["esbuild"]}}),/TOOLCHAIN_TRUST_DENIED/);
});
test("GitHub CI preflight must remain PR-scoped and least-privileged",()=>{
 assert.equal(validateAuditWorkflow(workflow),true);
 for(const addition of ["\nworkflow_dispatch:\n","\nenvironment: production\n",
  "\npermissions: write\n","\nrun: wrangler deploy\n",
  "\nrun: pnpm approve-builds\n","\nrun: echo ${{ secrets.CLOUDFLARE_API_TOKEN }}\n"])
   assert.throws(()=>validateAuditWorkflow(workflow+addition),/SANDBOX_PREFLIGHT_BLOCKED_/);
 assert.throws(()=>validateAuditWorkflow(workflow.replace("persist-credentials: false","persist-credentials: true")),/WORKFLOW_GITHUB_CREDENTIAL/);
 const bad=workflow.replace("artifacts/workerd-release-parity.json\\n          rm -f",
  "artifacts/workerd-release-parity.json\\n            artifacts/worker-sandbox-static-preflight.json\\n          rm -f");
 assert.throws(()=>validateAuditWorkflow(bad),/WORKFLOW_RELEASE_COMMAND_UNEXPECTED|WORKFLOW_ATTEMPTED_REPORT_EXECUTION/);
});
