import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { buildNavigationPublicationCandidate } from "./check-constitution-1.4-candidate.mjs";
import { buildProductCompletionPublicationCandidate } from "./check-constitution-1.5-candidate.mjs";

// Historical registrations are observations at the sealed 1.3 baseline, never
// evidence of successor adoption. Successor source compatibility requires exact
// eight-path replay; this is not an authenticated publication or compliance record.
export const registrationBaselineVersion = "1.3.0";
const manifestPath = "control/universal-constitution-version.json";
const contractPath = "control/universal-constitution.contract.json";
export function assertGovernancePolicySource(policy, root=process.cwd()) {
  if(policy?.policyId!=="blueprint-os:universal-century-grade"||policy.productionReleaseAuthority!==false)throw Error("invalid governance policy identity/authority");
  if(policy.policyVersion===registrationBaselineVersion)return;
  if(!["1.4.0","1.5.0"].includes(policy.policyVersion))throw Error("unsupported governance policy source version");
  const manifest=JSON.parse(readFileSync(join(root, manifestPath),"utf8"));
  if(!isDeepStrictEqual(policy,manifest))throw Error("successor policy manifest differs from actual source");
  const proof=policy.policyVersion==="1.4.0"?buildNavigationPublicationCandidate(root):buildProductCompletionPublicationCandidate(root);
  const expected=policy.policyVersion==="1.4.0"?"sha256:229b4084e5f4efe0a70432bb447ca76cf6e1101790ba3d79e5066775d5cbea2d":"sha256:b0fc80df000fa611474958cdb5668cb2d6913f519873a10c53e043c782fbd9b3";
  if(proof.descriptor.status!=="ACTIVE_AUTHORITY_SET_VERIFIED"||proof.descriptor.activePolicyVersion!==policy.policyVersion||proof.attestation.authoritySetDigest!==expected)throw Error("successor governance source seal mismatch");
}

export function readHistoricalRegistrationContract(root = process.cwd()) {
  const policy = JSON.parse(readFileSync(join(root, manifestPath), "utf8"));
  assertGovernancePolicySource(policy, root);
  const { originals } = buildNavigationPublicationCandidate(root);
  return JSON.parse(originals[contractPath]);
}
