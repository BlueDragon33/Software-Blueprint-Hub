import type { WorkflowExecutionAuthority } from "@blueprint-os/application";
import type {
  PostgresWorkflowExecutionAuthorityRepository,
  WorkflowExecutionAdoptionRecord,
  WorkflowExecutionIssuerRecord
} from "@blueprint-os/persistence";

type AuthorityStore = Pick<
  PostgresWorkflowExecutionAuthorityRepository,
  "latestAdoption" | "latestIssuer" | "currentAllowedIssuers"
>;

function denied(reason: string): never {
  throw new Error("WORKFLOW_EXECUTION_DENIED: " + reason);
}

/**
 * Request-scoped authority snapshot. Public keys are loaded once, but every
 * adoption/permission assertion re-reads the append-only decision log. A
 * revoke or key rotation after snapshot creation therefore fails closed.
 */
export class PostgresWorkflowExecutionAuthority implements WorkflowExecutionAuthority {
  private constructor(
    private readonly store: AuthorityStore,
    private readonly projectId: string,
    private readonly workflowId: string,
    private readonly policyVersion: string,
    private readonly issuerSnapshot: ReadonlyMap<string, WorkflowExecutionIssuerRecord>
  ) {}

  static async load(
    store: AuthorityStore,
    projectId: string,
    workflowId: string,
    policyVersion: string
  ): Promise<PostgresWorkflowExecutionAuthority> {
    const current = await store.currentAllowedIssuers(projectId, workflowId);
    const scoped = new Map<string, WorkflowExecutionIssuerRecord>();
    for (const [issuerId, record] of current) {
      if (record.policyVersion === policyVersion && record.decision === "allow") {
        scoped.set(issuerId, record);
      }
    }
    return new PostgresWorkflowExecutionAuthority(
      store, projectId, workflowId, policyVersion, scoped
    );
  }

  publicKeyFor(projectId: string, issuerId: string): string | null {
    if (projectId !== this.projectId) return null;
    return this.issuerSnapshot.get(issuerId)?.publicKeyPem ?? null;
  }

  async assertAdopted(
    projectId: string,
    workflowId: string,
    digest: string
  ): Promise<void> {
    if (projectId !== this.projectId || workflowId !== this.workflowId) {
      denied("workflow adoption scope mismatch");
    }
    const record: WorkflowExecutionAdoptionRecord | null =
      await this.store.latestAdoption(projectId, workflowId, digest);
    if (!record || record.decision !== "adopt" ||
        record.policyVersion !== this.policyVersion) {
      denied("exact workflow digest is not currently adopted");
    }
  }

  async assertMayExecute(
    projectId: string,
    workflowId: string,
    issuerId: string
  ): Promise<void> {
    if (projectId !== this.projectId || workflowId !== this.workflowId) {
      denied("issuer permission scope mismatch");
    }
    const pinned = this.issuerSnapshot.get(issuerId);
    if (!pinned) denied("issuer is not in the request authority snapshot");
    const latest = await this.store.latestIssuer(projectId, workflowId, issuerId);
    if (!latest || latest.decision !== "allow" ||
        latest.policyVersion !== this.policyVersion ||
        latest.publicKeyPem !== pinned.publicKeyPem) {
      denied("issuer permission was revoked, rotated or changed");
    }
  }
}
