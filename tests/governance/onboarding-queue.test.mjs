import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { validateOnboardingQueue } from "../../scripts/check-governance-onboarding-queue.mjs";

const read = p => JSON.parse(readFileSync(p, "utf8"));
const queue = read("control/governance-onboarding-queue.v1.json");
const governed = read("control/constitution-governed-repositories.json");
const policy = read("control/universal-constitution-version.json");
const check = (q, g = governed) => validateOnboardingQueue(q, g, policy);

test("validates bounded onboarding outside publication seal", () => {
  assert.deepEqual(check(queue), []);
});
test("rejects duplicated pending repo", () => {
  const q = structuredClone(queue); q.entries[1].repository = q.entries[0].repository;
  assert.ok(check(q).some(s => s.includes("duplicate pending")));
});
test("rejects staged repo falsely registered in canonical baseline", () => {
  const g = structuredClone(governed); g.repositories.push({repository: queue.entries[0].repository});
  assert.ok(check(queue, g).some(s => s.includes("already present")));
});
test("rejects implied constitutional compliance and production authority", () => {
  const q = structuredClone(queue); q.entries[0].canonicalCompliance = "COMPLIANT";
  q.entries[0].productionAuthority = true;
  assert.ok(check(q).some(s => s.includes("cannot claim PASS")));
});
test("rejects missing exact observed source revision", () => {
  const q = structuredClone(queue); q.entries[0].observedMainSha = "main";
  assert.ok(check(q).some(s => s.includes("missing exact observed HEAD")));
});
