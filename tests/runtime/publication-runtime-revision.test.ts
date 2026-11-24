import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localPublicationBuildRevision, publicationRuntimeRevision } from "../../packages/runtime/src/publication-runtime-revision";

const a = "a".repeat(40), b = "b".repeat(40);
describe("provider-neutral local publication provenance", () => {
  it("accepts one exact build stamp or matching legacy stamp", () => {
    expect(publicationRuntimeRevision(a, undefined)).toBe(a);
    expect(publicationRuntimeRevision("", a)).toBe(a);
    expect(publicationRuntimeRevision(a, a)).toBe(a);
  });
  it("fails closed on absence, malformed or conflicting stamps", () => {
    for (const [local, legacy] of [[undefined, undefined], ["", ""], ["abc", a], [a, b], [a + "\n", undefined], ["A".repeat(40), undefined]]) {
      expect(publicationRuntimeRevision(local, legacy)).toBeUndefined();
    }
  });
  it("reads a real clean Git commit and rejects modified or extra source files", () => {
    const dir = mkdtempSync(join(tmpdir(), "publication-clean-"));
    const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    try {
      git("init");
      git("config", "user.email", "qa@example.invalid");
      git("config", "user.name", "QA");
      mkdirSync(join(dir, "app"));
      writeFileSync(join(dir, "app", "source.txt"), "first\n");
      git("add", ".");
      git("commit", "-m", "fixture");
      const sha = git("rev-parse", "HEAD");
      expect(localPublicationBuildRevision(dir)).toBe(sha);
      expect(localPublicationBuildRevision(join(dir, "app"))).toBe(sha);
      writeFileSync(join(dir, "app", "source.txt"), "changed");
      expect(() => localPublicationBuildRevision(dir)).toThrow(/clean exact Git checkout/);
      git("restore", "app/source.txt");
      writeFileSync(join(dir, "untracked.txt"), "extra");
      expect(() => localPublicationBuildRevision(dir)).toThrow(/clean exact Git checkout/);
      rmSync(join(dir, "untracked.txt"));
      expect(localPublicationBuildRevision(dir)).toBe(sha);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});
