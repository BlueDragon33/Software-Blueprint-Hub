import type {
  BlueprintLevel,
  ProjectProfileSummary
} from "@blueprint-os/contracts";
import { isBlueprintLevel } from "@blueprint-os/core";

export * from "./resolver";

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
      "The declared Blueprint Level is preserved; FND-005 resolves versioned templates deterministically around it."
    ])
  });
}
