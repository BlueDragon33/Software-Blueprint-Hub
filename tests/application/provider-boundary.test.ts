import { describe, expect, it } from "vitest";

import {
  createProviderInvocationPlan,
  validateProviderDescriptor,
  type ProviderBoundaryDescriptor
} from "../../packages/application/src/provider-boundary";

const provider: ProviderBoundaryDescriptor = {
  id: "provider:github",
  version: "1.0.0",
  kind: "source-control",
  displayName: "GitHub",
  allowedProjectIds: ["project:blueprint-os"],
  credentialPolicy: {
    requiresCredentialReference: true,
    acceptedReferencePrefixes: ["credential-ref:github:"],
    rawSecretsAllowed: false
  },
  capabilities: [
    {
      id: "repository:read",
      mode: "read",
      description: "Read repository metadata."
    },
    {
      id: "pull-request:create",
      mode: "mutate-external",
      description: "Create a reviewed pull request."
    }
  ],
  productionReleaseAuthority: false,
  canonicalBlueprintMutationAuthority: false,
  qualityGateAuthority: false
};

describe("P9-009 Provider / Plugin Boundary", () => {
  it("accepts a scoped provider descriptor with no authority leakage", () => {
    expect(() => validateProviderDescriptor(provider)).not.toThrow();
  });

  it("creates a deterministic external invocation plan without canonical authority", () => {
    const request = {
      providerId: "provider:github",
      projectId: "project:blueprint-os",
      capabilityId: "pull-request:create",
      actorId: "actor:maintainer",
      sourceRevision: "revision:abc123",
      correlationId: "correlation:p9-009",
      credentialRef: "credential-ref:github:blueprint-maintainer",
      targetEnvironment: "preview" as const,
      metadata: {
        repository: "BlueDragon33/Software-Blueprint-Hub",
        branch: "phase9/p9-009-provider-plugin-boundary"
      }
    };

    const first = createProviderInvocationPlan(provider, request);
    const second = createProviderInvocationPlan(provider, request);

    expect(second).toEqual(first);
    expect(first).toMatchObject({
      canonicalMutationAllowed: false,
      qualityGateMutationAllowed: false,
      productionReleaseAllowed: false,
      requiresExternalExecution: true
    });
    expect(first.auditFingerprint).toMatch(/^sha256:/);
  });

  it("rejects raw secret-bearing metadata and secret-looking values", () => {
    expect(() =>
      createProviderInvocationPlan(provider, {
        providerId: provider.id,
        projectId: "project:blueprint-os",
        capabilityId: "repository:read",
        actorId: "actor:maintainer",
        sourceRevision: "revision:abc123",
        correlationId: "correlation:secret-key",
        credentialRef: "credential-ref:github:blueprint-maintainer",
        metadata: { apiKey: "not-even-allowed" }
      })
    ).toThrow(/secret-bearing key/i);

    expect(() =>
      createProviderInvocationPlan(provider, {
        providerId: provider.id,
        projectId: "project:blueprint-os",
        capabilityId: "repository:read",
        actorId: "actor:maintainer",
        sourceRevision: "revision:abc123",
        correlationId: "correlation:secret-value",
        credentialRef: "credential-ref:github:blueprint-maintainer",
        metadata: { note: "Bearer abcdefghijklmnop" }
      })
    ).toThrow(/raw secret-like value/i);
  });

  it("rejects out-of-scope projects and unsupported capabilities", () => {
    expect(() =>
      createProviderInvocationPlan(provider, {
        providerId: provider.id,
        projectId: "project:other",
        capabilityId: "repository:read",
        actorId: "actor:maintainer",
        sourceRevision: "revision:abc123",
        correlationId: "correlation:scope",
        credentialRef: "credential-ref:github:blueprint-maintainer"
      })
    ).toThrow(/not scoped/i);

    expect(() =>
      createProviderInvocationPlan(provider, {
        providerId: provider.id,
        projectId: "project:blueprint-os",
        capabilityId: "repository:delete",
        actorId: "actor:maintainer",
        sourceRevision: "revision:abc123",
        correlationId: "correlation:capability",
        credentialRef: "credential-ref:github:blueprint-maintainer"
      })
    ).toThrow(/does not expose capability/i);
  });

  it("blocks production mutations before Release Orchestration authority exists", () => {
    expect(() =>
      createProviderInvocationPlan(provider, {
        providerId: provider.id,
        projectId: "project:blueprint-os",
        capabilityId: "pull-request:create",
        actorId: "actor:maintainer",
        sourceRevision: "revision:abc123",
        correlationId: "correlation:production",
        credentialRef: "credential-ref:github:blueprint-maintainer",
        targetEnvironment: "production"
      })
    ).toThrow(/Release Orchestration authority/i);
  });
});
