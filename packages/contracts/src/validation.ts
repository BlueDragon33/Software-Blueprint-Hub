import type { ErrorObject } from "ajv";

import {
  createContractSchemaCompiler,
  type VerticalSliceContractName
} from "./schema-compiler";

export type { VerticalSliceContractName } from "./schema-compiler";

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

const { getValidator, referenceImportValidator } = createContractSchemaCompiler();

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
