export interface SessionCookiePolicyInput {
  readonly host?: string | null;
  readonly forwardedHost?: string | null;
  readonly forwardedProto?: string | null;
  readonly nodeEnv?: string | null;
}

function firstHeaderValue(value: string | null | undefined): string | null {
  const normalized = value?.split(",")[0]?.trim().toLowerCase();
  return normalized || null;
}

function hostnameFromHeader(value: string | null): string | null {
  if (!value) return null;
  if (value.startsWith("[")) {
    const end = value.indexOf("]");
    return end > 0 ? value.slice(1, end) : value;
  }
  return value.split(":")[0] ?? value;
}

export function shouldUseSecureAuthCookie(
  input: SessionCookiePolicyInput
): boolean {
  const hostHeader =
    firstHeaderValue(input.forwardedHost) ?? firstHeaderValue(input.host);
  const hostname = hostnameFromHeader(hostHeader);
  const localHost =
    hostname === "localhost" ||
    hostname?.endsWith(".localhost") === true ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  if (localHost) {
    return false;
  }

  const forwardedProto = firstHeaderValue(input.forwardedProto);
  if (forwardedProto === "https") {
    return true;
  }

  return input.nodeEnv === "production";
}
