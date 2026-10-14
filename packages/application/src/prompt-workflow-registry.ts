import {
  validateWorkflow,
  type WorkflowManifest,
  type WorkflowNode
} from "./prompt-workflow-core.mjs";

export interface GovernedWorkflowRepository {
  readonly projectId: string;
  readonly repository: string;
  readonly branch: string;
  readonly blueprintLevel: string;
}

export interface CentralWorkflowDescription {
  readonly workflowId: string;
  readonly workflowVersion: string;
  readonly status: WorkflowManifest["status"];
  readonly templateId: string;
  readonly projectId: string;
  readonly repository: string;
  readonly branch: string;
  readonly area: string;
  readonly nodeCount: number;
  readonly rootNodeIds: readonly string[];
}

/**
 * An explicit manifest registry for all governed repositories, including those without
 * project workflows. Registration is NOT canonical Project Profile creation, workflow
 * adoption, user authorization or evidence of completed work.
 *
 * Authentication remains at the existing Project Workspace/Prompt Projection boundary.
 * This registry is project-scoped metadata, never a public list of private workflows.
 */
export class CentralPromptWorkflowRegistry {
  private readonly projects = new Map<string, GovernedWorkflowRepository>();
  private readonly repositories = new Map<string, GovernedWorkflowRepository>();
  private readonly workflows = new Map<string, WorkflowManifest>();
  private readonly byProject = new Map<string, readonly CentralWorkflowDescription[]>();

  constructor(
    governedRepositories: readonly GovernedWorkflowRepository[],
    manifests: readonly unknown[]
  ) {
    for (const entry of governedRepositories) {
      if (!/^project:[a-z][a-z0-9-]+$/.test(entry.projectId) ||
          !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(entry.repository) ||
          !/^[a-zA-Z0-9._/-]+$/.test(entry.branch) ||
          !/^B[0-5]$/.test(entry.blueprintLevel)) {
        throw new TypeError("Invalid governed repository mapping");
      }
      if (this.projects.has(entry.projectId) || this.repositories.has(entry.repository)) {
        throw new TypeError("Duplicate governed project or repository");
      }
      const record = Object.freeze({ ...entry });
      this.projects.set(record.projectId, record);
      this.repositories.set(record.repository, record);
    }

    for (const manifestInput of manifests) {
      const result = validateWorkflow(manifestInput);
      if (!result.valid) {
        throw new TypeError("Invalid central workflow: " + result.errors.join("; "));
      }
      const manifest = structuredClone(manifestInput) as WorkflowManifest;
      const owner = this.projects.get(manifest.project.id);
      if (!owner || owner.repository !== manifest.project.repo) {
        throw new TypeError("Workflow does not match the governed project/repository registry");
      }
      if (this.workflows.has(manifest.workflowId)) {
        throw new TypeError("Ambiguous workflow ID: " + manifest.workflowId);
      }
      this.workflows.set(manifest.workflowId, manifest);
      const roots = manifest.nodes
        .filter((node) => node.dependsOn.length === 0 && !node.humanGate && node.stage !== "RELEASE")
        .map((node) => node.id)
        .sort();
      const description: CentralWorkflowDescription = Object.freeze({
        workflowId: manifest.workflowId,
        workflowVersion: manifest.workflowVersion,
        status: manifest.status,
        templateId: manifest.templateId,
        projectId: manifest.project.id,
        repository: owner.repository,
        branch: owner.branch,
        area: manifest.project.area,
        nodeCount: manifest.nodes.length,
        rootNodeIds: Object.freeze(roots)
      });
      this.byProject.set(manifest.project.id, [
        ...(this.byProject.get(manifest.project.id) ?? []),
        description
      ]);
    }
    for (const [projectId, entries] of this.byProject) {
      this.byProject.set(projectId, Object.freeze(
        [...entries].sort((a, b) => a.workflowId.localeCompare(b.workflowId))
      ));
    }
  }

  governedProjectCount(): number {
    return this.projects.size;
  }

  registeredWorkflowCount(): number {
    return this.workflows.size;
  }

  isGovernedProject(projectId: string): boolean {
    return this.projects.has(projectId);
  }

  /**
   * Read-only descriptions of *authored* workflows across governed projects.
   * This does not create a ProjectProfile or authorize access. Server callers
   * MUST enforce independent System Owner authority before returning results.
   */
  allWorkflowSummaries(): readonly CentralWorkflowDescription[] {
    return Object.freeze(
      [...this.byProject.values()].flat()
        .sort((a, b) => a.repository.localeCompare(b.repository) ||
          a.workflowId.localeCompare(b.workflowId))
    );
  }


  workflowsForProject(projectId: string): readonly CentralWorkflowDescription[] {
    if (!this.projects.has(projectId)) return Object.freeze([]);
    return this.byProject.get(projectId) ?? Object.freeze([]);
  }

  repositoryForProject(projectId: string): GovernedWorkflowRepository | null {
    return this.projects.get(projectId) ?? null;
  }

  repositoryByName(repository: string): GovernedWorkflowRepository | null {
    return this.repositories.get(repository) ?? null;
  }

  workflowForProject(projectId: string, workflowId: string): WorkflowManifest | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || workflow.project.id !== projectId) return null;
    return structuredClone(workflow);
  }

  workflowNode(
    projectId: string,
    workflowId: string,
    nodeId: string
  ): WorkflowNode | null {
    const manifest = this.workflowForProject(projectId, workflowId);
    return manifest?.nodes.find((node) => node.id === nodeId) ?? null;
  }
}
