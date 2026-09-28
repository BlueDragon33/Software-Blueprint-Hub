export interface SessionCookiePolicyInput {
  readonly host?: string | null;
  readonly forwardedProto?: string | null;
  readonly nodeEnv?: string | null;
  readonly allowLocalHttpAuth?: boolean;
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

function isLoopbackHost(host: string | null): boolean {
  const hostname = hostnameFromHeader(host);
  return (
    hostname === "localhost" ||
    hostname?.endsWith(".localhost") === true ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

export function shouldUseSecureAuthCookie(
  input: SessionCookiePolicyInput
): boolean {
  const forwardedProto = firstHeaderValue(input.forwardedProto);
  if (forwardedProto === "https") {
    return true;
  }

  if (input.nodeEnv === "production") {
    const localHttpExplicitlyAllowed =
      input.allowLocalHttpAuth === true &&
      isLoopbackHost(firstHeaderValue(input.host));

    return !localHttpExplicitlyAllowed;
  }

  return forwardedProto === "https";
}
