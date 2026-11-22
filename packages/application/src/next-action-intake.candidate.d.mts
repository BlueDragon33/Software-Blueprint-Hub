import type { WorkPackage } from '@blueprint-os/contracts';
export const NEXT_ACTION_INTAKE_VERSION: 'ana-intake:0.1.0';
export interface NextActionIntakeInput {
  projectId: string;
  requestId: string;
  sourceRevision: string;
  kind: 'addition' | 'other';
  content: string;
  selectedWorkPackageId: string | null;
}
export interface NextActionIntakeContext {
  authorizedProjectId: string;
  currentSourceRevision: string;
  existingWorkPackages: readonly WorkPackage[];
  now: string;
}
export type NextActionIntakeResult =
  | Readonly<{ kind: 'navigate'; projectId: string; sourceRevision: string; mayDispatch: false }>
  | Readonly<{ kind: 'already-saved'; projectId: string; workPackageId: string; sourceRevision: string; mayDispatch: false }>
  | Readonly<{ kind: 'create-planned'; projectId: string; workPackageId: string; sourceRevision: string; mayDispatch: false; workPackage: WorkPackage }>;
export function prepareNextActionIntake(input: NextActionIntakeInput, context: NextActionIntakeContext): NextActionIntakeResult;
