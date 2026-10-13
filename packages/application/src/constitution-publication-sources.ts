import { createHash } from "node:crypto";
import type { ConstitutionAuthoritySetAttestation, ConstitutionAuthoritySetComponent } from "@blueprint-os/core";

export const constitutionPublicationPaths = Object.freeze([
  "docs/UNIVERSAL-CONSTITUTION.md", "control/universal-constitution.contract.json",
  "packages/application/src/foundation-templates.ts", "packages/application/src/constitution-authority.ts",
  "control/universal-constitution-version.json", ".blueprint/constitution-adoption.json",
  "control/constitution-ecosystem-snapshot.json", "control/constitution-compliance-snapshot.json"
]);
export const constitutionPublicationPatchPath = "docs/amendments/CONSTITUTION-1.3-PUBLICATION.patch";
export type ConstitutionSourceFiles = Readonly<Record<string, string>>;
export const constitutionSourceDigest = (bytes: string) =>
  "sha256:" + createHash("sha256").update(bytes).digest("hex");
const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable) :
  value && typeof value === "object" ? Object.fromEntries(Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)])) : value;
const match = (text: string, pattern: RegExp): string => {
  const value = text.match(pattern)?.[1];
  if (!value) throw new TypeError("Missing canonical constitutional version/identity");
  return value;
};
const source = (files: ConstitutionSourceFiles, path: string): string => {
  const bytes = files[path];
  if (typeof bytes !== "string") throw new TypeError("Missing canonical source " + path);
  return bytes;
};

/** Strict bounded patch replay; no shell, code execution, offsets or arbitrary paths. */
export function applyConstitutionPublicationPatch(files: ConstitutionSourceFiles, patch: string): ConstitutionSourceFiles {
  if (!patch.endsWith("\n")) throw new TypeError("Publication patch contains unconsumed trailing data");
  const lines = patch.split("\n"), result: Record<string, string> = {}, seen = new Set<string>();
  let i = 0;
  while (i < lines.length - 1) {
    const header = lines[i++]?.match(/^diff --git a\/(\S+) b\/(\S+)$/);
    const path = header?.[1];
    if (!path || header?.[2] !== path || !constitutionPublicationPaths.includes(path) || seen.has(path)) {
      throw new TypeError("Publication patch contains an unexpected or duplicate path");
    }
    seen.add(path);
    if (!/^index [a-f0-9]+\.\.[a-f0-9]+ 100644$/.test(lines[i++] ?? "") ||
        lines[i++] !== "--- a/" + path || lines[i++] !== "+++ b/" + path) {
      throw new TypeError("Invalid publication patch header");
    }
    const before = source(files, path).split("\n"), after: string[] = [];
    let cursor = 0, hunks = 0;
    while (i < lines.length - 1 && !lines[i]?.startsWith("diff --git ")) {
      const h = lines[i++]?.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@.*$/);
      if (!h) throw new TypeError("Invalid publication patch hunk");
      const oldStart = Number(h[1]) - 1, oldCount = Number(h[2] ?? 1), newStart = Number(h[3]) - 1, newCount = Number(h[4] ?? 1);
      if (oldStart < cursor || oldStart > before.length) throw new TypeError("Patch source position drift");
      after.push(...before.slice(cursor, oldStart)); cursor = oldStart;
      if (after.length !== newStart) throw new TypeError("Patch target position drift");
      let removed = 0, added = 0;
      while (i < lines.length - 1 && !lines[i]?.startsWith("@@ ") && !lines[i]?.startsWith("diff --git ")) {
        const line = lines[i++]!;
        if (![" ", "+", "-"].includes(line[0] ?? "")) throw new TypeError("Unsupported patch encoding");
        if (line[0] !== "+") {
          if (before[cursor++] !== line.slice(1)) throw new TypeError("Publication patch baseline context mismatch");
          removed++;
        }
        if (line[0] !== "-") { after.push(line.slice(1)); added++; }
      }
      if (removed !== oldCount || added !== newCount) throw new TypeError("Patch hunk count mismatch");
      hunks++;
    }
    if (!hunks) throw new TypeError("Empty publication patch file");
    result[path] = [...after, ...before.slice(cursor)].join("\n");
  }
  if (seen.size !== constitutionPublicationPaths.length) throw new TypeError("Incomplete publication patch");
  // Version projection updates must not rewrite historical observations or local policy duties.
  for (const path of constitutionPublicationPaths.slice(5)) {
    const before = JSON.parse(source(files, path)), after = JSON.parse(source(result, path));
    const key = path.includes("ecosystem") ? "activePolicyVersion" : "policyVersion";
    before[key] = after[key];
    if (JSON.stringify(stable(before)) !== JSON.stringify(stable(after))) throw new TypeError("Publication rewrites historical adoption evidence");
  }
  return Object.freeze(result);
}

