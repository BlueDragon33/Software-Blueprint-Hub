#!/usr/bin/env node
// Read-only successor proof preparation. Never authorizes publication or writes law.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { constitutionPublicationPaths, constitutionPublicationProfile, applyConstitutionPublicationPatch, attestConstitutionAuthoritySources, constitutionSourceDigest } from "../packages/application/src/constitution-publication-sources.ts";
import { buildNavigationPublicationCandidate, verifyNavigationBlobSeals } from "./check-constitution-1.4-candidate.mjs";

export function buildProductCompletionPublicationCandidate(root=process.cwd(),revision="",runId=""){
 const prior=buildNavigationPublicationCandidate(root,revision,runId);
 const activeVersion=prior.descriptor.activePolicyVersion;
 const profile=constitutionPublicationProfile("1.4.0");
 const patch=readFileSync(root+"/"+profile.patchPath,"utf8");
 const files=applyConstitutionPublicationPatch(prior.files,patch);
 verifyNavigationBlobSeals(prior.files,files,patch);
 const attestation=attestConstitutionAuthoritySources(files,revision,runId);
 const old=JSON.parse(prior.files[constitutionPublicationPaths[1]]);
 const next=JSON.parse(files[constitutionPublicationPaths[1]]);
 if(attestation.policyVersion!=="1.5.0"||attestation.productionReleaseAuthority!==false||
    JSON.stringify(next.executionRules.slice(0,33))!==JSON.stringify(old.executionRules)||
    JSON.stringify(next.executionRules.slice(33).map(r=>r.id))!==JSON.stringify(["R34","R35","R36","R37","R38"]))throw Error("Successor candidate law mismatch");
 if(prior.attestation.authoritySetDigest!=="sha256:229b4084e5f4efe0a70432bb447ca76cf6e1101790ba3d79e5066775d5cbea2d"||
    attestation.authoritySetDigest!=="sha256:b0fc80df000fa611474958cdb5668cb2d6913f519873a10c53e043c782fbd9b3")throw Error("Successor authority-set seal mismatch");
 if(activeVersion==="1.5.0"&&constitutionPublicationPaths.some(path=>readFileSync(root+"/"+path,"utf8")!==files[path]))throw Error("Activated successor source drift");
 const status=activeVersion==="1.3.0"?"PREDECESSOR_NOT_ACTIVE":activeVersion==="1.4.0"?"INACTIVE_CANDIDATE_VERIFIED":"ACTIVE_AUTHORITY_SET_VERIFIED";
 return {profile,files,attestation,descriptor:{status,activePolicyVersion:activeVersion,candidatePolicyVersion:attestation.policyVersion,ruleCount:38,sourceRevision:revision,ciRunId:runId,authoritySetDigest:attestation.authoritySetDigest,publicationPatchDigest:constitutionSourceDigest(patch),ratification:"NOT_ASSERTED",publication:"NOT_ASSERTED",productionReleaseAuthority:false}};
}
if(import.meta.url===pathToFileURL(process.argv[1]??"").href){
 const revision=process.env.GITHUB_SHA??"",runId=process.env.GITHUB_RUN_ID??"";
 const result=buildProductCompletionPublicationCandidate(process.cwd(),revision,runId);
 if(process.argv.includes("--write-evidence")){
  if(result.descriptor.status==="PREDECESSOR_NOT_ACTIVE")throw Error("1.5 publication proof requires an active 1.4 predecessor");
  if(!/^[a-f0-9]{40}$/.test(revision)||!/^\d+$/.test(runId))throw Error("Exact CI context required");
  mkdirSync("artifacts",{recursive:true});
  for(const [path,bytes] of [[result.profile.descriptorPath,result.descriptor],[result.profile.attestationPath,result.attestation]])writeFileSync(path,JSON.stringify(bytes,null,2)+"\n");
 }
 console.log("[constitution-1.5-candidate]",result.descriptor.status,result.attestation.authoritySetDigest);
}
