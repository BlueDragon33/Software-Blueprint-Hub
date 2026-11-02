/**
 * Pure, fail-closed OpenNext peer range appraisal. Never installs or executes
 * adapter binaries; build-script trust review is independent from peer support.
 */
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
const pathFromRoot=p=>new URL(p, "file://"+root);
const app=JSON.parse(readFileSync(new URL("../apps/web/package.json",import.meta.url),"utf8"));
const metadata=JSON.parse(readFileSync(process.argv[2]||"artifacts/opennext-metadata.json","utf8"));
const nextVersion=app.dependencies?.next;
function version(s){const m=/^(\d+)\.(\d+)\.(\d+)$/.exec(s??"");return m?m.slice(1).map(Number):null;}
function cmp(a,b){for(let i=0;i<3;i++){if(a[i]!==b[i])return a[i]<b[i]?-1:1;}return 0;}
const observedPeer=metadata.peerDependencies?.next??null;
const next=version(nextVersion);
// This explicit shape is intentionally fail-closed; unknown semver variants
// must be reviewed, not optimistically classified compatible.
const peerKnown=observedPeer===">=15.5.28 <16 || >=16.4.1";
const adapterVersionKnown=metadata.version==="1.20.15";
const eligible=Boolean(peerKnown&&adapterVersionKnown&&next&&
 ((next[0]===15&&cmp(next,[15,5,28])>=0)||
  (next[0]===16&&cmp(next,[16,4,1])>=0)));
const status=!peerKnown||!adapterVersionKnown||!next
 ?"PEER_POLICY_UNRECOGNIZED_BLOCKED"
 :eligible?"PEER_RANGE_ACCEPTED_RUNTIME_UNVERIFIED":"PEER_RANGE_INCOMPATIBLE_BLOCKED";
const evidence={
 kind:"OpenNext-exact-version-peer-dependency-read-only-evidence",
 status, nextVersion, adapterVersion:metadata.version??null,
 peerDependency:observedPeer,
 peerEligible:eligible,
 buildScriptsApproved:false,
 opennextCliExecuted:false,
 runtimeVerified:false,
 productionAuthorized:false
};
writeFileSync(process.argv[3]||"artifacts/opennext-peer-evidence.json",JSON.stringify(evidence,null,2)+"\n");
console.log("[opennext-peer] "+status+": Hub Next "+nextVersion+"; OpenNext "+metadata.version+" requires "+observedPeer);
if(!next||!metadata.version||!observedPeer)process.exitCode=1;
