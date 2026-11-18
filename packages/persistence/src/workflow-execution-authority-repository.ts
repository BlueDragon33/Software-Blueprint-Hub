import { createPublicKey, randomUUID } from "node:crypto";

import type { WorkPackage } from "@blueprint-os/contracts";

import type { BlueprintPrismaClient } from "./client";
import type { Prisma } from "./generated/prisma/client";
import { PostgresWorkQualityRepository } from "./work-quality-repository";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const ID = /^[a-z][a-z0-9-]{1,79}$/;
const PROJECT = /^project:[a-z0-9-]+$/;
const VERSION = /^\d+\.\d+\.\d+$/;

export type WorkflowAdoptionDecision = "adopt" | "revoke";
export type WorkflowIssuerDecision = "allow" | "revoke";

export interface WorkflowExecutionAdoptionRecord {
  readonly projectId: string;
  readonly workflowId: string;
  readonly workflowDigest: string;
  readonly policyVersion: string;
  readonly decision: WorkflowAdoptionDecision;
  readonly decidedByPrincipalId: string;
  readonly decidedAt: Date;
}

export interface WorkflowExecutionIssuerRecord {
  readonly projectId: string;
  readonly workflowId: string;
  readonly issuerId: string;
  readonly publicKeyPem: string;
  readonly policyVersion: string;
  readonly decision: WorkflowIssuerDecision;
  readonly decidedByPrincipalId: string;
  readonly decidedAt: Date;
}

export interface RecordWorkflowAdoptionInput {
  readonly projectId: string;
  readonly workflowId: string;
  readonly workflowDigest: string;
  readonly policyVersion: string;
  readonly decision: WorkflowAdoptionDecision;
  readonly actorPrincipalId: string;
}

export interface RecordWorkflowIssuerInput {
  readonly projectId: string;
  readonly workflowId: string;
  readonly issuerId: string;
  readonly publicKeyPem: string;
  readonly policyVersion: string;
  readonly decision: WorkflowIssuerDecision;
  readonly actorPrincipalId: string;
}

export interface RecordInitialPreviewBindingInput {
  readonly workPackage: WorkPackage;
  readonly workflowId: string;
  readonly workflowDigest: string;
  readonly policyVersion: string;
  readonly issuerId: string;
  readonly publicKeyPem: string;
  readonly actorPrincipalId: string;
}

function validateScope(projectId: string, workflowId: string, policyVersion: string): void {
  if (!PROJECT.test(projectId) || !ID.test(workflowId) || !VERSION.test(policyVersion)) {
    throw new TypeError("Invalid workflow authority scope");
  }
}

function validateEd25519PublicKey(publicKeyPem: string): void {
  if (!publicKeyPem.startsWith("-----BEGIN PUBLIC KEY-----") || publicKeyPem.length > 4096) {
    throw new TypeError("Malformed workflow issuer public key");
  }
  try {
    const key = createPublicKey(publicKeyPem);
    if (key.asymmetricKeyType !== "ed25519") throw new Error("wrong key type");
  } catch {
    throw new TypeError("Workflow issuer key must be a valid Ed25519 public key");
  }
}

function adoption(row: {
  projectId: string; workflowId: string; workflowDigest: string; policyVersion: string;
  decision: string; decidedByPrincipalId: string; decidedAt: Date;
}): WorkflowExecutionAdoptionRecord {
  return Object.freeze({
    ...row,
    decision: row.decision as WorkflowAdoptionDecision
  });
}

function issuer(row: {
  projectId: string; workflowId: string; issuerId: string; publicKeyPem: string;
  policyVersion: string; decision: string; decidedByPrincipalId: string; decidedAt: Date;
}): WorkflowExecutionIssuerRecord {
  return Object.freeze({
    ...row,
    decision: row.decision as WorkflowIssuerDecision
  });
}

/**
 * Canonical workflow execution authority store.
 *
 * Only the bootstrapped System Owner can append decisions. The database
 * migration makes both logs immutable and permanently forces Production=false.
 * This repository never stores issuer private keys.
 */
