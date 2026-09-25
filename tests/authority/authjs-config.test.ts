import { describe, expect, it } from "vitest";

import { createAuthJsConfig } from "../../apps/web/src/auth/authjs-config";

describe("Auth.js configuration boundary", () => {
  it("keeps provider secrets in runtime configuration only", () => {
    const config = createAuthJsConfig({
      authSecret: "test-auth-secret",
      githubClientId: "client-id",
      githubClientSecret: "client-secret"
    });

    expect(config.session?.strategy).toBe("jwt");
    expect(config.providers).toHaveLength(1);
  });

  it("fails closed when required provider configuration is missing", () => {
    expect(() =>
      createAuthJsConfig({
        authSecret: "",
        githubClientId: "client-id",
        githubClientSecret: "client-secret"
      })
    ).toThrow(/AUTH_SECRET/);
  });
});
