import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const allowed=new Map([
 ["Software-Blueprint-Execution-Gateway","project:software-blueprint-execution-gateway"],
 ["Software-Blueprint-Execution-Worker","project:software-blueprint-execution-worker"],
 ["Software-Blueprint-QA-Worker","project:software-blueprint-qa-worker"]
]);
const sha=/^[a-f0-9]{40}$/;
const iso=v=>typeof v==="string"&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
export function validatePrivateServices(observation,baseline,publicQueue,policy){
 const errors=[];const bad=(reason)=>errors.push(reason);
 if(observation?.schemaVersion!=="1.0.0"||observation?.kind!=="private-execution-service-onboarding")return ["invalid private service observation"];
 if(observation.authority!=="read-only-observation-not-canonical-registration"||observation.credentialBridgeStatus!=="NOT_CONFIGURED")bad("private repository access not independently verified");
 if(observation.policyVersion!==policy?.policyVersion)bad("constitution policy mismatch");
 if(observation.sealedBaselineCount!==baseline?.repositories?.length)bad("sealed registry changed");
 if(!Array.isArray(observation.entries)||observation.entries.length!==allowed.size)return [...errors,"expected three separately staged private services"];
 const repos=new Set([...baseline.repositories.map(x=>x.repository),...publicQueue.entries.map(x=>x.repository)]);
 const projects=new Set([...baseline.repositories.map(x=>x.projectId),...publicQueue.entries.map(x=>x.projectId)]);
 const seen=new Set(),projectsSeen=new Set();
 for(const e of observation.entries){
   if(!e||typeof e!=="object"){bad("invalid entry");continue;}
   const short=e.repository?.split("/")[1];
   if(typeof short!=="string"||e.repository!=="BlueDragon33/"+short||allowed.get(short)!==e.projectId)bad("unapproved repository identity");
   if(seen.has(e.repository)||repos.has(e.repository))bad("duplicate or canonical repository");
   if(projectsSeen.has(e.projectId)||projects.has(e.projectId))bad("duplicate or canonical project");
   seen.add(e.repository);projectsSeen.add(e.projectId);
   if(e.branch!=="main"||e.blueprintLevel!=="B3"||!sha.test(e.sourceRevision??"")||!iso(e.observedAt))bad("invalid exact observed HEAD");
   if(e.visibility!=="private"||e.sourceFreshness!=="repository-own-main-ci-only"||e.liveCrossRepoVerified!==false)bad("unverified private cross-repo access must remain explicit");
   if(e.registrationState!=="pending-onboarding"||e.complianceState!=="UNVERIFIED"||e.canonicalProjectProfile!==false||e.productionAuthority!==false)bad("self-declared constitutional/production authority");
   if(e.adoptionPr!=="https://github.com/"+e.repository+"/pull/1"||
      !/^https:\/\/github\.com\/BlueDragon33\/Software-Blueprint-[A-Za-z-]+\/actions\/runs\/\d+$/.test(e.constitutionCi??"")||
      !/^https:\/\/github\.com\/BlueDragon33\/Software-Blueprint-[A-Za-z-]+\/actions\/runs\/\d+$/.test(e.serviceCi??"")||
      !e.constitutionCi.includes("/"+short+"/")||!e.serviceCi.includes("/"+short+"/"))bad("repository-specific PR/CI evidence misattributed");
 }
 if(seen.size!==allowed.size||[...allowed.keys()].some(k=>!seen.has("BlueDragon33/"+k)))bad("missing expected private service");
 return errors;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
try{
 const load=p=>JSON.parse(readFileSync(p,"utf8"));
 const errors=validatePrivateServices(
 load("control/private-execution-service-onboarding.v1.json"),
 load("control/constitution-governed-repositories.json"),
 load("control/governance-onboarding-queue.v1.json"),
 load("control/universal-constitution-version.json")
 );
 if(errors.length){for(const e of errors)console.error("[private-services] "+e);process.exitCode=1;}
 else console.log("[private-services] PASS: 3 private pending, cross-repo verification NOT_CONFIGURED; no authority issued");
}catch(e){console.error("[private-services] "+e.message);process.exitCode=1;}
}
