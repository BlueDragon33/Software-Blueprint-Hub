export type ConstitutionalPromptContext = Readonly<{
  projectId: string;
  projectName: string;
  workPackageId: string | null;
  sourceRevision: string | null;
  state: "ready" | "blocked" | "complete" | "unverified";
  reason: string | null;
}>;
export declare function buildConstitutionalNextPrompt(
  view: ConstitutionalPromptContext,
  requirements?: string
): string | null;
