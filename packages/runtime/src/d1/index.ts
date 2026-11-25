// Candidate composition only. Existing web runtime must not select this
// provider until actual D1 gate and migration admission. No implicit fallback.
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
import { GitHubConstitutionPublicationVerifier } from "../constitution-publication";
import { publicationRuntimeRevision } from "../publication-runtime-revision";
import { AuthorityService } from "@blueprint-os/core";
import type { SsoIdentityStore } from "../sso-identity-store";
import { D1WorkflowExecutionJournal } from "./workflow-execution-journal";
import { D1WorkflowInspectionQaJournal } from "./workflow-inspection-qa-journal";
import { createD1AuthorityRepository,createD1ConstitutionAuthorityRepository,D1DomainStore,D1LogStore,D1SsoStore,D1ProjectProfileRepository,D1WorkQualityRepository,D1GovernanceRepository,D1ReleaseRepository,D1PromptProjectionHistoryRepository,D1HumanProfessionalReviewDecisionRepository,D1WorkflowExecutionAuthorityRepository,type D1CanonicalBinding } from "@blueprint-os/persistence/d1";
export function createD1BlueprintServerRuntime(db:D1CanonicalBinding,publicationTokenProvider?:()=>Promise<string|null>) {
  if(!db||typeof db.prepare!=="function"||typeof db.batch!=="function")throw new Error("Canonical D1 binding required");
  const domain=new D1DomainStore(db), logs=new D1LogStore(db);
  const authorityRepository=createD1AuthorityRepository(db);
  const authority = new AuthorityService(authorityRepository);
  const constitutionAuthorityRepository =
    createD1ConstitutionAuthorityRepository(db);
  const runtimeRevision = publicationRuntimeRevision(process.env.BLUEPRINT_LOCAL_RUNTIME_REVISION, process.env.VERCEL_GIT_COMMIT_SHA);
  const constitutionAuthority = new ConstitutionAuthorityApplicationService(
    constitutionAuthorityRepository,
    authority,
    new GitHubConstitutionPublicationVerifier({
      runtimePolicyVersion: CONSTITUTION_POLICY_VERSION,
      ...(publicationTokenProvider ? { tokenProvider: publicationTokenProvider } : {}),
      ...(runtimeRevision ? { runtimeRevision } : {}),
      ...(process.env.CONSTITUTION_GITHUB_READ_TOKEN ? { token: process.env.CONSTITUTION_GITHUB_READ_TOKEN } : {})
    })
  );
  const profileRepository = new D1ProjectProfileRepository(domain);
  const workRepository = new D1WorkQualityRepository(domain);
  const governanceRepository = new D1GovernanceRepository(domain);
  const releaseRepository = new D1ReleaseRepository(domain);
  const promptHistoryRepository =
    new D1PromptProjectionHistoryRepository(domain);
  const professionalReviewRepository =
    new D1HumanProfessionalReviewDecisionRepository(logs);
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
  const workflowExecutionJournal = new D1WorkflowExecutionJournal(logs);
  const workflowExecutionAuthority = new D1WorkflowExecutionAuthorityRepository(logs);

  const sso:SsoIdentityStore = new D1SsoStore(db);
  return Object.freeze({
    sso,
    resolveLinkedAppManagementPrincipal: (subject:string,principalId:string) => logs.linkedPrincipal('application-management',subject,principalId),
    workflowInspectionQaJournal: new D1WorkflowInspectionQaJournal(logs),
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
    workflowExecutionJournal,
    workflowExecutionAuthority
  });
}

export type D1BlueprintServerRuntime=ReturnType<typeof createD1BlueprintServerRuntime>;
