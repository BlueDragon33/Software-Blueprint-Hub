import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { expect, it } from "vitest";

import {
  createContractSchemaCompiler,
  verticalSliceContractNames
} from "../../../packages/contracts/src/schema-compiler";
import { generateStandaloneContractValidators } from "../../../packages/contracts/src/standalone-validation";

it("validates canonical contracts with the same results when runtime code generation is disabled", () => {
  const baseline = createContractSchemaCompiler();
  type Validators = Pick<typeof baseline, "getValidator" | "referenceImportValidator">;
  const exports: { createContractSchemaCompiler?: () => Validators } = {};
  const require = createRequire(
    new URL("../../../packages/contracts/package.json", import.meta.url)
  );

  runInNewContext(generateStandaloneContractValidators(), { exports, require }, {
    contextCodeGeneration: { strings: false, wasm: false }
  });

  if (!exports.createContractSchemaCompiler) {
    throw new Error("Generated contract validators are missing");
  }
  const standalone = exports.createContractSchemaCompiler();
  for (const name of verticalSliceContractNames) {
    const node = baseline.getValidator(name);
    const worker = standalone.getValidator(name);

    expect(worker({}), name).toBe(node({}));
    expect(JSON.stringify(worker.errors), name).toBe(JSON.stringify(node.errors));
  }

  const profile = JSON.parse(readFileSync(
    new URL("../../../tests/contracts/fixtures/v1/project-profile.valid.json", import.meta.url),
    "utf8"
  ));
  const invalid = { ...profile, meta: { ...profile.meta, updatedAt: "invalid-date" } };
  const node = baseline.getValidator("ProjectProfile");
  const worker = standalone.getValidator("ProjectProfile");

  expect(worker(profile)).toBe(true);
  expect(worker(invalid)).toBe(false);
  expect(node(invalid)).toBe(false);
  expect(JSON.stringify(worker.errors)).toBe(JSON.stringify(node.errors));

  expect(standalone.referenceImportValidator({})).toBe(baseline.referenceImportValidator({}));
  expect(JSON.stringify(standalone.referenceImportValidator.errors)).toBe(
    JSON.stringify(baseline.referenceImportValidator.errors)
  );
});
