/**
 * Deterministic graph layout for read-only Prompt Workflow Studio.
 *
 * A manifest is a DAG contract, not workflow execution evidence. Layout never
 * assigns completion, gate PASS, ownership or release authority.
 */
export interface WorkflowGraphInputNode {
  readonly id: string;
  readonly dependsOn: readonly string[];
}

export interface WorkflowGraphPosition {
  readonly id: string;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface WorkflowGraphEdge {
  readonly key: string;
  readonly from: string;
  readonly to: string;
  readonly path: string;
}

export interface WorkflowGraphLayout {
  readonly width: number;
  readonly height: number;
  readonly positions: readonly WorkflowGraphPosition[];
  readonly edges: readonly WorkflowGraphEdge[];
}

const CARD_WIDTH = 216;
const CARD_HEIGHT = 114;
const GAP_X = 78;
const GAP_Y = 52;
const PADDING = 30;

export function layoutWorkflowGraph(
  nodes: readonly WorkflowGraphInputNode[]
): WorkflowGraphLayout {
  if (!nodes.length || nodes.length > 60) {
    throw new TypeError("Workflow graph must contain 1 to 60 nodes");
  }

  const byId = new Map<string, WorkflowGraphInputNode>();
  const indexes = new Map<string, number>();
  for (const [i, node] of nodes.entries()) {
    if (!node.id || byId.has(node.id) || !Array.isArray(node.dependsOn)) {
      throw new TypeError("Duplicate/invalid workflow graph node");
    }
    byId.set(node.id, node);
    indexes.set(node.id, i);
  }

  const depths = new Map<string, number>();
  const visiting = new Set<string>();
  function depthOf(id: string): number {
    const previous = depths.get(id);
    if (previous !== undefined) return previous;
    if (visiting.has(id)) throw new TypeError("Workflow dependency cycle");
    const node = byId.get(id);
    if (!node) throw new TypeError("Unknown workflow dependency " + id);
    visiting.add(id);
    let depth = 0;
    for (const dependency of node.dependsOn) {
      if (!byId.has(dependency)) {
        throw new TypeError("Unknown workflow dependency " + dependency);
      }
      depth = Math.max(depth, depthOf(dependency) + 1);
    }
    visiting.delete(id);
    depths.set(id, depth);
    return depth;
  }
  for (const node of nodes) depthOf(node.id);

  const lastDepth = Math.max(...depths.values());
  const columns: string[][] = Array.from({ length: lastDepth + 1 }, () => []);
  for (const node of nodes) columns[depths.get(node.id)!]!.push(node.id);

  // Preserve authored ordering, but group siblings by average parent order
  // to reduce crossing when workflows branch and converge.
  for (const column of columns) {
    column.sort((a, b) => {
      const position = (id: string) => {
        const dependencies = byId.get(id)!.dependsOn;
        return dependencies.length
          ? dependencies.reduce((sum, p) => sum + (indexes.get(p) ?? 0), 0) / dependencies.length
          : (indexes.get(id) ?? 0);
      };
      return position(a) - position(b) || indexes.get(a)! - indexes.get(b)!;
    });
  }

  const maxRows = Math.max(...columns.map((column) => column.length));
  const width = PADDING * 2 + (lastDepth + 1) * CARD_WIDTH + lastDepth * GAP_X;
  const height = PADDING * 2 + maxRows * CARD_HEIGHT + (maxRows - 1) * GAP_Y;

  const positions: WorkflowGraphPosition[] = [];
  const positionsById = new Map<string, WorkflowGraphPosition>();
  columns.forEach((column, depth) => {
    const columnHeight = column.length * CARD_HEIGHT + (column.length - 1) * GAP_Y;
    const start = PADDING + (height - PADDING * 2 - columnHeight) / 2;
    column.forEach((id, row) => {
      const item: WorkflowGraphPosition = Object.freeze({
        id, depth,
        x: PADDING + depth * (CARD_WIDTH + GAP_X),
        y: start + row * (CARD_HEIGHT + GAP_Y),
        width: CARD_WIDTH, height: CARD_HEIGHT
      });
      positions.push(item);
      positionsById.set(id, item);
    });
  });

  const edges: WorkflowGraphEdge[] = [];
  for (const node of nodes) {
    const to = positionsById.get(node.id)!;
    for (const dependency of node.dependsOn) {
      const from = positionsById.get(dependency)!;
      const x1 = from.x + CARD_WIDTH;
      const x2 = to.x;
      const y1 = from.y + CARD_HEIGHT / 2;
      const y2 = to.y + CARD_HEIGHT / 2;
      const bend = Math.max(20, (x2 - x1) * 0.45);
      edges.push(Object.freeze({
        key: dependency + "->" + node.id,
        from: dependency, to: node.id,
        path: "M " + x1 + " " + y1 + " C " +
          (x1 + bend) + " " + y1 + ", " +
          (x2 - bend) + " " + y2 + ", " + x2 + " " + y2
      }));
    }
  }

  return Object.freeze({
    width, height,
    positions: Object.freeze(positions),
    edges: Object.freeze(edges)
  });
}
