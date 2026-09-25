import { randomUUID } from "node:crypto";

import {
  OwnerBootstrapConflictError,
  type AuthenticatedIdentity,
  type AuthorityAuditInput,
  type AuthorityRepository,
  type PrincipalRecord,
  type ProjectRole,
  type ProjectRoleAssignment
} from "@blueprint-os/core";

import type { BlueprintPrismaClient } from "./client";
import { Prisma } from "./generated/prisma/client";

const SYSTEM_BOOTSTRAP_ID = "system";

function asPrincipal(row: {
  id: string;
  provider: string;
  providerSubject: string;
  email: string | null;
}): PrincipalRecord {
  return Object.freeze({
    id: row.id,
    provider: row.provider,
    providerSubject: row.providerSubject,
    email: row.email
  });
}

function validateIdentity(identity: AuthenticatedIdentity): void {
  if (!identity.provider.trim() || !identity.providerSubject.trim()) {
    throw new TypeError("Authenticated identity requires provider and providerSubject");
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export class PostgresAuthorityRepository implements AuthorityRepository {
  constructor(private readonly prisma: BlueprintPrismaClient) {}

  async resolvePrincipal(
    identity: AuthenticatedIdentity
  ): Promise<PrincipalRecord> {
    validateIdentity(identity);

    const row = await this.prisma.principal.upsert({
      where: {
        provider_providerSubject: {
          provider: identity.provider,
          providerSubject: identity.providerSubject
        }
      },
      create: {
        id: `principal:${randomUUID()}`,
        provider: identity.provider,
        providerSubject: identity.providerSubject,
        email: identity.email ?? null
      },
      update: {
        email: identity.email ?? null
      }
    });

    return asPrincipal(row);
  }

  async bootstrapOwner(
    identity: AuthenticatedIdentity
  ): Promise<PrincipalRecord> {
    validateIdentity(identity);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.systemBootstrap.findUnique({
          where: { id: SYSTEM_BOOTSTRAP_ID }
        });

        if (existing) {
          throw new OwnerBootstrapConflictError();
        }

        const principal = await tx.principal.upsert({
          where: {
            provider_providerSubject: {
              provider: identity.provider,
              providerSubject: identity.providerSubject
            }
          },
          create: {
            id: `principal:${randomUUID()}`,
            provider: identity.provider,
            providerSubject: identity.providerSubject,
            email: identity.email ?? null
          },
          update: {
            email: identity.email ?? null
          }
        });

        await tx.systemBootstrap.create({
          data: {
            id: SYSTEM_BOOTSTRAP_ID,
            ownerPrincipalId: principal.id
          }
        });

        await tx.authorityAuditEvent.create({
          data: {
            id: `audit:${randomUUID()}`,
            actorPrincipalId: principal.id,
            targetPrincipalId: principal.id,
            action: "SYSTEM_OWNER_BOOTSTRAPPED",
            detail: { provider: principal.provider }
          }
        });

        return asPrincipal(principal);
      });
    } catch (error) {
      if (
        error instanceof OwnerBootstrapConflictError ||
        isUniqueConstraintError(error)
      ) {
        throw new OwnerBootstrapConflictError();
      }
      throw error;
    }
  }

  async isSystemOwner(principalId: string): Promise<boolean> {
    const row = await this.prisma.systemBootstrap.findUnique({
      where: { id: SYSTEM_BOOTSTRAP_ID },
      select: { ownerPrincipalId: true }
    });

    return row?.ownerPrincipalId === principalId;
  }

  async findProjectRole(
    projectId: string,
    principalId: string
  ): Promise<ProjectRole | null> {
    const row = await this.prisma.projectAuthority.findUnique({
      where: {
        projectId_principalId: {
          projectId,
          principalId
        }
      },
      select: { role: true }
    });

    return row?.role ? (row.role as ProjectRole) : null;
  }

  async listProjectRolesForPrincipal(
    principalId: string
  ): Promise<readonly ProjectRoleAssignment[]> {
    const rows = await this.prisma.projectAuthority.findMany({
      where: { principalId },
      orderBy: [{ projectId: "asc" }, { role: "asc" }],
      select: {
        projectId: true,
        principalId: true,
        role: true
      }
    });

    return Object.freeze(
      rows.map((row) =>
        Object.freeze({
          projectId: row.projectId,
          principalId: row.principalId,
          role: row.role as ProjectRole
        })
      )
    );
  }

  async setProjectRole(
    assignment: ProjectRoleAssignment,
    audit: AuthorityAuditInput
  ): Promise<ProjectRoleAssignment> {
    await this.prisma.$transaction(async (tx) => {
      await tx.projectAuthority.upsert({
        where: {
          projectId_principalId: {
            projectId: assignment.projectId,
            principalId: assignment.principalId
          }
        },
        create: {
          projectId: assignment.projectId,
          principalId: assignment.principalId,
          role: assignment.role
        },
        update: {
          role: assignment.role
        }
      });

      await tx.authorityAuditEvent.create({
        data: {
          id: `audit:${randomUUID()}`,
          actorPrincipalId: audit.actorPrincipalId,
          targetPrincipalId: audit.targetPrincipalId ?? null,
          projectId: audit.projectId ?? null,
          action: audit.action,
          detail: audit.detail
            ? (JSON.parse(JSON.stringify(audit.detail)) as Prisma.InputJsonValue)
            : Prisma.JsonNull
        }
      });
    });

    return Object.freeze({ ...assignment });
  }
}
