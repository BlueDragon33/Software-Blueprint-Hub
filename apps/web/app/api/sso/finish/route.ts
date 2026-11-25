import { NextRequest, NextResponse } from "next/server";

import {
  allowedSsoRequestOrigin, requireSsoServerConfiguration,
  sealSsoCookie, SESSION_TTL, SSO_SESSION_COOKIE
} from "../../../../src/auth/appmanage-sso";
import {
  isVerifiedGitHubOwner, readOwnerPair, SSO_PAIR_COOKIE
} from "../../../../src/auth/appmanage-owner-pair";
import { resolveWebIdentity } from "../../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../../src/server/runtime";

export const dynamic = "force-dynamic";

function deny(origin: string, reason: string) {
  const response = NextResponse.redirect(new URL("/sso/error?reason=" + reason, origin));
  response.cookies.delete(SSO_PAIR_COOKIE);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

/**
 * Link only after two proofs in the same browser:
 * 1. an App-Manage Google owner redeemed via server-side PKCE, stored
 *    in this short-lived signed HttpOnly pending cookie; and
 * 2. an Auth.js GitHub session with the exact existing constitutional
 *    owner's immutable providerSubject.
 *
 * Email equality is not needed; no new Hub role or principal is created.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  if (!allowedSsoRequestOrigin(origin)) {
    return NextResponse.json({ error: "Unregistered SSO origin" }, { status: 403 });
  }
  try { requireSsoServerConfiguration(); }
  catch { return deny(origin, "unavailable"); }
  const secret = process.env.AUTH_SECRET!;
  const pending = readOwnerPair(request.cookies.get(SSO_PAIR_COOKIE)?.value, secret);
  if (!pending) return deny(origin, "invalid-flow");

  // An ordinary GitHub sign-in is permitted once if no session exists.
  // Its Auth.js OAuth state/CSRF checks remain fully enabled.
  const github = await resolveWebIdentity();
  if (!github) {
    const response = NextResponse.redirect(
      new URL("/api/auth/signin?callbackUrl=%2Fapi%2Fsso%2Ffinish", origin)
    );
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }

  try {
    const runtime = getBlueprintServerRuntime();
    const owner = await runtime.sso.currentOwner();
    if (!owner || !isVerifiedGitHubOwner(github, owner)) {
      return deny(origin, "owner-identity-mismatch");
    }

    const subject = pending.appManageSubject;
    let linked;
    try {
      linked = await runtime.sso.linkExistingOwner(subject, owner.id, owner.provider, owner.providerSubject);
    } catch {
      return deny(origin, "link-conflict");
    }
    if (!linked || linked.revokedAt || linked.principalId !== owner.id) {
      return deny(origin, "link-conflict");
    }

    if (await runtime.resolveLinkedAppManagementPrincipal(subject, owner.id) !== owner.id) return deny(origin, "link-conflict");

    const session = {
      kind: "session" as const,
      issuer: "application-management" as const,
      subject, principalId: owner.id,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL
    };
    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.set(SSO_SESSION_COOKIE, sealSsoCookie(session, secret), {
      httpOnly: true, secure: true, sameSite: "lax",
      path: "/", maxAge: SESSION_TTL
    });
    response.cookies.delete(SSO_PAIR_COOKIE);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return deny(origin, "server-unavailable");
  }
}
