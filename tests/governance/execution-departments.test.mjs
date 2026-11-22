import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { validateDepartmentOwnership } from "../../scripts/check-execution-departments.mjs";

const model = JSON.parse(readFileSync("control/execution-department-ownership.v1.json", "utf8"));
const clone = () => structuredClone(model);

test("validates exact 12-department responsibility map", () => {
  assert.deepEqual(validateDepartmentOwnership(model), []);
});
test("fails if quality gate can be passed by a department", () => {
  const bad = clone();
  bad.departments[3].authority.passQualityGate = true;
  assert.ok(validateDepartmentOwnership(bad).some(e => e.includes("implicit authority")));
});
test("fails if two departments share the same id", () => {
  const bad = clone();
  bad.departments[1].id = bad.departments[0].id;
  assert.ok(validateDepartmentOwnership(bad).some(e => e.includes("duplicate department")));
});
test("fails if evidence condition for a new repo is removed", () => {
  const bad = clone();
  bad.repositorySeparation.splitIfAnyVerified[1].evidence = "";
  assert.ok(validateDepartmentOwnership(bad).some(e => e.includes("repo split")));
});
test("fails if retry policy becomes unbounded", () => {
  const bad = clone();
  bad.handoff.failurePolicy = "repeat indefinitely";
  assert.ok(validateDepartmentOwnership(bad).some(e => e.includes("retry must be bounded")));
});

test("review evidence scales with real design/screenshot/runnable/release/operational artifacts",()=>{
  assert.equal(model.departments.length,12);
  assert.deepEqual(model.evidenceTieredReview.tiers.map(t=>t.id),[
    "design-contract","visual-asset","runnable-slice","release-candidate","operational-observation"
  ]);
  assert.deepEqual(validateDepartmentOwnership(model),[]);
  assert.equal(model.evidenceTieredReview.reviewIndependence.previewOrMockupNeverProvesRunnableFunction,true);
});

test("a mockup cannot be promoted to executable feature verification",()=>{
  const bad=clone();bad.evidenceTieredReview.reviewIndependence.previewOrMockupNeverProvesRunnableFunction=false;
  assert.ok(validateDepartmentOwnership(bad).some(e=>e.includes("independent and truthful")));
});

test("a tier without verifiable artifact evidence fails closed",()=>{
  const bad=clone();bad.evidenceTieredReview.tiers[2].requiredEvidence=[];
  assert.ok(validateDepartmentOwnership(bad).some(e=>e.includes("stage-specific evidence")));
});

test("tester stays within verification department, collecting precise real app failure specs",()=>{
  assert.equal(model.applicationTester.owner,"verification");
  assert.ok(model.applicationTester.issueContract.requiredFields.includes("reproductionSteps"));
  assert.ok(model.applicationTester.issueContract.requiredFields.includes("actualResult"));
  assert.ok(model.applicationTester.issueContract.optionalFields.includes("observedDurationMs"));
  assert.ok(model.applicationTester.issueContract.optionalFields.includes("stepCount"));
  const bad=clone();bad.applicationTester.owner="independent-13th-department";
  assert.ok(validateDepartmentOwnership(bad).some(e=>e.includes("established 12 departments")));
});

test("tester report cannot omit exact build or grant itself a Production PASS",()=>{
  const bad=clone();bad.applicationTester.issueContract.requiredFields =
    bad.applicationTester.issueContract.requiredFields.filter(v=>v!=="buildSha");
  assert.ok(validateDepartmentOwnership(bad).some(e=>e.includes("reproducible defects")));
  const forged=clone();forged.applicationTester.acceptance.testerCannotSelfPassConstitutionOrProduction=false;
  assert.ok(validateDepartmentOwnership(forged).some(e=>e.includes("self-approval")));
});
