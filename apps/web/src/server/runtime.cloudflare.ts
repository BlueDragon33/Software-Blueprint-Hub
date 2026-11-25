// Cloudflare-only composition. This module is selected only by the pinned
// Worker build plugin; the normal Next/Node runtime remains unchanged.
import { env } from "cloudflare:workers";
import { workerBuildRevision } from "virtual:blueprint-worker-build-revision";
import { createD1BlueprintServerRuntime, createRequestRuntimeScope, type D1BlueprintServerRuntime, type D1CanonicalBinding } from "@blueprint-os/runtime/d1";
import { resolveGitHubPublicationToken } from "../auth/server-actor";

export type WebBlueprintServerRuntime = D1BlueprintServerRuntime;
const scope = createRequestRuntimeScope<D1BlueprintServerRuntime>();
function nativeBinding():D1CanonicalBinding {
  const host=env as {BLUEPRINT_PERSISTENCE_PROVIDER?:unknown;BLUEPRINT_CANONICAL_DB?:unknown};
  const db=host.BLUEPRINT_CANONICAL_DB as D1CanonicalBinding|undefined;
  if(host.BLUEPRINT_PERSISTENCE_PROVIDER!=="d1"||!db||typeof db.prepare!=="function"||typeof db.batch!=="function")throw Error("Canonical Cloudflare D1 binding unavailable");
  return db;
}
function runtime(){return createD1BlueprintServerRuntime(nativeBinding(),resolveGitHubPublicationToken,workerBuildRevision);}
export function runWithD1WorkerRuntime<T>(binding:D1CanonicalBinding,callback:()=>T):T {
  if(binding!==nativeBinding())throw Error("Conflicting native D1 binding");
  return scope.run(runtime(),callback);
}
export function hasD1WorkerRuntime():boolean {
  try{nativeBinding();return true;}catch{return false;}
}
export function getBlueprintServerRuntime():WebBlueprintServerRuntime {
  // Native binding is also available to RSC/SSR modules even when their
  // module instances do not share the entry module's AsyncLocalStorage.
  return scope.hasD1Context()?scope.select("d1",()=>{throw Error("No PostgreSQL fallback")}):runtime();
}
