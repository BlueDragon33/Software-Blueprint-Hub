// Generate a deterministic static import map so Next.js bundles approved source files.
// The generated file is a derived projection, not another workflow source-of-truth.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const directory = path.join(root, "prompt-workflows/projects");
const target = path.join(root, "apps/web/src/server/prompt-workflow-manifests.generated.ts");
const filenames = readdirSync(directory).filter((name) => name.endsWith(".json")).sort();
const imports = filenames.map((name, i) =>
  'import manifest' + i + ' from "../../../../prompt-workflows/projects/' + name + '";'
);
const generated = [
  "// GENERATED FILE — DO NOT EDIT. Source: prompt-workflows/projects/*.json.",
  "// Regenerate with: node scripts/generate-prompt-workflow-imports.mjs",
  ...imports,
  "",
  "export const CENTRAL_WORKFLOW_MANIFESTS: readonly unknown[] = Object.freeze([",
  ...filenames.map((_file, i) => "  manifest" + i + ","),
  "]);",
  ""
].join("\n");
const check = process.argv.includes("--check");
if (check) {
  let current = "";
  try { current = readFileSync(target, "utf8"); } catch { /* missing is drift */ }
  if (current !== generated) {
    console.error("Central Workflow manifest imports are stale; regenerate and commit the diff.");
    process.exitCode = 1;
  } else {
    console.log("Central Workflow generated import map is in sync (" + filenames.length + " manifests)");
  }
} else {
  writeFileSync(target, generated);
  console.log("Generated " + target + " from " + filenames.length + " manifests");
}
