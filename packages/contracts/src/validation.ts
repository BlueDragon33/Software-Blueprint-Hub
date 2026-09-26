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

function referenceImportSemanticErrors(
  value: unknown
): readonly ContractValidationError[] {
  const manifest = value as {
    readonly id: string;
    readonly caseId: string;
    readonly referenceCaseId: string;
    readonly sourceArtifacts: readonly { readonly path: string }[];
    readonly conceptMappings: readonly {
      readonly sourceConcept: string;
      readonly namespace: string;
    }[];
  };
  const errors: ContractValidationError[] = [];
  const caseMatch = /^(.*)-v([1-9][0-9]*)$/.exec(manifest.caseId);

  if (caseMatch) {
    const expectedImportId =
      `reference-import:${caseMatch[1]}:v${caseMatch[2]}`;
    const expectedReferenceCaseId =
      `knowledge:reference-case:${manifest.caseId}`;

    if (manifest.id !== expectedImportId) {
      errors.push({
        instancePath: "/id",
        schemaPath: "#/identity",
        keyword: "identity",
        message: `must equal ${expectedImportId} for caseId ${manifest.caseId}`
      });
    }

    if (manifest.referenceCaseId !== expectedReferenceCaseId) {
      errors.push({
        instancePath: "/referenceCaseId",
        schemaPath: "#/identity",
        keyword: "identity",
        message:
          `must equal ${expectedReferenceCaseId} for caseId ${manifest.caseId}`
      });
    }
  }

  const artifactPaths = new Set<string>();
  for (const artifact of manifest.sourceArtifacts) {
    if (artifactPaths.has(artifact.path)) {
      errors.push({
        instancePath: "/sourceArtifacts",
        schemaPath: "#/sourceArtifacts",
        keyword: "uniqueSourceArtifactPath",
        message: `contains duplicate source artifact path: ${artifact.path}`
      });
      break;
    }
    artifactPaths.add(artifact.path);
  }

  const namespaces = new Set<string>();
  for (const mapping of manifest.conceptMappings) {
    if (namespaces.has(mapping.namespace)) {
      errors.push({
        instancePath: "/conceptMappings",
        schemaPath: "#/conceptMappings",
        keyword: "uniqueConceptNamespace",
        message: `contains duplicate concept namespace: ${mapping.namespace}`
      });
      break;
    }
    namespaces.add(mapping.namespace);
  }

  return Object.freeze(errors);
}

export function validateReferenceImportManifest(
  value: unknown
): ContractValidationResult {
  const structurallyValid = referenceImportValidator(value);
  const structuralErrors = normalizeErrors(referenceImportValidator.errors);

  if (!structurallyValid) {
    return Object.freeze({
      valid: false,
      errors: Object.freeze(structuralErrors)
    });
  }

  const semanticErrors = referenceImportSemanticErrors(value);

  return Object.freeze({
    valid: semanticErrors.length === 0,
    errors: semanticErrors
  });
}
