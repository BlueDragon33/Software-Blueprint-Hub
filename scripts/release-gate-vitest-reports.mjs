// Combine the exact public and private Vitest partitions without hiding a skip.
// The private report is accepted only from the protected manual gate's separate run.
const PRIVATE_SUITE = "tests/application/prompt-workflow-live-private-bridge.test.ts";
const normalized = name => typeof name === "string" ? name.replaceAll("\\", "/") : "";
const isPrivate = name => normalized(name) === PRIVATE_SUITE || normalized(name).endsWith("/" + PRIVATE_SUITE);
function counts(report) {
  if (!report || !Array.isArray(report.testResults) || report.testResults.length === 0) throw new Error("Missing Vitest report");
  for (const key of ["numTotalTests", "numPassedTests", "numFailedTests", "numPendingTests"]) {
    if (!Number.isInteger(report[key]) || report[key] < 0) throw new Error("Invalid Vitest result count");
  }
  const todo = report.numTodoTests ?? 0;
  if (!Number.isInteger(todo) || todo < 0 || report.numTotalTests !== report.numPassedTests + report.numFailedTests + report.numPendingTests + todo) throw new Error("Inconsistent Vitest counts");
  const files = report.testResults.map(file => normalized(file.name));
  if (files.some(name => !name) || new Set(files).size !== files.length) throw new Error("Duplicate or missing Vitest file identity");
  const assertions = report.testResults.flatMap(file => {
    if (!Array.isArray(file.assertionResults)) throw new Error("Missing Vitest assertions");
    return file.assertionResults;
  });
  if (assertions.length !== report.numTotalTests || assertions.filter(a => a.status === "passed").length !== report.numPassedTests || assertions.filter(a => a.status === "failed").length !== report.numFailedTests) throw new Error("Vitest assertion count mismatch");
  return { passed: report.numPassedTests, failed: report.numFailedTests, skipped: report.numPendingTests + todo };
}
export function combineReleaseVitestReports(publicReport, privateReport) {
  const pub = counts(publicReport);
  if (privateReport === undefined) {
    const suites = publicReport.testResults.filter(file => isPrivate(file.name));
    if (suites.length !== 1 || suites[0].assertionResults.length !== 8) throw new Error("Unpartitioned gate requires all eight private bridge test records");
    return pub;
  }
  if (publicReport.testResults.some(file => isPrivate(file.name))) throw new Error("Private suite already present in public partition");
  const priv = counts(privateReport);
  if (privateReport.testResults.length !== 1 || !isPrivate(privateReport.testResults[0].name) || privateReport.numTotalTests !== 8 || priv.passed !== 8 || priv.failed !== 0 || priv.skipped !== 0) throw new Error("Exact eight private bridge tests did not pass");
  return { passed: pub.passed + priv.passed, failed: pub.failed + priv.failed, skipped: pub.skipped + priv.skipped };
}
