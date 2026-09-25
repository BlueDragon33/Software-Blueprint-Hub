import { AppShell } from "@blueprint-os/ui";

export default function HomePage() {
  return (
    <AppShell>
      <main className="foundation">
        <p className="eyebrow">Blueprint OS · Project 0001</p>
        <h1>Foundation workspace</h1>
        <p className="lede">
          B0 Design Ready is complete. Runtime work is now constrained by the
          accepted contracts, ADRs, dependency graph, and quality gates.
        </p>
        <section aria-labelledby="current-work">
          <h2 id="current-work">Current authorized work</h2>
          <p>FND-001 — workspace and architecture boundaries.</p>
        </section>
      </main>
    </AppShell>
  );
}
