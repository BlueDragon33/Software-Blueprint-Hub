import { describe, expect, it, vi } from "vitest";
import { PostgresNextActionWorkBindingRepository } from "../../packages/persistence/src/next-action-work-binding-repository";
import type { BlueprintPrismaClient } from "../../packages/persistence/src/client";

const scope = {
  projectId: "project:blueprint-os", workPackageId: "work:precision", workPackageRecordVersion: 1,
  workflowId: "precision-inspection", workflowDigest: "sha256:" + "a".repeat(64),
  appHead: "b".repeat(40), policyVersion: "1.3.0"
};
const databaseTimestamp = "2026-10-17T00:00:00.123456Z";
function fixture(options: { adoption?: "missing" | "revoke" | "tie"; owner?: string; version?: number; binding?: string } = {}) {
  const adoption = {
    ...scope, id: "workflow-adoption:zzz", decidedByPrincipalId: "owner", decision: "adopt",
    decidedAt: new Date(databaseTimestamp)
  };
  const rows = options.adoption === "missing" ? [] : options.adoption === "tie"
    ? [adoption, { ...adoption, id: "workflow-adoption:aaa", decision: "revoke" }]
    : [{ ...adoption, decision: options.adoption === "revoke" ? "revoke" : "adopt" }];
  const writes = vi.fn(async (_input: unknown) => ({}));
  const audit = vi.fn(async (_input: unknown) => ({}));
  const tx = {
    systemBootstrap: { findUnique: vi.fn(async () => ({ ownerPrincipalId: options.owner ?? "owner" })) },
    $queryRaw: vi.fn(async () => [{ id: scope.workPackageId }]),
    workPackage: { findUnique: vi.fn(async () => ({ projectId: scope.projectId, recordVersion: options.version ?? 1, status: "ready" })) },
    workflowExecutionAdoptionDecision: {
      findFirst: vi.fn(async () => rows[0] ?? null),
      // Models the old exact-equality query after the driver rounded .123456 to .123.
      count: vi.fn(async () => options.adoption === "tie" ? 2 : 0),
      findMany: vi.fn(async () => rows)
    },
    nextActionWorkBindingDecision: { create: writes, findFirst: vi.fn(async () => ({ ...scope, decision: options.binding ?? "bind" })) },
    authorityAuditEvent: { create: audit }
  };
  const prisma = { ...tx, $transaction: async (fn: (tx: BlueprintPrismaClient) => Promise<void>) => fn(tx as unknown as BlueprintPrismaClient) } as unknown as BlueprintPrismaClient;
  return { repo: new PostgresNextActionWorkBindingRepository(prisma), writes, audit };
}

describe("Work binding timestamp precision (driver-shaped unit fixture, not live PostgreSQL)", () => {
  it("accepts one valid adoption despite sub-millisecond PostgreSQL precision", async () => {
    expect(new Date(databaseTimestamp).toISOString()).toBe("2026-10-17T00:00:00.123Z");
    const h = fixture();
    await expect(h.repo.record({ ...scope, actorPrincipalId: "owner", decision: "bind" })).resolves.toBeUndefined();
    await expect(h.repo.assertCurrent(scope)).resolves.toBeUndefined();
    expect(h.writes).toHaveBeenCalledTimes(1);
    expect(h.audit).toHaveBeenCalledTimes(1);
    expect(h.writes.mock.calls[0]?.[0]).toMatchObject({ data: { productionReleaseAuthority: false } });
  });
  it("still rejects indistinguishable adopt/revoke timestamps rather than choosing a UUID", async () => {
    const h = fixture({ adoption: "tie" });
    await expect(h.repo.record({ ...scope, actorPrincipalId: "owner", decision: "bind" })).rejects.toThrow(/unambiguous adopted workflow/);
    await expect(h.repo.assertCurrent(scope)).rejects.toThrow(/BINDING_DENIED/);
    expect(h.writes).not.toHaveBeenCalled();
  });
  it("denies absent or revoked adoption at both binding boundaries", async () => {
    for (const adoption of ["missing", "revoke"] as const) {
      const h = fixture({ adoption });
      await expect(h.repo.record({ ...scope, actorPrincipalId: "owner", decision: "bind" })).rejects.toThrow(/adopted workflow/);
      await expect(h.repo.assertCurrent(scope)).rejects.toThrow(/BINDING_DENIED/);
      expect(h.writes).not.toHaveBeenCalled();
    }
  });
  it("keeps owner and WorkPackage version checks ahead of appending a decision", async () => {
    for (const options of [{ owner: "different-owner" }, { version: 2 }]) {
      const h = fixture(options);
      await expect(h.repo.record({ ...scope, actorPrincipalId: "owner", decision: "bind" })).rejects.toThrow(/System Owner|recordVersion mismatch/);
      expect(h.writes).not.toHaveBeenCalled();
      expect(h.audit).not.toHaveBeenCalled();
    }
  });
  it("allows owner revocation even when adoption is absent", async () => {
    const h = fixture({ adoption: "missing" });
    await expect(h.repo.record({ ...scope, actorPrincipalId: "owner", decision: "revoke" })).resolves.toBeUndefined();
    expect(h.writes).toHaveBeenCalledTimes(1);
  });
  it("still denies an already revoked binding", async () => {
    await expect(fixture({ binding: "revoke" }).repo.assertCurrent(scope)).rejects.toThrow(/BINDING_DENIED/);
  });
});
