import type { ProjectProfile } from "@blueprint-os/contracts";
import {
  AuthorityService,
  type AuthenticatedActor,
  type ProjectProfileRepository,
  type ProjectRole
} from "@blueprint-os/core";

export type ProjectRegistryAccess = "SYSTEM_OWNER" | ProjectRole;

export interface ProjectRegistryItem {
  readonly projectId: string;
  readonly profileId: string;
  readonly name: string;
  readonly projectType: string;
  readonly blueprintLevel: ProjectProfile["blueprintLevel"];
  readonly recordVersion: number;
  readonly updatedAt: string;
  readonly access: ProjectRegistryAccess;
}

export class ProjectRegistryApplicationService {
  constructor(
    private readonly profiles: ProjectProfileRepository,
    private readonly authority: AuthorityService
  ) {}

  async list(
    actor: AuthenticatedActor | null
  ): Promise<readonly ProjectRegistryItem[]> {
    const scope = await this.authority.readableProjectScope(actor);

    const roleByProject = new Map<string, ProjectRole>();
    const profiles =
      scope.kind === "all"
        ? await this.profiles.listProfiles()
        : await this.profiles.listProfilesByProjectIds(
            scope.assignments.map((assignment) => {
              roleByProject.set(assignment.projectId, assignment.role);
              return assignment.projectId;
            })
          );

    return Object.freeze(
      [...profiles]
        .sort(
          (a, b) =>
            b.meta.updatedAt.localeCompare(a.meta.updatedAt) ||
            a.projectId.localeCompare(b.projectId)
        )
        .map((profile) =>
          Object.freeze({
            projectId: profile.projectId,
            profileId: profile.id,
            name: profile.name,
            projectType: profile.projectType,
            blueprintLevel: profile.blueprintLevel,
            recordVersion: profile.meta.recordVersion,
            updatedAt: profile.meta.updatedAt,
            access:
              scope.kind === "all"
                ? "SYSTEM_OWNER"
                : (roleByProject.get(profile.projectId) ?? "VIEWER")
          })
        )
    );
  }
}
