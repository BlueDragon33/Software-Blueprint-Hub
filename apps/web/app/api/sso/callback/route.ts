import { NextRequest, NextResponse } from "next/server";
import {
  allowedSsoRequestOrigin, APP_MANAGE_ISSUER, HUB_SSO_CLIENT_ID,
  HUB_SSO_ORIGIN, readSsoCookie, requireSsoServerConfiguration,
  sealSsoCookie, SESSION_TTL, SSO_FLOW_COOKIE,
  SSO_SESSION_COOKIE, validatedSsoRedemption
} from "../../../src/auth/appmanage-sso";
import { resolveWebActor, resolveWebIdentity } from "../../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../../src/server/runtime";

export const dynamic = "force-dynamic";

function returnToSettings(origin: string, status: string): NextResponse {
  const response = NextResponse.redirect(new URL("/settings?sso=" + status, origin));
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
  catch { return returnToSettings(origin, "unavailable"); }

  const flow = readSsoCookie(request.cookies.get(SSO_FLOW_COOKIE)?.value,
    process.env.AUTH_SECRET!, "flow");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!flow || flow.kind !== "flow" || state !== flow.state ||
      !code || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
    return returnToSettings(origin, "invalid-flow");
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
  if (!reply?.ok) return returnToSettings(origin, "exchange-failed");
  let identity: { subject: string; email: string };
  try {
    const payload: unknown = await reply.json();
    identity = validatedSsoRedemption(payload, APP_MANAGE_ISSUER);
  } catch { return returnToSettings(origin, "identity-invalid"); }

  try {
    const runtime = getBlueprintServerRuntime();
    const issuerName = "application-management";
    let link = await runtime.prisma.appManagementSsoLink.findUnique({
      where: { issuer_subject: { issuer: issuerName, subject: identity.subject } }
    });
    if (!link && flow.intent === "link") {
      const existing = await resolveWebIdentity();
      const actor = await resolveWebActor();
      if (!existing || existing.provider !== "github" || !actor ||
          !existing.email || existing.email.trim().toLowerCase() !== identity.email ||
          !(await runtime.authority.canExerciseConstitutionalAuthority(actor))) {
        return returnToSettings(origin, "link-requires-hub-owner");
      }
      try {
        link = await runtime.prisma.appManagementSsoLink.create({
          data: { issuer: issuerName, subject: identity.subject, principalId: actor.principalId }
        });
      } catch {
        // Race or conflicting identity: read it back, never reassign a principal.
        link = await runtime.prisma.appManagementSsoLink.findUnique({
          where: { issuer_subject: { issuer: issuerName, subject: identity.subject } }
        });
        if (!link || link.principalId !== actor.principalId) {
          return returnToSettings(origin, "link-conflict");
        }
      }
    }
    if (!link || link.revokedAt) return returnToSettings(origin, "link-required");

    // External issuer can assert only identity. All actual authority is held
    // by the existing Hub Principal / ProjectAuthority / SystemBootstrap.
    const principal = await runtime.prisma.principal.findUnique({
      where: { id: link.principalId }, select: { id: true }
    });
    if (!principal) return returnToSettings(origin, "missing-principal");
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
    return returnToSettings(origin, "server-unavailable");
  }
}
