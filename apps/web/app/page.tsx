import { AppShell } from "@blueprint-os/ui";

import { BlueprintWorkspace } from "./workspace-client";

export default function HomePage() {
  return (
    <AppShell>
      <BlueprintWorkspace />
    </AppShell>
  );
}
