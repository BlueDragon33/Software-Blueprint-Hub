import type { ProjectProfileResolution } from "@blueprint-os/application";
import type { BlueprintServerRuntime } from "@blueprint-os/runtime";

import {
  resolveWebActor,
  type WebAuthenticatedActor
} from "../auth/server-actor";
import { getBlueprintServerRuntime } from "./runtime";

export type ProjectWorkspaceLoadResult =
  | Readonly<{ state: "signed-out"; projectId: string }>
  | Readonly<{ state: "not-found"; projectId: string }>
  | Readonly<{ state: "unavailable"; projectId: string }>
  | Readonly<{
      state: "ready";
      projectId: string;
      actor: WebAuthenticatedActor;
      runtime: BlueprintServerRuntime;
      project: ProjectProfileResolution;
    }>;

export async function loadProjectWorkspace(
  encodedProjectId: string
): Promise<ProjectWorkspaceLoadResult> {
  const projectId = decodeURIComponent(encodedProjectId);
  const actor = await resolveWebActor();

  if (!actor) {
    return Object.freeze({ state: "signed-out", projectId });
  }

  try {
    const runtime = getBlueprintServerRuntime();
    const project = await runtime.profiles.read(actor, projectId);

    if (!project) {
      return Object.freeze({ state: "not-found", projectId });
    }

    return Object.freeze({
      state: "ready",
      projectId,
      actor,
      runtime,
      project
    });
  } catch {
    return Object.freeze({ state: "unavailable", projectId });
  }
}
