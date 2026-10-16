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

test("new RUE observation is later than historic sealed queue source", () => {
  const entry = queue.entries.find(e => e.repository === "BlueDragon33/Blueprint-Russian-Expert-Engine");
  assert.ok(entry);
  assert.equal(entry.canonicalCompliance, "UNVERIFIED");
  assert.equal(entry.productionAuthority, false);
  const q = structuredClone(queue);
  q.entries.at(-1).observedAt="2026-10-14T00:00:00.000Z";
  assert.ok(check(q).some(s=>s.includes("backdated observedAt")));
  q.entries.at(-1).observedAt="2026-10-16";
  assert.ok(check(q).some(s=>s.includes("invalid or backdated observedAt")));
  q.entries.at(-1).observedAt=entry.observedAt;
  assert.deepEqual(check(q),[]);
});
