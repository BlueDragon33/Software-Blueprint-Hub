export type ConstitutionalPromptContext = Readonly<{
  projectId: string;
  projectName: string;
  workPackageId: string | null;
  sourceRevision: string | null;
  state: "ready" | "blocked" | "complete" | "unverified";
  reason: string | null;
}>;
export type ConstitutionalSupportDirection =
  "p0-first" | "provisional-layout" | "p1-after-p0";
export declare const CONSTITUTIONAL_SUPPORT_DIRECTIONS: ReadonlyArray<Readonly<{
  id: ConstitutionalSupportDirection;
  label: string;
  instruction: string;
}>>;
export declare function buildConstitutionalNextPrompt(
  view: ConstitutionalPromptContext,
  requirements?: string,
  direction?: string
): string | null;
