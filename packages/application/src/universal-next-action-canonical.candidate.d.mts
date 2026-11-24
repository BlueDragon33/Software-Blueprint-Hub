export interface CanonicalWorkspaceWork {
 readonly id:string; readonly projectId:string; readonly title:string; readonly status:string;
 readonly dependencies:readonly string[]; readonly qualityGateIds:readonly string[];
}
export interface CanonicalWorkspaceGateBundle {
 readonly gate:Readonly<{id:string;projectId:string;status:string;evidenceIds:readonly string[]}>;
 readonly evidence:readonly Readonly<{id:string;gateId:string;source:string;revision:string}>[];
}
export interface CanonicalWorkspaceNextActionInput {
 readonly projectId:string;readonly projectName:string;readonly sourceRevision:string;
 readonly workPackages:readonly CanonicalWorkspaceWork[];
 readonly gateBundles:readonly CanonicalWorkspaceGateBundle[];
 readonly requiredGateIds:readonly string[];
}
export type CanonicalWorkspaceNextActionResult=Readonly<{
 state:"ready"|"blocked"|"unverified";reason:string;workPackageId:string|null;
 mayExecute:false;gatePass:false;canDispatch:false;
}>;
export function projectCanonicalNextAction(input:CanonicalWorkspaceNextActionInput):CanonicalWorkspaceNextActionResult;
