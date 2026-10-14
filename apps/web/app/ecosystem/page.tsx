import Link from "next/link";
import { AppShell } from "@blueprint-os/ui";
import governed from "../../../../control/constitution-governed-repositories.json";
import { presentGovernedApps } from "../../src/lib/hub-app-directory";
import { resolveWebActor } from "../../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../../src/server/runtime";
import { EcosystemDirectory } from "./ecosystem-directory";

export const dynamic = "force-dynamic";

export default async function EcosystemPage({
  searchParams
}: {
  readonly searchParams: Promise<{ app?: string | string[] }>;
}) {
  const actor = await resolveWebActor();
  if (!actor) return (
    <AppShell><main className="registry-shell">
      <h1>Vui lòng đăng nhập</h1>
      <p>Danh mục ứng dụng đang quản lý không được công khai trước khi xác thực.</p>
      <a className="primary-button" href="/api/auth/signin">Đăng nhập</a>
    </main></AppShell>
  );
  const runtime = getBlueprintServerRuntime();
  if (!(await runtime.authority.canExerciseConstitutionalAuthority(actor))) {
    return (
      <AppShell><main className="registry-shell">
        <h1>Không có quyền truy cập</h1>
        <p>Danh mục liên repository chỉ dành cho System Owner.</p>
        <Link href="/">Về trang chủ</Link>
      </main></AppShell>
    );
  }
  const [projects, query] = await Promise.all([runtime.registry.list(actor), searchParams]);
  const requestedApp = Array.isArray(query.app) ? query.app[0] : query.app;
  return (
    <AppShell>
      <EcosystemDirectory apps={presentGovernedApps(governed.repositories)}
        canonicalProjectIds={projects.map((project) => project.projectId)}
        initialAppId={requestedApp} />
    </AppShell>
  );
}
