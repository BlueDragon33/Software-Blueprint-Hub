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
      if(env?.BLUEPRINT_PERSISTENCE_PROVIDER!=="d1"||typeof db?.prepare!=="function"||typeof db?.batch!=="function"){console.error("BLUEPRINT_WORKER_GATE: HOST_D1_UNAVAILABLE");return unavailable();}
      try {
        return await runWithRuntime(db,()=>handler.fetch(request,env,ctx));
      } catch(error) {
        // Fixed diagnostic codes only; never log identity, secrets or error text.
        const code=error instanceof Error&&error.message==="Canonical Cloudflare D1 binding unavailable"?"NATIVE_D1_UNAVAILABLE":error instanceof Error&&error.message==="Invalid D1 host binding"?"HOST_BINDING_INVALID":"RUNTIME_OR_HANDLER_FAILED";
        console.error("BLUEPRINT_WORKER_GATE: "+code);
        return unavailable();
      }
    }
  });
}
