import { describe, expect, it } from "vitest";

import { shouldUseSecureAuthCookie } from "../../apps/web/src/auth/session-cookie-policy";

describe("Auth.js session cookie transport policy", () => {
  it("keeps production secure by default even when Host claims localhost", () => {
    expect(
      shouldUseSecureAuthCookie({
        host: "localhost:3000",
        nodeEnv: "production"
      })
    ).toBe(true);

    expect(
      shouldUseSecureAuthCookie({
        host: "127.0.0.1:3000",
        nodeEnv: "production"
      })
    ).toBe(true);
  });

  it("supports production-build parity on loopback only with explicit local HTTP opt-in", () => {
    for (const host of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
      expect(
        shouldUseSecureAuthCookie({
          host,
          nodeEnv: "production",
          allowLocalHttpAuth: true
        })
      ).toBe(false);
    }

    expect(
      shouldUseSecureAuthCookie({
        host: "blueprint.example.com",
        nodeEnv: "production",
        allowLocalHttpAuth: true
      })
    ).toBe(true);
  });

  it("never lets HTTP/host metadata override explicit HTTPS", () => {
    expect(
      shouldUseSecureAuthCookie({
        host: "localhost:3000",
        forwardedProto: "https",
        nodeEnv: "production",
        allowLocalHttpAuth: true
      })
    ).toBe(true);

    expect(
      shouldUseSecureAuthCookie({
        host: "blueprint.example.com",
        forwardedProto: "https",
        nodeEnv: "development"
      })
    ).toBe(true);
  });

  it("keeps non-local production hosts secure regardless of local opt-in", () => {
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
        forwardedProto: "http",
        nodeEnv: "production",
        allowLocalHttpAuth: true
      })
    ).toBe(true);
  });

  it("uses normal non-secure cookies for plain HTTP development", () => {
    expect(
      shouldUseSecureAuthCookie({
        host: "dev.example.test",
        forwardedProto: "http",
        nodeEnv: "development"
      })
    ).toBe(false);
  });
});
