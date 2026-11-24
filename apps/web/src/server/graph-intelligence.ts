import {
  blueprintOsDataLifecyclePolicyV1,
  blueprintOsThreatModelV1,
  buildGraphIntelligence
} from "@blueprint-os/application";
import { projectCanonicalNextAction } from "../../../../packages/application/src/universal-next-action-canonical.candidate.mjs";
import { loadProjectWorkspace } from "./project-workspace";
import { registeredWorkflowManifests } from "./prompt-workflow";
import { classifyCanonicalReadFailure } from "./runtime-state";

/** Server component loader. Never exposes graph sources before canonical PROJECT_READ. */
export async function loadGraphIntelligence(encodedProjectId: string) {
  const workspace = await loadProjectWorkspace(encodedProjectId);
  if (workspace.state !== "ready") return { state: workspace.state } as const;
  const { actor, runtime, projectId } = workspace;
  try {
    const [workPackages, bundles, releases] = await Promise.all([
      runtime.workQuality.listWorkPackages(actor, projectId),
      runtime.workQuality.listQualityGates(actor, projectId),
      runtime.releases.listReleases(actor, projectId)
    ]);
    // Only this project's manifests. No owner-wide catalog or other project reads.
    const workflows = registeredWorkflowManifests(projectId);
    const configuredRevision = process.env.RELEASE_GATE_REVISION ?? process.env.VERCEL_GIT_COMMIT_SHA;
    const sourceCodeRevision = configuredRevision && /^[0-9a-f]{40}$/.test(configuredRevision) ? configuredRevision : null;
    const graph = buildGraphIntelligence({
      projectId, profile: workspace.project.profile, blueprint: workspace.project.blueprint,
      workPackages, qualityGates: bundles.map(b => b.gate), evidence: bundles.flatMap(b => b.evidence), releases,
      workflows, sourceCodeRevision,
      security: projectId === "project:blueprint-os" ? blueprintOsThreatModelV1 : null,
      dataPolicy: projectId === "project:blueprint-os" ? blueprintOsDataLifecyclePolicyV1 : null
    });
    // Both Graph Intelligence and Next Action reuse this project's canonical
    // WorkPackages and gates. Neither view issues a runtime/approval token.
    const canonicalSourceRevision = await runtime.prompts.currentSourceRevisionFromProfile(
      actor, projectId, workspace.project
    );
    const nextAction = projectCanonicalNextAction({
      projectId, projectName: workspace.project.profile.name,
      sourceRevision: canonicalSourceRevision, workPackages, gateBundles: bundles,
      requiredGateIds: workspace.project.blueprint.requiredGates
    });
    return { state: "ready", profile: workspace.project.profile, graph,
      nextAction, canonicalSourceRevision } as const;
  } catch (error) {
    return { state: classifyCanonicalReadFailure(error) } as const;
  }
}
