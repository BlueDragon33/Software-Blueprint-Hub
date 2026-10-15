import { createHash } from "node:crypto";
import type {
  WorkflowAttemptRecord, WorkflowScopedAction
} from "@blueprint-os/application";

const SHA = /^[a-f0-9]{40}$/;
const REQUEST = /^sha256:[a-f0-9]{64}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const PATH = /^[a-zA-Z0-9_./-]{2,240}$/;
const MAX_FILE_BYTES = 256_000;
const MAX_TOTAL_BYTES = 512_000;
const MAX_RESPONSE_BYTES = 1_600_000;
const digest = (bytes: Buffer | string) =>
  "sha256:" + createHash("sha256").update(bytes).digest("hex");
const validPath = (path: unknown): path is string =>
  typeof path === "string" && PATH.test(path) &&
  path.split("/").every(part => part && part !== "." && part !== "..");

export interface PinnedInspectionQaOptions {
  /** Independently configured read-only GitHub client, NOT the executor result. */
  readonly http?: typeof fetch;
  readonly tokenProvider?: () => Promise<string | null>;
}

export interface PinnedInspectionQaReport {
  readonly status: "verified-inspection-bytes";
  readonly requestId: string;
  readonly sourceRevision: string;
  readonly observationDigest: string;
  readonly verifiedFiles: number;
  readonly completionReceiptIssued: false;
  readonly qualityGatePassed: false;
  readonly productionAuthorized: false;
}

/**
 * Independent read-back verifier for an OBSERVED INSPECT action.
 * It never runs or approves the action, edits source, signs a completion
 * receipt, or marks a human/constitutional/release gate PASS.
 */
export class PinnedInspectionQaVerifier {
  private readonly http: typeof fetch;
  constructor(private readonly options: PinnedInspectionQaOptions = {}) {
    this.http = options.http ?? fetch;
  }

  async verify(action: WorkflowScopedAction, observation: WorkflowAttemptRecord): Promise<PinnedInspectionQaReport> {
    if (!REQUEST.test(action.requestId) || !REPO.test(action.repository) ||
        !SHA.test(action.appHead) || action.mode !== "inspect-scoped" ||
        !validPath(action.nodeId) || !Number.isSafeInteger(action.maxFiles) ||
        action.maxFiles < 1 || action.maxFiles > 30 ||
        !Array.isArray(action.allowedPaths) || action.allowedPaths.length < 1 ||
        action.allowedPaths.length > action.maxFiles ||
        !action.allowedPaths.every(validPath)) {
      throw new Error("Invalid independent inspection QA scope");
    }
    if (observation.outcome !== "succeeded" || observation.attempt !== action.attempt ||
        !/^sha256:[a-f0-9]{64}$/.test(observation.observationDigest ?? "") ||
        observation.tokensUsed !== 0 || observation.filesTouched.length !== 0 ||
        observation.evidenceReferences.length < 1 ||
        observation.evidenceReferences.length > action.maxFiles) {
      throw new Error("Unverified or inconsistent inspection observation");
    }
    const prefix = "github:" + action.repository + "@" + action.appHead + "#";
    const paths = observation.evidenceReferences.map(ref => {
      if (!ref.startsWith(prefix)) throw new Error("QA evidence is not bound to exact repository and SHA");
      const path = ref.slice(prefix.length);
      if (!validPath(path) || !action.allowedPaths.some(scope => path === scope || path.startsWith(scope + "/"))) {
        throw new Error("QA evidence escapes signed source scope");
      }
      return path;
    });
    if (new Set(paths).size !== paths.length) throw new Error("Duplicate evidence references cannot be verified");
    const token = await this.options.tokenProvider?.();
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (token) headers.Authorization = "Bearer " + token;
    const files: Array<{path: string; bytes: number; sha256: string}> = [];
    let total = 0;
    const [owner, repo] = action.repository.split("/");
    for (const path of paths) {
      const url = "https://api.github.com/repos/" + encodeURIComponent(owner!) + "/" +
        encodeURIComponent(repo!) + "/contents/" + path.split("/").map(encodeURIComponent).join("/") +
        "?ref=" + action.appHead;
      const response = await this.http(url, {
        method: "GET", redirect: "error", cache: "no-store", headers,
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error("Independent pinned evidence unavailable: " + response.status);
      if (Number(response.headers.get("content-length") ?? 0) > MAX_RESPONSE_BYTES) {
        throw new Error("Independent evidence response exceeds size limit");
      }
      const text = await response.text();
      if (text.length > MAX_RESPONSE_BYTES) throw new Error("Independent evidence response exceeds size limit");
      const payload: unknown = JSON.parse(text);
      if (!payload || typeof payload !== "object" || Array.isArray(payload) ||
          !("type" in payload) || payload.type !== "file" ||
          !("path" in payload) || payload.path !== path ||
          !("size" in payload) || !Number.isInteger(payload.size) ||
          (payload.size as number) < 0 || (payload.size as number) > MAX_FILE_BYTES ||
          !("encoding" in payload) || payload.encoding !== "base64" ||
          !("content" in payload) || typeof payload.content !== "string" ||
          payload.content.length > Math.ceil(MAX_FILE_BYTES * 4 / 3) + 1024) {
        throw new Error("Independent QA requires bounded regular file bytes at the exact path");
      }
      const compact = payload.content.replace(/\s/g, "");
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)) {
        throw new Error("Malformed independent evidence base64");
      }
      const bytes = Buffer.from(compact, "base64");
      if (bytes.length !== payload.size) throw new Error("Independent evidence byte count mismatch");
      total += bytes.length;
      if (total > MAX_TOTAL_BYTES) throw new Error("Independent evidence total exceeds size limit");
      files.push({path, bytes: bytes.length, sha256: digest(bytes)});
    }
    files.sort((a, b) => a.path.localeCompare(b.path));
    const independentlyComputed = digest(JSON.stringify({
      schemaVersion: "1.0.0", projectId: action.projectId,
      repository: action.repository, appHead: action.appHead,
      nodeId: action.nodeId, mode: action.mode, files
    }));
    if (independentlyComputed !== observation.observationDigest) {
      throw new Error("Independent QA digest mismatch; runner report is not trusted");
    }
    return Object.freeze({
      status: "verified-inspection-bytes" as const,
      requestId: action.requestId, sourceRevision: action.appHead,
      observationDigest: independentlyComputed,
      verifiedFiles: files.length,
      completionReceiptIssued: false as const,
      qualityGatePassed: false as const,
      productionAuthorized: false as const
    });
  }
}
