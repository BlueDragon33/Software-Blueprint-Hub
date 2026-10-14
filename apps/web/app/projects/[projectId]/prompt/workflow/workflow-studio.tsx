"use client";

import { useMemo, useState } from "react";
import { layoutWorkflowGraph } from "../../../../../../../packages/application/src/prompt-workflow-graph";
import type { WorkflowNode, WorkflowReadinessPlan } from "@blueprint-os/application";

import styles from "./workflow-studio.module.css";

interface WorkflowStudioProps {
  readonly nodes: readonly WorkflowNode[];
  readonly rootNodeIds: readonly string[];
  readonly graphOnly?: boolean;
  readonly readiness?: WorkflowReadinessPlan | null;
  readonly readinessError?: string;
  readonly receiptVerificationConfigured?: boolean;
  readonly preview: Readonly<{
    rootNodeId: string;
    content: string;
    appHead: string;
    canonicalRevision: string;
    sourceRevision: string;
    contentHash: string;
  }> | null;
  readonly previewError: string;
}

function reviewState(
  node: WorkflowNode,
  rootNodeIds: readonly string[],
  readiness: WorkflowReadinessPlan | null,
  graphOnly: boolean
): {
  readonly label: string;
  readonly kind: "candidate" | "blocked" | "human" | "verified";
  readonly reason: string;
} {
  if (node.humanGate || node.stage === "RELEASE") {
    return {
      label: "Human gate",
      kind: "human",
      reason: "Separate human review and authorization are required. No automatic approval exists."
    };
  }
  const current = readiness?.nodes.find((item) => item.id === node.id);
  if (current?.state === "verified") {
    return {
      label: "Evidence verified", kind: "verified",
      reason: current.explanation + " This does not imply canonical Quality Gate PASS."
    };
  }
  if (current?.state === "waiting-evidence") {
    return {
      label: "Evidence required", kind: "blocked",
      reason: current.explanation + " Missing: " + current.missingDependencies.join(", ")
    };
  }
  if (rootNodeIds.includes(node.id) || current?.state === "available") {
    return {
      label: graphOnly ? "Manifest candidate" : "Preview candidate",
      kind: "candidate",
      reason: graphOnly
        ? "Read-only central manifest. The target Project Profile is not authorized in this catalog; no prompt, execution or completion receipt exists."
        : "Read-only prompt preview only. The node has not been executed or accepted."
    };
  }
  return {
    label: "Evidence required",
    kind: "blocked",
    reason: "Dependencies require trusted completion receipts. No completion was inferred."
  };
}

function DetailList({ title, values }: { readonly title: string; readonly values: readonly string[] }) {
  return (
    <section className={styles.detailList}>
      <h4>{title}</h4>
      <ul>{values.map((value, index) => <li key={index}>{value}</li>)}</ul>
    </section>
  );
}

