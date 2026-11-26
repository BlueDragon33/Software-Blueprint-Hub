/**
 * Bounded PR review identity authority adapter. Reuses the *existing*
 * canonical adoption/issuer decisions and WorkflowExecutionClaim unique index.
 * No new schema, issuer registry, release permission, or signing endpoint.
 */
import { verifyPrReviewIdentity, type PrReviewIdentityExpectation } from "@blueprint-os/application";
import type { PostgresWorkflowExecutionAuthorityRepository } from "@blueprint-os/persistence";
import { PostgresWorkflowExecutionJournal } from "./workflow-execution-journal";

type DecisionStore = Pick<
  PostgresWorkflowExecutionAuthorityRepository, "latestIssuer" | "latestAdoption"
>;
type ReplayJournal = Pick<PostgresWorkflowExecutionJournal, "claim">;
const ID = /^[a-z][a-z0-9-]{1,79}$/;

function deny(reason: string): never {
  throw new Error("PR_REVIEW_AUTHORITY_BLOCKED: " + reason);
}

export class PostgresPrReviewIdentityAuthority {
  constructor(
    private readonly decisions: DecisionStore,
    private readonly journal: ReplayJournal
  ) {}

  /**
   * The caller must supply workflowId and issuerId from trusted canonical
   * application authority, NEVER the PR body or an AI review finding.
   * Validates immutable trust decisions both before and after consuming a
   * durable request-scoped one-time claim. A concurrent revoke fails closed.
   */
  async verify(input: {
    readonly identity: unknown;
    readonly expected: PrReviewIdentityExpectation;
    readonly workflowId: string;
    readonly issuerId: string;
    readonly now?: Date;
  }): Promise<{
    readonly bindingId: string;
    readonly verifiedRequestId: string;
    readonly productionAuthorized: false;
    readonly qualityGatePassed: false;
    readonly humanApproved: false;
  }> {
    const { identity, expected, workflowId, issuerId, now = new Date() } = input;
    if (!ID.test(workflowId) || !ID.test(issuerId) ||
        !expected || typeof expected !== "object") {
      deny("trusted workflow or issuer scope missing");
    }
    const scope = {
      projectId: expected.projectId, workflowId, workflowDigest: expected.workflowDigest,
      issuerId, policyVersion: expected.policyVersion
    };
    const check = async (key?: string): Promise<string> => {
      const [adoption, issuer] = await Promise.all([
        this.decisions.latestAdoption(scope.projectId, workflowId, scope.workflowDigest),
        this.decisions.latestIssuer(scope.projectId, workflowId, issuerId)
      ]);
      if (!adoption || adoption.decision !== "adopt" ||
          adoption.policyVersion !== scope.policyVersion ||
          !issuer || issuer.decision !== "allow" ||
          issuer.policyVersion !== scope.policyVersion ||
          !issuer.publicKeyPem.startsWith("-----BEGIN PUBLIC KEY-----")) {
        deny("current canonical workflow adoption or issuer authorization revoked/unavailable");
      }
      if (key !== undefined && issuer.publicKeyPem !== key) {
        deny("issuer key was rotated during inspection");
      }
      return issuer.publicKeyPem;
    };
    const publicKey = await check();
    const verified = await verifyPrReviewIdentity(
      identity, expected, publicKey,
      { claim: (requestKey, expiresAt) => this.journal.claim(requestKey, expiresAt) },
      now
    );
    await check(publicKey);
    return Object.freeze({
      bindingId: verified.bindingId, verifiedRequestId: expected.requestId,
      productionAuthorized: false, qualityGatePassed: false, humanApproved: false
    });
  }
}
