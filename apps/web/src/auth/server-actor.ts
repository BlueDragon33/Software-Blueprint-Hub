import { getToken } from "@auth/core/jwt";
import { cookies, headers } from "next/headers";
import { readSsoCookie, SSO_SESSION_COOKIE, ssoEnabled } from "./appmanage-sso";

import { getBlueprintServerRuntime } from "../server/runtime";
import { shouldUseSecureAuthCookie } from "./session-cookie-policy";

export interface WebAuthenticatedIdentity {
  readonly provider: string;
  readonly providerSubject: string;
  readonly email: string | null;
}

export interface WebAuthenticatedActor {
  readonly principalId: string;
}

interface BlueprintJwtClaims {
  readonly blueprintProvider?: unknown;
  readonly blueprintProviderSubject?: unknown;
  readonly sub?: unknown;
  readonly email?: unknown;
  readonly blueprintGitHubAccessToken?: unknown;
}

function claimString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function resolveWebClaims(): Promise<BlueprintJwtClaims | null> {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    return null;
  }

  const requestHeaders = new Headers(await headers());
  const secureCookie = shouldUseSecureAuthCookie({
    host: requestHeaders.get("host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
    nodeEnv: process.env.NODE_ENV,
    allowLocalHttpAuth:
      process.env.BLUEPRINT_ALLOW_LOCAL_HTTP_AUTH?.trim().toLowerCase() ===
      "true"
  });

  const token = (await getToken({
    req: { headers: requestHeaders },
    secret,
    secureCookie
  })) as BlueprintJwtClaims | null;

  return token;
}

// Remains inside the encrypted HttpOnly Auth.js session and server-only GitHub requests.
export async function resolveGitHubPublicationToken(): Promise<string | null> {
  const token = await resolveWebClaims();
  return token?.blueprintProvider === "github" ? claimString(token.blueprintGitHubAccessToken) : null;
}

export async function resolveWebIdentity(): Promise<WebAuthenticatedIdentity | null> {
  const token = await resolveWebClaims();
  if (!token) return null;

  const provider = claimString(token.blueprintProvider) ?? "github";
  const providerSubject =
    claimString(token.blueprintProviderSubject) ?? claimString(token.sub);

  if (!providerSubject) {
    return null;
  }

  return Object.freeze({
    provider,
    providerSubject,
    email: claimString(token.email)
  });
}

export async function resolveWebActor(): Promise<WebAuthenticatedActor | null> {
  const identity = await resolveWebIdentity();
  if (identity) {
    const runtime = getBlueprintServerRuntime();
    const principal = await runtime.authority.resolveIdentity(identity);
    return Object.freeze({ principalId: principal.id });
  }
  // App-Manage SSO uses a separate HttpOnly signed cookie with a short
  // lifetime. Never map external "owner" labels to authority or bootstrap.
  if (!ssoEnabled()) return null;
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) return null;
  const cookieJar = await cookies();
  const session = readSsoCookie(cookieJar.get(SSO_SESSION_COOKIE)?.value,
    secret, "session");
  if (!session || session.kind !== "session") return null;
  const runtime = getBlueprintServerRuntime();
  const link = await runtime.prisma.appManagementSsoLink.findUnique({
    where: {
      issuer_subject: { issuer: "application-management", subject: session.subject }
    }
  });
  if (!link || link.revokedAt || link.principalId !== session.principalId) return null;
  const principal = await runtime.prisma.principal.findUnique({
    where: { id: session.principalId }, select: { id: true }
  });
  return principal ? Object.freeze({ principalId: principal.id }) : null;
}