export function WorkflowStudio({ nodes, rootNodeIds, preview, previewError,
  readiness = null, readinessError = "", receiptVerificationConfigured = false,
  graphOnly = false }: WorkflowStudioProps) {
  const [selectedId, setSelectedId] = useState(nodes[0]?.id ?? "");
  const [showPrompt, setShowPrompt] = useState(false);
  const layout = useMemo(() => layoutWorkflowGraph(nodes), [nodes]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const selected = nodeById.get(selectedId) ?? nodes[0];
  if (!selected) return null;
  const selectedState = reviewState(selected, rootNodeIds, readiness, graphOnly);
  const selectedPreview = selected.id === preview?.rootNodeId ? preview : null;

  return (
    <section className={styles.studio} aria-labelledby="workflow-studio-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Visual Workflow Studio</p>
          <h3 id="workflow-studio-heading">Dependency graph</h3>
          <p>Choose a node to inspect its contract. Arrows are dependencies, not completed work.</p>
        </div>
        <div className={styles.legend} aria-label="Node state legend">
          <span><i className={styles.dotCandidate} /> {graphOnly ? "Manifest candidate" : "Preview candidate"}</span>
          <span><i className={styles.dotBlocked} /> Waiting for evidence</span>
          <span><i className={styles.dotHuman} /> Human gate</span>
          <span><i className={styles.dotVerified} /> Signed evidence</span>
        </div>
      </header>

      <p className={styles.reason} role="status">
        {readinessError
          ? "Evidence readiness unavailable: " + readinessError
          : readiness
            ? "Signed receipts verified: " + readiness.acceptedReceipts +
              " · rejected/invalid: " + readiness.rejectedReceipts +
              " · eligible read-only nodes: " + readiness.readyNodeIds.length +
              (receiptVerificationConfigured
                ? " · Trust store configured"
                : " · No trusted signing keys configured")
            : "No trusted readiness snapshot; no completed node is assumed."}
      </p>

      <div className={styles.scroll} tabIndex={0} role="region"
        aria-label="Workflow diagram, horizontally scroll to explore all nodes">
        <div className={styles.canvas} style={{ width: layout.width, height: layout.height }}>
          <svg className={styles.connections} width={layout.width} height={layout.height}
            viewBox={"0 0 " + layout.width + " " + layout.height} aria-hidden="true">
            <defs>
              <marker id="workflow-studio-arrowhead" markerWidth="8" markerHeight="8" refX="7"
                refY="4" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M 0 0 L 8 4 L 0 8 z" className={styles.arrowhead}/>
              </marker>
            </defs>
            {layout.edges.map((edge) => (
              <path key={edge.key} d={edge.path}
                className={edge.to === selected.id || edge.from === selected.id
                  ? styles.connectionActive : styles.connection}
                markerEnd="url(#workflow-studio-arrowhead)" fill="none" />
            ))}
          </svg>
          {layout.positions.map((position) => {
            const node = nodeById.get(position.id)!;
            const state = reviewState(node, rootNodeIds, readiness, graphOnly);
            const isSelected = selected.id === node.id;
            return (
              <button key={node.id} type="button"
                className={[styles.node, isSelected ? styles.selected : "",
                  state.kind === "human" ? styles.nodeHuman : "",
                  state.kind === "candidate" ? styles.nodeCandidate : "",
                  state.kind === "verified" ? styles.nodeVerified : ""].filter(Boolean).join(" ")}
                style={{ left: position.x, top: position.y, width: position.width, height: position.height }}
                onClick={() => { setSelectedId(node.id); setShowPrompt(false); }}
                aria-pressed={isSelected}
                aria-controls="workflow-studio-node-detail"
                aria-label={node.stage + ": " + node.id + "; " + state.label}>
                <span className={styles.nodeHeader}>
                  <span className={styles.nodeStage}>{node.stage}</span>
                  <span className={styles.nodeNumber}>{String(nodes.indexOf(node) + 1).padStart(2, "0")}</span>
                </span>
                <strong className={styles.nodeTitle}>{node.id.replaceAll("-", " ")}</strong>
                <span className={styles.nodeState} data-kind={state.kind}>{state.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.detail} id="workflow-studio-node-detail" aria-live="polite">
        <div className={styles.detailHeading}>
          <div>
            <span className={styles.kicker}>{selected.stage} · {selected.id}</span>
            <h3>{selected.role}</h3>
            <p>{selected.goal}</p>
          </div>
          <span className={styles.detailStatus} data-kind={selectedState.kind}>{selectedState.label}</span>
        </div>
        <p className={styles.reason}>{selectedState.reason}</p>
        <div className={styles.detailGrid}>
          <DetailList title="Required inputs" values={selected.inputs} />
          <DetailList title="Expected outputs" values={selected.outputs} />
          <DetailList title="Acceptance criteria" values={selected.acceptance} />
          <DetailList title="Evidence requirements" values={selected.evidence} />
          <DetailList title="Allowed actions" values={selected.allowedActions} />
          <DetailList title="Forbidden actions" values={selected.forbiddenActions} />
        </div>
        <div className={styles.constraints}>
          <span>Depends on: {selected.dependsOn.join(", ") || "none"}</span>
          <span>Limit: {selected.budget.maxAttempts} attempts · {selected.budget.maxFiles} files · approx. {selected.budget.maxTokenEstimate.toLocaleString()} tokens</span>
          <span>On failure: BLOCK</span>
        </div>
        {rootNodeIds.includes(selected.id) && !graphOnly ? (
          <section className={styles.preview}>
            <div className={styles.previewHeader}>
              <div>
                <h4>Canonical prompt + node projection</h4>
                <p>Read-only candidate; no execution, approval or canonical history mutation.</p>
              </div>
              {selectedPreview ? (
                <button type="button" className={styles.promptToggle}
                  aria-expanded={showPrompt} onClick={() => setShowPrompt((visible) => !visible)}>
                  {showPrompt ? "Hide prompt" : "Inspect prompt"}
                </button>
              ) : null}
            </div>
            {selectedPreview ? (
              <>
                <dl className={styles.provenance}>
                  <div><dt>App HEAD</dt><dd>{selectedPreview.appHead}</dd></div>
                  <div><dt>Canonical</dt><dd>{selectedPreview.canonicalRevision}</dd></div>
                  <div><dt>Composite</dt><dd>{selectedPreview.sourceRevision}</dd></div>
                  <div><dt>Content hash</dt><dd>{selectedPreview.contentHash}</dd></div>
                </dl>
                {showPrompt ? <pre className={styles.promptContent}>{selectedPreview.content}</pre> : null}
              </>
            ) : (
              <p className={styles.error} role="status">
                Preview unavailable: {previewError || "Trusted project state or verified HEAD is missing."}
              </p>
            )}
          </section>
        ) : null}
      </div>
      <p className={styles.footer}>
        {graphOnly
          ? "Central catalog only: authored graph, not a provisioned canonical project, authorized prompt, execution record or Quality Gate PASS."
          : "All nodes are read-only designs. Workflow adoption, evidence verification, human UX acceptance and Production release remain separate trusted gates."}
      </p>
    </section>
  );
}
