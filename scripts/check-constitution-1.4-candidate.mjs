#!/usr/bin/env node
// Inactive 1.4 candidate only. Never writes active sources or a ratification.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { constitutionPublicationPaths, constitutionPublicationProfile, applyConstitutionPublicationPatch, attestConstitutionAuthoritySources, constitutionSourceDigest } from "../packages/application/src/constitution-publication-sources.ts";
export function buildNavigationPublicationCandidate(root=process.cwd(),revision="",runId=""){
 const read=path=>readFileSync(root+"/"+path,"utf8");
 const originals=Object.fromEntries(constitutionPublicationPaths.map(path=>[path,read(path)]));
 const baseline=attestConstitutionAuthoritySources(originals,revision,runId);
 if(baseline.policyVersion!=="1.3.0")throw Error("R33 requires exact 1.3 baseline");
 const profile=constitutionPublicationProfile(baseline.policyVersion),patch=read(profile.patchPath);
 const files=applyConstitutionPublicationPatch(originals,patch);
 const attestation=attestConstitutionAuthoritySources(files,revision,runId);
 const old=JSON.parse(originals[constitutionPublicationPaths[1]]),next=JSON.parse(files[constitutionPublicationPaths[1]]);
 if(attestation.policyVersion!==profile.targetVersion||next.executionRules.length!==33||JSON.stringify(next.executionRules.slice(0,32))!==JSON.stringify(old.executionRules)||next.executionRules[32].id!=="R33"||!next.navigationSupport?.attachments?.bindResolvedSetToReview||next.navigationSupport?.productionReleaseAuthority!==false)throw Error("R33 candidate law mismatch");
 return {profile,files,attestation,descriptor:{status:"INACTIVE_CANDIDATE_VERIFIED",activePolicyVersion:baseline.policyVersion,candidatePolicyVersion:attestation.policyVersion,ruleCount:33,sourceRevision:revision,ciRunId:runId,authoritySetDigest:attestation.authoritySetDigest,publicationPatchDigest:constitutionSourceDigest(patch),ratification:"NOT_ASSERTED",publication:"NOT_ASSERTED",productionReleaseAuthority:false}};
}
if(process.argv[1]?.endsWith("/check-constitution-1.4-candidate.mjs")){
 const revision=process.env.GITHUB_SHA??"",runId=process.env.GITHUB_RUN_ID??"";
 const result=buildNavigationPublicationCandidate(process.cwd(),revision,runId);
 if(process.argv.includes("--write-evidence")){
  if(!/^[a-f0-9]{40}$/.test(revision)||!/^\d+$/.test(runId))throw Error("Exact CI context required");
  mkdirSync("artifacts",{recursive:true});
  for(const [path,bytes] of [[result.profile.descriptorPath,result.descriptor],[result.profile.attestationPath,result.attestation]])writeFileSync(path,JSON.stringify(bytes,null,2)+"\n");
 }
 console.log("[constitution-1.4-candidate] INACTIVE_CANDIDATE_VERIFIED",result.attestation.authoritySetDigest);
}
