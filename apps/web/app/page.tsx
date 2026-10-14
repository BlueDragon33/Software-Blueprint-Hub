import Link from "next/link";

import { AppShell } from "@blueprint-os/ui";

import { resolveWebActor } from "../src/auth/server-actor";
import { getBlueprintServerRuntime } from "../src/server/runtime";
import { loadCompassProjection } from "../src/server/compass-projection";
import { RetryCurrentView } from "./_components/retry-current-view";
import { SystemCompass } from "./_components/system-compass";
import { HubLauncher } from "./_components/hub-launcher";
import { presentGovernedApps } from "../src/lib/hub-app-directory";
import governed from "../../../control/constitution-governed-repositories.json";

export const dynamic = "force-dynamic";

function SignedOutRegistry() {
  return (
    <AppShell>
      <main className="registry-shell">
        <header className="registry-header">
          <div>
            <p className="eyebrow">Blueprint OS</p>
            <h1>Trung tâm ứng dụng</h1>
            <p className="lede">Đăng nhập để mở các công cụ và dự án theo quyền truy cập của bạn.</p>
          </div>
          <Link className="environment-badge" href="/compass">Phase 9 · Compass</Link>
        </header>

        <section className="registry-state" aria-labelledby="sign-in-title">
          <span className="registry-state-icon" aria-hidden="true">◇</span>
          <div>
            <h2 id="sign-in-title">Đăng nhập để mở trung tâm ứng dụng.</h2>
            <p>
              Dữ liệu dự án được bảo vệ và chỉ hiển thị sau khi xác thực.
            </p>
          </div>
          <a className="primary-button registry-action" href="/api/auth/signin">
            Sign in
          </a>
        </section>

        <section className="registry-secondary">
          <strong>Cần tìm tài liệu dùng chung?</strong>
          <span>
            Thư viện lưu kiến thức có thể sử dụng lại, độc lập với trạng thái dự án.
          </span>
          <Link className="secondary-button registry-action" href="/knowledge">
            Mở thư viện
          </Link>
        </section>

        <section className="registry-secondary">
          <strong>Cần tạo dự án mới?</strong>
          <span>
            Có thể khám phá quy trình tạo dự án theo mẫu chuẩn.
          </span>
          <Link className="secondary-button registry-action" href="/projects/new">
            Mở hướng dẫn tạo dự án
          </Link>
        </section>
      </main>
    </AppShell>
  );
}

export default async function HomePage() {
  const actor = await resolveWebActor();

  if (!actor) {
    return <SignedOutRegistry />;
  }

  let items;
  let compass;
  let canManageEcosystem = false;
  try {
    const runtime = getBlueprintServerRuntime();
    [items, compass, canManageEcosystem] = await Promise.all([
      runtime.registry.list(actor),
      loadCompassProjection(actor).catch(() => null),
      runtime.authority.canExerciseConstitutionalAuthority(actor)
    ]);
  } catch {
    return (
      <AppShell>
        <main className="registry-shell">
          <header className="registry-header">
            <div>
              <p className="eyebrow">Blueprint OS</p>
              <h1>Projects</h1>
            </div>
            <span className="environment-badge">Canonical</span>
          </header>
          <section
            className="registry-state registry-state-error runtime-recovery-state"
            role="alert"
            aria-labelledby="registry-runtime-title"
          >
            <span className="registry-state-icon" aria-hidden="true">!</span>
            <div>
              <p className="section-kicker">Canonical runtime unavailable</p>
              <h2 id="registry-runtime-title">
                Project registry is temporarily unavailable.
              </h2>
              <p>
                Your account remains signed in. No project data was exposed or
                replaced by preview or cached state.
              </p>
            </div>
            <RetryCurrentView label="Retry project registry" />
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="registry-shell hub-home">
        <HubLauncher
          projects={items.map((item) => ({
            projectId: item.projectId, name: item.name,
            blueprintLevel: item.blueprintLevel, updatedAt: item.updatedAt
          }))}
          governedApps={canManageEcosystem ? presentGovernedApps(governed.repositories) : []}
          canManageEcosystem={canManageEcosystem}
        />
        <details className="hub-technical-details">
          <summary>🧭 La bàn kỹ thuật & tiến độ theo bằng chứng</summary>
          {compass
            ? <SystemCompass compact projection={compass} />
            : <p>Không thể tải dữ liệu la bàn lúc này. Bạn có thể mở lại trang La bàn từ các biểu tượng phía trên.</p>}
        </details>
      </main>
    </AppShell>
  );
}
