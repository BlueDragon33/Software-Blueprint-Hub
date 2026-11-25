// Candidate; original QA validation from cca507983de8dfc4cca0247f17da5264ada1c296.
import type { D1LogStore } from "@blueprint-os/persistence";

const REQUEST = /^sha256:[a-f0-9]{64}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const SHA = /^[a-f0-9]{40}$/;
export const INDEPENDENT_INSPECTION_VERIFIER_ID = "pinned-independent-github-readback-v1" as const;

export interface DurableInspectionQaRecord {
  readonly requestId: string;
  readonly attempt: number;
  readonly observationDigest: string;
  readonly sourceRevision: string;
  readonly verifiedFiles: number;
  readonly verifierId: typeof INDEPENDENT_INSPECTION_VERIFIER_ID;
}

function validate(value: DurableInspectionQaRecord): void {
  if (!REQUEST.test(value.requestId) ||
      !Number.isInteger(value.attempt) || value.attempt < 1 || value.attempt > 5 ||
      !DIGEST.test(value.observationDigest) ||
      !SHA.test(value.sourceRevision) ||
      value.verifierId !== INDEPENDENT_INSPECTION_VERIFIER_ID ||
      !Number.isInteger(value.verifiedFiles) || value.verifiedFiles < 1 ||
      value.verifiedFiles > 30) {
    throw new TypeError("Invalid independent QA verification record");
  }
}

/**
 * Append-only storage for independently re-fetched SHA-pinned inspection bytes.
 * The DB FK and trigger require a matching succeeded, read-only journal entry.
 * No method returns a signed completion receipt or canonical Quality Gate PASS.
 */
export class D1WorkflowInspectionQaJournal {
  constructor(private readonly store: D1LogStore) {}

  async appendVerified(input: DurableInspectionQaRecord): Promise<void> {
    validate(input);
    await this.store.append("WorkflowExecutionQaVerification", {
        requestId: input.requestId,
        attempt: input.attempt,
        observationDigest: input.observationDigest,
        sourceRevision: input.sourceRevision,
        verifierId: input.verifierId,
        verifiedFiles: input.verifiedFiles
    });
  }

  async readVerified(requestId: string, attempt: number): Promise<DurableInspectionQaRecord | null> {
    if (!REQUEST.test(requestId) || !Number.isInteger(attempt) || attempt < 1 || attempt > 5) {
      throw new TypeError("Invalid independent QA read-back key");
    }
    const [entry] = await this.store.read("WorkflowExecutionQaVerification", {requestId, attempt}, [], 1);
    if (!entry) return null;
    const result: DurableInspectionQaRecord = {
      requestId: entry.requestId,
      attempt: entry.attempt,
      observationDigest: entry.observationDigest,
      sourceRevision: entry.sourceRevision,
      verifiedFiles: entry.verifiedFiles,
      verifierId: entry.verifierId as typeof INDEPENDENT_INSPECTION_VERIFIER_ID
    };
    validate(result);
    return Object.freeze(result);
  }
}
