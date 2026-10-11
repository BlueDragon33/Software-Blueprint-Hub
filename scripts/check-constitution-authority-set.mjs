#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { attestConstitutionAuthoritySources, constitutionPublicationPaths } from "../packages/application/src/constitution-publication-sources.ts";

try {
  const args = process.argv.slice(2);
  let manifestPath = "control/universal-constitution-version.json", output;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--write") { output = args[++i]; if (!output) throw new Error("--write requires an output path"); }
    else if (args[i] === "--json") continue;
    else if (args[i]?.startsWith("--")) throw new Error("Unknown argument " + args[i]);
    else manifestPath = args[i];
  }
  const files = Object.fromEntries(constitutionPublicationPaths.slice(0, 5).map(path =>
    [path, readFileSync(path === "control/universal-constitution-version.json" ? manifestPath : path, "utf8")]));
  const calculated = attestConstitutionAuthoritySources(files, process.env.GITHUB_SHA ?? "", process.env.GITHUB_RUN_ID ?? "");
  const attestation = { ...calculated, sourceRevision: process.env.GITHUB_SHA ?? null, ciRunId: process.env.GITHUB_RUN_ID ?? null };
  if (output) {
    if (!/^[a-f0-9]{40}$/.test(attestation.sourceRevision ?? "") || !/^\d+$/.test(attestation.ciRunId ?? "")) throw new Error("--write requires GITHUB_SHA and GITHUB_RUN_ID trusted CI context");
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, JSON.stringify(attestation, null, 2) + "\n");
  }
  console.log(args.includes("--json") ? JSON.stringify(attestation, null, 2) :
    `[constitution-authority-set] PASS ${attestation.policyId}@${attestation.policyVersion} · 4 components · ${attestation.authoritySetDigest}`);
} catch (error) {
  console.error("[constitution-authority-set] " + (error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
}
