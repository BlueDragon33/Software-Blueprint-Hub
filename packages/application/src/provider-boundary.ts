import { createHash } from "node:crypto";

export type ProviderKind =
  | "source-control"
  | "deployment"
  | "connector"
  | "custom";

export type ProviderCapabilityMode =
  | "read"
  | "propose"
  | "mutate-external";

export interface ProviderCapability {
  readonly id: string;
  readonly mode: ProviderCapabilityMode;
  readonly description: string;
}

export interface ProviderBoundaryDescriptor {
  readonly id: string;
  readonly version: string;
  readonly kind: ProviderKind;
  readonly displayName: string;
  readonly allowedProjectIds: readonly string[];
  readonly credentialPolicy: {
    readonly requiresCredentialReference: boolean;
    readonly acceptedReferencePrefixes: readonly string[];
    readonly rawSecretsAllowed: false;
  };
  readonly capabilities: readonly ProviderCapability[];
  readonly productionReleaseAuthority: false;
  readonly canonicalBlueprintMutationAuthority: false;
  readonly qualityGateAuthority: false;
}

export interface ProviderInvocationRequest {
  readonly providerId: string;
  readonly projectId: string;
  readonly capabilityId: string;
  readonly actorId: string;
  readonly sourceRevision: string;
  readonly correlationId: string;
  readonly credentialRef?: string;
  readonly targetEnvironment?: "local" | "preview" | "production";
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface ProviderInvocationPlan {
  readonly id: string;
  readonly providerId: string;
  readonly projectId: string;
  readonly capabilityId: string;
  readonly capabilityMode: ProviderCapabilityMode;
  readonly actorId: string;
  readonly sourceRevision: string;
  readonly correlationId: string;
  readonly credentialRef: string | null;
  readonly targetEnvironment: "local" | "preview" | "production" | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly canonicalMutationAllowed: false;
  readonly qualityGateMutationAllowed: false;
  readonly productionReleaseAllowed: false;
  readonly requiresExternalExecution: true;
  readonly auditFingerprint: string;
}

const forbiddenKey = /(password|secret|token|api[-_]?key|authorization|cookie|session|credential)$/i;
const suspiciousSecretValue =
  /(?:bearer\s+[a-z0-9._-]{8,}|basic\s+[a-z0-9+/=]{8,}|gh[pousr]_[a-z0-9]{12,}|sk-[a-z0-9_-]{12,}|eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,})/i;

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new TypeError(`${label} is required`);
  return trimmed;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stableValue(child)])
    );
  }
  return value;
}

function hash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stableValue(value)))
    .digest("hex");
}

function assertNoRawSecrets(
  value: unknown,
  path = "metadata"
): void {
  if (typeof value === "string") {
    if (suspiciousSecretValue.test(value)) {
      throw new TypeError(`${path} contains a raw secret-like value`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertNoRawSecrets(child, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(
    value as Readonly<Record<string, unknown>>
  )) {
    if (forbiddenKey.test(key)) {
      throw new TypeError(`${path} contains forbidden secret-bearing key ${key}`);
    }
    assertNoRawSecrets(child, `${path}.${key}`);
  }
}

export function validateProviderDescriptor(
  descriptor: ProviderBoundaryDescriptor
): void {
  required(descriptor.id, "Provider id");
  required(descriptor.version, "Provider version");
  required(descriptor.displayName, "Provider displayName");

  if (descriptor.productionReleaseAuthority !== false) {
    throw new TypeError("Provider production release authority must remain false");
  }
  if (descriptor.canonicalBlueprintMutationAuthority !== false) {
    throw new TypeError("Provider canonical Blueprint mutation authority must remain false");
  }
  if (descriptor.qualityGateAuthority !== false) {
    throw new TypeError("Provider Quality Gate authority must remain false");
  }
  if (descriptor.credentialPolicy.rawSecretsAllowed !== false) {
    throw new TypeError("Provider raw secrets must remain forbidden");
  }

  const projectIds = new Set<string>();
  for (const projectId of descriptor.allowedProjectIds) {
    const id = required(projectId, "Allowed project id");
    if (projectIds.has(id)) throw new TypeError(`Duplicate allowed project id ${id}`);
    projectIds.add(id);
  }

  const capabilityIds = new Set<string>();
  for (const capability of descriptor.capabilities) {
    const id = required(capability.id, "Capability id");
    required(capability.description, "Capability description");
    if (capabilityIds.has(id)) {
      throw new TypeError(`Duplicate provider capability ${id}`);
    }
    capabilityIds.add(id);
  }

  for (const prefix of descriptor.credentialPolicy.acceptedReferencePrefixes) {
    required(prefix, "Credential reference prefix");
  }
}

export function createProviderInvocationPlan(
  descriptor: ProviderBoundaryDescriptor,
  request: ProviderInvocationRequest
): ProviderInvocationPlan {
  validateProviderDescriptor(descriptor);

  if (request.providerId !== descriptor.id) {
    throw new TypeError(
      `Invocation provider ${request.providerId} does not match descriptor ${descriptor.id}`
    );
  }
  if (!descriptor.allowedProjectIds.includes(request.projectId)) {
    throw new TypeError(
      `Provider ${descriptor.id} is not scoped to project ${request.projectId}`
    );
  }

  const capability = descriptor.capabilities.find(
    (item) => item.id === request.capabilityId
  );
  if (!capability) {
    throw new TypeError(
      `Provider ${descriptor.id} does not expose capability ${request.capabilityId}`
    );
  }

  const credentialRef = request.credentialRef?.trim() || null;
  if (descriptor.credentialPolicy.requiresCredentialReference && !credentialRef) {
    throw new TypeError("Provider invocation requires an opaque credential reference");
  }
  if (credentialRef) {
    const allowed = descriptor.credentialPolicy.acceptedReferencePrefixes.some(
      (prefix) => credentialRef.startsWith(prefix)
    );
    if (!allowed) {
      throw new TypeError(
        "Credential must be an opaque reference with an accepted provider prefix"
      );
    }
    if (suspiciousSecretValue.test(credentialRef)) {
      throw new TypeError("Credential reference appears to contain a raw secret");
    }
  }

  if (
    request.targetEnvironment === "production" &&
    capability.mode !== "read"
  ) {
    throw new TypeError(
      "Production provider mutation is blocked until explicit Release Orchestration authority exists"
    );
  }

  const metadata = Object.freeze({ ...(request.metadata ?? {}) });
  assertNoRawSecrets(metadata);

  const identity = {
    providerId: descriptor.id,
    providerVersion: descriptor.version,
    projectId: required(request.projectId, "Project id"),
    capabilityId: capability.id,
    actorId: required(request.actorId, "Actor id"),
    sourceRevision: required(request.sourceRevision, "Source revision"),
    correlationId: required(request.correlationId, "Correlation id"),
    credentialRef,
    targetEnvironment: request.targetEnvironment ?? null,
    metadata
  };

  return Object.freeze({
    id: `provider-invocation:${hash(identity).slice(0, 32)}`,
    providerId: identity.providerId,
    projectId: identity.projectId,
    capabilityId: identity.capabilityId,
    capabilityMode: capability.mode,
    actorId: identity.actorId,
    sourceRevision: identity.sourceRevision,
    correlationId: identity.correlationId,
    credentialRef,
    targetEnvironment: identity.targetEnvironment,
    metadata,
    canonicalMutationAllowed: false,
    qualityGateMutationAllowed: false,
    productionReleaseAllowed: false,
    requiresExternalExecution: true,
    auditFingerprint: `sha256:${hash(identity)}`
  });
}
