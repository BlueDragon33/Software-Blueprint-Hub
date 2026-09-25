import {
  createBlueprintServerRuntime,
  type BlueprintServerRuntime
} from "@blueprint-os/runtime";

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

export function getBlueprintServerRuntime(): BlueprintServerRuntime {
  if (!globalThis.__blueprintServerRuntime) {
    globalThis.__blueprintServerRuntime = createBlueprintServerRuntime(
      requireDatabaseUrl()
    );
  }

  return globalThis.__blueprintServerRuntime;
}
