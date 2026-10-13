import "server-only";

import {
  CONSTITUTION_POLICY_VERSION,
  PromptWorkflowPreviewService,
  type WorkflowNodePreview
} from "@blueprint-os/application";
import type { AuthenticatedActor } from "@blueprint-os/core";

import governed from "../../../../control/constitution-governed-repositories.json";
import candidate from "../../../../prompt-workflows/projects/application-management.visa-recovery.v1.json";

import { getBlueprintServerRuntime } from "./runtime";

export const VISA_WORKFLOW_PROJECT_ID = "project:application-management";
export const VISA_WORKFLOW_ID = "app-management-visa-form-recovery";

const match = governed.repositories.find((entry) =>
  entry.projectId === VISA_WORKFLOW_PROJECT_ID && entry.repository === candidate.project.repo
);

if (!match || match.branch !== "main") {
  throw new Error("Central workflow registry is inconsistent with governed repository identity");
}

/**
 * Read GitHub as a verified HEAD source. No caller-supplied branch/repository/commit
 * and no cached or guessed SHA. A provider outage blocks the preview.
 */
async function verifiedRepoHead(repo: string): Promise<string> {
  if (repo !== match.repository) throw new Error("Unexpected repository for workflow");
  const [owner, name] = repo.split("/");
  if (!owner || !name) throw new Error("Malformed canonical repository");
  const url = "https://api.github.com/repos/" +
    encodeURIComponent(owner) + "/" + encodeURIComponent(name) +
    "/branches/" + encodeURIComponent(match.branch);

  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("GitHub HEAD verification unavailable: HTTP " + response.status);
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("commit" in body)) {
    throw new Error("Malformed GitHub HEAD response");
  }
  const commit = body.commit;
  if (!commit || typeof commit !== "object" || !("sha" in commit) ||
      typeof commit.sha !== "string" || !/^[0-9a-f]{40}$/.test(commit.sha)) {
    throw new Error("Unverified application HEAD");
  }
  return commit.sha;
}

export async function previewVisaWorkflowRoot(
  actor: AuthenticatedActor,
  projectId: string
): Promise<WorkflowNodePreview> {
  if (projectId !== VISA_WORKFLOW_PROJECT_ID) {
    throw new Error("Workflow is not assigned to this project");
  }
  const runtime = getBlueprintServerRuntime();
  const service = new PromptWorkflowPreviewService(
    runtime.prompts,
    { read: async (id: string) => {
      if (id !== VISA_WORKFLOW_ID) throw new Error("Unknown central workflow");
      return candidate;
    } },
    { readHead: verifiedRepoHead },
    CONSTITUTION_POLICY_VERSION
  );
  return service.preview(actor, projectId, VISA_WORKFLOW_ID, "inventory");
}

export function candidateVisaWorkflowStages(): readonly {
  id: string; stage: string; goal: string; dependencies: readonly string[];
}[] {
  return candidate.nodes.map((node) => ({
    id: node.id, stage: node.stage, goal: node.goal, dependencies: node.dependsOn
  }));
}
