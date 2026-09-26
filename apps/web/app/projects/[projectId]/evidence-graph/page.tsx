import {
  buildQualityEvidenceGraph,
  type QualityEvidenceGraphNode
} from "@blueprint-os/application";

import {
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface EvidenceGraphPageProps {
  readonly params: Promise<{ projectId: string }>;
}

const kindLabel: Readonly<Record<QualityEvidenceGraphNode["kind"], string>> = {
  "work-package": "Work Package",
  "quality-gate": "Quality Gate",
  "gate-evidence": "Gate Evidence",
  release: "Release"
};

function nodeClass(kind: QualityEvidenceGraphNode["kind"]): string {
  return "evidence-graph-node evidence-graph-node-" + kind;
}

export default async function EvidenceGraphPage({
  params
}: EvidenceGraphPageProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  const [workPackages, gateModels, releases] = await Promise.all([
    workspace.runtime.workQuality.listWorkPackages(
      workspace.actor,
      workspace.projectId
    ),
    workspace.runtime.workQuality.listQualityGates(
      workspace.actor,
      workspace.projectId
    ),
    workspace.runtime.releases.listReleases(
      workspace.actor,
      workspace.projectId
    )
  ]);

  const graph = buildQualityEvidenceGraph({
    projectId: workspace.projectId,
    workPackages,
    qualityGates: gateModels.map((item) => item.gate),
    evidence: gateModels.flatMap((item) => item.evidence),
    releases
  });

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="evidence-graph"
    >
      <section className="workspace-view-heading">
        <div>
          <p className="section-kicker">Quality provenance</p>
          <h2>Work → Gate → Evidence → Release</h2>
          <p>
            An explainable read-only projection of canonical links. The graph
            does not calculate readiness, promote a gate to PASS or authorize a release.
          </p>
        </div>
        <span className="status-chip status-chip-info">Projection only</span>
      </section>

      <section className="workspace-fact-grid" aria-label="Evidence graph summary">
        <article className="workspace-fact">
          <span>Work Packages</span>
          <strong>{graph.summary.workPackages}</strong>
          <small>Canonical project work</small>
        </article>
        <article className="workspace-fact">
          <span>Quality Gates</span>
          <strong>{graph.summary.qualityGates}</strong>
          <small>Status is shown, never inferred</small>
        </article>
        <article className="workspace-fact">
          <span>Evidence</span>
          <strong>{graph.summary.evidenceRecords}</strong>
          <small>Exact source + revision preserved</small>
        </article>
        <article className="workspace-fact">
          <span>Graph links</span>
          <strong>{graph.summary.edges}</strong>
          <small>Validated provenance relationships</small>
        </article>
      </section>

      <section className="evidence-graph-boundary">
        <strong>Authority boundary</strong>
        <p>{graph.boundaryNote}</p>
      </section>

      <section className="workspace-section" aria-labelledby="graph-nodes-title">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Canonical records</p>
            <h3 id="graph-nodes-title">Evidence graph nodes</h3>
          </div>
        </div>

        <div className="evidence-graph-nodes">
          {graph.nodes.map((node) => (
            <article className={nodeClass(node.kind)} key={node.id}>
              <div className="evidence-graph-node-heading">
                <span>{kindLabel[node.kind]}</span>
                {node.status ? (
                  <span className="status-chip status-chip-neutral">{node.status}</span>
                ) : null}
              </div>
              <strong>{node.label}</strong>
              <code>{node.id}</code>
              {node.revision ? (
                <dl>
                  <div>
                    <dt>Revision</dt>
                    <dd>{node.revision}</dd>
                  </div>
                  <div>
                    <dt>Source</dt>
                    <dd>{node.source ?? "—"}</dd>
                  </div>
                </dl>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-section" aria-labelledby="graph-edges-title">
        <div className="workspace-section-heading">
          <div>
            <p className="section-kicker">Explainable relationships</p>
            <h3 id="graph-edges-title">Provenance edges</h3>
          </div>
        </div>

        {graph.edges.length ? (
          <div className="evidence-graph-edges">
            {graph.edges.map((edge) => (
              <article key={edge.kind + ":" + edge.from + ":" + edge.to}>
                <span className="status-chip status-chip-neutral">{edge.kind}</span>
                <div>
                  <code>{edge.from}</code>
                  <span aria-hidden="true">→</span>
                  <code>{edge.to}</code>
                </div>
                <p>{edge.explanation}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="workspace-empty-inline">
            No canonical provenance relationships exist for this project yet.
          </div>
        )}
      </section>
    </ProjectWorkspaceFrame>
  );
}
