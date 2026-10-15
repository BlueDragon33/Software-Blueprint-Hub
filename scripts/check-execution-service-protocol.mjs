import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const roles=new Map([
 ["gateway","BlueDragon33/Software-Blueprint-Execution-Gateway"],
 ["executor","BlueDragon33/Software-Blueprint-Execution-Worker"],
 ["independent-qa","BlueDragon33/Software-Blueprint-QA-Worker"]
]);
const essential=["appHead","workflowDigest","canonicalDigest","policyVersion"];
const normalized=a=>Array.isArray(a)&&a.length===new Set(a).size;
export function validateExecutionBoundaryProtocol(p,privateServices,law){
 const errors=[];const bad=e=>errors.push(e);
 if(p?.schemaVersion!=="1.0.0"||p?.kind!=="execution-service-boundary-protocol")return ["invalid execution boundary contract"];
 if(p.owner!=="BlueDragon33/Software-Blueprint-Hub"||p.constitution?.policyVersion!==law?.policyVersion||p.status!=="candidate-integration-contract")bad("unauthorized contract owner/policy");
 const pending=new Map((privateServices?.entries??[]).map(e=>[e.repository,e]));
 if(!Array.isArray(p.services)||p.services.length!==roles.size)bad("incorrect service count");
 else{
  const rolesSeen=new Set();
  for(const e of p.services){
   if(rolesSeen.has(e.role)||roles.get(e.role)!==e.repository)bad("duplicate/misassigned service role");
   rolesSeen.add(e.role);
   if(pending.get(e.repository)?.projectId!==e.projectId)bad("service project not in private onboarding");
   if(!Array.isArray(e.neverGrants)||!e.neverGrants.some(v=>v.includes("production-release")))bad("implicit production authority");
  }
 }
 const w=p.wire??{},d=p.durability??{},deploy=p.deployment??{};
 for(const key of ["issuerGrantFields","gatewayDispatchFields","workerObservationFields","hubAttemptFields","hubIndependentQaFields"]){
  if(!normalized(w[key]))bad("duplicate/missing wire fields: "+key);
 }
 for(const key of essential){
  for(const place of ["issuerGrantFields","gatewayDispatchFields","workerObservationFields"])
   if(!w[place]?.includes(key))bad("missing pinned source binding "+key+" in "+place);
 }
 if(w.signature!=="Ed25519 detached base64 over canonical JSON payload (signature field excluded)"||w.version!=="1.0.0")bad("untrusted signature protocol");
 if(!w.issuerGrantFields?.includes("signature")||!w.gatewayDispatchFields?.includes("signature")||w.workerObservationFields?.includes("signature"))bad("signature boundary confusion");
 if(JSON.stringify(w.allowedModes)!==JSON.stringify(["inspect-scoped"])||
   w.budgets?.maxFiles>10||w.budgets?.maxBytes>512000||
   w.budgets?.maxGrantLifetimeSeconds>600||w.budgets?.maxAttempts!==1||
   w.budgets?.maxTokensUsed!==0)bad("unbounded execution capability");
 if(d.canonicalDatabaseOwner!=="BlueDragon33/Software-Blueprint-Hub"||
 d.hubAttemptAdapter!=="PostgresWorkflowExecutionJournal"||
 d.qaVerificationAdapter!=="PostgresWorkflowInspectionQaJournal"||
 d.workerClaimNamespace!=="worker-distinct-from-gateway-issued-grant-claim"||
 d.qualityGatePassed!==false||d.completionReceiptIssued!==false||d.productionAuthorized!==false)bad("canonical truth/quality authority escalation");
 if(deploy.authenticationState!=="NOT_CONFIGURED"||
 deploy.privateCrossRepoCredentialBridge!=="NOT_CONFIGURED"||
 deploy.previewServiceToServiceE2E!=="NOT_VERIFIED"||
 deploy.previewDatabaseMigration!=="ISOLATED_NEON_BRANCH_TEST_ONLY"||
 deploy.productionAuthority!==false)bad("false live deployment or authorization");
 return errors;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
try{
 const read=x=>JSON.parse(readFileSync(x,"utf8"));
 const e=validateExecutionBoundaryProtocol(read("control/execution-service-protocol.v1.json"),read("control/private-execution-service-onboarding.v1.json"),read("control/universal-constitution-version.json"));
 if(e.length){e.forEach(x=>console.error("[execution-protocol] "+x));process.exitCode=1;}else console.log("[execution-protocol] PASS: signed inspect-only boundaries, no live permissions claimed");
}catch(e){console.error("[execution-protocol] "+e.message);process.exitCode=1;}
}
