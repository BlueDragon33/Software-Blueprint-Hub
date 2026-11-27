#!/usr/bin/env node
// Gate orchestration only. Source version is not proof of runtime publication.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const checker = "scripts/check-constitution-1.5-candidate.mjs";
const proofPaths = ["artifacts/constitution-1.5-candidate.json", "artifacts/constitution-1.5-authority-set.json"];

export function runSuccessorGate(root = process.cwd(), env = process.env) {
  const manifest = JSON.parse(readFileSync(join(root, "control/universal-constitution-version.json"), "utf8"));
  const version = manifest.policyVersion;
  if (!["1.3.0", "1.4.0", "1.5.0"].includes(version) || manifest.productionReleaseAuthority !== false) {
    throw new Error("Unsupported successor gate baseline");
  }
  if (proofPaths.some(path => existsSync(join(root, path)))) throw new Error("Stale successor proof exists");
  const emit = version === "1.4.0";
  if (emit && (!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA ?? "") || env.GITHUB_SHA !== env.RELEASE_GATE_REVISION || !/^\d+$/.test(env.GITHUB_RUN_ID ?? ""))) {
    throw new Error("Successor proof requires exact release revision and CI run");
  }
  const result = spawnSync(process.execPath, [checker, ...(emit ? ["--write-evidence"] : [])], { cwd: root, env, stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error("Successor checker failed", { cause: result.error });
  const present = proofPaths.map(path => existsSync(join(root, path)));
  if (present.some(value => value !== emit)) throw new Error("Unexpected successor proof output");
  if (emit) {
    const [descriptor, attestation] = proofPaths.map(path => JSON.parse(readFileSync(join(root, path), "utf8")));
    if (descriptor.status !== "INACTIVE_CANDIDATE_VERIFIED" || descriptor.activePolicyVersion !== "1.4.0" || descriptor.candidatePolicyVersion !== "1.5.0" || descriptor.sourceRevision !== env.GITHUB_SHA || descriptor.ciRunId !== env.GITHUB_RUN_ID || descriptor.ratification !== "NOT_ASSERTED" || descriptor.publication !== "NOT_ASSERTED" || descriptor.productionReleaseAuthority !== false || attestation.policyVersion !== "1.5.0" || attestation.sourceRevision !== env.GITHUB_SHA || attestation.ciRunId !== env.GITHUB_RUN_ID || attestation.productionReleaseAuthority !== false || descriptor.authoritySetDigest !== attestation.authoritySetDigest) {
      throw new Error("Successor proof output mismatch");
    }
  }
  return emit ? "SUCCESSOR_PROOF_PREPARED_NOT_PUBLISHED" : "SUCCESSOR_READ_ONLY_NO_PROOF";
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  console.log("[constitution-successor-gate]", runSuccessorGate());
}
