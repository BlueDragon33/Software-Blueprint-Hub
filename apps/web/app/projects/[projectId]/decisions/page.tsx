import {
  NotAvailableYet,
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface WorkspaceFutureViewProps {
  readonly params: Promise<{ projectId: string }>;
}

export default async function WorkspaceFutureView({
  params
}: WorkspaceFutureViewProps) {
  const { projectId } = await params;
  const workspace = await loadProjectWorkspace(projectId);

  if (workspace.state !== "ready") {
    return <ProjectWorkspaceState state={workspace.state} />;
  }

  return (
    <ProjectWorkspaceFrame
      profile={workspace.project.profile}
      active="decisions"
    >
      <NotAvailableYet
        title="Architecture Decisions"
        phase="P6-004"
        description="ADR becomes canonical product state in P6-004. This view is reserved now so project navigation stays stable without inventing decision records before the canonical module exists."
      />
    </ProjectWorkspaceFrame>
  );
}
