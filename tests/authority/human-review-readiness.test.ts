import { describe, expect, it } from "vitest";

import { evaluateHumanReviewEnvironment } from "../../apps/web/src/server/human-review-readiness";

describe("P9-019 human review runtime readiness", () => {
  it("blocks when required authenticated runtime configuration is incomplete", () => {
    const checks = evaluateHumanReviewEnvironment({
      databaseUrl: "postgresql://example",
      authSecret: "secret",
      githubClientId: "",
      githubClientSecret: "",
      bootstrapProvider: "github",
      bootstrapSubject: "owner-subject",
      allowLocalHttpAuth: "false",
      nodeEnv: "production"
    });

    expect(
      checks.find((item) => item.id === "github-oauth")
    ).toMatchObject({
      state: "blocked"
    });
    expect(
      checks.find((item) => item.id === "database-url")
    ).toMatchObject({
      state: "ready"
    });
  });

  it("reports complete required configuration without exposing values", () => {
    const sensitiveValues = {
      databaseUrl: "postgresql://user:super-secret-password@db/review",
      authSecret: "auth-secret-do-not-render",
      githubClientId: "github-client-id-do-not-render",
      githubClientSecret: "github-secret-do-not-render",
      bootstrapProvider: "github",
      bootstrapSubject: "123456789",
      allowLocalHttpAuth: "false",
      nodeEnv: "production"
    };

    const checks = evaluateHumanReviewEnvironment(sensitiveValues);
    expect(
      checks.filter((item) => item.state === "blocked")
    ).toHaveLength(0);

    const serialized = JSON.stringify(checks);
    expect(serialized).not.toContain(sensitiveValues.databaseUrl);
    expect(serialized).not.toContain(sensitiveValues.authSecret);
    expect(serialized).not.toContain(sensitiveValues.githubClientId);
    expect(serialized).not.toContain(sensitiveValues.githubClientSecret);
    expect(serialized).not.toContain(sensitiveValues.bootstrapSubject);
  });

  it("marks explicit local HTTP auth as a review warning rather than authority", () => {
    const checks = evaluateHumanReviewEnvironment({
      databaseUrl: "postgresql://example",
      authSecret: "secret",
      githubClientId: "client",
      githubClientSecret: "client-secret",
      bootstrapProvider: "github",
      bootstrapSubject: "owner-subject",
      allowLocalHttpAuth: "true",
      nodeEnv: "production"
    });

    expect(
      checks.find((item) => item.id === "local-http-auth")
    ).toEqual({
      id: "local-http-auth",
      label: "Local HTTP auth exception",
      state: "warning",
      detail:
        "BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH is enabled. Use it only for loopback local review."
    });
  });
});
