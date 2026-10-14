import { NextRequest, NextResponse } from "next/server";
import { SSO_SESSION_COOKIE, SSO_FLOW_COOKIE } from "../../../src/auth/appmanage-sso";

export async function POST(request: NextRequest) {
  // Reject cross-site CSRF. An external site cannot clear the managed session.
  const origin = request.headers.get("origin");
  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }
  const response = NextResponse.redirect(new URL("/", request.nextUrl.origin), 303);
  response.cookies.delete(SSO_SESSION_COOKIE);
  response.cookies.delete(SSO_FLOW_COOKIE);
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}
