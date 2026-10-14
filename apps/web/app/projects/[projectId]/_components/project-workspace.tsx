import Link from "next/link";
import type { ReactNode } from "react";

import type { ProjectProfile } from "@blueprint-os/contracts";
import { ActionGroup, AppShell, EmptyState, StatusChip } from "@blueprint-os/ui";

import { RetryCurrentView } from "../../../_components/retry-current-view";
import { ProjectWorkspaceNav } from "./project-workspace-nav";

export type ProjectWorkspaceView =
  | "overview"
  | "profile"
  | "blueprint"
  | "roadmap"
  | "quality"
  | "evidence-graph"
  | "release-orchestration"
  | "security"
  | "data-lifecycle"
  | "prompt"
  | "decisions"
  | "risks-debt"
  | "releases-lessons";

interface WorkspaceViewDefinition {
  readonly id: ProjectWorkspaceView;
  readonly label: string;
  readonly suffix: string;
  readonly description: string;
}

export const projectWorkspaceViews: readonly WorkspaceViewDefinition[] =
  Object.freeze([
    {
      id: "overview",
      label: "Overview",
      suffix: "",
      description: "Readiness, blockers and next action"
    },
    {
      id: "profile",
      label: "Profile",
      suffix: "/profile",
      description: "Canonical Project Profile"
    },
    {
      id: "blueprint",
      label: "Blueprint",
      suffix: "/blueprint",
      description: "Resolved modules, gates and templates"
    },
    {
      id: "roadmap",
      label: "Roadmap",
      suffix: "/roadmap",
      description: "Dependency-aware Work Packages"
    },
    {
      id: "quality",
      label: "Quality",
      suffix: "/quality",
      description: "Quality Gates and evidence"
    },
    {
      id: "evidence-graph",
      label: "Evidence Graph",
      suffix: "/evidence-graph",
      description: "Work, gate, evidence and release provenance"
    },
    {
      id: "release-orchestration",
      label: "Release Orchestration",
      suffix: "/release-orchestration",
      description: "Exact-revision promotion preconditions and deployment blockers"
    },
    {
      id: "security",
      label: "Security",
      suffix: "/security",
      description: "Trust zones, threats, mitigations and publish blockers"
    },
    {
      id: "data-lifecycle",
      label: "Data Lifecycle",
      suffix: "/data-lifecycle",
      description: "Retention, archive, export, migration and deletion policy"
    },
    {
      id: "prompt",
      label: "Prompt",
      suffix: "/prompt",
      description: "Derived execution projection"
    },
    {
      id: "decisions",
      label: "Decisions",
      suffix: "/decisions",
      description: "Architecture decisions"
    },
    {
      id: "risks-debt",
      label: "Risks & Debt",
      suffix: "/risks-debt",
      description: "Risks and technical debt"
    },
    {
      id: "releases-lessons",
      label: "Releases & Lessons",
      suffix: "/releases-lessons",
      description: "Release evidence and learning"
    }
  ]);

interface ProjectWorkspaceFrameProps {
  readonly profile: ProjectProfile;
  readonly active: ProjectWorkspaceView;
  readonly children: ReactNode;
}

