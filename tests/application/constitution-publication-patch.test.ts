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

describe("revised enterprise authority review (not publication admission)", () => {
  it("replays the exact revised authority and retains the historical target", async () => {
    const { buildEnterpriseReviewCandidate, buildProductCompletionPublicationCandidate } = await import("../../scripts/check-constitution-1.5-candidate.mjs");
    const historical = buildProductCompletionPublicationCandidate();
    const revised = buildEnterpriseReviewCandidate();
    expect(historical.attestation.authoritySetDigest).toBe("sha256:b0fc80df000fa611474958cdb5668cb2d6913f519873a10c53e043c782fbd9b3");
    expect(revised.attestation.authoritySetDigest).toBe("sha256:89d7956a68edc037d4ef480bbbc2c706a283d0934d5333251a63f4d7c41d3a20");
    expect(revised.descriptor.status).toBe("REVIEW_ONLY_NOT_ADMITTED");
    expect(revised.descriptor.publication).toBe("NOT_ASSERTED");
    expect(revised.descriptor.productionReleaseAuthority).toBe(false);
  });
  it("rejects a changed patch even when an existing canonical replay is available", async () => {
    const { buildProductCompletionPublicationCandidate, reviewEnterpriseAuthoritySet } = await import("../../scripts/check-constitution-1.5-candidate.mjs");
    const { buildNavigationPublicationCandidate } = await import("../../scripts/check-constitution-1.4-candidate.mjs");
    const prior=buildNavigationPublicationCandidate(), historical=buildProductCompletionPublicationCandidate();
    const patch=readFileSync("docs/amendments/CONSTITUTION-1.5-ENTERPRISE-OPTIMIZATION-PUBLICATION.candidate.patch","utf8");
    expect(() => reviewEnterpriseAuthoritySet(prior,historical,patch.replace("thresholdExclusive\": 30","thresholdExclusive\": 31"))).toThrow();
    expect(() => reviewEnterpriseAuthoritySet(prior,historical,readFileSync("docs/amendments/CONSTITUTION-1.5-PRODUCT-COMPLETION-PUBLICATION.patch","utf8"))).toThrow(/Enterprise authority-set seal mismatch/);
    expect(() => reviewEnterpriseAuthoritySet({...prior,attestation:{...prior.attestation,authoritySetDigest:"wrong"}},historical,patch)).toThrow(/predecessor\/historical seal mismatch/);
  });
});

describe("single prospective 1.5 target", () => {
  it("selects only the revised patch while retaining old target for explicit audit", async () => {
    const { constitutionPublicationProfile } = await import("../../packages/application/src/constitution-publication-sources");
    const { buildProductCompletionPublicationCandidate } = await import("../../scripts/check-constitution-1.5-candidate.mjs");
    expect(constitutionPublicationProfile("1.4.0").patchPath).toBe("docs/amendments/CONSTITUTION-1.5-ENTERPRISE-OPTIMIZATION-PUBLICATION.candidate.patch");
    expect(constitutionPublicationProfile("1.3.0").targetVersion).toBe("1.4.0");
    expect(buildProductCompletionPublicationCandidate().descriptor.status).toBe("SUPERSEDED_UNPUBLISHED_CANDIDATE");
  });
});
