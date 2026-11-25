// Trusted Cloudflare host boundary. Never accepts binding/provider from a request.
function unavailable() {
  return new Response("Canonical persistence unavailable", {
    status:503,
    headers:{"cache-control":"private, no-store","content-type":"text/plain; charset=utf-8","x-content-type-options":"nosniff"}
  });
}
export function createD1WorkerHost(handler, runWithRuntime) {
  if(typeof handler?.fetch!=="function"||typeof runWithRuntime!=="function")throw TypeError("Worker handler and runtime bridge required");
  return Object.freeze({
    async fetch(request, env, ctx) {
      const db=env?.BLUEPRINT_CANONICAL_DB;
      if(env?.BLUEPRINT_PERSISTENCE_PROVIDER!=="d1"||typeof db?.prepare!=="function"||typeof db?.batch!=="function")return unavailable();
      try {
        return await runWithRuntime(db,()=>handler.fetch(request,env,ctx));
      } catch {
        return unavailable();
      }
    }
  });
}
