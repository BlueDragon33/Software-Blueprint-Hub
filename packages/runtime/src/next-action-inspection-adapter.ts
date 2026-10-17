import {
  preflightUnifiedNextAction,
  workflowManifestDigest,
  type WorkflowExecutionGrant,
  type WorkflowExecutionTrustedDependencies
} from "@blueprint-os/application";
import { explainWorkPackageReadiness, type AuthenticatedActor } from "@blueprint-os/core";
import type { BlueprintServerRuntime } from "./index";
import { PostgresWorkflowExecutionAuthority } from "./workflow-execution-authority";
import { PostgresWorkflowInspectionQaJournal } from "./workflow-inspection-qa-journal";
import {
  executeAndVerifyScopedInspection,
  type WorkflowInspectionDependencies,
  type WorkflowInspectionOutcome
} from "./workflow-inspection-pipeline";

type Manifest = Parameters<typeof executeAndVerifyScopedInspection>[1];
type SourceContext = Parameters<typeof executeAndVerifyScopedInspection>[2];

/**
 * Host-owned dependencies. No browser, request JSON or repository manifest
 * may supply an executor/QA service or execution authority. This internal-only
 * adapter does not install a POST route, scheduler or default runner.
 */
export type TrustedNextActionInspectionServices = Pick<
  WorkflowInspectionDependencies,
  "source" | "trust" | "verifier" | "runner" | "qa" | "freshness" | "clock"
> & {
  /** Mandatory trusted canonical mapping; same project alone is insufficient. */
  readonly binding: {
    assertCurrent(input: Readonly<{
      projectId: string;
      workPackageId: string;
      workflowId: string;
      workflowDigest: string;
      appHead: string;
    }>): Promise<void>;
  };
};

export interface AuthorizedNextActionInspectionInput {
  readonly actor: AuthenticatedActor | null;
  readonly projectId: string;
  readonly displayedProfileVersion: number;
  readonly displayedActionKind: "continue-work";
  readonly workPackageId: string;
  readonly workflow: Manifest;
  readonly context: SourceContext;
  readonly grant: unknown; // must be a separately signed exact-scope grant
}

async function assertCanonicalInspectionEligible(
  runtime: BlueprintServerRuntime,
  input: AuthorizedNextActionInspectionInput
): Promise<void> {
  // This adapter may perform durable journal writes. PROJECT_READ alone is
  // never sufficient; check real PROJECT_MUTATE at every protected boundary.
  await runtime.authority.require(input.actor, input.projectId, "PROJECT_MUTATE");
  const project = await runtime.profiles.read(input.actor, input.projectId);
  if (!project) throw new Error("NEXT_ACTION_BLOCKED: canonical ProjectProfile unavailable");
  const readiness = await runtime.readiness.read(
    input.actor, input.projectId, project.blueprint.requiredGates
  );
  const checked = preflightUnifiedNextAction({
    projectId: input.projectId,
    profileVersion: input.displayedProfileVersion,
    actionKind: input.displayedActionKind
  }, {
    projectId: readiness.projectId,
    profileVersion: project.profile.meta.recordVersion,
    nextAction: readiness.nextAction
  });
  if (checked.state !== "current" || readiness.nextAction.kind !== "continue-work") {
    throw new Error("NEXT_ACTION_BLOCKED: stale or non-executable canonical Next Action");
  }
  if (input.context.projectId !== input.projectId ||
      input.workflow.project.id !== input.projectId ||
      input.context.repository !== input.workflow.project.repo ||
      !/^[a-f0-9]{40}$/.test(input.context.appHead)) {
    throw new Error("NEXT_ACTION_BLOCKED: workflow project/repository/HEAD binding mismatch");
  }
  const works = await runtime.workQuality.listWorkPackages(input.actor, input.projectId);
  const work = works.find(item => item.id === input.workPackageId);
  if (!work || (work.status !== "ready" && work.status !== "in-progress") ||
      work.projectId !== input.projectId ||
      explainWorkPackageReadiness(work, works).state !== "ready") {
    throw new Error("NEXT_ACTION_BLOCKED: WorkPackage missing, blocked or has incomplete dependencies");
  }
  // Prevent a typed grant from bypassing unresolved per-work gates. These
  // statuses are read from the canonical database, not from UI/client input.
  const gates = await runtime.workQuality.listQualityGates(input.actor, input.projectId);
  if (!work.qualityGateIds.length || !work.qualityGateIds.every(id => {
    const gate = gates.find(item => item.gate.id === id);
    return gate?.gate.projectId === input.projectId && gate.gate.status === "pass" &&
      gate.evidence.length > 0;
  })) {
    throw new Error("NEXT_ACTION_BLOCKED: WorkPackage Quality Gates require recorded PASS evidence");
  }
}

export async function inspectAuthorizedNextAction(
  runtime: BlueprintServerRuntime,
  input: AuthorizedNextActionInspectionInput,
  services: TrustedNextActionInspectionServices
): Promise<WorkflowInspectionOutcome> {
  // This restricted adapter can ONLY inspect; no edit/test/release dispatch.
  if (!input.grant || typeof input.grant !== "object" ||
      (input.grant as Partial<WorkflowExecutionGrant>).mode !== "inspect-scoped") {
    throw new Error("NEXT_ACTION_BLOCKED: only signed inspect-scoped grants are eligible");
  }
  if (typeof services.binding?.assertCurrent !== "function") {
    throw new Error("NEXT_ACTION_BLOCKED: no trusted WorkPackage-to-workflow binding source");
  }
  const assertEligible = async (): Promise<void> => {
    await assertCanonicalInspectionEligible(runtime, input);
    // Read this mapping again before each runner/QA step, never infer
    // canonical adoption from shared projectId or workflow.status.
    await services.binding.assertCurrent({
      projectId: input.projectId,
      workPackageId: input.workPackageId,
      workflowId: input.workflow.workflowId,
      workflowDigest: workflowManifestDigest(input.workflow),
      appHead: input.context.appHead
    });
  };
  await assertEligible();
  const grant = input.grant as WorkflowExecutionGrant;
  const authority = await PostgresWorkflowExecutionAuthority.load(
    runtime.workflowExecutionAuthority,
    input.projectId, input.workflow.workflowId, input.context.policyVersion
  );
  const chainedFreshness: WorkflowExecutionTrustedDependencies["freshness"] = {
    assertCurrent: async (context) => {
      await assertEligible();
      await services.freshness.assertCurrent(context);
    }
  };
  const scopedRunner: WorkflowExecutionTrustedDependencies["runner"] = {
    execute: async action => {
      await assertEligible();
      return services.runner.execute(action);
    }
  };
  const scopedQa: WorkflowInspectionDependencies["qa"] = {
    verify: async (action, observation) => {
      await assertEligible();
      return services.qa.verify(action, observation);
    }
  };
  // Authority, durable journals and QA record store are constructed from the
  // EXISTING runtime. Callers cannot pass an in-memory journal/authority here.
  return executeAndVerifyScopedInspection(
    grant, input.workflow, input.context, {
      source: services.source,
      trust: services.trust,
      verifier: services.verifier,
      authority,
      journal: runtime.workflowExecutionJournal,
      qaJournal: new PostgresWorkflowInspectionQaJournal(runtime.prisma),
      runner: scopedRunner,
      qa: scopedQa,
      freshness: chainedFreshness,
      ...(services.clock ? {clock: services.clock} : {})
    }
  );
}