export function ProjectWorkspaceFrame({
  profile,
  active,
  children
}: ProjectWorkspaceFrameProps) {
  const root = `/projects/${encodeURIComponent(profile.projectId)}`;

  return (
    <AppShell>
      <main className="project-workspace">
        <div className="project-workspace-breadcrumbs">
          <Link className="text-link" href="/">Màn hình ứng dụng</Link>
          <span aria-hidden="true">/</span>
          <Link className="text-link" href={root}>{profile.name}</Link>
          <span aria-hidden="true">/</span>
          <span>
            {projectWorkspaceViews.find((view) => view.id === active)?.label ??
              "Không gian làm việc"}
          </span>
        </div>

        <header className="project-workspace-header">
          <div>
            <p className="eyebrow">KHÔNG GIAN DỰ ÁN CHUẨN</p>
            <h1>{profile.name}</h1>
            <p className="lede">
              {profile.projectType} · {profile.projectId}
            </p>
          </div>
          <ActionGroup className="project-workspace-header-actions">
            <span className="project-level project-level-large">
              {profile.blueprintLevel}
            </span>
            <Link className="secondary-button registry-action" href="/projects/new">
              Tạo dự án
            </Link>
          </ActionGroup>
        </header>

        <div className="project-workspace-grid">
          <aside className="project-workspace-nav-shell">
            <ProjectWorkspaceNav
              root={root}
              active={active}
              views={projectWorkspaceViews}
            />
          </aside>

          <div className="project-workspace-content">{children}</div>
        </div>
      </main>
    </AppShell>
  );
}

interface WorkspaceStateProps {
  readonly state: "signed-out" | "not-found" | "forbidden" | "unavailable";
}

export function ProjectWorkspaceState({ state }: WorkspaceStateProps) {
  if (state === "signed-out") {
    return (
      <AppShell>
        <main className="registry-shell">
          <Link className="text-link" href="/">← Projects</Link>
          <EmptyState
            className="registry-state"
            title="Đăng nhập để mở dự án này."
            description="Thông tin dự án được bảo vệ theo quyền truy cập của Hub."
            action={
              <a className="primary-button registry-action" href="/api/auth/signin">
                Đăng nhập
              </a>
            }
          />
        </main>
      </AppShell>
    );
  }

  if (state === "not-found") {
    return (
      <AppShell>
        <main className="registry-shell">
          <Link className="text-link" href="/">← Projects</Link>
          <EmptyState
            className="registry-state"
            title="Không tìm thấy dự án."
            description="Chưa có hồ sơ dự án chuẩn cho mã này. Danh sách repository do Hub quản lý không tự tạo hồ sơ dự án."
          />
        </main>
      </AppShell>
    );
  }

  if (state === "forbidden") {
    return (
      <AppShell>
        <main className="registry-shell">
          <Link className="text-link" href="/">← Projects</Link>
          <section
            className="registry-state registry-state-error runtime-recovery-state"
            role="alert"
            aria-labelledby="project-forbidden-title"
          >
            <span className="registry-state-icon" aria-hidden="true">!</span>
            <div>
              <p className="section-kicker">Authority protected</p>
              <h1 id="project-forbidden-title">
                Bạn không có quyền truy cập dự án này.
              </h1>
              <p>
                Blueprint OS không hiển thị dữ liệu trái quyền hạn hoặc thay thế
                dữ liệu chuẩn bằng bản xem trước.
              </p>
            </div>
            <Link className="secondary-button registry-action" href="/">
              Về màn hình ứng dụng
            </Link>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="registry-shell">
        <Link className="text-link" href="/">← Projects</Link>
        <section
          className="registry-state registry-state-error runtime-recovery-state"
          role="alert"
          aria-labelledby="project-runtime-title"
        >
          <span className="registry-state-icon" aria-hidden="true">!</span>
          <div>
            <p className="section-kicker">Canonical runtime unavailable</p>
            <h1 id="project-runtime-title">Không thể tải dữ liệu dự án.</h1>
            <p>
              Phiên đăng nhập vẫn còn. Không sử dụng dữ liệu giả hoặc bản lưu tạm
              để thay thế khi dữ liệu chuẩn không tải được.
            </p>
          </div>
          <RetryCurrentView />
        </section>
      </main>
    </AppShell>
  );
}

interface NotAvailableYetProps {
  readonly title: string;
  readonly phase: string;
  readonly description: string;
}

export function NotAvailableYet({
  title,
  phase,
  description
}: NotAvailableYetProps) {
  return (
    <section className="workspace-module-state">
      <p className="section-kicker">Canonical module not available yet</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <StatusChip>{phase}</StatusChip>
    </section>
  );
}
