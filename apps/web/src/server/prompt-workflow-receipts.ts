import "server-only";

import { createHash } from "node:crypto";

import type {
  WorkflowEvidenceAnchor,
  WorkflowEvidenceVerifier,
  WorkflowReceiptSource,
  WorkflowTrustStore
} from "@blueprint-os/application";

const HUB_REPO = "BlueDragon33/Software-Blueprint-Hub";
const RECEIPT_LIMIT = 200_000;
const EVIDENCE_LIMIT = 2_000_000;

function githubHeaders(raw = false): HeadersInit {
  const token = process.env.WORKFLOW_RECEIPT_GITHUB_READ_TOKEN?.trim();
  return {
    Accept: raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: "Bearer " + token } : {})
  };
}

async function readGitHubContentsJson(path: string): Promise<unknown> {
  const url = "https://api.github.com/repos/" + HUB_REPO +
    "/contents/" + path.split("/").map(encodeURIComponent).join("/") + "?ref=main";
  const response = await fetch(url, {
    cache: "no-store", headers: githubHeaders(), signal: AbortSignal.timeout(8000)
  });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error("Trusted workflow receipt store unavailable: HTTP " + response.status);
  const json: unknown = await response.json();
  if (!json || typeof json !== "object" || !("encoding" in json) ||
      json.encoding !== "base64" || !("content" in json) ||
      typeof json.content !== "string" || json.content.length > RECEIPT_LIMIT * 2) {
    throw new Error("Malformed or oversized central receipt record");
  }
  const text = Buffer.from(json.content.replace(/\s/g, ""), "base64");
  if (text.length > RECEIPT_LIMIT) throw new Error("Oversized central receipt payload");
  return JSON.parse(text.toString("utf8")) as unknown;
}

function verifiedTrustKeys(): Readonly<Record<string, Readonly<Record<string, string>>>> | null {
  const text = process.env.WORKFLOW_ATTESTATION_PUBLIC_KEYS_JSON?.trim();
  if (!text) return null;
  let parsed: unknown;
  try { parsed = JSON.parse(text); }
  catch { throw new Error("Invalid attestation trust-store configuration"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Attestation trust store must be a project-keyed object");
  }
  const result: Record<string, Record<string, string>> = {};
  for (const [projectId, issuerKeys] of Object.entries(parsed)) {
    if (!/^project:[a-z][a-z0-9-]+$/.test(projectId) ||
        !issuerKeys || typeof issuerKeys !== "object" || Array.isArray(issuerKeys)) {
      throw new Error("Invalid project/issuer trust binding");
    }
    const issuers: Record<string, string> = {};
    for (const [issuer, publicKey] of Object.entries(issuerKeys)) {
      if (!/^[a-z][a-z0-9-]{1,79}$/.test(issuer) ||
          typeof publicKey !== "string" ||
          !publicKey.startsWith("-----BEGIN PUBLIC KEY-----") ||
          publicKey.length > 4096) {
        throw new Error("Malformed trusted Ed25519 public key");
      }
      issuers[issuer] = publicKey;
    }
    result[projectId] = issuers;
  }
  return result;
}

/**
 * Load ONLY exact repository files pinned to the signed app HEAD, and verify
 * their actual bytes. Generic HTTP URLs, client payloads and untrusted
 * cross-repository references are never accepted.
 */
export function trustedWorkflowReceiptAdapters(
  projectId: string,
  repository: string,
  workflowId: string,
  appHead: string
): {
  readonly configured: boolean;
  readonly source: WorkflowReceiptSource;
  readonly trust: WorkflowTrustStore;
  readonly verifier: WorkflowEvidenceVerifier;
} {
  const keys = verifiedTrustKeys();
  const configured = keys !== null && Object.keys(keys[projectId] ?? {}).length > 0;
  const source: WorkflowReceiptSource = {
    list: async (requestedProject, requestedWorkflow) => {
      if (requestedProject !== projectId || requestedWorkflow !== workflowId) {
        throw new Error("Receipt source project binding mismatch");
      }
      if (!configured) return [];
      const location = "prompt-workflows/receipts/" +
        encodeURIComponent(projectId) + "/" + encodeURIComponent(workflowId) + ".json";
      const value = await readGitHubContentsJson(location);
      if (!Array.isArray(value)) throw new Error("Malformed signed receipt array");
      return value;
    }
  };
  const trust: WorkflowTrustStore = {
    publicKeyFor: (requestedProject, issuer) => {
      if (requestedProject !== projectId) return null;
      return keys?.[projectId]?.[issuer] ?? null;
    }
  };
  const verifier: WorkflowEvidenceVerifier = {
    verify: async (anchor: WorkflowEvidenceAnchor) => {
      const match = /^github:([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)@([a-f0-9]{40})#([A-Za-z0-9_./-]{1,220})$/.exec(anchor.reference);
      if (!match) return false;
      const [, owner, name, revision, path] = match;
      if (!owner || !name || !revision || !path ||
          owner + "/" + name !== repository || revision !== appHead ||
          path.split("/").some((piece) => !piece || piece === "." || piece === "..")) return false;
      const url = "https://api.github.com/repos/" +
        encodeURIComponent(owner) + "/" + encodeURIComponent(name) + "/contents/" +
        path.split("/").map(encodeURIComponent).join("/") + "?ref=" + revision;
      const response = await fetch(url, {
        cache: "no-store", headers: githubHeaders(true), signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) return false;
      if (Number(response.headers.get("content-length") || 0) > EVIDENCE_LIMIT) return false;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > EVIDENCE_LIMIT) return false;
      const actual = "sha256:" + createHash("sha256").update(bytes).digest("hex");
      return actual === anchor.digest;
    }
  };
  return { configured, source, trust, verifier };
}
