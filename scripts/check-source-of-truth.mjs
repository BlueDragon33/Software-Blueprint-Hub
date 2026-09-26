import { findSourceTruthViolations, loadRepositoryTruth } from "./source-truth-lib.mjs";

const violations = findSourceTruthViolations(loadRepositoryTruth());

if (violations.length) {
  console.error("Source-of-truth contradiction gate FAILED:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log("Source-of-truth contradiction gate PASS");
}
