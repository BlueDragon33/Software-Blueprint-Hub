import type { ReferenceImportManifest } from "@blueprint-os/contracts";
import { validateReferenceImportManifest } from "@blueprint-os/contracts";

import baumanNextgenV1Json from "./reference-imports/bauman-nextgen-v1.json";

function requireValidReferenceImport(
  value: unknown,
  label: string
): ReferenceImportManifest {
  const result = validateReferenceImportManifest(value);

  if (!result.valid) {
    const detail = result.errors
      .map(
        (error) =>
          `${error.instancePath || "/"}: ${error.message} [${error.keyword}]`
      )
      .join("; ");

    throw new TypeError(
      `Invalid Reference Import Manifest ${label}: ${detail}`
    );
  }

  return value as ReferenceImportManifest;
}

const baumanNextgenV1 = requireValidReferenceImport(
  baumanNextgenV1Json,
  "bauman-nextgen-v1"
);

const referenceImports = Object.freeze([baumanNextgenV1]);

const byCaseId = new Map(
  referenceImports.map((manifest) => [manifest.caseId, manifest] as const)
);

export function listReferenceImportManifests(): readonly ReferenceImportManifest[] {
  return referenceImports;
}

export function findReferenceImportManifest(
  caseId: string
): ReferenceImportManifest | null {
  return byCaseId.get(caseId) ?? null;
}
