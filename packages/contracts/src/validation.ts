import type { ErrorObject, ValidateFunction } from "ajv";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import referenceImportSchemaJson from "../../../schemas/reference-import-manifest.v1.json";
import canonicalSchema from "../../../schemas/vertical-slice.contracts.v1.json";

export type VerticalSliceContractName =
  | "ProjectProfile"
  | "ResolvedBlueprint"
  | "WorkPackage"
  | "QualityGate"
  | "GateEvidence"
  | "PromptProjection"
  | "ArchitectureDecision"
  | "Risk"
  | "TechnicalDebt"
  | "ReleaseRecord"
  | "LessonLearned";

export interface ContractValidationError {
  readonly instancePath: string;
  readonly schemaPath: string;
  readonly keyword: string;
  readonly message: string;
}

export interface ContractValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ContractValidationError[];
}

interface CanonicalSchemaShape {
  readonly $id: string;
}

const schema = canonicalSchema as typeof canonicalSchema & CanonicalSchemaShape;
const referenceImportSchema = referenceImportSchemaJson as typeof referenceImportSchemaJson & CanonicalSchemaShape;

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: true
});

addFormats(ajv, { mode: "full" });
ajv.addSchema(schema);
ajv.addSchema(referenceImportSchema);

const validators = new Map<VerticalSliceContractName, ValidateFunction>();

function getValidator(name: VerticalSliceContractName): ValidateFunction {
  const existing = validators.get(name);
  if (existing) {
    return existing;
  }

  const ref = `${schema.$id}#/$defs/${name}`;
  const compiled = ajv.getSchema(ref) ?? ajv.compile({ $ref: ref });
  validators.set(name, compiled);
  return compiled;
}

function normalizeErrors(
  errors: ErrorObject[] | null | undefined
): readonly ContractValidationError[] {
  if (!errors) {
    return [];
  }

  return errors.map((error) => ({
    instancePath: error.instancePath,
    schemaPath: error.schemaPath,
    keyword: error.keyword,
    message: error.message ?? "Schema validation failed"
  }));
}

export function validateContract(
  name: VerticalSliceContractName,
  value: unknown
): ContractValidationResult {
  const validator = getValidator(name);
  const valid = validator(value);

  return Object.freeze({
    valid: Boolean(valid),
    errors: Object.freeze(normalizeErrors(validator.errors))
  });
}

export function validateProjectProfile(value: unknown): ContractValidationResult {
  return validateContract("ProjectProfile", value);
}

const referenceImportValidator =
  ajv.getSchema(referenceImportSchema.$id) ?? ajv.compile(referenceImportSchema);

export function validateReferenceImportManifest(
  value: unknown
): ContractValidationResult {
  const valid = referenceImportValidator(value);

  return Object.freeze({
    valid: Boolean(valid),
    errors: Object.freeze(normalizeErrors(referenceImportValidator.errors))
  });
}
