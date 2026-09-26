import { performance } from "node:perf_hooks";

import type { ProjectRegistryItem } from "./project-registry";
import { buildProjectPortfolioProjection } from "./project-portfolio";
import {
  buildQualityEvidenceGraph,
  type QualityEvidenceGraphInput
} from "./quality-evidence-graph";

export interface CapacityBudget {
  readonly id: string;
  readonly metric: string;
  readonly maximum: number;
  readonly unit: "records" | "edges" | "milliseconds";
  readonly rationale: string;
}

export interface CapacityMeasurement {
  readonly budgetId: string;
  readonly measured: number;
  readonly maximum: number;
  readonly unit: CapacityBudget["unit"];
  readonly pass: boolean;
}

export interface PerformanceCapacityProof {
  readonly kind: "performance-capacity-proof";
  readonly sourceRevision: string;
  readonly measurements: readonly CapacityMeasurement[];
  readonly blockers: readonly string[];
  readonly productionReleaseAuthority: false;
  readonly canonicalMutationAllowed: false;
  readonly boundaryNote: string;
}

export const blueprintOsCapacityBudgetsV1: readonly CapacityBudget[] = Object.freeze([
  Object.freeze({
    id: "portfolio-project-count",
    metric: "authority-filtered portfolio projects",
    maximum: 500,
    unit: "records",
    rationale: "Portfolio remains a metadata projection; 500 readable projects is the Phase 9 proof target."
  }),
  Object.freeze({
    id: "evidence-graph-node-count",
    metric: "quality evidence graph nodes",
    maximum: 4000,
    unit: "records",
    rationale: "Large provenance graphs must stay bounded before a dedicated graph database or pagination contract is justified."
  }),
  Object.freeze({
    id: "evidence-graph-edge-count",
    metric: "quality evidence graph edges",
    maximum: 8000,
    unit: "edges",
    rationale: "Edge expansion is bounded to avoid accidental unbounded in-memory projection."
  }),
  Object.freeze({
    id: "portfolio-projection-cpu",
    metric: "synthetic 500-project portfolio projection CPU",
    maximum: 250,
    unit: "milliseconds",
    rationale: "A broad CI-safe CPU ceiling catches algorithmic regressions without pretending to be a network latency SLO."
  }),
  Object.freeze({
    id: "evidence-graph-projection-cpu",
    metric: "synthetic 1000-work-package evidence graph projection CPU",
    maximum: 500,
    unit: "milliseconds",
    rationale: "A broad deterministic CPU budget catches severe graph-construction regressions in CI."
  })
]);

function budget(id: string): CapacityBudget {
  const found = blueprintOsCapacityBudgetsV1.find((item) => item.id === id);
  if (!found) throw new TypeError(`Unknown capacity budget ${id}`);
  return found;
}

function measurement(
  id: string,
  measured: number
): CapacityMeasurement {
  const target = budget(id);
  return Object.freeze({
    budgetId: id,
    measured,
    maximum: target.maximum,
    unit: target.unit,
    pass: measured <= target.maximum
  });
}

export function evaluateCapacityProof(input: {
  readonly sourceRevision: string;
  readonly portfolioItems: readonly ProjectRegistryItem[];
  readonly evidenceGraph: QualityEvidenceGraphInput;
}): PerformanceCapacityProof {
  const sourceRevision = input.sourceRevision.trim();
  if (!sourceRevision) throw new TypeError("Capacity proof source revision is required");

  const portfolioStart = performance.now();
  const portfolio = buildProjectPortfolioProjection(input.portfolioItems);
  const portfolioMs = performance.now() - portfolioStart;

  const graphStart = performance.now();
  const graph = buildQualityEvidenceGraph(input.evidenceGraph);
  const graphMs = performance.now() - graphStart;

  const measurements = Object.freeze([
    measurement("portfolio-project-count", portfolio.totalReadableProjects),
    measurement("evidence-graph-node-count", graph.nodes.length),
    measurement("evidence-graph-edge-count", graph.edges.length),
    measurement("portfolio-projection-cpu", portfolioMs),
    measurement("evidence-graph-projection-cpu", graphMs)
  ]);

  const blockers = Object.freeze(
    measurements
      .filter((item) => !item.pass)
      .map(
        (item) =>
          `capacity-budget-exceeded:${item.budgetId}:${item.measured.toFixed(2)}>${item.maximum}`
      )
      .sort()
  );

  return Object.freeze({
    kind: "performance-capacity-proof",
    sourceRevision,
    measurements,
    blockers,
    productionReleaseAuthority: false,
    canonicalMutationAllowed: false,
    boundaryNote:
      "These are deterministic in-process capacity proofs and broad CI CPU budgets, not external latency or Production SLO claims."
  });
}
