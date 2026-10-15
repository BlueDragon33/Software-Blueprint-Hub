import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function validateOnboardingQueue(queue, governed, policy) {
  const errors = [];
  const reject = (message) => errors.push(message);
  if (!queue || queue.schemaVersion !== "1.0.0" || queue.kind !== "governed-repository-onboarding-queue") return ["invalid onboarding queue"];
  if (queue.scope !== "bounded-observation-not-constitutional-authority") reject("queue cannot claim constitutional authority");
  if (queue.sealedBaseline?.policyVersion !== policy?.policyVersion) reject("queue policy must agree with active Constitution");
  if (!Array.isArray(governed?.repositories) || !Array.isArray(queue.entries)) return [...errors, "invalid repository arrays"];
  if (queue.sealedBaseline?.governedCount !== governed.repositories.length) reject("sealed baseline count drift");
  const accepted = new Set(governed.repositories.map(e => e.repository));
  const seen = new Set();
  for (const e of queue.entries) {
    if (!e || typeof e !== "object") { reject("invalid queue entry"); continue; }
    if (typeof e.repository !== "string" || !/^BlueDragon33\/[A-Za-z0-9_.-]+$/.test(e.repository)) reject("invalid repository");
    if (seen.has(e.repository)) reject("duplicate pending repo: " + e.repository);
    seen.add(e.repository);
    if (accepted.has(e.repository)) reject("pending repository already present in constitutional baseline: " + e.repository);
    if (e.branch !== "main") reject("unknown pending default branch for " + e.repository);
    if (!/^project:[a-z0-9-]+$/.test(e.projectId ?? "")) reject("invalid projectId");
    if (!/^B[0-5]$/.test(e.proposedBlueprintLevel ?? "")) reject("invalid proposed blueprint level");
    if (!/^[a-f0-9]{40}$/.test(e.observedMainSha ?? "")) reject("missing exact observed HEAD");
    if (typeof e.adoptionPr !== "string" || !e.adoptionPr.startsWith("https://github.com/" + e.repository + "/pull/") || !/^\\d+$/.test(e.adoptionPr.split("/").at(-1))) reject("adoption PR URL mismatch for " + e.repository);
    if (typeof e.adoptionCI !== "string" || !e.adoptionCI.startsWith("https://github.com/" + e.repository + "/actions/runs/")) reject("missing matching CI evidence");
    if (e.state !== "adopted-pending-canonical-registration" || e.canonicalCompliance !== "UNVERIFIED" || e.productionAuthority !== false) reject("cannot claim PASS or production for pending repository");
  }
  if (queue.entries.length === 0) reject("onboarding queue must not be empty while active");
  if (typeof queue.promotionRule !== "string" || !queue.promotionRule.includes("reviewed migration")) reject("sealed snapshot migration gate missing");
  if (Number.isNaN(Date.parse(queue.recordedAt ?? ""))) reject("recordedAt required");
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const queue = JSON.parse(readFileSync("control/governance-onboarding-queue.v1.json", "utf8"));
    const governed = JSON.parse(readFileSync("control/constitution-governed-repositories.json", "utf8"));
    const policy = JSON.parse(readFileSync("control/universal-constitution-version.json", "utf8"));
    const errors = validateOnboardingQueue(queue, governed, policy);
    if (errors.length) {
      for (const error of errors) console.error("[governance-onboarding] " + error);
      process.exitCode = 1;
    } else console.log("[governance-onboarding] PASS: 2 adopted foundations staged outside sealed constitutional registry");
  } catch (error) {
    console.error("[governance-onboarding] failed: " + error.message);
    process.exitCode = 1;
  }
}
