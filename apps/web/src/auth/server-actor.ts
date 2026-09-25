import { getToken } from "@auth/core/jwt";
import { headers } from "next/headers";

import { getBlueprintServerRuntime } from "../server/runtime";

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
}

function claimString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function resolveWebIdentity(): Promise<WebAuthenticatedIdentity | null> {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    return null;
  }

  const requestHeaders = new Headers(await headers());
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const secureCookie =
    forwardedProto === "https" ||
    (!forwardedProto && process.env.NODE_ENV === "production");

  const token = (await getToken({
    req: { headers: requestHeaders },
    secret,
    secureCookie
  })) as BlueprintJwtClaims | null;

  if (!token) {
    return null;
  }

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
  if (!identity) {
    return null;
  }

  const runtime = getBlueprintServerRuntime();
  const principal = await runtime.authority.resolveIdentity(identity);
  return Object.freeze({ principalId: principal.id });
}
