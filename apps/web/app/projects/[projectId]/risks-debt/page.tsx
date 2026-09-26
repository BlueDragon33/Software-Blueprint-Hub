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
      active="risks-debt"
    >
      <NotAvailableYet
        title="Risks & Technical Debt"
        phase="P6-004"
        description="Risks and technical debt are reserved for the canonical P6-004 module and are not inferred from unrelated project state."
      />
    </ProjectWorkspaceFrame>
  );
}
