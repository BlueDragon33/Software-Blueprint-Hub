import { NextRequest, NextResponse } from "next/server";
import {
  allowedSsoRequestOrigin, newSsoFlow, requireSsoServerConfiguration,
  sealSsoCookie, SSO_FLOW_COOKIE, FLOW_TTL, ssoRequestUrl
} from "../../../../src/auth/appmanage-sso";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    requireSsoServerConfiguration();
    if (!allowedSsoRequestOrigin(request.nextUrl.origin)) {
      return NextResponse.json({ error: "SSO is not registered for this host" }, { status: 403 });
    }
    const intent = request.nextUrl.searchParams.get("intent") === "link" ? "link" : "login";
    const flow = newSsoFlow(intent);
    const response = NextResponse.redirect(ssoRequestUrl(flow));
    response.cookies.set(SSO_FLOW_COOKIE, sealSsoCookie(flow, process.env.AUTH_SECRET!), {
      secure: true, httpOnly: true, sameSite: "lax", path: "/", maxAge: FLOW_TTL
    });
    response.headers.set("Cache-Control", "no-store, private");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return NextResponse.json({
      error: "App-Manage single sign-on is not configured for this Hub Preview"
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
