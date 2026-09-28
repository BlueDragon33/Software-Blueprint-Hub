import { describe, expect, it } from "vitest";

import {
  evaluateOwnerBootstrapAuthorization
} from "../../apps/web/src/auth/owner-bootstrap-policy";

describe("System Owner bootstrap identity policy", () => {
  const identity = {
    provider: "github",
    providerSubject: "owner-subject"
  };

  it("fails closed when deployment bootstrap identity is not configured", () => {
    expect(
      evaluateOwnerBootstrapAuthorization(identity, {})
    ).toEqual({
      configured: false,
      allowed: false,
      reason: "bootstrap-identity-not-configured"
    });

    expect(
      evaluateOwnerBootstrapAuthorization(identity, {
        provider: "github",
        providerSubject: ""
      })
    ).toMatchObject({
      configured: false,
      allowed: false
    });
  });

  it("allows only the exact configured provider and provider subject", () => {
    expect(
      evaluateOwnerBootstrapAuthorization(identity, {
        provider: "github",
        providerSubject: "owner-subject"
      })
    ).toEqual({
      configured: true,
      allowed: true,
      reason: "configured-bootstrap-identity"
    });

    expect(
      evaluateOwnerBootstrapAuthorization(
        { provider: "github", providerSubject: "attacker" },
        { provider: "github", providerSubject: "owner-subject" }
      )
    ).toEqual({
      configured: true,
      allowed: false,
      reason: "authenticated-identity-not-configured-owner"
    });

    expect(
      evaluateOwnerBootstrapAuthorization(
        { provider: "other-provider", providerSubject: "owner-subject" },
        { provider: "github", providerSubject: "owner-subject" }
      )
    ).toMatchObject({
      configured: true,
      allowed: false
    });
  });

  it("normalizes deployment configuration but never identity claims", () => {
    expect(
      evaluateOwnerBootstrapAuthorization(identity, {
        provider: " github ",
        providerSubject: " owner-subject "
      })
    ).toMatchObject({
      configured: true,
      allowed: true
    });

    expect(
      evaluateOwnerBootstrapAuthorization(
        { provider: "github ", providerSubject: "owner-subject" },
        { provider: "github", providerSubject: "owner-subject" }
      )
    ).toMatchObject({
      configured: true,
      allowed: false
    });
  });
});
