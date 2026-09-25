import type { ProjectProfile } from "@blueprint-os/contracts";

export class RecordVersionConflictError extends Error {
  readonly code = "RECORD_VERSION_CONFLICT";

  constructor(
    readonly projectId: string,
    readonly expectedRecordVersion: number
  ) {
    super(
      `Project ${projectId} is not at expected record version ${expectedRecordVersion}`
    );
    this.name = "RecordVersionConflictError";
  }
}

export interface ProjectProfileRepository {
  createProjectWithProfile(profile: ProjectProfile): Promise<ProjectProfile>;
  findProfileByProjectId(projectId: string): Promise<ProjectProfile | null>;
  updateProfile(
    profile: ProjectProfile,
    expectedRecordVersion: number
  ): Promise<ProjectProfile>;
}
