import {
  createHash, createHmac, randomBytes, timingSafeEqual
} from "node:crypto";

export const HUB_SSO_ORIGIN = "https://software-blueprint-hub-git-main-dinhnam3391-4708.vercel.app";
export const APP_MANAGE_ISSUER = "https://application-management.boiech-ai.workers.dev";
export const HUB_SSO_CLIENT_ID = "software-blueprint-hub";
export const SSO_FLOW_COOKIE = "__Host-blueprint-am-flow";
export const SSO_SESSION_COOKIE = "__Host-blueprint-am-session";
export const FLOW_TTL = 300;
export const SESSION_TTL = 600;

export interface HubSsoFlow {
  readonly kind: "flow";
  readonly state: string;
  readonly verifier: string;
  readonly intent: "login" | "link";
  readonly exp: number;
}
export interface HubSsoSession {
  readonly kind: "session";
  readonly issuer: "application-management";
  readonly subject: string;
  readonly principalId: string;
  readonly exp: number;
}

export function ssoEnabled(): boolean {
  return process.env.APPMANAGE_SSO_ENABLED === "true";
}
export function requireSsoServerConfiguration(): string {
  if (!ssoEnabled()) throw new Error("App-Manage single sign-on is not enabled for this deployment");
  if (!(process.env.AUTH_SECRET?.trim()) || process.env.AUTH_SECRET!.trim().length < 32) {
    throw new Error("Missing required Hub session signing key");
  }
  const issuer = process.env.APPMANAGE_SSO_ORIGIN?.trim() || APP_MANAGE_ISSUER;
  if (issuer !== APP_MANAGE_ISSUER) {
    throw new Error("Untrusted App-Manage issuer: only the pinned HTTPS production origin is supported");
  }
  return issuer;
}
export function allowedSsoRequestOrigin(origin: string): boolean {
  // Stable Preview host only until a separately reviewed production client is registered.
  return origin === HUB_SSO_ORIGIN;
}
export function ssoPkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
function mac(payload: string, secret: string): string {
  return createHmac("sha256", secret).update("blueprint-am-sso-v1:" + payload).digest("base64url");
}
export function sealSsoCookie(claim: HubSsoFlow | HubSsoSession, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url");
  return "v1." + payload + "." + mac(payload, secret);
}
export function readSsoCookie(
  value: string | undefined,
  secret: string,
  kind: "flow" | "session",
  nowSeconds = Math.floor(Date.now() / 1000)
): HubSsoFlow | HubSsoSession | null {
  if (!value || value.length > 2000 || secret.length < 32) return null;
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" ||
      !/^[A-Za-z0-9_-]{16,1600}$/.test(parts[1] ?? "") ||
      !/^[A-Za-z0-9_-]{43}$/.test(parts[2] ?? "")) return null;
  const expected = Buffer.from(mac(parts[1]!, secret), "base64url");
  const supplied = Buffer.from(parts[2]!, "base64url");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  let decoded: unknown;
  try { decoded = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")); }
  catch { return null; }
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) return null;
  const v = decoded as Record<string, unknown>;
  if (v.kind !== kind || !Number.isSafeInteger(v.exp) ||
      (v.exp as number) <= nowSeconds) return null;
  if (kind === "flow") {
    if (Object.keys(v).length !== 5 ||
        typeof v.state !== "string" || !/^[A-Za-z0-9_-]{32,80}$/.test(v.state) ||
        typeof v.verifier !== "string" || !/^[A-Za-z0-9_-]{43,128}$/.test(v.verifier) ||
        !["login", "link"].includes(String(v.intent)) ||
        (v.exp as number) - nowSeconds > FLOW_TTL) return null;
    return v as unknown as HubSsoFlow;
  }
  if (Object.keys(v).length !== 5 || v.issuer !== "application-management" ||
      typeof v.subject !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.subject) ||
      typeof v.principalId !== "string" || !/^principal:[0-9a-fA-F-]{36}$/.test(v.principalId) ||
      (v.exp as number) - nowSeconds > SESSION_TTL) return null;
  return v as unknown as HubSsoSession;
}
export function newSsoFlow(intent: "login" | "link", nowSeconds = Math.floor(Date.now() / 1000)): HubSsoFlow {
  return Object.freeze({
    kind: "flow" as const,
    state: randomBytes(24).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    intent, exp: nowSeconds + FLOW_TTL
  });
}
export function ssoRequestUrl(flow: HubSsoFlow, origin = APP_MANAGE_ISSUER): string {
  const url = new URL("/__sso/authorize", origin);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", HUB_SSO_CLIENT_ID);
  url.searchParams.set("redirect_uri", HUB_SSO_ORIGIN + "/api/sso/callback");
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", ssoPkceChallenge(flow.verifier));
  url.searchParams.set("state", flow.state);
  return url.href;
}
export function validatedSsoRedemption(value: unknown, issuer: string, nowSeconds = Math.floor(Date.now() / 1000)):
  { readonly subject: string; readonly email: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Untrusted SSO response");
  const data = value as Record<string, unknown>;
  if (data.issuer !== issuer || data.audience !== HUB_SSO_CLIENT_ID ||
      typeof data.subject !== "string" ||
      data.subject !== data.email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.subject) ||
      data.subject !== data.subject.toLowerCase() ||
      !Number.isSafeInteger(data.expiresAt) ||
      (data.expiresAt as number) <= nowSeconds ||
      (data.expiresAt as number) > nowSeconds + 60) {
    throw new Error("App-Manage identity response failed issuer/audience/lifetime binding");
  }
  return { subject: data.subject, email: data.subject };
}
