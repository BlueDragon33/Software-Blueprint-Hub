import { generateKeyPairSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  makeReviewerAbP3WorkPackage,
  prepareReviewerAbP3Binding,
  verifyReviewerAbP3DraftHeads
} from "../../apps/web/src/server/reviewer-ab-preview-p3";
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

describe("Reviewer A/B initial Preview P3 binding", () => {
  const manifest = JSON.parse(readFileSync(new URL(
    "../../prompt-workflows/projects/blueprint-os.reviewer-ab-source-inspection.v1.json",
    import.meta.url
  ), "utf8"));
  const env = {
    BLUEPRINT_AB_P3_MODE: "isolated-loopback",
    AUTH_URL: "http://127.0.0.1:3000",
    DATABASE_URL: "postgresql://ep-dawn-band-b3r8ahco.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
    BLUEPRINT_AB_P3_HUB_SHA: "a".repeat(40),
    BLUEPRINT_AB_P3_A_SHA: "b".repeat(40),
    BLUEPRINT_AB_P3_B_SHA: "c".repeat(40),
    BLUEPRINT_AB_P3_ISSUER_PUBLIC_KEY: keyA
  };

  it("binds exact candidate revisions, workflow projection and issuer to planned work", () => {
    const binding = prepareReviewerAbP3Binding(manifest, env)!;
    expect(binding.workflowDigest).not.toBe(binding.candidateDigest);
    expect(manifest.status).toBe("candidate");
    expect(makeReviewerAbP3WorkPackage(binding, new Date().toISOString())).toMatchObject({
      id: binding.workPackageId, status: "planned", qualityGateIds: [], meta: { recordVersion: 1 }
    });
    expect(prepareReviewerAbP3Binding(manifest, { ...env, BLUEPRINT_AB_P3_B_SHA: "d".repeat(40) })?.reviewDigest)
      .not.toBe(binding.reviewDigest);
    expect(prepareReviewerAbP3Binding(manifest, { ...env, BLUEPRINT_AB_P3_ISSUER_PUBLIC_KEY: keyB })?.reviewDigest)
      .not.toBe(binding.reviewDigest);
  });

  it("rejects the production endpoint, cloud runtime, off-host origin and invalid issuer key", () => {
    for (const change of [
      { DATABASE_URL: env.DATABASE_URL.replace("dawn-band-b3r8ahco", "floral-truth-b35a7tn7") },
      { DATABASE_URL: env.DATABASE_URL + "&host=misconfigured.example" },
      { VERCEL_ENV: "production" },
      { AUTH_URL: "https://preview.example" },
      { BLUEPRINT_AB_P3_ISSUER_PUBLIC_KEY: "invalid" }
    ]) {
      expect(prepareReviewerAbP3Binding(manifest, { ...env, ...change })).toBeNull();
    }
  });

  it("requires all authenticated Draft metadata to match the configured scope and SHA", async () => {
    const { revisions } = prepareReviewerAbP3Binding(manifest, env)!;
    const read = (stale: boolean): typeof fetch => async (url, init) => {
      expect(new URL(String(url)).origin).toBe("https://api.github.com");
      expect(init?.redirect).toBe("error");
      const item = revisions.find(({ repository }) => String(url).includes(repository + "/pulls/"))!;
      return Response.json({
        number: item.number, state: "open", draft: true,
        base: { repo: { full_name: item.repository } },
        head: { repo: { full_name: item.repository }, sha: stale && item.role === "B" ? "e".repeat(40) : item.sha }
      });
    };
    await expect(verifyReviewerAbP3DraftHeads(revisions, null, read(false))).resolves.toBeUndefined();
    await expect(verifyReviewerAbP3DraftHeads(revisions, null, read(true))).rejects.toThrow(/HEAD changed/);
  });
});
