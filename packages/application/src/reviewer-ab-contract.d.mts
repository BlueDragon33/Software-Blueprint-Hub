/** Typed declarations for the Blueprint OS 1.3.0 advisory A/B ESM contract. */
export interface ReviewWorkOrder {
  readonly schemaVersion: "1.0.0";
  readonly kind: "review-work-order";
  readonly policyVersion: "1.3.0";
  readonly projectId: string;
  readonly repository: string;
  readonly pullRequestNumber: number;
  readonly workPackageId: string;
  readonly workPackageRecordVersion: number;
  readonly workflowId: string;
  readonly workflowNodeId: string;
  readonly workflowDigest: string;
  readonly sourceRevision: string;
  readonly canonicalSourceRevision: string;
  readonly expectedStateVersion: number;
  readonly issuerGrantDigest: string;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly scope: Readonly<{
    allowedPaths: readonly string[];
    maxFiles: number;
    maxBytes: number;
    maxAttempts: number;
    maxTokensUsed: 0;
  }>;
  readonly orderKey: string;
}
export interface ReviewSourceFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
}
export function reviewOrderKey(order: ReviewWorkOrder): string;
export function reviewSourceDigestV1(files: readonly ReviewSourceFile[]): string;
export function validateReviewWorkOrder(order: unknown): Readonly<{
  valid: true;
  advisoryOnly: true;
  canonicalMutationAllowed: false;
  qualityGatePassed: false;
  productionAuthorized: false;
}>;
