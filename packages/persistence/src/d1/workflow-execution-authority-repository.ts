// Candidate; original scope and Ed25519 validation preserved from 799f3d5f77532ce9b47381752fe1ab02561a6f08.
import { createPublicKey, randomUUID } from "node:crypto";

import { D1LogStore } from "../../../../experiments/d1-publication/d1-log-store";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const ID = /^[a-z][a-z0-9-]{1,79}$/;
const PROJECT = /^project:[a-z0-9-]+$/;
const VERSION = /^\d+\.\d+\.\d+$/;

import type { WorkflowAdoptionDecision, WorkflowIssuerDecision, WorkflowExecutionAdoptionRecord, WorkflowExecutionIssuerRecord, RecordWorkflowAdoptionInput, RecordWorkflowIssuerInput } from "../workflow-execution-authority-repository";

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
export class D1WorkflowExecutionAuthorityRepository {
  constructor(private readonly store: D1LogStore) {}
  async recordAdoption(input: RecordWorkflowAdoptionInput): Promise<WorkflowExecutionAdoptionRecord> {
    validateScope(input.projectId, input.workflowId, input.policyVersion);
    if (!DIGEST.test(input.workflowDigest) || !["adopt", "revoke"].includes(input.decision)) throw new TypeError("Invalid workflow adoption decision");
    const row=await this.store.appendOwned("WorkflowExecutionAdoptionDecision", {
      id:"workflow-adoption:"+randomUUID(),projectId:input.projectId,workflowId:input.workflowId,workflowDigest:input.workflowDigest,
      policyVersion:input.policyVersion,decision:input.decision,decidedByPrincipalId:input.actorPrincipalId,productionReleaseAuthority:false
    }, {id:"audit:"+randomUUID(),actorPrincipalId:input.actorPrincipalId,projectId:input.projectId,action:"WORKFLOW_EXECUTION_ADOPTION_DECISION",
      detail:{workflowId:input.workflowId,workflowDigest:input.workflowDigest,policyVersion:input.policyVersion,decision:input.decision,productionReleaseAuthority:false}});
    return adoption(row);
  }
  async recordIssuer(input: RecordWorkflowIssuerInput): Promise<WorkflowExecutionIssuerRecord> {
    validateScope(input.projectId,input.workflowId,input.policyVersion);
    if(!ID.test(input.issuerId)||!["allow","revoke"].includes(input.decision)) throw new TypeError("Invalid workflow issuer decision");
    validateEd25519PublicKey(input.publicKeyPem);
    const row=await this.store.appendOwned("WorkflowExecutionIssuerDecision",{
      id:"workflow-issuer:"+randomUUID(),projectId:input.projectId,workflowId:input.workflowId,issuerId:input.issuerId,publicKeyPem:input.publicKeyPem,policyVersion:input.policyVersion,decision:input.decision,decidedByPrincipalId:input.actorPrincipalId,productionReleaseAuthority:false
    },{id:"audit:"+randomUUID(),actorPrincipalId:input.actorPrincipalId,projectId:input.projectId,action:"WORKFLOW_EXECUTION_ISSUER_DECISION",detail:{workflowId:input.workflowId,issuerId:input.issuerId,policyVersion:input.policyVersion,decision:input.decision,productionReleaseAuthority:false}});
    return issuer(row);
  }
  async latestAdoption(projectId:string,workflowId:string,workflowDigest:string):Promise<WorkflowExecutionAdoptionRecord|null>{
    const [row]=await this.store.read("WorkflowExecutionAdoptionDecision",{projectId,workflowId,workflowDigest},[["decidedAt","desc"],["id","desc"]],1);
    return row?adoption(row):null;
  }
  async latestIssuer(projectId:string,workflowId:string,issuerId:string):Promise<WorkflowExecutionIssuerRecord|null>{
    const [row]=await this.store.read("WorkflowExecutionIssuerDecision",{projectId,workflowId,issuerId},[["decidedAt","desc"],["id","desc"]],1);
    return row?issuer(row):null;
  }
  async currentAllowedIssuers(projectId:string,workflowId:string):Promise<ReadonlyMap<string,WorkflowExecutionIssuerRecord>>{
    const rows=await this.store.read("WorkflowExecutionIssuerDecision",{projectId,workflowId},[["decidedAt","desc"],["id","desc"]]);
    const current=new Map<string,WorkflowExecutionIssuerRecord>(),seen=new Set<string>();
    for(const row of rows){if(seen.has(row.issuerId))continue;seen.add(row.issuerId);if(row.decision==="allow")current.set(row.issuerId,issuer(row));}
    return current;
  }
}
