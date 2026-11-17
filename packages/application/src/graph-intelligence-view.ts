/** Browser-safe projection helpers; no IO, authority or server imports. */
import type { GraphIntelligenceProjection } from "./graph-intelligence";

export const graphDomains = ["constitution", "projects", "architecture", "security", "data",
  "agents", "workflows", "qa", "evidence", "operations", "human"] as const;
export type GraphDomain = typeof graphDomains[number];
export const graphRelations = ["dependency", "data-flow", "control", "evidence"] as const;
export type GraphRelation = typeof graphRelations[number];

/** Direction is declared once. A change to a dependency/evidence impacts its consumers. */
export const graphEdgeContracts = {
  "depends-on": { relation: "dependency", impact: "reverse" },
  "requires-gate": { relation: "control", impact: "reverse" },
  "supported-by": { relation: "evidence", impact: "reverse" },
  "release-evidence": { relation: "evidence", impact: "reverse" },
  governs: { relation: "control", impact: "forward" },
  constrains: { relation: "control", impact: "forward" },
  feeds: { relation: "data-flow", impact: "forward" },
  scopes: { relation: "control", impact: "none" },
  "requires-approval": { relation: "control", impact: "reverse" },
  "implements-requirement": { relation: "evidence", impact: "reverse" }
} as const satisfies Record<string, { relation: GraphRelation; impact: "forward" | "reverse" | "none" }>;
export type GraphEdgeKind = keyof typeof graphEdgeContracts;

export const GRAPH_LIMITS = Object.freeze({ nodes: 1200, edges: 6000, renderedNodes: 120 });

export interface GraphImpact {
  readonly nodeId: string;
  /** Shortest deterministic explanation path, preserving each edge's actual semantics. */
  readonly path: readonly string[];
}
export function traceGraphImpact(graph: GraphIntelligenceProjection, changedId: string,
  relations: readonly GraphRelation[] = graphRelations): readonly GraphImpact[] {
  if (!graph.nodes.some(x => x.id === changedId)) throw new TypeError("Unknown impact source");
  const outgoing = new Map(graph.nodes.map(n => [n.id, [] as { to: string; edge: string }[]]));
  for (const e of graph.edges) {
    const contract = graphEdgeContracts[e.kind];
    if (!relations.includes(e.relation) || contract.impact === "none") continue;
    const [from, to] = contract.impact === "forward" ? [e.from, e.to] : [e.to, e.from];
    outgoing.get(from)!.push({ to, edge: e.id });
  }
  const paths = new Map<string, readonly string[]>([[changedId, []]]);
  const queue = [changedId];
  for (let i = 0; i < queue.length; i++) for (const next of outgoing.get(queue[i]!)!) {
    if (paths.has(next.to)) continue;
    paths.set(next.to, [...paths.get(queue[i]!)!, next.edge]); queue.push(next.to);
  }
  return queue.slice(1).map(nodeId => ({ nodeId, path: paths.get(nodeId)! }));
}