export class PostgresWorkflowExecutionAuthorityRepository {
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  private async assertOwnerAndProject(
    tx: Prisma.TransactionClient,
    actorPrincipalId: string,
    projectId: string
  ): Promise<void> {
    const [bootstrap, project] = await Promise.all([
      tx.systemBootstrap.findUnique({ where: { id: "system" }, select: { ownerPrincipalId: true } }),
      tx.project.findUnique({ where: { id: projectId }, select: { id: true } })
    ]);
    if (!bootstrap || bootstrap.ownerPrincipalId !== actorPrincipalId) {
      throw new Error("System Owner authority required for workflow execution decisions");
    }
    if (!project) throw new Error("Canonical project does not exist");
  }

  async recordAdoption(input: RecordWorkflowAdoptionInput): Promise<WorkflowExecutionAdoptionRecord> {
    validateScope(input.projectId, input.workflowId, input.policyVersion);
    if (!DIGEST.test(input.workflowDigest) || !["adopt", "revoke"].includes(input.decision)) {
      throw new TypeError("Invalid workflow adoption decision");
    }
    return this.prisma.$transaction(async (tx) => {
      await this.assertOwnerAndProject(tx, input.actorPrincipalId, input.projectId);
      return this.appendAdoption(tx, input);
    });
  }

  private async appendAdoption(tx: Prisma.TransactionClient, input: RecordWorkflowAdoptionInput) {
    const row = await tx.workflowExecutionAdoptionDecision.create({
      data: {
        id: "workflow-adoption:" + randomUUID(),
        projectId: input.projectId,
        workflowId: input.workflowId,
        workflowDigest: input.workflowDigest,
        policyVersion: input.policyVersion,
        decision: input.decision,
        decidedByPrincipalId: input.actorPrincipalId,
        productionReleaseAuthority: false
      }
    });
    await tx.authorityAuditEvent.create({
      data: {
        id: "audit:" + randomUUID(),
        actorPrincipalId: input.actorPrincipalId,
        projectId: input.projectId,
        action: "WORKFLOW_EXECUTION_ADOPTION_DECISION",
        detail: {
          workflowId: input.workflowId,
          workflowDigest: input.workflowDigest,
          policyVersion: input.policyVersion,
          decision: input.decision,
          productionReleaseAuthority: false
        }
      }
    });
    return adoption(row);
  }

  async recordIssuer(input: RecordWorkflowIssuerInput): Promise<WorkflowExecutionIssuerRecord> {
    validateScope(input.projectId, input.workflowId, input.policyVersion);
    if (!ID.test(input.issuerId) || !["allow", "revoke"].includes(input.decision)) {
      throw new TypeError("Invalid workflow issuer decision");
    }
    validateEd25519PublicKey(input.publicKeyPem);
    return this.prisma.$transaction(async (tx) => {
      await this.assertOwnerAndProject(tx, input.actorPrincipalId, input.projectId);
      return this.appendIssuer(tx, input);
    });
  }

  private async appendIssuer(tx: Prisma.TransactionClient, input: RecordWorkflowIssuerInput) {
    const row = await tx.workflowExecutionIssuerDecision.create({
      data: {
        id: "workflow-issuer:" + randomUUID(),
        projectId: input.projectId,
        workflowId: input.workflowId,
        issuerId: input.issuerId,
        publicKeyPem: input.publicKeyPem,
        policyVersion: input.policyVersion,
        decision: input.decision,
        decidedByPrincipalId: input.actorPrincipalId,
        productionReleaseAuthority: false
      }
    });
    await tx.authorityAuditEvent.create({
      data: {
        id: "audit:" + randomUUID(),
        actorPrincipalId: input.actorPrincipalId,
        projectId: input.projectId,
        action: "WORKFLOW_EXECUTION_ISSUER_DECISION",
        detail: {
          workflowId: input.workflowId,
          issuerId: input.issuerId,
          policyVersion: input.policyVersion,
          decision: input.decision,
          productionReleaseAuthority: false
        }
      }
    });
    return issuer(row);
  }

