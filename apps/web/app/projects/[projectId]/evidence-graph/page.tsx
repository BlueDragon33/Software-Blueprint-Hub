import { ProjectWorkspaceFrame, ProjectWorkspaceState } from "../_components/project-workspace";
import { loadGraphIntelligence } from "../../../../src/server/graph-intelligence";
import { GraphIntelligenceStudio } from "./graph-intelligence-studio";

export const dynamic = "force-dynamic";

export default async function EvidenceGraphPage({ params }: {
  readonly params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await loadGraphIntelligence(projectId);
  if (result.state !== "ready") return <ProjectWorkspaceState state={result.state} />;
  return (
    <ProjectWorkspaceFrame profile={result.profile} active="evidence-graph">
      <GraphIntelligenceStudio graph={result.graph} />
    </ProjectWorkspaceFrame>
  );
}
