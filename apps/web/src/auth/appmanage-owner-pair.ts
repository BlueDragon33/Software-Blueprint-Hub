import { createHmac, timingSafeEqual } from "node:crypto";

/** Verified App-Manage identity awaiting independent GitHub OAuth proof. */
export const SSO_PAIR_COOKIE = "__Host-blueprint-pending-owner-proof";
export const PAIR_TTL_SECONDS = 300;

export interface PendingOwnerPair {
  readonly kind: "pending-owner-pair";
  readonly appManageSubject: string;
  readonly expiresAt: number;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update("blueprint-pair-v1:" + payload).digest("base64url");
}

export function sealOwnerPair(value: PendingOwnerPair, secret: string): string {
  if (secret.length < 32) throw new Error("Missing secure pairing key");
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  return "v1." + payload + "." + sign(payload, secret);
}

export function readOwnerPair(
  cookie: string | undefined,
  secret: string,
  now = Math.floor(Date.now() / 1000)
): PendingOwnerPair | null {
  if (!cookie || cookie.length > 1000 || secret.length < 32) return null;
  const parts = cookie.split(".");
  if (parts.length !== 3 || parts[0] !== "v1" ||
      !/^[A-Za-z0-9_-]{16,800}$/.test(parts[1] ?? "") ||
      !/^[A-Za-z0-9_-]{43}$/.test(parts[2] ?? "")) return null;
  const actual = Buffer.from(parts[2]!, "base64url");
  const expected = Buffer.from(sign(parts[1]!, secret), "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  let raw: unknown;
  try { raw = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")); }
  catch { return null; }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const val = raw as Record<string, unknown>;
  if (Object.keys(val).length !== 3 || val.kind !== "pending-owner-pair" ||
      typeof val.appManageSubject !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.appManageSubject) ||
      val.appManageSubject !== val.appManageSubject.toLowerCase() ||
      !Number.isSafeInteger(val.expiresAt) || (val.expiresAt as number) <= now ||
      (val.expiresAt as number) > now + PAIR_TTL_SECONDS) return null;
  return val as unknown as PendingOwnerPair;
}

/** Existing Hub authority is proven solely by the GitHub account subject. */
export function isVerifiedGitHubOwner(
  github: { readonly provider: string; readonly providerSubject: string } | null,
  constitutionalOwner: { readonly provider: string; readonly providerSubject: string } | null
): boolean {
  return !!github && !!constitutionalOwner &&
    github.provider === "github" && constitutionalOwner.provider === "github" &&
    !!github.providerSubject &&
    github.providerSubject === constitutionalOwner.providerSubject;
}
