import { describe, expect, it } from "vitest";
import type { GateEvidence, QualityGate } from "../../packages/contracts/src";
import { AuthorityService, type AuthorityRepository, type ProjectRole } from "../../packages/core/src/authority";
import { readProjectQualityReview } from "../../apps/web/src/server/project-quality-review";

const projectId = "project:fixture-am";
const actor = { principalId: "principal:fixture" };
const meta = { schemaVersion: "1.0.0" as const, recordVersion: 2,
  createdAt: "2026-11-25T00:00:00Z", updatedAt: "2026-11-25T00:00:00Z" };
const gate: QualityGate = { id: "gate:instance:fixture", projectId, name: "Fixture quality",
  requirements: ["Fixture evidence"], status: "not-ready", evidenceIds: [], meta };
const evidence: GateEvidence = { id: "evidence:fixture", gateId: gate.id, kind: "test",
  source: "fixture", revision: "a".repeat(40), createdAt: meta.createdAt };
const bundle = { gate, evidence: [evidence] };

function fixture(initialRole: ProjectRole | null, models = [bundle], systemOwner = false) {
  let role = initialRole;
  let reads = 0;
  const repo: AuthorityRepository = {
    async resolvePrincipal() { throw new Error("unexpected identity mutation"); },
    async bootstrapOwner() { throw new Error("unexpected bootstrap"); },
    async isSystemOwner(id) { return systemOwner && id === actor.principalId; },
    async findProjectRole(id, principal) { return id === projectId && principal === actor.principalId ? role : null; },
    async listProjectRolesForPrincipal() { return []; },
    async setProjectRole() { throw new Error("unexpected role mutation"); }
  };
  const runtime = { authority: new AuthorityService(repo), workQuality: {
    async listQualityGates() { reads++; return models; }
  } };
  return { runtime, revoke: () => { role = null; }, reads: () => reads };
}

describe("project quality review read admission", () => {
  it("denies signed-out before reading", async () => {
    const f = fixture("OWNER");
    await expect(readProjectQualityReview(f.runtime, null, projectId)).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED" });
    expect(f.reads()).toBe(0);
  });
  it("denies reviewer of another project before reading", async () => {
    const f = fixture("REVIEWER");
    await expect(readProjectQualityReview(f.runtime, actor, "project:other")).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED" });
    expect(f.reads()).toBe(0);
  });
  for (const role of ["VIEWER", "EDITOR", "REVIEWER", "OWNER"] as const) {
    it(`preserves canonical read and review separation for ${role}`, async () => {
      const f = fixture(role);
      const result = await readProjectQualityReview(f.runtime, actor, projectId);
      expect(result.canReview).toBe(role === "OWNER" || role === "REVIEWER");
      expect(result.gateModels[0]?.gate).toEqual(gate);
      expect(result.gateModels[0]?.gate.status).toBe("not-ready");
    });
  }
  it("allows canonical system owner without a project role", async () => {
    const f = fixture(null, [bundle], true);
    expect((await readProjectQualityReview(f.runtime, actor, projectId)).canReview).toBe(true);
  });
  it("does not invent missing instance IDs", async () => {
    const f = fixture("REVIEWER", []);
    expect((await readProjectQualityReview(f.runtime, actor, projectId)).gateModels).toEqual([]);
  });
  it("rejects cross-project gate records", async () => {
    const f = fixture("REVIEWER", [{ ...bundle, gate: { ...gate, projectId: "project:other" } }]);
    await expect(readProjectQualityReview(f.runtime, actor, projectId)).rejects.toThrow("inconsistent");
  });
  it("rejects duplicate canonical IDs", async () => {
    const f = fixture("REVIEWER", [bundle, bundle]);
    await expect(readProjectQualityReview(f.runtime, actor, projectId)).rejects.toThrow("inconsistent");
  });
  it("rejects invalid record version", async () => {
    const f = fixture("REVIEWER", [{ ...bundle, gate: { ...gate, meta: { ...meta, recordVersion: 0 } } }]);
    await expect(readProjectQualityReview(f.runtime, actor, projectId)).rejects.toThrow("inconsistent");
  });
  it("rejects evidence bound to another gate", async () => {
    const f = fixture("REVIEWER", [{ gate, evidence: [{ ...evidence, gateId: "gate:other" }] }]);
    await expect(readProjectQualityReview(f.runtime, actor, projectId)).rejects.toThrow("inconsistent");
  });
  it("denies disclosure after role revocation during read", async () => {
    const f = fixture("REVIEWER");
    const original = f.runtime.workQuality.listQualityGates;
    f.runtime.workQuality.listQualityGates = async () => { const rows = await original(); f.revoke(); return rows; };
    await expect(readProjectQualityReview(f.runtime, actor, projectId)).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED" });
  });
  it("propagates authority store failure instead of claiming permission", async () => {
    const f = fixture("REVIEWER");
    f.runtime.authority.can = async () => { throw new Error("authority unavailable"); };
    await expect(readProjectQualityReview(f.runtime, actor, projectId)).rejects.toThrow("authority unavailable");
  });
});