/** The shared CLI/runtime authority-set calculation; verification authority is external. */
export function attestConstitutionAuthoritySources(files: ConstitutionSourceFiles, sourceRevision: string, ciRunId: string): ConstitutionAuthoritySetAttestation {
  const manifest = JSON.parse(source(files, constitutionPublicationPaths[4]!));
  const doc = source(files, constitutionPublicationPaths[0]!);
  const contractBytes = source(files, constitutionPublicationPaths[1]!);
  const contract = JSON.parse(contractBytes);
  const template = source(files, constitutionPublicationPaths[2]!);
  const policy = source(files, constitutionPublicationPaths[3]!);
  const anchor = template.indexOf("export const universalConstitutionTemplateV1");
  const end = template.indexOf("satisfies BlueprintTemplate", anchor);
  if (anchor < 0 || end < 0) throw new TypeError("Missing canonical Universal template");
  const block = template.slice(anchor, end);
  const policyId = manifest.policyId, policyVersion = manifest.policyVersion;
  const templateId = match(block, /\bid:\s*"([^"]+)"/);
  const sourceId = match(policy, /CONSTITUTION_POLICY_ID\s*=\s*"([^"]+)"/);
  const sourceVersion = match(policy, /CONSTITUTION_POLICY_VERSION\s*=\s*"([^"]+)"/);
  if (manifest.schemaVersion !== "1.0.0" || manifest.productionReleaseAuthority !== false ||
      typeof policyId !== "string" || typeof policyVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(policyVersion) ||
      match(doc, /^Policy ID:\s*`([^`]+)`/m) !== policyId ||
      match(doc, /^Policy version:\s*\*\*([^*]+)\*\*/m) !== policyVersion ||
      contract.policyId !== policyId || contract.policyVersion !== policyVersion ||
      match(block, /\bversion:\s*"([^"]+)"/) !== policyVersion ||
      sourceId !== policyId || sourceVersion !== policyVersion ||
      contract.constitutionTemplate?.id !== templateId || contract.constitutionTemplate?.version !== policyVersion) {
    throw new TypeError("Constitution authority-set version/identity drift");
  }
  for (const [index, key] of ["normativeDocument", "machineContract", "universalTemplate", "policySource"].entries()) {
    if (manifest[key]?.path !== constitutionPublicationPaths[index] || manifest[key]?.version !== policyVersion) {
      throw new TypeError("Non-canonical authority manifest path/version");
    }
  }
  if (manifest.universalTemplate.id !== templateId) throw new TypeError("Template identity drift");
  const components: ConstitutionAuthoritySetComponent[] = [
    { id: "normative-document" as const, path: constitutionPublicationPaths[0]!, version: policyVersion, digest: constitutionSourceDigest(doc) },
    { id: "machine-contract" as const, path: constitutionPublicationPaths[1]!, version: policyVersion, digest: constitutionSourceDigest(contractBytes) },
    { id: "universal-template" as const, path: constitutionPublicationPaths[2]!, version: policyVersion, digest: constitutionSourceDigest(block) },
    { id: "policy-version" as const, path: constitutionPublicationPaths[3]!, version: policyVersion, digest: constitutionSourceDigest(JSON.stringify({ policyId: sourceId, policyVersion: sourceVersion })) }
  ].sort((a, b) => a.id.localeCompare(b.id));
  return Object.freeze({ schemaVersion: "1.0.0", source: "trusted-ci-attestation", policyId, policyVersion,
    sourceRevision, ciRunId, components, authoritySetDigest: constitutionSourceDigest(JSON.stringify(stable({ policyId, policyVersion, components }))), productionReleaseAuthority: false });
}
