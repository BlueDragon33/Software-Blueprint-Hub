import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateWorkflow } from "./prompt-workflow-lib.mjs";

const directory = fileURLToPath(new URL("../prompt-workflows/projects/", import.meta.url));
const files = readdirSync(directory).filter((name) => name.endsWith(".json")).sort();
if (!files.length) {
  console.error("FAIL: no project workflow manifests");
  process.exitCode = 1;
} else {
  for (const filename of files) {
    try {
      const manifest = JSON.parse(readFileSync(resolve(directory, filename), "utf8"));
      const result = validateWorkflow(manifest);
      if (!result.valid) {
        process.exitCode = 1;
        console.error("FAIL " + filename + ": " + result.errors.join(" | "));
      } else {
        console.log("VALID " + filename + " [" + manifest.status + "], nodes=" + manifest.nodes.length);
      }
    } catch (error) {
      process.exitCode = 1;
      console.error("FAIL " + filename + ": " + error.message);
    }
  }
}
