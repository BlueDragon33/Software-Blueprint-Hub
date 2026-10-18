export interface ManagedNextAction {
  readonly schema: "blueprint-next-action-handoff/v1";
  readonly scope: "blueprint-workflow";
  readonly repository: string;
  readonly sourceSha: string | null;
  readonly state: string;
  readonly mode: "interactive" | "text-fallback";
  readonly actions: readonly [{
    readonly id: "blueprint-next-action";
    readonly label: "Hỗ trợ / Next Action";
    readonly kind: "issue-next-turn" | "copy-next-turn";
    readonly query: string;
    readonly button: Readonly<{
      component: "button";
      enabled: true;
      actionId: "blueprint-next-action";
    }> | null;
  }];
  readonly fallbackPrompt: string;
  readonly authority: Readonly<{
    autoApprove: false;
    merge: false;
    publish: false;
    ratify: false;
    d1ShutdownAccepted: false;
  }>;
}
export const NEXT_ACTION_LABEL: "Hỗ trợ / Next Action";
export function validateManagedNextAction(handoff: ManagedNextAction): Readonly<{
  valid: true;
  actionCount: 1;
  label: "Hỗ trợ / Next Action";
  outputContract: "VALIDATED_DESIGN_ONLY";
  controlRendered: "UNVERIFIED";
  releaseAuthorized: false;
  ownerUXAccepted: false;
}>;
export function composeManagedNextAction(args: Readonly<{
  repository: string;
  sourceSha: string | null;
  state: string;
  query: string;
  interactiveSupported?: boolean;
  kind?: "issue-next-turn" | "copy-next-turn";
}>): ManagedNextAction;
