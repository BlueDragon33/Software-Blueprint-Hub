import type { Options, ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import referenceImportSchema from "../../../schemas/reference-import-manifest.v1.json";
import canonicalSchema from "../../../schemas/vertical-slice.contracts.v1.json";

export const verticalSliceContractNames = [
  "ProjectProfile",
  "ResolvedBlueprint",
  "WorkPackage",
  "QualityGate",
  "GateEvidence",
  "PromptProjection",
  "ArchitectureDecision",
  "Risk",
  "TechnicalDebt",
  "ReleaseRecord",
  "LessonLearned"
] as const;

export type VerticalSliceContractName = (typeof verticalSliceContractNames)[number];

export function contractSchemaRef(name: VerticalSliceContractName): string {
  return `${canonicalSchema.$id}#/$defs/${name}`;
}

export const referenceImportSchemaId = referenceImportSchema.$id;

export function createContractSchemaCompiler(code: NonNullable<Options["code"]> = {}) {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: true,
    code
  });

  addFormats(ajv, { mode: "full" });
  ajv.addSchema(canonicalSchema);
  ajv.addSchema(referenceImportSchema);

  const validators = new Map<VerticalSliceContractName, ValidateFunction>();

  function getValidator(name: VerticalSliceContractName): ValidateFunction {
    const existing = validators.get(name);
    if (existing) {
      return existing;
    }

    const ref = contractSchemaRef(name);
    const compiled = ajv.getSchema(ref) ?? ajv.compile({ $ref: ref });
    validators.set(name, compiled);
    return compiled;
  }

  const referenceImportValidator =
    ajv.getSchema(referenceImportSchemaId) ?? ajv.compile(referenceImportSchema);

  return { ajv, getValidator, referenceImportValidator };
}
