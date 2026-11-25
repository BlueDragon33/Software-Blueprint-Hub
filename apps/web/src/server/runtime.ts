import {
  createBlueprintServerRuntime,
  type BlueprintServerRuntime
} from "@blueprint-os/runtime";

import { createD1BlueprintServerRuntime, createRequestRuntimeScope, type D1BlueprintServerRuntime, type D1CanonicalBinding } from "@blueprint-os/runtime/d1";
import { resolveGitHubPublicationToken } from "../auth/server-actor";

export type WebBlueprintServerRuntime = BlueprintServerRuntime | D1BlueprintServerRuntime;
const d1Scope = createRequestRuntimeScope<D1BlueprintServerRuntime>();

/** Trusted host bridge only. The Worker adapter must supply its actual D1 binding.
 * Never call with values from request payloads, cookies or headers. */
export function runWithD1WorkerRuntime<T>(binding:D1CanonicalBinding,callback:()=>T):T {
  if(process.env.BLUEPRINT_PERSISTENCE_PROVIDER !== "d1") throw Error("D1 provider is not selected");
  return d1Scope.run(createD1BlueprintServerRuntime(binding,resolveGitHubPublicationToken),callback);
}
export function hasD1WorkerRuntime():boolean { return d1Scope.hasD1Context(); }

declare global {
  var __blueprintServerRuntime: BlueprintServerRuntime | undefined;
}

function requireDatabaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error("DATABASE_URL is required for canonical Blueprint operations");
  }
  return value;
}

function getPostgresRuntime(): BlueprintServerRuntime {
  if (!globalThis.__blueprintServerRuntime) {
    globalThis.__blueprintServerRuntime = createBlueprintServerRuntime(
      requireDatabaseUrl(),
      resolveGitHubPublicationToken
    );
  }

  return globalThis.__blueprintServerRuntime;
}

export function getBlueprintServerRuntime(): WebBlueprintServerRuntime {
  return d1Scope.select(process.env.BLUEPRINT_PERSISTENCE_PROVIDER,getPostgresRuntime);
}
