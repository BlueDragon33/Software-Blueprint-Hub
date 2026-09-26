import {
  NotAvailableYet,
  ProjectWorkspaceFrame,
  ProjectWorkspaceState
} from "../_components/project-workspace";
import { loadProjectWorkspace } from "../../../../src/server/project-workspace";

export const dynamic = "force-dynamic";

interface PageProps {
  readonly params: Promise<{ projectId: string }>;
}

export default async function Page({ params }: PageProps) {
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
        description="Release records, exact revision evidence, rollback notes and Lessons Learned will be introduced as canonical state in P6-006."
      />
    </ProjectWorkspaceFrame>
  );
}
