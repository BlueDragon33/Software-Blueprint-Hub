import { createHash } from "node:crypto";
import type {
  WorkflowAttemptRecord,
  WorkflowExecutionJournal
} from "@blueprint-os/application";
import type { BlueprintPrismaClient } from "@blueprint-os/persistence";

const REQUEST_ID = /^sha256:[0-9a-f]{64}$/;
const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ALLOWED_OUTCOMES = new Set(["succeeded", "failed", "invalid-result", "runner-error"]);
const EVIDENCE_REF = /^(?:github:|artifact:|canonical:)[a-zA-Z0-9/:._#@-]{4,300}$/;
const FILE_PATH = /^[a-zA-Z0-9_./-]{2,240}$/;
const SERVICE_ROLES = new Set(["gateway", "executor", "independent-qa"]);

function uniqueConflict(error: unknown): boolean {
  return error !== null && typeof error === "object" &&
    "code" in error && error.code === "P2002";
}

function assertRequestId(key: string): void {
  if (!REQUEST_ID.test(key)) throw new TypeError("Invalid workflow execution requestId");
}

function assertObservation(value: WorkflowAttemptRecord): void {
  if (!value || typeof value !== "object" ||
      !Number.isInteger(value.attempt) || value.attempt < 1 || value.attempt > 5 ||
      !ALLOWED_OUTCOMES.has(value.outcome) ||
      !Number.isInteger(value.tokensUsed) || value.tokensUsed < 0 ||
      value.tokensUsed > 30000 ||
      (value.observationDigest !== null && !DIGEST.test(value.observationDigest)) ||
      !Array.isArray(value.evidenceReferences) ||
      !Array.isArray(value.filesTouched) ||
      value.evidenceReferences.length > 30 || value.filesTouched.length > 30 ||
      value.evidenceReferences.some((item) => typeof item !== "string" || !EVIDENCE_REF.test(item)) ||
      value.filesTouched.some((item) => typeof item !== "string" ||
        !FILE_PATH.test(item) || item.split("/").some((segment) =>
          segment === "" || segment === "." || segment === ".."))) {
    throw new TypeError("Invalid workflow execution observation");
  }
  if ((value.outcome === "succeeded" || value.outcome === "failed") &&
      (!value.observationDigest || value.evidenceReferences.length === 0)) {
    throw new TypeError("Observed attempt requires a real digest and evidence references");
  }
  if ((value.outcome === "runner-error" || value.outcome === "invalid-result") &&
      (value.observationDigest !== null || value.evidenceReferences.length > 0 ||
       value.filesTouched.length > 0 || value.tokensUsed !== 0)) {
    throw new TypeError("Unverified attempt cannot fabricate observed evidence");
  }
}

/**
 * Durable journal using the existing canonical Blueprint PostgreSQL/Prisma
 * connection. Production requires the new schema migration to be applied.
 *
 * No get-or-create fallback, no upsert, no expiry-based nonce recycling.
 * A duplicate grant is a replay even after a process restart.
 */
export class PostgresWorkflowExecutionJournal implements WorkflowExecutionJournal {
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  /**
   * The trusted host chooses the role, after grant/authority validation. Only
   * claim capability is exposed; signed request IDs and canonical audit keys
   * remain unchanged. All roles reuse the durable, append-only claim store.
   */
  forService(
    service: "gateway" | "executor" | "independent-qa"
  ): Pick<WorkflowExecutionJournal, "claim"> {
    if (!SERVICE_ROLES.has(service)) throw new TypeError("Invalid execution service role");
    return Object.freeze({
      claim: async (requestId: string, expiresAt: string): Promise<boolean> => {
        assertRequestId(requestId);
        const key = "sha256:" + createHash("sha256")
          .update("blueprint-os:workflow-service-claim:v1\0")
          .update(service).update("\0").update(requestId).digest("hex");
        return this.claim(key, expiresAt);
      }
    });
  }

  async claim(requestId: string, expiresAt: string): Promise<boolean> {
    assertRequestId(requestId);
    const expiry = new Date(expiresAt);
    if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now()) {
      throw new TypeError("Expired or malformed execution grant expiry");
    }
    try {
      await this.prisma.workflowExecutionClaim.create({
        data: { requestId, expiresAt: expiry }
      });
      return true;
    } catch (error) {
      if (uniqueConflict(error)) return false;
      // Connection, migration, privilege and other DB failures are fatal.
      throw error;
    }
  }

  async append(requestId: string, observation: WorkflowAttemptRecord): Promise<void> {
    assertRequestId(requestId);
    assertObservation(observation);
    // FK requires a prior durable claim, and composite PK forbids writing
    // the same attempt twice. An exception intentionally halts recovery.
    await this.prisma.workflowExecutionObservation.create({
      data: {
        requestId,
        attempt: observation.attempt,
        outcome: observation.outcome,
        observationDigest: observation.observationDigest,
        evidenceReferences: [...observation.evidenceReferences],
        filesTouched: [...observation.filesTouched],
        tokensUsed: observation.tokensUsed
      }
    });
  }

  /** Explicit read-back for audit/recovery; never resumes a claimed grant. */
  async read(requestId: string): Promise<{
    readonly claimed: boolean;
    readonly attempts: readonly WorkflowAttemptRecord[];
  }> {
    assertRequestId(requestId);
    const claim = await this.prisma.workflowExecutionClaim.findUnique({
      where: { requestId }
    });
    if (!claim) return { claimed: false, attempts: [] };
    const observations = await this.prisma.workflowExecutionObservation.findMany({
      where: { requestId },
      orderBy: { attempt: "asc" },
      take: 5
    });
    return Object.freeze({
      claimed: true,
      attempts: Object.freeze(observations.map((item): WorkflowAttemptRecord => {
        if (!Array.isArray(item.evidenceReferences) ||
            !Array.isArray(item.filesTouched) ||
            item.evidenceReferences.some((x) => typeof x !== "string") ||
            item.filesTouched.some((x) => typeof x !== "string")) {
          throw new TypeError("Corrupted workflow execution journal");
        }
        const observation = {
          attempt: item.attempt,
          outcome: item.outcome as WorkflowAttemptRecord["outcome"],
          observationDigest: item.observationDigest,
          evidenceReferences: item.evidenceReferences as string[],
          filesTouched: item.filesTouched as string[],
          tokensUsed: item.tokensUsed
        };
        try {
          assertObservation(observation);
        } catch {
          throw new TypeError("Corrupted workflow execution journal");
        }
        return Object.freeze(observation);
      }))
    });
  }
}
