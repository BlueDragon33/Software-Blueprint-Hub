import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative, sep } from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceExts = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);
const ignored = new Set(["node_modules", ".next", "dist", "coverage", ".git"]);

const violations = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!sourceExts.has(extname(entry.name))) continue;
    await checkFile(full);
  }
}

function hasImport(content, pattern) {
  return pattern.test(content);
}

async function checkFile(file) {
  const rel = relative(root, file).split(sep).join("/");
  const content = await readFile(file, "utf8");

  if (rel.startsWith("packages/contracts/")) {
    if (hasImport(content, /from\s+["'](?:next|react|react-dom|@blueprint-os\/core|@blueprint-os\/ui)/)) {
      violations.push(`${rel}: contracts must remain framework/domain independent`);
    }
  }

  if (rel.startsWith("packages/core/")) {
    if (hasImport(content, /from\s+["'](?:next|react|react-dom|@blueprint-os\/ui|@blueprint-os\/persistence)/)) {
      violations.push(`${rel}: core must not depend on web/UI/persistence implementation`);
    }
  }

  if (rel.startsWith("packages/ui/")) {
    if (hasImport(content, /from\s+["'](?:@blueprint-os\/persistence|.*\/adapters\/)/)) {
      violations.push(`${rel}: UI must not import persistence adapters`);
    }
  }

  if (rel.startsWith("apps/web/")) {
    if (hasImport(content, /from\s+["'](?:@blueprint-os\/persistence|.*\/adapters\/)/)) {
      violations.push(`${rel}: web presentation must use application/domain ports, not persistence adapters`);
    }
  }
}

for (const folder of ["apps", "packages"]) {
  try {
    await walk(join(root, folder));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (violations.length) {
  console.error("Architecture boundary violations:");
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log("Architecture boundaries: PASS");
