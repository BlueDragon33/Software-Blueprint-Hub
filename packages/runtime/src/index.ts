import {
  foundationBlueprintTemplatesV1,
  GovernanceApplicationService,
  ProjectProfileApplicationService,
  ProjectReadinessApplicationService,
  ProjectRegistryApplicationService,
  PromptProjectionApplicationService,
  StaticTemplateCatalog,
  WorkQualityApplicationService
} from "@blueprint-os/application";
import { AuthorityService } from "@blueprint-os/core";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresGovernanceRepository,
  PostgresProjectProfileRepository,
  PostgresWorkQualityRepository,
  type BlueprintPrismaClient
} from "@blueprint-os/persistence";

export interface BlueprintServerRuntime {
  readonly prisma: BlueprintPrismaClient;
  readonly authority: AuthorityService;
  readonly profiles: ProjectProfileApplicationService;
  readonly registry: ProjectRegistryApplicationService;
  readonly readiness: ProjectReadinessApplicationService;
  readonly governance: GovernanceApplicationService;
  readonly workQuality: WorkQualityApplicationService;
  readonly prompts: PromptProjectionApplicationService;
}

export function createBlueprintServerRuntime(
  connectionString: string
): BlueprintServerRuntime {
  if (!connectionString.trim()) {
    throw new Error("DATABASE_URL is required to create Blueprint server runtime");
  }

  const prisma = createPrismaClient(connectionString);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const profileRepository = new PostgresProjectProfileRepository(prisma);
  const workRepository = new PostgresWorkQualityRepository(prisma);
  const governanceRepository = new PostgresGovernanceRepository(prisma);
  const templates = new StaticTemplateCatalog(foundationBlueprintTemplatesV1);
  const profiles = new ProjectProfileApplicationService(
    profileRepository,
    authority,
    templates
  );
  const registry = new ProjectRegistryApplicationService(
    profileRepository,
    authority
  );
  const readiness = new ProjectReadinessApplicationService(
    workRepository,
    authority
  );
  const workQuality = new WorkQualityApplicationService(
    workRepository,
    authority
  );
  const governance = new GovernanceApplicationService(
    governanceRepository,
    workRepository,
    authority
  );
  const prompts = new PromptProjectionApplicationService(
    authority,
    profiles,
    workRepository
  );

  return Object.freeze({
    prisma,
    authority,
    profiles,
    registry,
    readiness,
    governance,
    workQuality,
    prompts
  });
}

export async function closeBlueprintServerRuntime(
  runtime: BlueprintServerRuntime
): Promise<void> {
  await runtime.prisma.$disconnect();
}
