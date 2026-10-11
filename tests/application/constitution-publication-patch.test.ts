import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { buildConstitutionCandidate } from "../../scripts/check-constitution-1.3-candidate.mjs";
import { applyConstitutionPublicationPatch, attestConstitutionAuthoritySources } from "../../packages/application/src/constitution-publication-sources";

describe("sealed publication bytes", () => {
  it("derives the real reviewed authority set from the exact eight-file patch", () => {
    const candidate = buildConstitutionCandidate();
    const files = Object.fromEntries(candidate.originals);
    const result = applyConstitutionPublicationPatch(files, readFileSync("docs/amendments/CONSTITUTION-1.3-PUBLICATION.patch", "utf8"));
    expect(result).toEqual(Object.fromEntries(candidate.files));
    const attestation = attestConstitutionAuthoritySources(result, "a".repeat(40), "38159024792");
    expect(attestation.policyVersion).toBe("1.3.0");
    expect(attestation.components).toHaveLength(4);
  });
  it("rejects paths outside the canonical set and mismatched baseline context", () => {
    const candidate = buildConstitutionCandidate();
    const files = Object.fromEntries(candidate.originals);
    const patch = readFileSync("docs/amendments/CONSTITUTION-1.3-PUBLICATION.patch", "utf8");
    expect(() => applyConstitutionPublicationPatch(files, patch + "THIS IS UNPARSED TRAILING DATA")).toThrow();
    expect(() => applyConstitutionPublicationPatch(files, patch.replaceAll("docs/UNIVERSAL-CONSTITUTION.md", "../outside"))).toThrow();
    files["docs/UNIVERSAL-CONSTITUTION.md"] = "tampered\n";
    expect(() => applyConstitutionPublicationPatch(files, patch)).toThrow();
  });
});
