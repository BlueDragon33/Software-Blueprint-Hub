import { randomUUID } from "node:crypto";
import type { BlueprintPrismaClient } from "./client";

const PROJECT = /^project:[a-z0-9][a-z0-9-]{0,158}$/;
const WORK = /^[a-zA-Z][a-zA-Z0-9:._/-]{1,159}$/;
const WORKFLOW = /^[a-z][a-z0-9-]{1,79}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const SHA = /^[a-f0-9]{40}$/;
const POLICY = /^\d+\.\d+\.\d+$/;

export interface NextActionWorkBindingScope {
  readonly projectId: string;
  readonly workPackageId: string;
  readonly workPackageRecordVersion: number;
  readonly workflowId: string;
  readonly workflowDigest: string;
  readonly appHead: string;
  readonly policyVersion: string;
}
export interface NextActionWorkBindingDecisionInput extends NextActionWorkBindingScope {
  readonly actorPrincipalId: string;
  readonly decision: "bind" | "revoke";
}

function validateScope(input: NextActionWorkBindingScope): void {
  if (!PROJECT.test(input.projectId) || !WORK.test(input.workPackageId) ||
      !Number.isSafeInteger(input.workPackageRecordVersion) ||
      input.workPackageRecordVersion < 1 || !WORKFLOW.test(input.workflowId) ||
      !DIGEST.test(input.workflowDigest) || !SHA.test(input.appHead) ||
      !POLICY.test(input.policyVersion)) {
    throw new TypeError("Invalid canonical WorkPackage-workflow binding scope");
  }
}

/**
 * Durable association, NOT a second workflow adoption / issuer system.
 * Only the authenticated existing System Owner may append decisions.
 * Every read independently checks the current adoption and WorkPackage
 * version; successful binding is NEVER an execution/QA/Production permit.
 */
export class PostgresNextActionWorkBindingRepository {
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async record(input: NextActionWorkBindingDecisionInput): Promise<void> {
    validateScope(input);
    if (!["bind", "revoke"].includes(input.decision)) {
      throw new TypeError("Unknown WorkPackage-workflow binding decision");
    }
    await this.prisma.$transaction(async tx => {
      const [bootstrap, work, adoption] = await Promise.all([
        tx.systemBootstrap.findUnique({where:{id:"system"},select:{ownerPrincipalId:true}}),
        tx.workPackage.findUnique({where:{id:input.workPackageId},
          select:{projectId:true,recordVersion:true,status:true}}),
        tx.workflowExecutionAdoptionDecision.findFirst({
          where:{projectId:input.projectId,workflowId:input.workflowId,
            workflowDigest:input.workflowDigest},
          orderBy:[{decidedAt:"desc"},{id:"desc"}]
        })
      ]);
      if (!bootstrap || bootstrap.ownerPrincipalId !== input.actorPrincipalId) {
        throw new Error("System Owner required for binding decision");
      }
      if (!work || work.projectId !== input.projectId ||
          work.recordVersion !== input.workPackageRecordVersion) {
        throw new Error("Canonical WorkPackage project or recordVersion mismatch");
      }
      // Binding requires existing, independently authenticated adoption.
      // Revocation must remain possible even if adoption itself was revoked.
      if (input.decision === "bind" &&
          (!adoption || adoption.decision !== "adopt" ||
           adoption.policyVersion !== input.policyVersion)) {
        throw new Error("Exact adopted workflow decision required before binding");
      }
      await tx.nextActionWorkBindingDecision.create({
        data:{
          id:"work-binding:"+randomUUID(),
          projectId:input.projectId,
          workPackageId:input.workPackageId,
          workPackageRecordVersion:input.workPackageRecordVersion,
          workflowId:input.workflowId,
          workflowDigest:input.workflowDigest,
          appHead:input.appHead,
          policyVersion:input.policyVersion,
          decision:input.decision,
          decidedByPrincipalId:input.actorPrincipalId,
          productionReleaseAuthority:false
        }
      });
      await tx.authorityAuditEvent.create({
        data:{
          id:"audit:"+randomUUID(),
          actorPrincipalId:input.actorPrincipalId,
          projectId:input.projectId,
          action:"NEXT_ACTION_WORKFLOW_BINDING_DECISION",
          detail:{
            workPackageId:input.workPackageId,
            workPackageRecordVersion:input.workPackageRecordVersion,
            workflowId:input.workflowId,
            workflowDigest:input.workflowDigest,
            appHead:input.appHead,
            policyVersion:input.policyVersion,
            decision:input.decision,
            productionReleaseAuthority:false
          }
        }
      });
    },{isolationLevel:"Serializable",maxWait:5000,timeout:10000});
  }

  async assertCurrent(scope: NextActionWorkBindingScope): Promise<void> {
    validateScope(scope);
    const [latest, work, adoption] = await Promise.all([
      this.prisma.nextActionWorkBindingDecision.findFirst({
        where:{projectId:scope.projectId,workPackageId:scope.workPackageId},
        orderBy:[{decidedAt:"desc"},{id:"desc"}]
      }),
      this.prisma.workPackage.findUnique({
        where:{id:scope.workPackageId},
        select:{projectId:true,recordVersion:true,status:true}
      }),
      this.prisma.workflowExecutionAdoptionDecision.findFirst({
        where:{projectId:scope.projectId,workflowId:scope.workflowId,
          workflowDigest:scope.workflowDigest},
        orderBy:[{decidedAt:"desc"},{id:"desc"}]
      })
    ]);
    if (!latest || latest.decision !== "bind" ||
        latest.projectId !== scope.projectId ||
        latest.workPackageId !== scope.workPackageId ||
        latest.workPackageRecordVersion !== scope.workPackageRecordVersion ||
        latest.workflowId !== scope.workflowId ||
        latest.workflowDigest !== scope.workflowDigest ||
        latest.appHead !== scope.appHead ||
        latest.policyVersion !== scope.policyVersion ||
        !work || work.projectId !== scope.projectId ||
        work.recordVersion !== scope.workPackageRecordVersion ||
        (work.status !== "ready" && work.status !== "in-progress") ||
        !adoption || adoption.decision !== "adopt" ||
        adoption.policyVersion !== scope.policyVersion) {
      throw new Error("NEXT_ACTION_BINDING_DENIED: missing, revoked or stale canonical WorkPackage/workflow/SHA/adoption");
    }
  }
}
