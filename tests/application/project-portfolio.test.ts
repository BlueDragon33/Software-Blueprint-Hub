import { describe, expect, it } from "vitest";

import {
  buildProjectPortfolioProjection,
  type ProjectRegistryItem
} from "../../packages/application/src";

const alpha: ProjectRegistryItem = {
  projectId: "project:alpha",
  profileId: "profile:alpha",
  name: "Alpha",
  projectType: "web-application",
  blueprintLevel: "B2",
  recordVersion: 3,
  updatedAt: "2026-09-26T10:00:00.000Z",
  access: "OWNER"
};

const beta: ProjectRegistryItem = {
  projectId: "project:beta",
  profileId: "profile:beta",
  name: "Beta",
  projectType: "platform",
  blueprintLevel: "B4",
  recordVersion: 7,
  updatedAt: "2026-09-26T11:00:00.000Z",
  access: "VIEWER"
};

describe("P9-011 Multi-project Portfolio View", () => {
  it("builds deterministic metadata-only portfolio regardless of input order", () => {
    const first = buildProjectPortfolioProjection([alpha, beta]);
    const second = buildProjectPortfolioProjection([beta, alpha]);

    expect(second).toEqual(first);
    expect(first.totalReadableProjects).toBe(2);
    expect(first.latestRegistryUpdate).toBe(beta.updatedAt);
    expect(first.projects.map((item) => item.projectId)).toEqual([
      "project:beta",
      "project:alpha"
    ]);
  });

  it("preserves authority-filtered project identity without cross-project mutation authority", () => {
    const projection = buildProjectPortfolioProjection([alpha]);

    expect(projection.projects).toEqual([
      expect.objectContaining({
        projectId: "project:alpha",
        access: "OWNER"
      })
    ]);
    expect(projection).toMatchObject({
      canonicalMutationAllowed: false,
      crossProjectMutationAllowed: false,
      aggregatedReadinessAllowed: false,
      businessDataIncluded: false
    });
  });

  it("fails closed on duplicate project identity", () => {
    expect(() =>
      buildProjectPortfolioProjection([
        alpha,
        { ...alpha, name: "Conflicting Alpha" }
      ])
    ).toThrow(/duplicate project identity/i);
  });

  it("does not manufacture combined readiness, gate or progress fields", () => {
    const projection = buildProjectPortfolioProjection([alpha, beta]);
    const keys = new Set<string>();

    const collect = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(collect);
        return;
      }
      if (!value || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        keys.add(key);
        collect(child);
      }
    };

    collect(projection);

    for (const forbidden of [
      "readiness",
      "gateStatus",
      "qualityGate",
      "progress",
      "progressPercent",
      "percentComplete",
      "releaseAuthority",
      "businessData"
    ]) {
      expect(keys.has(forbidden)).toBe(false);
    }
  });

  it("groups only safe registry metadata", () => {
    const projection = buildProjectPortfolioProjection([
      alpha,
      beta,
      {
        ...alpha,
        projectId: "project:gamma",
        profileId: "profile:gamma",
        name: "Gamma",
        access: "VIEWER",
        updatedAt: "2026-09-26T09:00:00.000Z"
      }
    ]);

    expect(projection.byBlueprintLevel).toEqual([
      { key: "B2", count: 2 },
      { key: "B4", count: 1 }
    ]);
    expect(projection.byAccess).toEqual([
      { key: "OWNER", count: 1 },
      { key: "VIEWER", count: 2 }
    ]);
  });
});