  /**
   * Initialize a Preview binding atomically. A retry returns the existing
   * binding only while the original WorkPackage and authority are current.
   */
  async recordInitialPreviewBinding(input: RecordInitialPreviewBindingInput) {
    const { workPackage, workflowId, workflowDigest, policyVersion, issuerId, publicKeyPem, actorPrincipalId } = input;
    const { projectId } = workPackage;
    validateScope(projectId, workflowId, policyVersion);
    validateEd25519PublicKey(publicKeyPem);
    if (!DIGEST.test(workflowDigest) || !ID.test(issuerId) ||
        workPackage.status !== "planned" || workPackage.meta.recordVersion !== 1 ||
        workPackage.dependencies.length || workPackage.qualityGateIds.length) {
      throw new TypeError("Invalid initial Preview binding");
    }
    const scope = { projectId, workflowId, policyVersion, actorPrincipalId };
    return this.prisma.$transaction(async (tx) => {
      await this.assertOwnerAndProject(tx, actorPrincipalId, projectId);
      const work = new PostgresWorkQualityRepository(tx);
      const [current, adopted, allowed] = await Promise.all([
        work.findWorkPackageById(workPackage.id),
        tx.workflowExecutionAdoptionDecision.findFirst({
          where: { projectId, workflowId, workflowDigest },
          orderBy: [{ decidedAt: "desc" }, { id: "desc" }]
        }),
        tx.workflowExecutionIssuerDecision.findFirst({
          where: { projectId, workflowId, issuerId },
          orderBy: [{ decidedAt: "desc" }, { id: "desc" }]
        })
      ]);
      if (current || adopted || allowed) {
        if (current?.projectId !== projectId || current.status !== "planned" ||
            current.meta.recordVersion !== 1 || current.purpose !== workPackage.purpose ||
            current.title !== workPackage.title || current.dependencies.length || current.qualityGateIds.length ||
            current.acceptanceCriteria.length !== workPackage.acceptanceCriteria.length ||
            current.acceptanceCriteria.some((criterion, index) => criterion !== workPackage.acceptanceCriteria[index]) ||
            adopted?.decision !== "adopt" || adopted.policyVersion !== policyVersion ||
            adopted.decidedByPrincipalId !== actorPrincipalId || adopted.productionReleaseAuthority ||
            allowed?.decision !== "allow" || allowed.policyVersion !== policyVersion ||
            allowed.decidedByPrincipalId !== actorPrincipalId || allowed.productionReleaseAuthority ||
            allowed.publicKeyPem !== publicKeyPem) {
          throw new Error("Initial Preview binding is stale, partial or revoked");
        }
        return Object.freeze({ status: "existing" as const, workPackage: current,
          adoption: adoption(adopted), issuer: issuer(allowed) });
      }
      const stored = await work.createWorkPackage(workPackage);
      const adoptionRecord = await this.appendAdoption(tx, { ...scope, workflowDigest, decision: "adopt" });
      const issuerRecord = await this.appendIssuer(tx, { ...scope, issuerId, publicKeyPem, decision: "allow" });
      return Object.freeze({ status: "created" as const, workPackage: stored,
        adoption: adoptionRecord, issuer: issuerRecord });
    }, { isolationLevel: "Serializable" });
  }

  async latestAdoption(
    projectId: string, workflowId: string, workflowDigest: string
  ): Promise<WorkflowExecutionAdoptionRecord | null> {
    const row = await this.prisma.workflowExecutionAdoptionDecision.findFirst({
      where: { projectId, workflowId, workflowDigest },
      orderBy: [{ decidedAt: "desc" }, { id: "desc" }]
    });
    return row ? adoption(row) : null;
  }

  async latestIssuer(
    projectId: string, workflowId: string, issuerId: string
  ): Promise<WorkflowExecutionIssuerRecord | null> {
    const row = await this.prisma.workflowExecutionIssuerDecision.findFirst({
      where: { projectId, workflowId, issuerId },
      orderBy: [{ decidedAt: "desc" }, { id: "desc" }]
    });
    return row ? issuer(row) : null;
  }

  async currentAllowedIssuers(
    projectId: string, workflowId: string
  ): Promise<ReadonlyMap<string, WorkflowExecutionIssuerRecord>> {
    const rows = await this.prisma.workflowExecutionIssuerDecision.findMany({
      where: { projectId, workflowId },
      orderBy: [{ decidedAt: "desc" }, { id: "desc" }]
    });
    const current = new Map<string, WorkflowExecutionIssuerRecord>();
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.issuerId)) continue;
      seen.add(row.issuerId);
      if (row.decision === "allow") current.set(row.issuerId, issuer(row));
    }
    return current;
  }
}
