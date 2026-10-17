import { createHash, randomUUID } from "node:crypto";
import { Prisma } from "./generated/prisma/client";
import { AuthorityService, type AuthenticatedActor } from "@blueprint-os/core";
import type { BlueprintPrismaClient } from "./client";

/** This is the implementation of the unratified candidate, not a Constitution copy. */
export const CONTINUOUS_PREFLIGHT_CHECK_IDS = [
  "effective-authority", "product-goal-and-exit-criteria",
  "current-source-and-checkpoint", "critical-path-and-dependencies",
  "blocking-defects-and-repair", "relevant-quality-gates",
  "risk-human-and-capability-boundaries", "durable-handoff"
] as const;

const SHA = /^[a-f0-9]{40}$/;
const DIGEST = /^sha256:[a-f0-9]{64}$/;
const PROJECT = /^project:[a-z][a-z0-9-]+$/;
const WORK = /^work:[a-zA-Z0-9_.:-]{3,120}$/;

export interface PreflightBinding {
  readonly projectId: string;
  readonly workId: string;
  readonly profileVersion: number;
  readonly workVersion: number;
  readonly canonicalDigest: string;
  readonly appHead: string;
  readonly gateDigest: string;
  readonly policyVersion: string;
  readonly checks: readonly {
    readonly id: typeof CONTINUOUS_PREFLIGHT_CHECK_IDS[number];
    readonly evidence: string;
  }[];
}

