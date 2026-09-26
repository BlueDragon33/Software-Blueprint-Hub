import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();

function filesUnder(path: string): string[] {
  const absolute = join(repoRoot, path);
  const result: string[] = [];

  for (const entry of readdirSync(absolute)) {
    const child = join(absolute, entry);
    if (statSync(child).isDirectory()) {
      result.push(...filesUnder(relative(repoRoot, child)));
    } else {
      result.push(relative(repoRoot, child).replaceAll("\\", "/"));
    }
  }

  return result;
}

describe("P8-007 Reference Import gate architecture isolation", () => {
  it("keeps Bauman-specific semantics out of Universal Core authority surfaces", () => {
    const protectedPaths = [
      ...filesUnder("packages/core/src"),
      "schemas/blueprint-meta-model.v0.json",
      "docs/UNIVERSAL-CONSTITUTION.v0.md"
    ];

    const violations = protectedPaths.flatMap((path) => {
      const content = readFileSync(join(repoRoot, path), "utf8");
      return /bauman/i.test(content) ? [path] : [];
    });

    expect(violations).toEqual([]);
  });

  it("keeps Bauman material inside explicit reference/import surfaces", () => {
    const permitted = [
      "docs/reference-cases/BAUMAN-NEXTGEN-v1.md",
      "docs/reference-cases/BAUMAN-NEXTGEN-MAPPING-v1.md",
      "docs/reference-cases/BAUMAN-NEXTGEN-GAP-ANALYSIS-v1.md",
      "packages/application/src/reference-imports/bauman-nextgen-v1.json"
    ];

    for (const path of permitted) {
      expect(readFileSync(join(repoRoot, path), "utf8").length).toBeGreaterThan(0);
    }
  });
});
