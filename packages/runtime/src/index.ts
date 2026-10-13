import {
  ConstitutionAuthorityApplicationService,
  CONSTITUTION_POLICY_VERSION,
  ConstitutionLockedTemplateCatalog,
  foundationBlueprintTemplatesV1,
  GovernanceApplicationService,
  HumanProfessionalReviewApplicationService,
  KnowledgeLibraryApplicationService,
  ProjectProfileApplicationService,
  ProjectReadinessApplicationService,
  ProjectRegistryApplicationService,
  PromptProjectionApplicationService,
  ReleaseLessonsApplicationService,
  StaticTemplateCatalog,
  universalConstitutionTemplateV1,
  WorkQualityApplicationService
} from "@blueprint-os/application";
import { GitHubConstitutionPublicationVerifier } from "./constitution-publication";
import { PostgresWorkflowExecutionJournal } from "./workflow-execution-journal";
export { PostgresWorkflowExecutionJournal } from "./workflow-execution-journal";
export { ScopedGitHubReadExecutor } from "./workflow-scoped-github-executor";
import { AuthorityService } from "@blueprint-os/core";
import {
  createPrismaClient,
  PostgresAuthorityRepository,
  PostgresConstitutionAuthorityRepository,
  PostgresGovernanceRepository,
  PostgresHumanProfessionalReviewDecisionRepository,
  PostgresProjectProfileRepository,
  PostgresPromptProjectionHistoryRepository,
  PostgresReleaseRepository,
  PostgresWorkQualityRepository,
  type BlueprintPrismaClient
} from "@blueprint-os/persistence";

export interface BlueprintServerRuntime {
  readonly prisma: BlueprintPrismaClient;
  readonly authority: AuthorityService;
  readonly constitutionAuthority: ConstitutionAuthorityApplicationService;
  readonly profiles: ProjectProfileApplicationService;
  readonly registry: ProjectRegistryApplicationService;
  readonly readiness: ProjectReadinessApplicationService;
  readonly governance: GovernanceApplicationService;
  readonly knowledge: KnowledgeLibraryApplicationService;
  readonly releases: ReleaseLessonsApplicationService;
  readonly workQuality: WorkQualityApplicationService;
  readonly prompts: PromptProjectionApplicationService;
  readonly professionalReview: HumanProfessionalReviewApplicationService;
  /** Dormant until a separately authorized executor is integrated. */
  readonly workflowExecutionJournal: PostgresWorkflowExecutionJournal;
}

export function createBlueprintServerRuntime(
  connectionString: string,
  publicationTokenProvider?: () => Promise<string | null>
): BlueprintServerRuntime {
  if (!connectionString.trim()) {
    throw new Error("DATABASE_URL is required to create Blueprint server runtime");
  }

  const prisma = createPrismaClient(connectionString);
  const authorityRepository = new PostgresAuthorityRepository(prisma);
  const authority = new AuthorityService(authorityRepository);
  const constitutionAuthorityRepository =
    new PostgresConstitutionAuthorityRepository(prisma);
  const constitutionAuthority = new ConstitutionAuthorityApplicationService(
    constitutionAuthorityRepository,
    authority,
    new GitHubConstitutionPublicationVerifier({
      runtimePolicyVersion: CONSTITUTION_POLICY_VERSION,
      ...(publicationTokenProvider ? { tokenProvider: publicationTokenProvider } : {}),
      ...(process.env.VERCEL_GIT_COMMIT_SHA ? { runtimeRevision: process.env.VERCEL_GIT_COMMIT_SHA } : {}),
      ...(process.env.CONSTITUTION_GITHUB_READ_TOKEN ? { token: process.env.CONSTITUTION_GITHUB_READ_TOKEN } : {})
    })
  );
  const profileRepository = new PostgresProjectProfileRepository(prisma);
  const workRepository = new PostgresWorkQualityRepository(prisma);
  const governanceRepository = new PostgresGovernanceRepository(prisma);
  const releaseRepository = new PostgresReleaseRepository(prisma);
  const promptHistoryRepository =
    new PostgresPromptProjectionHistoryRepository(prisma);
  const professionalReviewRepository =
    new PostgresHumanProfessionalReviewDecisionRepository(prisma);
  const templates = new ConstitutionLockedTemplateCatalog(
    new StaticTemplateCatalog(foundationBlueprintTemplatesV1),
    universalConstitutionTemplateV1
  );
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
  const professionalReview = new HumanProfessionalReviewApplicationService(
    professionalReviewRepository,
    authority
  );
  const workflowExecutionJournal = new PostgresWorkflowExecutionJournal(prisma);

  return Object.freeze({
    prisma,
    authority,
    constitutionAuthority,
    profiles,
    registry,
    readiness,
    governance,
    knowledge,
    releases,
    workQuality,
    prompts,
    professionalReview,
    workflowExecutionJournal
  });
}

export async function closeBlueprintServerRuntime(
  runtime: BlueprintServerRuntime
): Promise<void> {
  await runtime.prisma.$disconnect();
}
