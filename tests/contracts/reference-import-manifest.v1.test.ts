import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { validateReferenceImportManifest } from "../../packages/contracts/src";

async function manifestFixture(): Promise<unknown> {
  const url = new URL(
    "../../packages/application/src/reference-imports/bauman-nextgen-v1.json",
    import.meta.url
  );
  return JSON.parse(await readFile(url, "utf8"));
}

describe("Reference Import Manifest v1", () => {
  it("accepts the frozen Bauman Reference Import manifest", async () => {
    const result = validateReferenceImportManifest(await manifestFixture());

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("fails closed when exact source provenance is missing", async () => {
    const invalid = structuredClone(await manifestFixture()) as {
      source: Record<string, unknown>;
    };
    delete invalid.source.revision;

    const result = validateReferenceImportManifest(invalid);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "required")).toBe(true);
  });

  it("rejects a non-exact source revision", async () => {
    const invalid = structuredClone(await manifestFixture()) as {
      source: Record<string, unknown>;
    };
    invalid.source.revision = "latest";

    const result = validateReferenceImportManifest(invalid);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "pattern")).toBe(true);
  });

  it("rejects authority escalation inside a Reference Import", async () => {
    const invalid = structuredClone(await manifestFixture()) as {
      authority: Record<string, unknown>;
    };
    invalid.authority.canonicalProjectState = true;

    const result = validateReferenceImportManifest(invalid);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "const")).toBe(true);
  });

  it("forbids network-dependent canonical reads", async () => {
    const invalid = structuredClone(await manifestFixture()) as {
      driftPolicy: Record<string, unknown>;
    };
    invalid.driftPolicy.networkRequiredForCanonicalRead = true;

    const result = validateReferenceImportManifest(invalid);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "const")).toBe(true);
  });

  it("rejects unknown import classifications", async () => {
    const invalid = structuredClone(await manifestFixture()) as {
      conceptMappings: Array<Record<string, unknown>>;
    };
    invalid.conceptMappings[0]!.classification = "looks-universal";

    const result = validateReferenceImportManifest(invalid);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "enum")).toBe(true);
  });

  it("enforces deterministic identity relationships", async () => {
    const invalid = structuredClone(await manifestFixture()) as Record<
      string,
      unknown
    >;
    invalid.id = "reference-import:wrong:v1";

    const result = validateReferenceImportManifest(invalid);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "identity")).toBe(true);
  });

  it("rejects duplicate source artifact paths", async () => {
    const invalid = structuredClone(await manifestFixture()) as {
      sourceArtifacts: Array<Record<string, unknown>>;
    };
    invalid.sourceArtifacts.push(structuredClone(invalid.sourceArtifacts[0]!));

    const result = validateReferenceImportManifest(invalid);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (error) => error.keyword === "uniqueSourceArtifactPath"
      )
    ).toBe(true);
  });

  it("rejects unknown top-level fields", async () => {
    const invalid = structuredClone(await manifestFixture()) as Record<
      string,
      unknown
    >;
    invalid.surpriseAuthority = "pass";

    const result = validateReferenceImportManifest(invalid);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.keyword === "additionalProperties")
    ).toBe(true);
  });
});
