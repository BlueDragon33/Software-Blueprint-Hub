import type { ProjectRegistryItem } from "./project-registry";

export interface ProjectPortfolioSummaryItem {
  readonly projectId: string;
  readonly name: string;
  readonly projectType: string;
  readonly blueprintLevel: ProjectRegistryItem["blueprintLevel"];
  readonly access: ProjectRegistryItem["access"];
  readonly recordVersion: number;
  readonly updatedAt: string;
}

export interface ProjectPortfolioCount {
  readonly key: string;
  readonly count: number;
}

export interface ProjectPortfolioProjection {
  readonly projectionKind: "authority-filtered-portfolio";
  readonly canonicalMutationAllowed: false;
  readonly crossProjectMutationAllowed: false;
  readonly aggregatedReadinessAllowed: false;
  readonly businessDataIncluded: false;
  readonly totalReadableProjects: number;
  readonly latestRegistryUpdate: string | null;
  readonly byBlueprintLevel: readonly ProjectPortfolioCount[];
  readonly byProjectType: readonly ProjectPortfolioCount[];
  readonly byAccess: readonly ProjectPortfolioCount[];
  readonly projects: readonly ProjectPortfolioSummaryItem[];
  readonly boundaryNote: string;
}

function counts(values: readonly string[]): readonly ProjectPortfolioCount[] {
  const map = new Map<string, number>();
  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1);
  }

  return Object.freeze(
    [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => Object.freeze({ key, count }))
  );
}

export function buildProjectPortfolioProjection(
  registryItems: readonly ProjectRegistryItem[]
): ProjectPortfolioProjection {
  const seen = new Set<string>();
  for (const item of registryItems) {
    if (seen.has(item.projectId)) {
      throw new TypeError(
        `Portfolio projection received duplicate project identity ${item.projectId}`
      );
    }
    seen.add(item.projectId);
  }

  const projects = Object.freeze(
    [...registryItems]
      .sort(
        (a, b) =>
          b.updatedAt.localeCompare(a.updatedAt) ||
          a.projectId.localeCompare(b.projectId)
      )
      .map((item) =>
        Object.freeze({
          projectId: item.projectId,
          name: item.name,
          projectType: item.projectType,
          blueprintLevel: item.blueprintLevel,
          access: item.access,
          recordVersion: item.recordVersion,
          updatedAt: item.updatedAt
        })
      )
  );

  return Object.freeze({
    projectionKind: "authority-filtered-portfolio",
    canonicalMutationAllowed: false,
    crossProjectMutationAllowed: false,
    aggregatedReadinessAllowed: false,
    businessDataIncluded: false,
    totalReadableProjects: projects.length,
    latestRegistryUpdate: projects[0]?.updatedAt ?? null,
    byBlueprintLevel: counts(projects.map((item) => item.blueprintLevel)),
    byProjectType: counts(projects.map((item) => item.projectType)),
    byAccess: counts(projects.map((item) => item.access)),
    projects,
    boundaryNote:
      "Portfolio aggregates only authority-filtered registry metadata. It does not merge project authority, readiness, Quality Gate state, release authority or business data."
  });
}
