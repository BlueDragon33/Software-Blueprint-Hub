import { AppShell } from "@blueprint-os/ui";

import { ProjectBootstrapFactory } from "./project-bootstrap-factory";

export default function NewProjectPage() {
  return (
    <AppShell>
      <ProjectBootstrapFactory />
    </AppShell>
  );
}
