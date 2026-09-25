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
      active="risks-debt"
    >
      <NotAvailableYet
        title="Risks & Technical Debt"
        phase="P6-004"
        description="Risk and TechnicalDebt records become canonical in P6-004. Until then this workspace view remains an explicit unavailable state rather than a local or decorative checklist."
      />
    </ProjectWorkspaceFrame>
  );
}
