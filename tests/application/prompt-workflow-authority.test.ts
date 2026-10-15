import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";

import { PostgresWorkflowExecutionAuthority } from "../../packages/runtime/src/workflow-execution-authority";
import type {
  WorkflowExecutionAdoptionRecord,
  WorkflowExecutionIssuerRecord
} from "../../packages/persistence/src/workflow-execution-authority-repository";

const projectId = "project:application-management";
const workflowId = "app-management-visa-form-recovery";
const digest = "sha256:" + "a".repeat(64);
const policyVersion = "1.3.0";
const issuerId = "system-owner";
const keyA = generateKeyPairSync("ed25519").publicKey
  .export({ format: "pem", type: "spki" }).toString();
const keyB = generateKeyPairSync("ed25519").publicKey
  .export({ format: "pem", type: "spki" }).toString();

function adoption(decision: "adopt" | "revoke" = "adopt"): WorkflowExecutionAdoptionRecord {
  return {
    projectId, workflowId, workflowDigest: digest, policyVersion, decision,
    decidedByPrincipalId: "principal:owner", decidedAt: new Date()
  };
}
function issuer(
  decision: "allow" | "revoke" = "allow",
  publicKeyPem = keyA
): WorkflowExecutionIssuerRecord {
  return {
    projectId, workflowId, issuerId, publicKeyPem, policyVersion, decision,
    decidedByPrincipalId: "principal:owner", decidedAt: new Date()
  };
}

describe("P1 request-scoped workflow execution authority", () => {
  it("accepts exact adopted digest and unchanged allowed issuer key", async () => {
    const store = {
      latestAdoption: async () => adoption(),
      latestIssuer: async () => issuer(),
      currentAllowedIssuers: async () => new Map([[issuerId, issuer()]])
    };
    const authority = await PostgresWorkflowExecutionAuthority.load(
      store, projectId, workflowId, policyVersion
    );
    expect(authority.publicKeyFor(projectId, issuerId)).toBe(keyA);
    await expect(authority.assertAdopted(projectId, workflowId, digest)).resolves.toBeUndefined();
    await expect(authority.assertMayExecute(projectId, workflowId, issuerId)).resolves.toBeUndefined();
  });

  it("fails closed if adoption is revoked after request snapshot creation", async () => {
    let decision: "adopt" | "revoke" = "adopt";
    const store = {
      latestAdoption: async () => adoption(decision),
      latestIssuer: async () => issuer(),
      currentAllowedIssuers: async () => new Map([[issuerId, issuer()]])
    };
    const authority = await PostgresWorkflowExecutionAuthority.load(
      store, projectId, workflowId, policyVersion
    );
    decision = "revoke";
    await expect(authority.assertAdopted(projectId, workflowId, digest))
      .rejects.toThrow(/not currently adopted/);
  });

  it("fails closed on issuer revoke or key rotation after snapshot creation", async () => {
    let current = issuer();
    const store = {
      latestAdoption: async () => adoption(),
      latestIssuer: async () => current,
      currentAllowedIssuers: async () => new Map([[issuerId, issuer()]])
    };
    const authority = await PostgresWorkflowExecutionAuthority.load(
      store, projectId, workflowId, policyVersion
    );
    current = issuer("revoke");
    await expect(authority.assertMayExecute(projectId, workflowId, issuerId))
      .rejects.toThrow(/revoked, rotated or changed/);
    current = issuer("allow", keyB);
    await expect(authority.assertMayExecute(projectId, workflowId, issuerId))
      .rejects.toThrow(/revoked, rotated or changed/);
    expect(authority.publicKeyFor(projectId, issuerId)).toBe(keyA);
  });

  it("does not leak a key across project/workflow or policy scopes", async () => {
    const store = {
      latestAdoption: async () => adoption(),
      latestIssuer: async () => issuer(),
      currentAllowedIssuers: async () => new Map([[issuerId, issuer()]])
    };
    const authority = await PostgresWorkflowExecutionAuthority.load(
      store, projectId, workflowId, policyVersion
    );
    expect(authority.publicKeyFor("project:other", issuerId)).toBeNull();
    await expect(authority.assertMayExecute(projectId, "other-workflow", issuerId))
      .rejects.toThrow(/scope mismatch/);
    const wrongPolicy = await PostgresWorkflowExecutionAuthority.load(
      store, projectId, workflowId, "1.4.0"
    );
    expect(wrongPolicy.publicKeyFor(projectId, issuerId)).toBeNull();
  });
});
