export interface OwnerBootstrapIdentity {
  readonly provider: string;
  readonly providerSubject: string;
}

export interface OwnerBootstrapPolicyEnvironment {
  readonly provider?: string | null | undefined;
  readonly providerSubject?: string | null | undefined;
}

export type OwnerBootstrapAuthorization =
  | Readonly<{
      configured: false;
      allowed: false;
      reason: "bootstrap-identity-not-configured";
    }>
  | Readonly<{
      configured: true;
      allowed: false;
      reason: "authenticated-identity-not-configured-owner";
    }>
  | Readonly<{
      configured: true;
      allowed: true;
      reason: "configured-bootstrap-identity";
    }>;

function normalized(value: string | null | undefined): string | null {
  const result = value?.trim();
  return result ? result : null;
}

export function evaluateOwnerBootstrapAuthorization(
  identity: OwnerBootstrapIdentity,
  environment: OwnerBootstrapPolicyEnvironment = {
    provider: process.env.BLUEPRINT_OWNER_BOOTSTRAP_PROVIDER,
    providerSubject: process.env.BLUEPRINT_OWNER_BOOTSTRAP_SUBJECT
  }
): OwnerBootstrapAuthorization {
  const configuredProvider = normalized(environment.provider);
  const configuredSubject = normalized(environment.providerSubject);

  if (!configuredProvider || !configuredSubject) {
    return Object.freeze({
      configured: false,
      allowed: false,
      reason: "bootstrap-identity-not-configured"
    });
  }

  if (
    identity.provider !== configuredProvider ||
    identity.providerSubject !== configuredSubject
  ) {
    return Object.freeze({
      configured: true,
      allowed: false,
      reason: "authenticated-identity-not-configured-owner"
    });
  }

  return Object.freeze({
    configured: true,
    allowed: true,
    reason: "configured-bootstrap-identity"
  });
}
