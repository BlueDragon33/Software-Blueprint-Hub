import { NextRequest, NextResponse } from "next/server";
import {
  allowedSsoRequestOrigin, APP_MANAGE_ISSUER, HUB_SSO_CLIENT_ID,
  HUB_SSO_ORIGIN, readSsoCookie, requireSsoServerConfiguration,
  sealSsoCookie, SESSION_TTL, SSO_FLOW_COOKIE,
  SSO_SESSION_COOKIE, validatedSsoRedemption
} from "../../../../src/auth/appmanage-sso";
import { matchingExistingHubOwner } from "../../../../src/auth/appmanage-owner-link";
import { getBlueprintServerRuntime } from "../../../../src/server/runtime";

export const dynamic = "force-dynamic";

function returnToAccessError(origin: string, status: string): NextResponse {
  const response = NextResponse.redirect(new URL("/sso/error?reason=" + status, origin));
  response.cookies.delete(SSO_FLOW_COOKIE);
  response.headers.set("Cache-Control", "no-store, private");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const origin = request.nextUrl.origin;
  if (!allowedSsoRequestOrigin(origin)) {
    return NextResponse.json({ error: "Unregistered SSO callback origin" }, { status: 403 });
  }
  let issuer: string;
  try { issuer = requireSsoServerConfiguration(); }
  catch { return returnToAccessError(origin, "unavailable"); }

  const flow = readSsoCookie(request.cookies.get(SSO_FLOW_COOKIE)?.value,
    process.env.AUTH_SECRET!, "flow");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!flow || flow.kind !== "flow" || state !== flow.state ||
      !code || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
    return returnToAccessError(origin, "invalid-flow");
  }
  const reply = await fetch(issuer + "/__sso/token", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      code, code_verifier: flow.verifier, client_id: HUB_SSO_CLIENT_ID,
      redirect_uri: HUB_SSO_ORIGIN + "/api/sso/callback"
    }),
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000)
  }).catch(() => null);
  if (!reply?.ok) return returnToAccessError(origin, "exchange-failed");
  let identity: { subject: string; email: string; appManageRole: "owner" };
  try {
    const payload: unknown = await reply.json();
    identity = validatedSsoRedemption(payload, APP_MANAGE_ISSUER);
  } catch { return returnToAccessError(origin, "identity-invalid"); }

  try {
    const runtime = getBlueprintServerRuntime();
    const issuerName = "application-management";
    let link = await runtime.prisma.appManagementSsoLink.findUnique({
      where: { issuer_subject: { issuer: issuerName, subject: identity.subject } }
    });
    if (!link) {
      // One-tap enrollment: App-Manage has verified an active Google Owner.
      // The sole constitutional Hub owner is separately established in this
      // database. Never invent a Hub Principal, bootstrap or project role.
      const bootstrap = await runtime.prisma.systemBootstrap.findUnique({
        where: { id: "system" },
        include: { owner: { select: { id: true, email: true, provider: true } } }
      });
      const ownerId = matchingExistingHubOwner(identity, bootstrap?.owner ?? null);
      if (!ownerId) return returnToAccessError(origin, "owner-identity-mismatch");
      try {
        link = await runtime.prisma.appManagementSsoLink.create({
          data: { issuer: issuerName, subject: identity.subject, principalId: ownerId }
        });
      } catch {
        // Another request may have created the same link. Never overwrite
        // or reassign a conflicting or revoked identity.
        link = await runtime.prisma.appManagementSsoLink.findUnique({
          where: { issuer_subject: { issuer: issuerName, subject: identity.subject } }
        });
        if (!link || link.principalId !== ownerId || link.revokedAt) {
          return returnToAccessError(origin, "link-conflict");
        }
      }
    }
    if (!link || link.revokedAt) return returnToAccessError(origin, "link-required");

    // External issuer can assert only identity. All actual authority is held
    // by the existing Hub Principal / ProjectAuthority / SystemBootstrap.
    const principal = await runtime.prisma.principal.findUnique({
      where: { id: link.principalId }, select: { id: true }
    });
    if (!principal) return returnToAccessError(origin, "missing-principal");
    const session = {
      kind: "session" as const, issuer: issuerName as "application-management",
      subject: identity.subject, principalId: principal.id,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL
    };
    const response = NextResponse.redirect(new URL("/", origin));
    response.cookies.set(SSO_SESSION_COOKIE, sealSsoCookie(session, process.env.AUTH_SECRET!), {
      secure: true, httpOnly: true, sameSite: "lax", path: "/", maxAge: SESSION_TTL
    });
    response.cookies.delete(SSO_FLOW_COOKIE);
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return returnToAccessError(origin, "server-unavailable");
  }
}
