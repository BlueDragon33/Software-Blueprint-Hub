export type AdaptiveViewport = "desktop" | "tablet" | "mobile";
export type AdaptiveAuditRequirement =
  | "keyboard"
  | "focus-visible"
  | "skip-link"
  | "current-route"
  | "reduced-motion"
  | "no-horizontal-overflow"
  | "touch-target"
  | "textual-status"
  | "dense-view-readability";

export interface AdaptiveAuditSurface {
  readonly id: string;
  readonly path: string;
  readonly viewports: readonly AdaptiveViewport[];
  readonly requirements: readonly AdaptiveAuditRequirement[];
}

export interface AdaptiveUxAuditPlan {
  readonly kind: "adaptive-ux-audit-plan";
  readonly projectId: "project:blueprint-os";
  readonly sourceRevision: string;
  readonly targetViewports: Readonly<Record<AdaptiveViewport, {
    readonly width: number;
    readonly height: number;
    readonly touch: boolean;
  }>>;
  readonly surfaces: readonly AdaptiveAuditSurface[];
  readonly productionReleaseAuthority: false;
  readonly canonicalMutationAllowed: false;
  readonly blockers: readonly string[];
}

const requiredRequirements: readonly AdaptiveAuditRequirement[] = Object.freeze([
  "keyboard",
  "focus-visible",
  "skip-link",
  "current-route",
  "reduced-motion",
  "no-horizontal-overflow",
  "touch-target",
  "textual-status",
  "dense-view-readability"
]);

export function buildAdaptiveUxAuditPlan(input: {
  readonly sourceRevision: string;
  readonly surfaces: readonly AdaptiveAuditSurface[];
}): AdaptiveUxAuditPlan {
  const sourceRevision = input.sourceRevision.trim();
  if (!sourceRevision) throw new TypeError("Adaptive UX audit source revision is required");

  const ids = new Set<string>();
  for (const surface of input.surfaces) {
    if (!surface.id.trim() || !surface.path.trim()) {
      throw new TypeError("Adaptive UX audit surfaces require id and path");
    }
    if (ids.has(surface.id)) throw new TypeError(`Duplicate audit surface ${surface.id}`);
    ids.add(surface.id);
    if (surface.viewports.length === 0) {
      throw new TypeError(`Audit surface ${surface.id} requires at least one viewport`);
    }
  }

  const covered = new Set(input.surfaces.flatMap((surface) => surface.requirements));
  const blockers = requiredRequirements
    .filter((requirement) => !covered.has(requirement))
    .map((requirement) => `missing-audit-requirement:${requirement}`)
    .sort();

  for (const viewport of ["desktop", "tablet", "mobile"] as const) {
    if (!input.surfaces.some((surface) => surface.viewports.includes(viewport))) {
      blockers.push(`missing-viewport:${viewport}`);
    }
  }

  return Object.freeze({
    kind: "adaptive-ux-audit-plan",
    projectId: "project:blueprint-os",
    sourceRevision,
    targetViewports: Object.freeze({
      desktop: Object.freeze({ width: 1440, height: 1000, touch: false }),
      tablet: Object.freeze({ width: 834, height: 1194, touch: true }),
      mobile: Object.freeze({ width: 412, height: 915, touch: true })
    }),
    surfaces: Object.freeze(
      [...input.surfaces]
        .map((surface) =>
          Object.freeze({
            id: surface.id.trim(),
            path: surface.path.trim(),
            viewports: Object.freeze([...new Set(surface.viewports)].sort()),
            requirements: Object.freeze([...new Set(surface.requirements)].sort())
          })
        )
        .sort((a, b) => a.id.localeCompare(b.id))
    ),
    productionReleaseAuthority: false,
    canonicalMutationAllowed: false,
    blockers: Object.freeze(blockers.sort())
  });
}

export const blueprintOsAdaptiveUxAuditV1 = buildAdaptiveUxAuditPlan({
  sourceRevision: "phase9:p9-016",
  surfaces: [
    {
      id: "project-workspace",
      path: "/projects/project%3Ap6-registry-beta/quality",
      viewports: ["desktop", "tablet", "mobile"],
      requirements: [
        "keyboard",
        "focus-visible",
        "skip-link",
        "current-route",
        "no-horizontal-overflow",
        "touch-target",
        "textual-status",
        "dense-view-readability"
      ]
    },
    {
      id: "data-lifecycle",
      path: "/projects/project%3Ap6-registry-beta/data-lifecycle",
      viewports: ["desktop", "tablet", "mobile"],
      requirements: [
        "keyboard",
        "focus-visible",
        "current-route",
        "no-horizontal-overflow",
        "dense-view-readability"
      ]
    },
    {
      id: "knowledge",
      path: "/knowledge",
      viewports: ["desktop", "tablet", "mobile"],
      requirements: [
        "keyboard",
        "focus-visible",
        "skip-link",
        "reduced-motion",
        "no-horizontal-overflow"
      ]
    },
    {
      id: "project-bootstrap",
      path: "/projects/new",
      viewports: ["desktop", "tablet", "mobile"],
      requirements: [
        "keyboard",
        "focus-visible",
        "reduced-motion",
        "touch-target",
        "no-horizontal-overflow"
      ]
    }
  ]
});
