import { ProjectWorkspaceFrame, ProjectWorkspaceState } from "../_components/project-workspace";
import { loadGraphIntelligence } from "../../../../src/server/graph-intelligence";
import { GraphIntelligenceStudio } from "./graph-intelligence-studio";
import { UniversalNextActionCandidate } from "../_components/universal-next-action.candidate";

export const dynamic = "force-dynamic";

export default async function EvidenceGraphPage({ params }: {
  readonly params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await loadGraphIntelligence(projectId);
  if (result.state !== "ready") return <ProjectWorkspaceState state={result.state} />;
  return (
    <ProjectWorkspaceFrame profile={result.profile} active="evidence-graph">
      <UniversalNextActionCandidate view={{
        projectId: result.profile.projectId,
        projectName: result.profile.name,
        workPackageId: result.nextAction.workPackageId,
        sourceRevision: result.canonicalSourceRevision,
        checkpointRef: null,
        state: result.nextAction.state,
        verifiedAt: null,
        reason: result.nextAction.reason,
        action: {
          kind: "internal-navigation",
          label: "Mở Prompt Workspace",
          href: "/projects/" + encodeURIComponent(result.profile.projectId) + "/prompt"
        }
      }} />
      <GraphIntelligenceStudio graph={result.graph} />
    </ProjectWorkspaceFrame>
  );
}
