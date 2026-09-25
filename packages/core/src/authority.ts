export const projectRoles = [
  "OWNER",
  "EDITOR",
  "REVIEWER",
  "VIEWER"
] as const;

export type ProjectRole = (typeof projectRoles)[number];

export const authorityActions = [
  "PROJECT_READ",
  "PROJECT_MUTATE",
  "PROJECT_REVIEW",
  "PROJECT_ADMIN",
  "ROLE_MANAGE"
] as const;

export type AuthorityAction = (typeof authorityActions)[number];

export interface AuthenticatedIdentity {
  readonly provider: string;
  readonly providerSubject: string;
  readonly email?: string | null;
}

export interface PrincipalRecord {
  readonly id: string;
  readonly provider: string;
  readonly providerSubject: string;
  readonly email: string | null;
}

export interface AuthenticatedActor {
  readonly principalId: string;
}

export interface ProjectRoleAssignment {
  readonly projectId: string;
  readonly principalId: string;
  readonly role: ProjectRole;
}

export interface AuthorityAuditInput {
  readonly actorPrincipalId: string;
  readonly targetPrincipalId?: string;
  readonly projectId?: string;
  readonly action: string;
  readonly detail?: Readonly<Record<string, unknown>>;
}

export interface AuthorityRepository {
  resolvePrincipal(identity: AuthenticatedIdentity): Promise<PrincipalRecord>;
  bootstrapOwner(identity: AuthenticatedIdentity): Promise<PrincipalRecord>;
  isSystemOwner(principalId: string): Promise<boolean>;
  findProjectRole(
    projectId: string,
    principalId: string
  ): Promise<ProjectRole | null>;
  setProjectRole(
    assignment: ProjectRoleAssignment,
    audit: AuthorityAuditInput
  ): Promise<ProjectRoleAssignment>;
}

export class OwnerBootstrapConflictError extends Error {
  readonly code = "OWNER_BOOTSTRAP_CONFLICT";

  constructor() {
    super("Blueprint OS owner bootstrap has already been completed");
    this.name = "OwnerBootstrapConflictError";
  }
}

export class AuthorizationDeniedError extends Error {
  readonly code = "AUTHORIZATION_DENIED";

  constructor(
    readonly action: AuthorityAction,
    readonly projectId: string
  ) {
    super(`Authorization denied for ${action} on project ${projectId}`);
    this.name = "AuthorizationDeniedError";
  }
}

const roleActions: Readonly<Record<ProjectRole, ReadonlySet<AuthorityAction>>> = {
  OWNER: new Set(authorityActions),
  EDITOR: new Set(["PROJECT_READ", "PROJECT_MUTATE"]),
  REVIEWER: new Set(["PROJECT_READ", "PROJECT_REVIEW"]),
  VIEWER: new Set(["PROJECT_READ"])
};

export class AuthorityService {
  constructor(private readonly repository: AuthorityRepository) {}

  resolveIdentity(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return this.repository.resolvePrincipal(identity);
  }

  bootstrapOwner(identity: AuthenticatedIdentity): Promise<PrincipalRecord> {
    return this.repository.bootstrapOwner(identity);
  }

  async can(
    actor: AuthenticatedActor | null,
    projectId: string,
    action: AuthorityAction
  ): Promise<boolean> {
    if (!actor) {
      return false;
    }

    if (await this.repository.isSystemOwner(actor.principalId)) {
      return true;
    }

    const role = await this.repository.findProjectRole(
      projectId,
      actor.principalId
    );

    return role ? roleActions[role].has(action) : false;
  }

  async require(
    actor: AuthenticatedActor | null,
    projectId: string,
    action: AuthorityAction
  ): Promise<void> {
    if (!(await this.can(actor, projectId, action))) {
      throw new AuthorizationDeniedError(action, projectId);
    }
  }

  async grantProjectRole(
    actor: AuthenticatedActor | null,
    assignment: ProjectRoleAssignment
  ): Promise<ProjectRoleAssignment> {
    await this.require(actor, assignment.projectId, "ROLE_MANAGE");

    return this.repository.setProjectRole(assignment, {
      actorPrincipalId: actor!.principalId,
      targetPrincipalId: assignment.principalId,
      projectId: assignment.projectId,
      action: "PROJECT_ROLE_SET",
      detail: { role: assignment.role }
    });
  }
}
