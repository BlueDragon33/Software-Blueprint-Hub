#!/usr/bin/env node
// Read-only successor proof preparation. Never authorizes publication or writes law.
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { constitutionPublicationPaths, constitutionPublicationProfile, applyConstitutionPublicationPatch, attestConstitutionAuthoritySources, constitutionSourceDigest } from "../packages/application/src/constitution-publication-sources.ts";
import { buildNavigationPublicationCandidate, verifyNavigationBlobSeals } from "./check-constitution-1.4-candidate.mjs";

export function buildProductCompletionPublicationCandidate(root=process.cwd(),revision="",runId=""){
 const prior=buildNavigationPublicationCandidate(root,revision,runId);
 const activeVersion=prior.descriptor.activePolicyVersion;
 // Superseded, unpublished target is historical only; it is not the selected publication profile.
 const profile=Object.freeze({...constitutionPublicationProfile("1.4.0"),patchPath:"docs/amendments/CONSTITUTION-1.5-PRODUCT-COMPLETION-PUBLICATION.patch"});
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
 const historicalActive=activeVersion==="1.5.0"&&constitutionPublicationPaths.every(path=>readFileSync(root+"/"+path,"utf8")===files[path]);
 const status=historicalActive?"HISTORICAL_SOURCE_MATCH":"SUPERSEDED_UNPUBLISHED_CANDIDATE";
 return {profile,files,attestation,descriptor:{status,activePolicyVersion:activeVersion,candidatePolicyVersion:attestation.policyVersion,ruleCount:38,sourceRevision:revision,ciRunId:runId,authoritySetDigest:attestation.authoritySetDigest,publicationPatchDigest:constitutionSourceDigest(patch),ratification:"NOT_ASSERTED",publication:"NOT_ASSERTED",productionReleaseAuthority:false}};
}

const enterprisePatchPath="docs/amendments/CONSTITUTION-1.5-ENTERPRISE-OPTIMIZATION-PUBLICATION.candidate.patch";
const enterpriseDigest="sha256:5e802bf1cf50c6947f7c8b335d35acc20782ebda12fb4ce8af7e4d79c74ae6cb";
const enterprisePredecessorDigest="sha256:229b4084e5f4efe0a70432bb447ca76cf6e1101790ba3d79e5066775d5cbea2d";
const historicalProductDigest="sha256:b0fc80df000fa611474958cdb5668cb2d6913f519873a10c53e043c782fbd9b3";

// Read-only review of the revised exact target; never emit operational publication proof.
export function reviewEnterpriseAuthoritySet(prior,historical,patch,revision="",runId=""){
 if(prior.attestation.authoritySetDigest!==enterprisePredecessorDigest||
    historical.attestation.authoritySetDigest!==historicalProductDigest||
    prior.attestation.policyVersion!=="1.4.0"||historical.attestation.policyVersion!=="1.5.0")throw Error("Enterprise predecessor/historical seal mismatch");
 const files=applyConstitutionPublicationPatch(prior.files,patch);
 verifyNavigationBlobSeals(prior.files,files,patch);
 const attestation=attestConstitutionAuthoritySources(files,revision,runId);
 if(attestation.authoritySetDigest!==enterpriseDigest||attestation.policyVersion!=="1.5.0"||attestation.productionReleaseAuthority!==false)throw Error("Enterprise authority-set seal mismatch");
 const [normative,contract,...unchanged]=constitutionPublicationPaths;
 const before=JSON.parse(historical.files[contract]),after=JSON.parse(files[contract]);
 if(unchanged.some(path=>files[path]!==historical.files[path])||
    !files[normative].startsWith(historical.files[normative].split("### 10.R34")[0])||
    JSON.stringify(after.executionRules)!==JSON.stringify(before.executionRules)||
    JSON.stringify(after.pillars)!==JSON.stringify(before.pillars)||
    after.enterpriseOptimization?.monitoring?.burden?.thresholdExclusive!==30||
    after.enterpriseOptimization?.monitoring?.danger?.thresholdExclusive!==40||
    after.enterpriseOptimization?.productionReleaseAuthority!==false)throw Error("Enterprise historical law or risk contract drift");
 return {files,attestation,descriptor:{status:"REVIEW_ONLY_NOT_ADMITTED",activePolicyVersion:prior.descriptor.activePolicyVersion,candidatePolicyVersion:"1.5.0",ruleCount:38,sourceRevision:revision,ciRunId:runId,authoritySetDigest:attestation.authoritySetDigest,publicationPatchDigest:constitutionSourceDigest(patch),ratification:"NOT_ASSERTED",publication:"NOT_ASSERTED",productionReleaseAuthority:false}};
}

export function buildEnterpriseReviewCandidate(root=process.cwd(),revision="",runId=""){
 const prior=buildNavigationPublicationCandidate(root,revision,runId);
 const historical=buildProductCompletionPublicationCandidate(root,revision,runId);
 return reviewEnterpriseAuthoritySet(prior,historical,readFileSync(root+"/"+enterprisePatchPath,"utf8"),revision,runId);
}

if(import.meta.url===pathToFileURL(process.argv[1]??"").href){
 const revision=process.env.GITHUB_SHA??"",runId=process.env.GITHUB_RUN_ID??"";
 // Only the revised target is selected by default. Historical inspection is explicit.
 if(process.argv.includes("--write-evidence"))throw Error("Revised enterprise candidate requires independent admission; proof emission disabled");
 const result=process.argv.includes("--historical")?buildProductCompletionPublicationCandidate(process.cwd(),revision,runId):buildEnterpriseReviewCandidate(process.cwd(),revision,runId);
 console.log("[constitution-1.5-candidate]",result.descriptor.status,result.attestation.authoritySetDigest);
}
