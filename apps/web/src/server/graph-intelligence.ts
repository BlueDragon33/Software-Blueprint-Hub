import {
  blueprintOsDataLifecyclePolicyV1,
  blueprintOsThreatModelV1,
  buildGraphIntelligence
} from "@blueprint-os/application";
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
    return { state: "ready", profile: workspace.project.profile, graph } as const;
  } catch (error) {
    return { state: classifyCanonicalReadFailure(error) } as const;
  }
}
