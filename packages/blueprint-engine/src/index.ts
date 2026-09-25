import type {
  BlueprintLevel,
  ProjectProfileSummary
} from "@blueprint-os/contracts";
import { isBlueprintLevel } from "@blueprint-os/core";

export interface BlueprintClassification {
  readonly level: BlueprintLevel;
  readonly rationale: readonly string[];
}

export function classifyDeclaredProfile(
  profile: ProjectProfileSummary
): BlueprintClassification {
  if (!isBlueprintLevel(profile.blueprintLevel)) {
    throw new Error("Unsupported Blueprint Level");
  }

  return Object.freeze({
    level: profile.blueprintLevel,
    rationale: Object.freeze([
      "FND-001 preserves the declared level; rule-based resolution is implemented in FND-005."
    ])
  });
}
