import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { validateProjectProfile } from "../../packages/contracts/src/validation";

async function fixture(name: string): Promise<unknown> {
  const url = new URL(`./fixtures/v1/${name}`, import.meta.url);
  return JSON.parse(await readFile(url, "utf8"));
}

describe("ProjectProfile v1 contract", () => {
  it("accepts a valid versioned ProjectProfile", async () => {
    const result = validateProjectProfile(
      await fixture("project-profile.valid.json")
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects an unsupported BlueprintLevel", async () => {
    const result = validateProjectProfile(
      await fixture("project-profile.invalid-blueprint-level.json")
    );

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.keyword === "enum")).toBe(true);
  });

  it("rejects unknown top-level properties", async () => {
    const result = validateProjectProfile(
      await fixture("project-profile.invalid-unknown-property.json")
    );

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((error) => error.keyword === "additionalProperties")
    ).toBe(true);
  });

  it("accepts data inside the explicit extensions boundary", async () => {
    const result = validateProjectProfile(
      await fixture("project-profile.valid-extension.json")
    );

    expect(result.valid).toBe(true);
  });
});
