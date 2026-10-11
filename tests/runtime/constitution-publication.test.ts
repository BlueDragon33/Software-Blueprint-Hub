import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildConstitutionCandidate } from "../../scripts/check-constitution-1.3-candidate.mjs";
import { attestConstitutionAuthoritySources, constitutionSourceDigest } from "../../packages/application/src/constitution-publication-sources";
import { createTestArtifact } from "./constitution-artifact-fixture";
import { GitHubConstitutionPublicationVerifier } from "../../packages/runtime/src/constitution-publication";
const SHA = "a".repeat(40), ACTIVE = "b".repeat(40), RUN = "12345";
type ProviderFixture = Record<string, unknown> & {
 jobs?: Array<Record<string, unknown> & { steps: Array<Record<string, unknown> & { conclusion: string }> }>;
 artifacts?: Array<Record<string, unknown> & { expired: boolean }>;
};
function fixture(change?: (url: string, body: ProviderFixture) => void, defect?: string) {
 const candidate = buildConstitutionCandidate();
 const steps = readFileSync(".github/workflows/ci.yml", "utf8").split("  release-gate:")[1]!.split("\n")
  .map(line => line.match(/^      - name: (.+)$/)?.[1]).filter((name): name is string => Boolean(name))
  .map(name => ({ name, status: "completed", conclusion: "success" }));
 const attestation=attestConstitutionAuthoritySources(Object.fromEntries(candidate.files),SHA,RUN);
 const patch=readFileSync("docs/amendments/CONSTITUTION-1.3-PUBLICATION.patch","utf8");
 const descriptor: Record<string,unknown>={status:"INACTIVE_CANDIDATE_VERIFIED",candidatePolicyVersion:"1.3.0",activePolicyVersion:"1.2.0",ruleCount:32,sourceRevision:SHA,ciRunId:RUN,authoritySetDigest:attestation.authoritySetDigest,
  publicationPatchDigest:constitutionSourceDigest(patch),ratification:"NOT_ASSERTED",publication:"NOT_ASSERTED",productionReleaseAuthority:false};
 const testResults={node:{passed:125,failed:0,skipped:0},vitest:{passed:273,failed:0,skipped:0},browser:{passed:72,failed:0,skipped:0,flaky:0}};
 if(defect==="skipped-tests")testResults.vitest.skipped=1;
 if(defect==="fake-seal")descriptor.authoritySetDigest="sha256:"+"2".repeat(64);
 const entries:Record<string,unknown>={"artifacts/constitution-1.3-authority-set.json":attestation,
  "artifacts/constitution-authority-set.json":attestConstitutionAuthoritySources(Object.fromEntries(candidate.originals),SHA,RUN),
  "artifacts/constitution-1.3-candidate.json":descriptor,"artifacts/release-gate-evidence.json":{repository:"BlueDragon33/Software-Blueprint-Hub",
    revision:SHA,runId:RUN,runAttempt:defect==="old-attempt"?"2":"1",productionDeploymentAuthorized:false,testResults}};
 if(defect==="missing-descriptor")delete entries["artifacts/constitution-1.3-candidate.json"];
 if(defect==="null-descriptor")entries["artifacts/constitution-1.3-candidate.json"]=null;
 const archive=createTestArtifact(entries);
 const http = async (input: string | URL | Request) => {
  const url = String(input); let body: ProviderFixture | string | undefined;
  if(url.endsWith("/artifacts/1/zip")) return new Response(archive.bytes);
  if(url.includes("/attempts/1/jobs")) body={jobs:[{id:1,name:"release-gate",run_id:Number(RUN),head_sha:SHA,status:"completed",conclusion:"success",steps}]};
  else if(url.endsWith("/artifacts?per_page=100")) body={artifacts:[{id:1,created_at:"2026-10-12T00:00:00Z",name:`release-gate-evidence-${SHA}`,expired:false,digest:archive.digest,workflow_run:{id:Number(RUN),head_sha:SHA}}]};
  else if(url.endsWith(`/actions/runs/${RUN}`)) body={id:Number(RUN),run_attempt:1,head_sha:SHA,status:"completed",conclusion:"success",path:".github/workflows/ci.yml",event:"push",repository:{full_name:"BlueDragon33/Software-Blueprint-Hub"}};
  else if(url.endsWith("/git/ref/heads/main")) body={object:{sha:ACTIVE}};
  else {
   const path=url.split(/\/(?:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa|bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb)\//)[1]!;
   body=path.endsWith("ci.yml") ? readFileSync(".github/workflows/ci.yml","utf8")+(defect==="workflow-mismatch"&&url.includes(SHA)?"\n# changed":"") : path.endsWith("PUBLICATION.patch") ? readFileSync("docs/amendments/CONSTITUTION-1.3-PUBLICATION.patch","utf8") : (url.includes(ACTIVE)?candidate.files:candidate.originals).get(path);
  }
  if (body && typeof body === "object") change?.(url,body);
  return new Response(typeof body==="string"?body:JSON.stringify(body),{status:body===undefined?404:200});
 };
 return {http: http as typeof fetch,archive};
}
describe("real-provider publication boundary",()=>{
 it("prepares verified bytes but refuses PUBLISHED before canonical and runtime activation",async()=>{
  const {http}=fixture();
  const inactive=new GitHubConstitutionPublicationVerifier({http,runtimeRevision:SHA,runtimePolicyVersion:"1.2.0"});
  const proof=await inactive.prepare(SHA,RUN);
  expect(proof.attestation.policyVersion).toBe("1.3.0");
  expect(await inactive.verify(proof.attestation)).toBe(false);
  const active=new GitHubConstitutionPublicationVerifier({http,runtimeRevision:ACTIVE,runtimePolicyVersion:"1.3.0"});
  expect(await active.verify(proof.attestation)).toBe(true);
 });
 it.each(["wrong-sha","skipped-step","expired-artifact","wrong-workflow","failed-run"])("rejects provider evidence: %s",async defect=>{
  const {http}=fixture((url,body)=>{
   if(defect==="wrong-sha"&&url.endsWith(`/actions/runs/${RUN}`))body.head_sha=ACTIVE;
   if(defect==="skipped-step"&&body.jobs)body.jobs[0].steps[0].conclusion="skipped";
   if(defect==="expired-artifact"&&body.artifacts)body.artifacts[0].expired=true;
   if(defect==="wrong-workflow"&&url.endsWith(`/actions/runs/${RUN}`))body.path=".github/workflows/fake.yml";
   if(defect==="failed-run"&&url.endsWith(`/actions/runs/${RUN}`))body.conclusion="failure";
  });
  await expect(new GitHubConstitutionPublicationVerifier({http,runtimeRevision:ACTIVE,runtimePolicyVersion:"1.3.0"}).prepare(SHA,RUN)).rejects.toThrow();
 });
 it.each(["skipped-tests", "fake-seal", "old-attempt", "workflow-mismatch", "missing-descriptor", "null-descriptor"])("rejects actual artifact/workflow evidence: %s",async defect=>{
  const {http}=fixture(undefined,defect);
  await expect(new GitHubConstitutionPublicationVerifier({http,runtimeRevision:ACTIVE,runtimePolicyVersion:"1.3.0"}).prepare(SHA,RUN)).rejects.toThrow();
 });
 it("rejects a forged digest and stale deployed revision",async()=>{
  const {http}=fixture();const verifier=new GitHubConstitutionPublicationVerifier({http,runtimeRevision:SHA,runtimePolicyVersion:"1.3.0"});
  const proof=await verifier.prepare(SHA,RUN);
  expect(await verifier.verify({...proof.attestation,authoritySetDigest:"sha256:"+"9".repeat(64)})).toBe(false);
  expect(await verifier.verify(proof.attestation)).toBe(false);
 });
 it("refreshes the session token per API request and never forwards it to artifact storage or raw sources",async()=>{
  const original=fixture();let tokenCount=0;
  const requests:{url:string;authorization:string|null}[]=[];
  const storage="https://productionresultstest.blob.core.windows.net/evidence.zip";
  const http:typeof fetch=async(input,init)=>{
   const url=String(input);requests.push({url,authorization:new Headers(init?.headers).get("Authorization")});
   if(url.endsWith("/artifacts/1/zip"))return new Response(null,{status:302,headers:{location:storage}});
   if(url===storage)return new Response(original.archive.bytes);
   return original.http(input,init);
  };
  await new GitHubConstitutionPublicationVerifier({http,runtimeRevision:ACTIVE,runtimePolicyVersion:"1.3.0",tokenProvider:async()=>`test-session-${++tokenCount}`}).prepare(SHA,RUN);
  const api=requests.filter(item=>item.url.startsWith("https://api.github.com/"));
  expect(api.length).toBeGreaterThan(1);
  expect(new Set(api.map(item=>item.authorization)).size).toBe(api.length);
  expect(api.every(item=>item.authorization?.startsWith("Bearer test-session-"))).toBe(true);
  expect(requests.filter(item=>!item.url.startsWith("https://api.github.com/")).every(item=>item.authorization===null)).toBe(true);
 });
 it("refuses untrusted artifact redirects before contacting the destination",async()=>{
  const original=fixture();const requested:string[]=[];
  const http:typeof fetch=async(input,init)=>{
   const url=String(input);requested.push(url);
   if(url.endsWith("/artifacts/1/zip"))return new Response(null,{status:302,headers:{location:"https://example.invalid/evidence.zip"}});
   return original.http(input,init);
  };
  await expect(new GitHubConstitutionPublicationVerifier({http,runtimeRevision:ACTIVE,runtimePolicyVersion:"1.3.0",token:"test-session"}).prepare(SHA,RUN)).rejects.toThrow(/Untrusted artifact redirect/);
  expect(requested.some(url=>url.startsWith("https://example.invalid/"))).toBe(false);
 });
});
