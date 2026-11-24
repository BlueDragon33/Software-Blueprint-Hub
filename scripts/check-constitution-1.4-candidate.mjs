#!/usr/bin/env node
// Candidate and exact activated byte readback; never writes active sources or a ratification.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { constitutionPublicationPaths, constitutionPublicationProfile, applyConstitutionPublicationPatch, attestConstitutionAuthoritySources, constitutionSourceDigest } from "../packages/application/src/constitution-publication-sources.ts";
// Reverse only the same strict bounded patch grammar; the canonical replay checks all eight paths.
export function reverseNavigationPatch(patch){
 return patch.split("\n").map(line=>{
  if(line.startsWith("index "))return line.replace(/^index ([a-f0-9]+)\.\.([a-f0-9]+) 100644$/,"index $2..$1 100644");
  if(line.startsWith("--- a/")||line.startsWith("+++ b/"))return line;
  if(line.startsWith("@@ "))return line.replace(/^@@ -(\d+)(,\d+)? \+(\d+)(,\d+)? @@(.*)$/,"@@ -$3$4 +$1$2 @@$5");
  if(line.startsWith("+"))return "-"+line.slice(1);
  if(line.startsWith("-"))return "+"+line.slice(1);
  return line;
 }).join("\n");
}
export function readNavigationBaseline(root=process.cwd()){
 const read=path=>readFileSync(root+"/"+path,"utf8");
 const current=Object.fromEntries(constitutionPublicationPaths.map(path=>[path,read(path)]));
 const active=attestConstitutionAuthoritySources(current,"","");
 const profile=constitutionPublicationProfile("1.3.0"),patch=read(profile.patchPath);
 if(active.policyVersion==="1.3.0")return {originals:current,current,activeVersion:active.policyVersion,profile,patch};
 if(active.policyVersion!=="1.4.0")throw Error("Unsupported R33 authority baseline");
 const originals=applyConstitutionPublicationPatch(current,reverseNavigationPatch(patch));
 const replay=applyConstitutionPublicationPatch(originals,patch);
 if(attestConstitutionAuthoritySources(originals,"","").policyVersion!=="1.3.0"||constitutionPublicationPaths.some(path=>replay[path]!==current[path]))throw Error("Activated R33 source drift");
 return {originals,current,activeVersion:active.policyVersion,profile,patch};
}
export function buildNavigationPublicationCandidate(root=process.cwd(),revision="",runId=""){
 const {originals,activeVersion,profile,patch}=readNavigationBaseline(root);
 const baseline=attestConstitutionAuthoritySources(originals,revision,runId);
 if(baseline.policyVersion!=="1.3.0")throw Error("R33 requires exact 1.3 baseline");
 const files=applyConstitutionPublicationPatch(originals,patch);
 const attestation=attestConstitutionAuthoritySources(files,revision,runId);
 const old=JSON.parse(originals[constitutionPublicationPaths[1]]),next=JSON.parse(files[constitutionPublicationPaths[1]]);
 if(attestation.policyVersion!==profile.targetVersion||next.executionRules.length!==33||JSON.stringify(next.executionRules.slice(0,32))!==JSON.stringify(old.executionRules)||next.executionRules[32].id!=="R33"||!next.navigationSupport?.attachments?.bindResolvedSetToReview||next.navigationSupport?.productionReleaseAuthority!==false)throw Error("R33 candidate law mismatch");
 return {profile,originals,files,attestation,descriptor:{status:activeVersion==="1.3.0"?"INACTIVE_CANDIDATE_VERIFIED":"ACTIVE_AUTHORITY_SET_VERIFIED",activePolicyVersion:activeVersion,candidatePolicyVersion:attestation.policyVersion,ruleCount:33,sourceRevision:revision,ciRunId:runId,authoritySetDigest:attestation.authoritySetDigest,publicationPatchDigest:constitutionSourceDigest(patch),ratification:"NOT_ASSERTED",publication:"NOT_ASSERTED",productionReleaseAuthority:false}};
}
if(process.argv[1]?.endsWith("/check-constitution-1.4-candidate.mjs")){
 const revision=process.env.GITHUB_SHA??"",runId=process.env.GITHUB_RUN_ID??"";
 const result=buildNavigationPublicationCandidate(process.cwd(),revision,runId);
 if(process.argv.includes("--write-evidence")){
  if(!/^[a-f0-9]{40}$/.test(revision)||!/^\d+$/.test(runId))throw Error("Exact CI context required");
  mkdirSync("artifacts",{recursive:true});
  for(const [path,bytes] of [[result.profile.descriptorPath,result.descriptor],[result.profile.attestationPath,result.attestation]])writeFileSync(path,JSON.stringify(bytes,null,2)+"\n");
 }
 console.log("[constitution-1.4-candidate]",result.descriptor.status,result.attestation.authoritySetDigest);
}
