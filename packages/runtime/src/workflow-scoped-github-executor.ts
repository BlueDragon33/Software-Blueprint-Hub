import { createHash } from "node:crypto";
import type {
  WorkflowScopedAction,
  WorkflowScopedExecutor,
  WorkflowAttemptResult
} from "@blueprint-os/application";

const MAX_FILE_BYTES = 256_000;
const MAX_TOTAL_BYTES = 512_000;
const MAX_RESPONSE_BYTES = 1_600_000;
const SHA = /^[0-9a-f]{40}$/;
const PATH = /^[a-zA-Z0-9_./-]{2,240}$/;
const REPO = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

type ContentsFile = {
  readonly type: "file";
  readonly path: string;
  readonly size: number;
  readonly encoding: "base64";
  readonly content: string;
};

export interface ScopedGitHubReadOptions {
  /** Static, trusted repository binding. NEVER derived from a request body. */
  readonly repository: string;
  readonly tokenProvider?: () => Promise<string | null>;
  readonly http?: typeof fetch;
}

/**
 * Real GitHub read-only executor for safe discovery steps.
 *
 * No shell, arbitrary commands, edit/test mode, recursive repo walk, or write
 * API. Only exact grant allowlisted paths at the pinned Git SHA. Directory
 * listings inspect *immediate files only* and refuse oversized directories.
 */
export class ScopedGitHubReadExecutor implements WorkflowScopedExecutor {
  private readonly http: typeof fetch;

  constructor(private readonly options: ScopedGitHubReadOptions) {
    if (!REPO.test(options.repository)) throw new TypeError("Malformed trusted GitHub repository binding");
    this.http = options.http ?? fetch;
  }

  async execute(action: WorkflowScopedAction): Promise<WorkflowAttemptResult> {
    if (action.mode !== "inspect-scoped") {
      throw new Error("GitHub inspection executor never edits code, runs tests or executes commands");
    }
    if (!REPO.test(action.repository) ||
        action.repository !== this.options.repository ||
        !SHA.test(action.appHead) ||
        !Number.isInteger(action.maxFiles) || action.maxFiles < 1 || action.maxFiles > 30 ||
        !Array.isArray(action.allowedPaths) || action.allowedPaths.length < 1 ||
        action.allowedPaths.length > action.maxFiles) {
      throw new Error("Invalid or out-of-scope signed GitHub inspection action");
    }

    const token = await this.options.tokenProvider?.();
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (token) headers.Authorization = "Bearer " + token;
    const seen = new Set<string>();
    const fileDigests: Array<{ path: string; bytes: number; sha256: string }> = [];
    let total = 0;

    async function parseContents(response: Response): Promise<unknown> {
      if (!response.ok) throw new Error("Pinned GitHub source unavailable (" + response.status + ")");
      const length = Number(response.headers.get("content-length") ?? 0);
      if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) {
        throw new Error("GitHub inspection response exceeds size limit");
      }
      const raw = await response.text();
      if (raw.length > MAX_RESPONSE_BYTES) throw new Error("GitHub inspection response exceeds size limit");
      return JSON.parse(raw) as unknown;
    }

    const [owner, repoName] = this.options.repository.split("/");
    const contentsUrl = (path: string) =>
      "https://api.github.com/repos/" + encodeURIComponent(owner!) + "/" +
      encodeURIComponent(repoName!) + "/contents/" +
      path.split("/").map(encodeURIComponent).join("/") +
      "?ref=" + encodeURIComponent(action.appHead);
    const request = async (path: string): Promise<unknown> =>
      parseContents(await this.http(contentsUrl(path), {
        method: "GET", redirect: "error", cache: "no-store", headers,
        signal: AbortSignal.timeout(8000)
      }));

    function validPath(path: unknown): path is string {
      return typeof path === "string" && PATH.test(path) &&
        path.split("/").every((part) => part && part !== "." && part !== "..");
    }

    async function loadFile(path: string, payload?: unknown): Promise<void> {
      if (seen.has(path)) return;
      if (fileDigests.length >= action.maxFiles) throw new Error("Inspection file budget exceeded");
      const candidate = payload ?? await request(path);
      if (!candidate || typeof candidate !== "object" ||
          !("type" in candidate) || candidate.type !== "file" ||
          !("path" in candidate) || candidate.path !== path ||
          !("size" in candidate) || typeof candidate.size !== "number" ||
          !Number.isInteger(candidate.size) || candidate.size < 0 ||
          candidate.size > MAX_FILE_BYTES) {
        throw new Error("Expected bounded, regular file at exact pinned path");
      }
      // Directory listing entries omit contents. Fetch exact file independently.
      const file = candidate as Partial<ContentsFile>;
      const body = file.encoding === "base64" && typeof file.content === "string"
        ? candidate as ContentsFile
        : await request(path) as Partial<ContentsFile>;
      if (!body || body.type !== "file" || body.path !== path ||
          body.encoding !== "base64" || typeof body.content !== "string" ||
          body.content.length > Math.ceil(MAX_FILE_BYTES * 4 / 3) + 1024) {
        throw new Error("Pinned GitHub source missing supported file contents");
      }
      const compact = body.content.replace(/\s/g, "");
      if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(compact)) {
        throw new Error("Malformed base64 GitHub response");
      }
      const bytes = Buffer.from(compact, "base64");
      if (bytes.length !== candidate.size || bytes.length > MAX_FILE_BYTES) {
        throw new Error("Pinned GitHub source size mismatch");
      }
      total += bytes.length;
      if (total > MAX_TOTAL_BYTES) throw new Error("Total bounded inspection size exceeded");
      seen.add(path);
      fileDigests.push({
        path, bytes: bytes.length,
        sha256: "sha256:" + createHash("sha256").update(bytes).digest("hex")
      });
    }

    for (const scope of action.allowedPaths) {
      if (!validPath(scope)) throw new Error("Unsafe or malformed inspection path");
      const response = await request(scope);
      if (Array.isArray(response)) {
        if (response.length > 100) throw new Error("Inspection directory listing too large");
        // No recursive scan. Reject symlinks/submodules and out-of-scope entries.
        const entries = response.filter((entry): entry is { type: string; path: string } =>
          !!entry && typeof entry === "object" && "type" in entry &&
          "path" in entry && typeof entry.path === "string" &&
          typeof entry.type === "string");
        if (entries.length !== response.length) throw new Error("Malformed GitHub directory listing");
        for (const entry of entries) {
          if (entry.type !== "file") continue;
          if (!validPath(entry.path) || !entry.path.startsWith(scope + "/") ||
              entry.path.slice(scope.length + 1).includes("/")) {
            throw new Error("Directory listing escapes signed scope");
          }
          await loadFile(entry.path);
        }
      } else {
        await loadFile(scope, response);
      }
    }

    if (!fileDigests.length) throw new Error("No concrete files observed within signed scope");
    fileDigests.sort((a, b) => a.path.localeCompare(b.path));
    const record = JSON.stringify({
      schemaVersion: "1.0.0", projectId: action.projectId,
      repository: action.repository, appHead: action.appHead,
      nodeId: action.nodeId, mode: action.mode, files: fileDigests
    });
    return Object.freeze({
      outcome: "succeeded" as const,
      observationDigest: "sha256:" + createHash("sha256").update(record).digest("hex"),
      evidenceReferences: Object.freeze(fileDigests.map((file) =>
        "github:" + action.repository + "@" + action.appHead + "#" + file.path)),
      filesTouched: Object.freeze([]), // Inspection makes ZERO changes.
      tokensUsed: 0 // No LLM was called.
    });
  }
}