export function preflightGateDigest(value: unknown): string {
  // Input is the authenticated canonical WorkQuality evidence bundle.
  return "sha256:" + createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/** Inputs MUST be server-computed from a freshly authenticated canonical read. */
export function validatePreflightBinding(input: PreflightBinding): void {
  if (!PROJECT.test(input.projectId) || !WORK.test(input.workId) ||
      !Number.isSafeInteger(input.profileVersion) || input.profileVersion < 1 ||
      !Number.isSafeInteger(input.workVersion) || input.workVersion < 1 ||
      !DIGEST.test(input.canonicalDigest) || !DIGEST.test(input.gateDigest) ||
      !SHA.test(input.appHead) || !/^\d+\.\d+\.\d+$/.test(input.policyVersion) ||
      input.checks.length !== CONTINUOUS_PREFLIGHT_CHECK_IDS.length ||
      new Set(input.checks.map(c => c.id)).size !== CONTINUOUS_PREFLIGHT_CHECK_IDS.length ||
      !CONTINUOUS_PREFLIGHT_CHECK_IDS.every(id => input.checks.some(c => c.id === id)) ||
      input.checks.some(c => c.evidence.length < 8 || c.evidence.length > 400 ||
        !/^(?:canonical:|github:)[A-Za-z0-9/:._#@-]+$/.test(c.evidence))) {
    throw new Error("Incomplete or malformed canonical eight-factor preflight binding");
  }
}
export interface PreflightDecisionView {
  readonly sequence: number;
  readonly decision: "attest" | "revoke";
  readonly actorPrincipalId: string;
  readonly current: boolean;
}
/** Owner-only append. A checked form cannot supply a trusted evidence binding. */
export class PostgresContinuousPreflightRepository {
  constructor(private readonly prisma: BlueprintPrismaClient,
              private readonly authority: AuthorityService) {}

  async latest(actor: AuthenticatedActor | null, binding: PreflightBinding):
    Promise<PreflightDecisionView | null> {
    await this.authority.require(actor,binding.projectId,"PROJECT_READ");
    validatePreflightBinding(binding);
    const row=await this.prisma.continuousPreflightReceipt.findFirst({
      where:{projectId:binding.projectId,workId:binding.workId},
      orderBy:[{sequence:"desc"},{createdAt:"desc"}]
    });
    if (!row) return null;
    const values=(row.checks as unknown);
    const match=row.decision==="attest" && row.profileVersion===binding.profileVersion &&
      row.workVersion===binding.workVersion && row.canonicalDigest===binding.canonicalDigest &&
      row.appHead===binding.appHead && row.gateDigest===binding.gateDigest &&
      row.policyVersion===binding.policyVersion && Array.isArray(values) && values.length===binding.checks.length &&
      binding.checks.every((check,i)=>{
        const stored=values[i];
        return stored!==null && typeof stored==="object" &&
          "id" in stored && "evidence" in stored &&
          stored.id===check.id && stored.evidence===check.evidence;
      });
    // An Owner/reviewer access revocation cannot leave a once-attested receipt active.
    const attesterStillAuthorized=match && await this.authority.can(
      {principalId:row.actorPrincipalId},binding.projectId,"PROJECT_ADMIN");
    return Object.freeze({sequence:row.sequence,decision:row.decision as "attest"|"revoke",
      actorPrincipalId:row.actorPrincipalId,current:Boolean(match && attesterStillAuthorized)});
  }

  async append(actor: AuthenticatedActor | null,binding: PreflightBinding,
    decision:"attest"|"revoke",expectedSequence:number,note:string):
    Promise<PreflightDecisionView> {
    await this.authority.require(actor,binding.projectId,"PROJECT_ADMIN");
    validatePreflightBinding(binding);
    if (!actor || !["attest","revoke"].includes(decision) ||
        !Number.isSafeInteger(expectedSequence) || expectedSequence<0 ||
        note.trim().length<25 || note.length>900) {
      throw new Error("Owner decision requires exact sequence and substantive note");
    }
    const recorded=await this.prisma.$transaction(async tx=>{
      const previous=await tx.continuousPreflightReceipt.findFirst({
        where:{projectId:binding.projectId,workId:binding.workId},
        orderBy:[{sequence:"desc"},{createdAt:"desc"}]
      });
      if ((previous?.sequence ?? 0)!==expectedSequence) {
        throw new Error("PREFLIGHT_CAS_CONFLICT: stale confirmation or replay");
      }
      // A stale source cannot be used merely because the browser kept a token.
      const [profile,work]=await Promise.all([
        tx.projectProfile.findUnique({where:{projectId:binding.projectId}}),
        tx.workPackage.findUnique({where:{id:binding.workId}})
      ]);
      if (decision==="attest" && (!profile || profile.recordVersion!==binding.profileVersion ||
          !work || work.projectId!==binding.projectId ||
          work.recordVersion!==binding.workVersion ||
          work.status!=="ready")) {
        throw new Error("PREFLIGHT_SOURCE_DRIFT: Profile or READY Work Package changed");
      }
      const row=await tx.continuousPreflightReceipt.create({data:{
        id:"preflight:"+randomUUID(), projectId:binding.projectId,
        workId:binding.workId,sequence:expectedSequence+1,
        decision,profileVersion:binding.profileVersion,workVersion:binding.workVersion,
        canonicalDigest:binding.canonicalDigest,appHead:binding.appHead,
        gateDigest:binding.gateDigest,policyVersion:binding.policyVersion,
        checks:JSON.parse(JSON.stringify(binding.checks)) as Prisma.InputJsonValue,
        note:note.trim(),actorPrincipalId:actor.principalId,
        productionReleaseAuthority:false
      }});
      await tx.authorityAuditEvent.create({data:{
        id:"audit:"+randomUUID(),actorPrincipalId:actor.principalId,
        projectId:binding.projectId,action:"CONTINUOUS_PREFLIGHT_"+decision.toUpperCase(),
        detail:{workId:binding.workId,sequence:row.sequence,
          source:binding.canonicalDigest,head:binding.appHead,
          productionReleaseAuthority:false}
      }});
      return row;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
    const reread=await this.latest(actor,binding);
    if (!reread || reread.sequence!==recorded.sequence ||
        reread.decision!==decision || (decision==="attest" && !reread.current)) {
      throw new Error("Preflight decision could not be verified by durable readback");
    }
    return reread;
  }
}
