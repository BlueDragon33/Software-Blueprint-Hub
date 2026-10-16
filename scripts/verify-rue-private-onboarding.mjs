import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { inspectPendingOnboarding, githubJson } from "./verify-governance-onboarding-live.mjs";

const RUE = "BlueDragon33/Blueprint-Russian-Expert-Engine";

/**
 * Explicit, manual Preview-only onboarding proof for the private RUE repo.
 * Requires a GitHub App installation token limited to RUE with Contents:read and Actions:read.
 * Emits metadata only; never downloads corpora or issues Quality Gate/release authority.
 */
export async function verifyRuePrivateOnboarding(queue, contract, getJson=githubJson) {
  const entries = Array.isArray(queue?.entries) ? queue.entries.filter(row=>row.repository===RUE) : [];
  if (entries.length !== 1 || entries[0].visibility !== "private") {
    throw new Error("[rue-private] exact private repository not found in onboarding queue");
  }
  const selected = {...queue, entries};
  const results = await inspectPendingOnboarding(selected, contract, getJson, {scopedPrivateRead:RUE});
  const result = results[0];
  if (result?.adoptionState !== "verified-at-exact-head" ||
      result?.exactHead !== entries[0].observedMainSha ||
      !result?.verifiedCiRunId ||
      result?.qualityGatePassAllowed !== false ||
      result?.productionReleaseAuthority !== false ||
      result?.complianceState !== "UNVERIFIED") {
    throw new Error("[rue-private] private verification is not ready");
  }
  return Object.freeze({
    schema:"RUE_PRIVATE_ONBOARDING_SOURCE_CHECK_V1",
    repository:RUE,
    exactHead:result.exactHead,
    adoptionState:"SOURCE_AND_WORKFLOW_VERIFIED_ONLY",
    workflowRunId:result.verifiedCiRunId,
    canonicalProjectProfile:false,
    complianceState:"UNVERIFIED",
    qualityGatePassAllowed:false,
    productionReleaseAuthority:false
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.env.BLUEPRINT_RUE_PRIVATE_CHECK !== "true" ||
        typeof process.env.GITHUB_TOKEN !== "string" ||
        process.env.GITHUB_TOKEN.length < 30) {
      throw new Error("[rue-private] opt-in Preview scope and restricted GitHub App token required");
    }
    const queue = JSON.parse(readFileSync("control/governance-onboarding-queue.v1.json","utf8"));
    const contract = JSON.parse(readFileSync("control/universal-constitution.contract.json","utf8"));
    const result = await verifyRuePrivateOnboarding(queue, contract);
    // Only already-authorized, public onboarding metadata. No token, source bytes or corpus.
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode=1;
  }
}
