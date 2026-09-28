import { describe, expect, it } from "vitest";

import { shouldUseSecureAuthCookie } from "../../apps/web/src/auth/session-cookie-policy";

describe("Auth.js session cookie transport policy", () => {
  it("supports local-first next start over localhost/loopback even in production mode", () => {
    expect(
      shouldUseSecureAuthCookie({
        host: "localhost:3000",
        nodeEnv: "production"
      })
    ).toBe(false);

    expect(
      shouldUseSecureAuthCookie({
        host: "127.0.0.1:3000",
        nodeEnv: "production"
      })
    ).toBe(false);

    expect(
      shouldUseSecureAuthCookie({
        host: "[::1]:3000",
        nodeEnv: "production"
      })
    ).toBe(false);
  });

  it("does not allow forwarded host spoofing to downgrade Production cookie lookup", () => {
    expect(
      shouldUseSecureAuthCookie({
        host: "blueprint.example.com",
        forwardedProto: "http",
        nodeEnv: "production"
      })
    ).toBe(true);

    expect(
      shouldUseSecureAuthCookie({
        host: "localhost:3000",
        forwardedProto: "https",
        nodeEnv: "production"
      })
    ).toBe(true);
  });

  it("keeps non-local production hosts on secure Auth.js cookies", () => {
    expect(
      shouldUseSecureAuthCookie({
        host: "blueprint.example.com",
        forwardedProto: "http",
        nodeEnv: "production"
      })
    ).toBe(true);

    expect(
      shouldUseSecureAuthCookie({
        host: "blueprint.example.com",
        forwardedProto: "https",
        nodeEnv: "production"
      })
    ).toBe(true);
  });

  it("honors https in development without treating arbitrary hosts as local", () => {
    expect(
      shouldUseSecureAuthCookie({
        host: "dev.example.test",
        forwardedProto: "https",
        nodeEnv: "development"
      })
    ).toBe(true);

    expect(
      shouldUseSecureAuthCookie({
        host: "dev.example.test",
        forwardedProto: "http",
        nodeEnv: "development"
      })
    ).toBe(false);
  });
});
