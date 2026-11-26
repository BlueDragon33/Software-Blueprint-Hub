import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {independentlyReviewPolicy} from "../../scripts/audit-worker-independent-isolation.mjs";
const policy=JSON.parse(readFileSync(new URL("../../control/worker-local-sandbox-preflight.proposed.json",import.meta.url),"utf8"));
const trust=JSON.parse(readFileSync(new URL("../../control/worker-local-adapter-trust.proposed.json",import.meta.url),"utf8"));
const copy=()=>structuredClone(policy);
function blocked(change,message){const p=copy();change(p);
 assert.throws(()=>independentlyReviewPolicy(p,trust),new RegExp("ISOLATION_REVIEW_DENIED_"+message));
}
test("Review of unchanged proposed policy returns explicit evidence BLOCKED, never independent human approval",()=>{
 const r=independentlyReviewPolicy(policy,trust);
 assert.equal(r.staticDenyContractIntact,true);
 assert.equal(r.decision,"BLOCKED_MISSING_INDEPENDENT_ISOLATION_EVIDENCE");
 assert.equal(r.gaps.length,12);
 for(const name of ["humanReviewerVerified","githubBranchProtectionVerified","containerImageVerified",
 "hostIsolationVerified","noEgressVerified","secretIsolationVerified","actualResourceLimitsVerified",
 "postinstallAllowed","nativeBinaryExecuted","workerdExecuted","productionAuthorized"])
  assert.equal(r[name],false,name);
});
test("Unreviewed container image digest or forged reviewer identifier is refused, not accepted as evidence",()=>{
 blocked(p=>p.containerContract.imageDigest="sha256:"+"f".repeat(64),"IMAGE_DIGEST_NOT_REVIEWED");
 blocked(p=>p.evidenceGate.reviewerApprovalId="AUTO_REVIEWER_FAKE","REVIEWER_NOT_ASSIGNED");
 blocked(p=>p.evidenceGate.hostIsolationVerified=true,"UNVERIFIED_EVIDENCE_hostIsolationVerified");
 blocked(p=>p.evidenceGate.signatureVerified=true,"UNVERIFIED_EVIDENCE_signatureVerified");
 blocked(p=>p.reviewedBaseline.boundExecutionHeadSha="f".repeat(40),"LIVE_SOURCE_SHA_NOT_AUTHORIZED");
});
test("Seccomp/AppArmor, namespace and least privilege cannot be relaxed",()=>{
 blocked(p=>p.containerContract.user.seccomp="unconfined","USER_PROFILE");
 blocked(p=>p.containerContract.user.apparmor="unconfined","USER_PROFILE");
 blocked(p=>p.containerContract.user.userNamespaceRequired=false,"USER_PROFILE");
 blocked(p=>p.containerContract.user.privileged=true,"USER_privileged");
 blocked(p=>p.containerContract.user.capabilitiesDrop=[],"CAPABILITIES");
});
test("No egress, credentials, socket or production DB mutation policy can be weakened",()=>{
 blocked(p=>p.containerContract.network.mode="bridge","NETWORK_MODE");
 blocked(p=>p.containerContract.network.egress=true,"NETWORK_egress");
 blocked(p=>p.containerContract.network.dns=true,"NETWORK_dns");
 blocked(p=>p.containerContract.credentials.inheritHostEnvironment=true,"SECRETS_inheritHostEnvironment");
 blocked(p=>p.containerContract.credentials.envAllowlist.push("DATABASE_URL"),"ENV_ALLOWLIST");
 blocked(p=>p.containerContract.storage.hostMounts=["/var/run/docker.sock"],"HOST_MOUNTS");
 blocked(p=>p.containerContract.data.realNeon=true,"DATABASE_realNeon");
 blocked(p=>p.containerContract.data.socketMounts=["/run/postgresql"],"DATABASE_SOCKETS");
});
test("CPU/RAM/PIDs/time, filesystem and immutable binary/source digest regressions are rejected",()=>{
 blocked(p=>p.containerContract.limits.memoryMiB=4096,"LIMIT_memoryMiB");
 blocked(p=>p.containerContract.limits.wallClockSeconds=999,"LIMIT_wallClockSeconds");
 blocked(p=>p.containerContract.limits.pids=0,"LIMIT_pids");
 blocked(p=>p.containerContract.storage.rootReadonly=false,"FILESYSTEM_rootReadonly");
 blocked(p=>p.containerContract.storage.tmpfs[0].noexec=false,"TMPFS");
 blocked(p=>p.pinnedToolchain.nativeLinuxX64.workerd.elfSha256="0".repeat(64),"WORKERD_PIN_DRIFT");
 blocked(p=>p.pinnedToolchain.postinstallSha256.esbuild="0".repeat(64),"ESBUILD_SCRIPT_DRIFT");
});
test("Toolchain lifecycle approvals and proposed self-promotion are independently rejected",()=>{
 blocked(p=>p.adapterRuntimeAuthorized=true,"AUTHORITY_adapterRuntimeAuthorized");
 blocked(p=>p.containerContract.status="RUNNING","CONTAINER_LAUNCH_FALSE");
 const modified=structuredClone(trust);modified.installLifecycle.approvedBuildScripts=["esbuild"];
 assert.throws(()=>independentlyReviewPolicy(policy,modified),/TOOLCHAIN_DENIAL|APPROVED_BUILD_SCRIPTS/);
 const promoted=structuredClone(trust);promoted.approvedForExecution=true;
 assert.throws(()=>independentlyReviewPolicy(policy,promoted),/TOOLCHAIN_DENIAL/);
});
