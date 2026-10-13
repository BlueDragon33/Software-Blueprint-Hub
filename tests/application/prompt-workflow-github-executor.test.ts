import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { WorkflowScopedAction } from "../../packages/application/src/prompt-workflow-execution";
import { ScopedGitHubReadExecutor } from "../../packages/runtime/src/workflow-scoped-github-executor";

const head = "a".repeat(40);
const repository = "BlueDragon33/Application-Management";
const action: WorkflowScopedAction = {
  requestId: "sha256:" + "b".repeat(64),
  projectId: "project:application-management",
  repository, appHead: head, nodeId: "inventory",
  mode: "inspect-scoped", allowedPaths: ["src/visa/form.ts"],
  maxFiles: 2, maxTokenEstimate: 5000, attempt: 1
};
const path = "src/visa/form.ts";

function response(contents: unknown, status = 200): Response {
  return new Response(JSON.stringify(contents), {
    status, headers: { "content-type": "application/json" }
  });
}
function file(path: string, body = "actual source code") {
  return {
    type: "file", path, size: Buffer.byteLength(body),
    encoding: "base64", content: Buffer.from(body).toString("base64")
  };
}
function fixture(handler: (url: URL) => Response) {
  const requests: string[] = [];
  const http = vi.fn(async (url: string | URL) => {
    requests.push(String(url));
    return handler(new URL(String(url)));
  });
  const inspector = new ScopedGitHubReadExecutor({
    repository, http: http as unknown as typeof fetch,
    tokenProvider: async () => "scoped-token"
  });
  return { inspector, http, requests };
}

describe("Real scoped GitHub read executor", () => {
  it("fetches only exact pinned SHA file, verifies real bytes and never reports mutation", async () => {
    const f = fixture((url) => {
      expect(url.searchParams.get("ref")).toBe(head);
      expect(url.pathname).toBe("/repos/BlueDragon33/Application-Management/contents/" + path);
      return response(file(path));
    });
    const result = await f.inspector.execute(action);
    expect(result.outcome).toBe("succeeded");
    expect(result.filesTouched).toEqual([]);
    expect(result.tokensUsed).toBe(0);
    expect(result.evidenceReferences).toEqual(["github:" + repository + "@" + head + "#" + path]);
    expect(result.observationDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(f.http).toHaveBeenCalledTimes(1);
    expect(f.http.mock.calls[0]?.[1]?.method).toBe("GET");
    expect(f.http.mock.calls[0]?.[1]?.headers.Authorization).toBe("Bearer scoped-token");
    const canonical = JSON.stringify({
      schemaVersion: "1.0.0", projectId: action.projectId,
      repository, appHead: head, nodeId: "inventory", mode: "inspect-scoped",
      files: [{
        path, bytes: 18,
        sha256: "sha256:" + createHash("sha256").update("actual source code").digest("hex")
      }]
    });
    expect(result.observationDigest).toBe("sha256:" + createHash("sha256").update(canonical).digest("hex"));
  });

  it("limits directory inspection to immediate regular children only, never walks repository recursively", async () => {
    const files = ["src/visa/a.ts", "src/visa/b.ts"];
    const f = fixture((url) => {
      const p = decodeURIComponent(url.pathname.split("/contents/")[1]!);
      if (p === "src/visa") return response([
        { type: "dir", path: "src/visa/nested" },
        { type: "file", path: files[1] },
        { type: "file", path: files[0] }
      ]);
      return response(file(p));
    });
    const result = await f.inspector.execute({ ...action, allowedPaths: ["src/visa"] });
    expect(result.evidenceReferences).toEqual(files.map((p) => "github:" + repository + "@" + head + "#" + p));
    expect(f.http).toHaveBeenCalledTimes(3);
    expect(f.requests.every((r) => !r.includes("/nested"))).toBe(true);
  });

  it("rejects edits, test runs, mismatched repository, unpinned HEAD and traversal", async () => {
    const f = fixture(() => response(file(path)));
    for (const invalid of [
      { ...action, mode: "edit-scoped" },
      { ...action, mode: "test-scoped" },
      { ...action, repository: "BlueDragon33/other" },
      { ...action, appHead: "not-a-sha" },
      { ...action, allowedPaths: ["src/../secrets"] },
      { ...action, allowedPaths: ["/etc/passwd"] }
    ] as WorkflowScopedAction[]) {
      await expect(f.inspector.execute(invalid)).rejects.toThrow();
    }
    expect(f.http).not.toHaveBeenCalled();
  });

  it("blocks symlink-like responses, wrong exact file path and missing source", async () => {
    for (const object of [
      { ...file(path), type: "symlink" },
      file("private/admin.ts"),
      { ...file(path), encoding: "none" },
      { ...file(path), size: 777 }
    ]) {
      const f = fixture(() => response(object));
      await expect(f.inspector.execute(action)).rejects.toThrow();
    }
    await expect(fixture(() => response({ message: "Not Found" }, 404)).inspector.execute(action))
      .rejects.toThrow("Pinned GitHub source unavailable");
  });

  it("fails on total file caps, out-of-scope listings and oversized content", async () => {
    const over = fixture((url) => {
      const p = decodeURIComponent(url.pathname.split("/contents/")[1]!);
      if (p === "src/visa") return response([
        { type: "file", path: "src/visa/a.ts" },
        { type: "file", path: "src/visa/b.ts" },
        { type: "file", path: "src/visa/c.ts" }
      ]);
      return response(file(p));
    });
    await expect(over.inspector.execute({ ...action, allowedPaths: ["src/visa"] }))
      .rejects.toThrow("budget exceeded");

    const escape = fixture(() => response([{ type: "file", path: "private/root.ts" }]));
    await expect(escape.inspector.execute({ ...action, allowedPaths: ["src/visa"] }))
      .rejects.toThrow("escapes signed scope");

    const huge = fixture(() => response(file(path, "x".repeat(256001))));
    await expect(huge.inspector.execute(action)).rejects.toThrow();

    const blank = fixture(() => response([{ type: "dir", path: "src/visa/empty" }]));
    await expect(blank.inspector.execute({ ...action, allowedPaths: ["src/visa"] }))
      .rejects.toThrow("No concrete files");
  });
});
