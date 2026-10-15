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
