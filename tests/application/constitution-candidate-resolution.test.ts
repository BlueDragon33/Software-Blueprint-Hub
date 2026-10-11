import { runInNewContext } from "node:vm";
import { readFileSync } from "node:fs";
import { buildConstitutionCandidate } from "../../scripts/check-constitution-1.3-candidate.mjs";
import { resolveBlueprint } from "../../packages/blueprint-engine/src";
import type { BlueprintTemplate } from "../../packages/blueprint-engine/src";
import type { ProjectProfile } from "../../packages/contracts/src";
import { universalConstitutionTemplateV1 } from "../../packages/application/src/foundation-templates";
import { describe, expect, it } from "vitest";

describe("inactive constitutional candidate resolution", () => {
  it("inherits all existing pillars and binds every new rule to a real locked requirement", () => {
    const candidate = buildConstitutionCandidate();
    const source = candidate.files.get("packages/application/src/foundation-templates.ts")!;
    const block = source.slice(source.indexOf("export const universalConstitutionTemplateV1"),
      source.indexOf("export const foundationBlueprintTemplatesV1"))
      .replace("export const", "const").replace("satisfies BlueprintTemplate", "");
    const template = runInNewContext(block + "\nuniversalConstitutionTemplateV1") as BlueprintTemplate;
    const expectedIds = universalConstitutionTemplateV1.requirements.map((r) => r.id);
    expect(template.requirements.map((r) => r.id)).toEqual(expectedIds);
    expect(template.version).toBe("1.3.0");
    // Real resolver, not a mock or a token/string presence check.
    const profile = JSON.parse(readFileSync("tests/contracts/fixtures/v1/project-profile.valid.json", "utf8")) as ProjectProfile;
    const resolved = resolveBlueprint({ profile, templates: [template] });
    expect(resolved.status).toBe("success");
    if (resolved.status !== "success") throw new Error("Candidate cannot resolve");
    const inherited = new Set(resolved.requirements.map((r) => r.id));
    for (const rule of candidate.rules) expect(inherited.has(rule.requirementId)).toBe(true);
    expect(candidate.contract.pillars).toHaveLength(7);
    expect(candidate.rules).toHaveLength(32);
    expect(candidate.contract.academicCapacityReference.S100.bands).toHaveLength(10);
    expect(candidate.contract.academicCapacityReference.R200.bands).toHaveLength(10);
    expect(candidate.contract.academicCapacityReference.R200.inherits).toBe("S100");
    expect(candidate.contract.academicCapacityReference.R200.applicability).toBe("comprehensive-russian-learning-only");
    expect(candidate.contract.academicCapacityReference.featureQuota).toBe(false);
    expect(candidate.contract.academicCapacityReference.unsupportedStatus).toBe("UNVERIFIED");
    expect(candidate.contract.executionProfiles.COMPACT).toEqual(["B0", "B1", "B2"]);
    expect(candidate.contract.executionProfiles.STRUCTURED).toEqual(["B3", "B4", "B5"]);
    expect(candidate.contract.managementMigration.unsupportedStatus).toBe("UNVERIFIED");
    expect(candidate.contract.computedContrast.normalTextRatio).toBe(4.5);
  });
});
