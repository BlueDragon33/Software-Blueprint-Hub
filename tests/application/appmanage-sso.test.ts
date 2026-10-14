import { describe, expect, it } from "vitest";
import {
  APP_MANAGE_ISSUER, HUB_SSO_CLIENT_ID, HUB_SSO_ORIGIN,
  newSsoFlow, readSsoCookie, sealSsoCookie, ssoPkceChallenge,
  ssoRequestUrl, validatedSsoRedemption
} from "../../apps/web/src/auth/appmanage-sso";

const secret = "a".repeat(48);
const clock = 1800000000;
describe("App-Manage to Blueprint one-login SSO client", () => {
  it("creates exact pinned HTTPS PKCE S256 request, no tokens in browser URL", () => {
    const flow = newSsoFlow("login", clock);
    const url = new URL(ssoRequestUrl(flow));
    expect(url.origin).toBe(APP_MANAGE_ISSUER);
    expect(url.searchParams.get("client_id")).toBe(HUB_SSO_CLIENT_ID);
    expect(url.searchParams.get("redirect_uri")).toBe(HUB_SSO_ORIGIN + "/api/sso/callback");
    expect(url.searchParams.get("code_challenge")).toBe(ssoPkceChallenge(flow.verifier));
    expect(url.searchParams.get("state")).toBe(flow.state);
    expect(url.searchParams.has("code_verifier")).toBe(false);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("authenticates HMAC flow cookie and refuses tampered state, wrong kind and expiry", () => {
    const flow = newSsoFlow("link", clock);
    const signed = sealSsoCookie(flow, secret);
    expect(readSsoCookie(signed, secret, "flow", clock + 1)).toMatchObject(flow);
    expect(readSsoCookie(signed, secret, "session", clock + 1)).toBeNull();
    expect(readSsoCookie(signed + "x", secret, "flow", clock + 1)).toBeNull();
    expect(readSsoCookie(signed, "other-secret".repeat(4), "flow", clock + 1)).toBeNull();
    expect(readSsoCookie(signed, secret, "flow", clock + 301)).toBeNull();
  });

  it("SSO cookie cannot grant owner; it names a pre-existing principal only", () => {
    const session = {
      kind: "session" as const, issuer: "application-management" as const,
      subject: "owner@example.com",
      principalId: "principal:" + "e".repeat(8) + "-" + "f".repeat(4) + "-" +
        "a".repeat(4) + "-" + "b".repeat(4) + "-" + "c".repeat(12),
      exp: clock + 600
    };
    const value = sealSsoCookie(session, secret);
    expect(readSsoCookie(value, secret, "session", clock + 1)).toEqual(session);
    expect(readSsoCookie(value, secret, "session", clock + 601)).toBeNull();
    expect(readSsoCookie(sealSsoCookie({ ...session, principalId: "administrator" }, secret),
      secret, "session", clock + 1)).toBeNull();
    expect(readSsoCookie(sealSsoCookie({ ...session, issuer: "evil.example" } as never, secret),
      secret, "session", clock + 1)).toBeNull();
  });

  it("refuses forged, stale and wrong audience issuer payloads", () => {
    const payload = { issuer: APP_MANAGE_ISSUER, audience: HUB_SSO_CLIENT_ID,
      subject: "owner@example.com", email: "owner@example.com", expiresAt: clock + 60 };
    expect(validatedSsoRedemption(payload, APP_MANAGE_ISSUER, clock)).toEqual({
      subject: "owner@example.com", email: "owner@example.com"
    });
    expect(() => validatedSsoRedemption({ ...payload, audience: "other" }, APP_MANAGE_ISSUER, clock)).toThrow();
    expect(() => validatedSsoRedemption({ ...payload, issuer: "https://evil.example" }, APP_MANAGE_ISSUER, clock)).toThrow();
    expect(() => validatedSsoRedemption({ ...payload, expiresAt: clock - 1 }, APP_MANAGE_ISSUER, clock)).toThrow();
    expect(() => validatedSsoRedemption({ ...payload, subject: "other@example.com" }, APP_MANAGE_ISSUER, clock)).toThrow();
  });
});
