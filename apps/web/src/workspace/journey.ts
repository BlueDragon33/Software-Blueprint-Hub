export const workspaceStages = [
  "project",
  "blueprint",
  "work",
  "gate",
  "prompt"
] as const;

export type WorkspaceStage = (typeof workspaceStages)[number];

export interface WorkspaceStageState {
  readonly id: WorkspaceStage;
  readonly label: string;
  readonly status: "complete" | "current" | "upcoming";
}

const stageLabels: Readonly<Record<WorkspaceStage, string>> = {
  project: "Project",
  blueprint: "Blueprint",
  work: "Work Package",
  gate: "Quality Gate",
  prompt: "Execution Prompt"
};

export function workspaceStageState(
  current: WorkspaceStage
): readonly WorkspaceStageState[] {
  const currentIndex = workspaceStages.indexOf(current);

  return workspaceStages.map((id, index) => ({
    id,
    label: stageLabels[id],
    status:
      index < currentIndex
        ? "complete"
        : index === currentIndex
          ? "current"
          : "upcoming"
  }));
}

export function nextWorkspaceStage(current: WorkspaceStage): WorkspaceStage {
  const index = workspaceStages.indexOf(current);
  return workspaceStages[Math.min(index + 1, workspaceStages.length - 1)]!;
}

export function previousWorkspaceStage(current: WorkspaceStage): WorkspaceStage {
  const index = workspaceStages.indexOf(current);
  return workspaceStages[Math.max(index - 1, 0)]!;
}
