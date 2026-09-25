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
      active="releases-lessons"
    >
      <NotAvailableYet
        title="Releases & Lessons"
        phase="P6-006"
        description="Exact release revisions, rollback notes and Lessons Learned become canonical in P6-006. This route is intentionally stable now but does not fabricate release history."
      />
    </ProjectWorkspaceFrame>
  );
}
