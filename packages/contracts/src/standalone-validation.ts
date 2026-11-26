import standaloneCode from "ajv/dist/standalone/index.js";

import {
  contractSchemaRef,
  createContractSchemaCompiler,
  referenceImportSchemaId,
  verticalSliceContractNames
} from "./schema-compiler";

export function generateStandaloneContractValidators(): string {
  const { ajv } = createContractSchemaCompiler({ source: true });
  const schemaRefs = Object.fromEntries(
    verticalSliceContractNames.map((name) => [name, contractSchemaRef(name)])
  );
  const validators = standaloneCode(ajv, {
    ...schemaRefs,
    referenceImportValidator: referenceImportSchemaId
  });
  const entries = verticalSliceContractNames
    .map((name) => `  ${name}: exports.${name}`)
    .join(",\n");

  return `${validators}
const validatorsByName = {
  __proto__: null,
${entries}
};
exports.createContractSchemaCompiler = function () {
  return {
    getValidator(name) {
      return validatorsByName[name];
    },
    referenceImportValidator: exports.referenceImportValidator
  };
};
`;
}
