import {
  foundationBlueprintTemplatesV1,
  GovernanceApplicationService,
  KnowledgeLibraryApplicationService,
  ProjectProfileApplicationService,
  ProjectReadinessApplicationService,
  ProjectRegistryApplicationService,
  PromptProjectionApplicationService,
  ReleaseLessonsApplicationService,
  StaticTemplateCatalog,
  WorkQualityApplicationService
} from "@blueprint-os/application";
import { AuthorityService } from "@blueprint-os/core";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresGovernanceRepository,
  PostgresProjectProfileRepository,
  PostgresPromptProjectionHistoryRepository,
  PostgresReleaseRepository,
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
  readonly knowledge: KnowledgeLibraryApplicationService;
  readonly releases: ReleaseLessonsApplicationService;
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
  const releaseRepository = new PostgresReleaseRepository(prisma);
  const promptHistoryRepository =
    new PostgresPromptProjectionHistoryRepository(prisma);
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
  const knowledge = new KnowledgeLibraryApplicationService();
  const releases = new ReleaseLessonsApplicationService(
    releaseRepository,
    workRepository,
    authority
  );
  const prompts = new PromptProjectionApplicationService(
    authority,
    profiles,
    workRepository,
    undefined,
    promptHistoryRepository
  );

  return Object.freeze({
    prisma,
    authority,
    profiles,
    registry,
    readiness,
    governance,
    knowledge,
    releases,
    workQuality,
    prompts
  });
}

export async function closeBlueprintServerRuntime(
  runtime: BlueprintServerRuntime
): Promise<void> {
  await runtime.prisma.$disconnect();
}
