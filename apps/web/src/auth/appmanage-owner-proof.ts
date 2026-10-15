import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Two independently verified sessions are needed when Google and GitHub
 * constitutional owner emails differ. Never equate external "owner" roles.
 */
export const SSO_PAIRING_COOKIE = "__Host-blueprint-am-pairing";
export const SSO_PAIRING_TTL = 300;

export interface HubSsoPairing {
  readonly kind: "pairing";
  readonly issuer: "application-management";
  readonly subject: string;
  readonly exp: number;
}
export interface GitHubVerifiedIdentity {
  readonly provider: string;
  readonly providerSubject: string;
}
export interface HubConstitutionalOwner {
  readonly id: string;
  readonly provider: string;
  readonly providerSubject: string;
}

function signature(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update("blueprint-am-cross-provider-owner-proof-v1:" + payload)
    .digest("base64url");
}
export function sealPendingPairing(pending: HubSsoPairing, secret: string): string {
  if (secret.length < 32) throw new Error("Missing pairing-signature secret");
  const payload = Buffer.from(JSON.stringify(pending)).toString("base64url");
  return "v1." + payload + "." + signature(payload, secret);
}
export function readPendingPairing(
  value: string | undefined, secret: string,
  now = Math.floor(Date.now() / 1000)
): HubSsoPairing | null {
  if (!value || value.length > 1300 || secret.length < 32) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" ||
      !/^[A-Za-z0-9_-]{16,1100}$/.test(parts[1] ?? "") ||
      !/^[A-Za-z0-9_-]{43}$/.test(parts[2] ?? "")) return null;
  const a = Buffer.from(signature(parts[1]!, secret), "base64url");
  const b = Buffer.from(parts[2]!, "base64url");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const v = parsed as Record<string, unknown>;
    if (Object.keys(v).length !== 4 || v.kind !== "pairing" ||
        v.issuer !== "application-management" ||
        typeof v.subject !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.subject) ||
        v.subject !== v.subject.toLowerCase() ||
        !Number.isSafeInteger(v.exp) ||
        (v.exp as number) <= now || (v.exp as number) > now + SSO_PAIRING_TTL) return null;
    return v as unknown as HubSsoPairing;
  } catch { return null; }
}
/** Exact GitHub OAuth provider subject, not email or a client-submitted label. */
export function matchingVerifiedGitHubOwner(
  identity: GitHubVerifiedIdentity | null,
  owner: HubConstitutionalOwner | null
): string | null {
  if (!identity || !owner || identity.provider !== "github" ||
      owner.provider !== "github" || !identity.providerSubject ||
      owner.providerSubject !== identity.providerSubject ||
      !/^principal:[0-9a-fA-F-]{36}$/.test(owner.id)) return null;
  return owner.id;
}

export function githubOwnerSignInUrl(origin: string): string {
  const url = new URL("/api/auth/signin", origin);
  url.searchParams.set("callbackUrl", new URL("/api/sso/finish", origin).href);
  return url.href;
}
