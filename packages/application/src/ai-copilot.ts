import { createHash } from "node:crypto";

export type AiCopilotTask =
  | "analyze"
  | "draft"
  | "suggest"
  | "summarize";

export interface AiCopilotRequest {
  readonly projectId: string;
  readonly task: AiCopilotTask;
  readonly actorId: string;
  readonly sourceRevision: string;
  readonly prompt: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface AiCopilotProposal {
  readonly id: string;
  readonly kind: "ai-copilot-proposal";
  readonly projectId: string;
  readonly task: AiCopilotTask;
  readonly actorId: string;
  readonly sourceRevision: string;
  readonly promptFingerprint: string;
  readonly contextFingerprint: string;
  readonly output: string;
  readonly reviewState: "pending-human-review";
  readonly canonicalMutationAllowed: false;
  readonly qualityGateMutationAllowed: false;
  readonly productionReleaseAllowed: false;
  readonly requiresExplicitAcceptance: true;
}

const forbiddenKey = /(password|secret|token|api[-_]?key|authorization|cookie|session|credential)$/i;
const secretLike =
  /(?:bearer\s+[a-z0-9._-]{8,}|basic\s+[a-z0-9+/=]{8,}|gh[pousr]_[a-z0-9]{12,}|sk-[a-z0-9_-]{12,}|eyJ[a-zA-Z0-9_-]{8,}\.[a-zA-Z0-9_-]{8,})/i;

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, stable(child)])
    );
  }
  return value;
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(stable(value)))
    .digest("hex");
}

function required(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new TypeError(`${label} is required`);
  return trimmed;
}

function assertSafeContext(value: unknown, path = "context"): void {
  if (typeof value === "string") {
    if (secretLike.test(value)) {
      throw new TypeError(`${path} contains a secret-like value`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertSafeContext(child, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(
    value as Readonly<Record<string, unknown>>
  )) {
    if (forbiddenKey.test(key)) {
      throw new TypeError(`${path} contains forbidden secret-bearing key ${key}`);
    }
    assertSafeContext(child, `${path}.${key}`);
  }
}

export function createAiCopilotProposal(
  request: AiCopilotRequest,
  output: string
): AiCopilotProposal {
  const projectId = required(request.projectId, "Project id");
  const actorId = required(request.actorId, "Actor id");
  const sourceRevision = required(request.sourceRevision, "Source revision");
  const prompt = required(request.prompt, "Prompt");
  const normalizedOutput = required(output, "AI output");
  const context = Object.freeze({ ...(request.context ?? {}) });

  assertSafeContext(context);

  const identity = {
    projectId,
    task: request.task,
    actorId,
    sourceRevision,
    prompt,
    context,
    output: normalizedOutput
  };

  return Object.freeze({
    id: `ai-proposal:${digest(identity).slice(0, 32)}`,
    kind: "ai-copilot-proposal",
    projectId,
    task: request.task,
    actorId,
    sourceRevision,
    promptFingerprint: `sha256:${digest(prompt)}`,
    contextFingerprint: `sha256:${digest(context)}`,
    output: normalizedOutput,
    reviewState: "pending-human-review",
    canonicalMutationAllowed: false,
    qualityGateMutationAllowed: false,
    productionReleaseAllowed: false,
    requiresExplicitAcceptance: true
  });
}
