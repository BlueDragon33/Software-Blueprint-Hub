import type {
  BlueprintLevel,
  ProjectId,
  ProjectProfileSummary
} from "@blueprint-os/contracts";

export * from "./authority";
export * from "./persistence";
export * from "./work-quality";
export * from "./project-readiness";
export * from "./governance";

export interface RegisteredProject {
  readonly id: ProjectId;
  readonly profile: ProjectProfileSummary;
}

const blueprintLevels: readonly BlueprintLevel[] = [
  "B0",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5"
];

export function isBlueprintLevel(value: string): value is BlueprintLevel {
  return blueprintLevels.includes(value as BlueprintLevel);
}

export function registerProject(
  id: ProjectId,
  profile: ProjectProfileSummary
): RegisteredProject {
  return Object.freeze({ id, profile: Object.freeze({ ...profile }) });
}
