export type BlueprintLevel = "B0" | "B1" | "B2" | "B3" | "B4" | "B5";

export type ProjectId = `project:${string}`;

export interface ProjectProfileSummary {
  readonly name: string;
  readonly projectType: string;
  readonly blueprintLevel: BlueprintLevel;
}

export interface SourceRevision {
  readonly schemaVersion: string;
  readonly recordVersion: number;
}

export * from "./generated/vertical-slice";
export * from "./validation";
