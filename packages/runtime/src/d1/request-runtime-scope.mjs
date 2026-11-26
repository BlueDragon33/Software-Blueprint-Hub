import { AsyncLocalStorage } from 'node:async_hooks';

// Host-only entry point: callers must supply a verified platform binding.
// Request headers, cookies and user payloads are never provider selectors.
export function createRequestRuntimeScope() {
  const local = new AsyncLocalStorage();
  return Object.freeze({
    run(runtime, callback) {
      if (!runtime || typeof callback !== 'function') throw new TypeError('Runtime and callback required');
      if (local.getStore()) throw new Error('Nested D1 runtime context is forbidden');
      return local.run(runtime, callback);
    },
    select(mode, postgres) {
      const bound = local.getStore();
      if (mode === 'd1') {
        if (!bound) throw new Error('Canonical D1 Worker binding is unavailable');
        return bound;
      }
      if (mode !== undefined && mode !== 'postgres') throw new Error('Unsupported persistence provider');
      if (bound) throw new Error('D1 context conflicts with PostgreSQL provider');
      return postgres();
    },
    hasD1Context() { return local.getStore() !== undefined; }
  });
}
