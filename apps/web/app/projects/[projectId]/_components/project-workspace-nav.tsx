"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useHubPreferences } from "../../../_components/hub-preferences";

export interface ProjectWorkspaceNavItem {
  readonly id: string;
  readonly label: string;
  readonly suffix: string;
  readonly description: string;
}


const localized: Readonly<Record<string, { vi: string; en: string; descriptionVi: string; descriptionEn: string }>> = {
  overview: { vi: "Tổng quan", en: "Overview", descriptionVi: "Trạng thái & việc cần làm", descriptionEn: "Readiness and next action" },
  profile: { vi: "Hồ sơ dự án", en: "Profile", descriptionVi: "Thông tin chuẩn của dự án", descriptionEn: "Canonical project profile" },
  blueprint: { vi: "Thiết kế", en: "Blueprint", descriptionVi: "Mô-đun & yêu cầu", descriptionEn: "Modules and requirements" },
  roadmap: { vi: "Lộ trình", en: "Roadmap", descriptionVi: "Giai đoạn & công việc", descriptionEn: "Work packages and stages" },
  quality: { vi: "Chất lượng", en: "Quality", descriptionVi: "Kiểm thử & tiêu chí", descriptionEn: "Tests and gates" },
  "evidence-graph": { vi: "Bằng chứng", en: "Evidence graph", descriptionVi: "Nguồn gốc kết quả", descriptionEn: "Result provenance" },
  "release-orchestration": { vi: "Phát hành", en: "Release", descriptionVi: "Điều kiện triển khai", descriptionEn: "Release preconditions" },
  security: { vi: "Bảo mật", en: "Security", descriptionVi: "Quyền & an toàn", descriptionEn: "Access and safety" },
  "data-lifecycle": { vi: "Dữ liệu", en: "Data lifecycle", descriptionVi: "Lưu trữ & vòng đời", descriptionEn: "Storage and lifecycle" },
  prompt: { vi: "Quy trình & Prompt", en: "Workflow & Prompt", descriptionVi: "Đồ thị AI & lệnh", descriptionEn: "AI graph and prompts" },
  decisions: { vi: "Quyết định", en: "Decisions", descriptionVi: "Thiết kế & lựa chọn", descriptionEn: "Architecture decisions" },
  "risks-debt": { vi: "Rủi ro", en: "Risks", descriptionVi: "Vấn đề & nợ kỹ thuật", descriptionEn: "Issues and technical debt" },
  "releases-lessons": { vi: "Lịch sử & bài học", en: "History & lessons", descriptionVi: "Phát hành & kinh nghiệm", descriptionEn: "Releases and lessons" }
};

const menuGroups = [
  { id: "build", vi: "📐 Xây dựng", en: "📐 Build", ids: ["overview", "profile", "blueprint", "roadmap"] },
  { id: "assurance", vi: "🛡️ Kiểm soát", en: "🛡️ Assurance", ids: ["quality", "evidence-graph", "release-orchestration", "security", "data-lifecycle"] },
  { id: "knowledge", vi: "🧠 Tri thức & AI", en: "🧠 Knowledge & AI", ids: ["prompt", "decisions", "risks-debt", "releases-lessons"] }
] as const;

interface ProjectWorkspaceNavProps {
  readonly root: string;
  readonly active: string;
  readonly views: readonly ProjectWorkspaceNavItem[];
}

export function ProjectWorkspaceNav({
  root,
  active,
  views
}: ProjectWorkspaceNavProps) {
  const activeRef = useRef<HTMLAnchorElement | null>(null);
  const { language } = useHubPreferences();

  useEffect(() => {
    const activeElement = activeRef.current;
    if (!activeElement) return;

    const shell = activeElement.closest(".project-workspace-nav-shell");
    if (!(shell instanceof HTMLElement)) return;

    const activeBox = activeElement.getBoundingClientRect();
    const shellBox = shell.getBoundingClientRect();
    const fullyVisible =
      activeBox.left >= shellBox.left && activeBox.right <= shellBox.right;

    if (!fullyVisible) {
      activeElement.scrollIntoView({
        behavior: "auto",
        block: "nearest",
        inline: "center"
      });
    }
  }, [active]);

  return (
    <nav className="project-workspace-nav hub-workspace-navigation"
      aria-label={language === "en" ? "Project workspace views" : "Các mục trong dự án"}>
      <Link className="hub-home-link" href="/">
        🏠 {language === "en" ? "App home" : "Màn hình ứng dụng"}
      </Link>
      {menuGroups.map((group) => {
        const links = views.filter((view) => (group.ids as readonly string[]).includes(view.id));
        if (!links.length) return null;
        return (
          <details key={group.id} className="hub-nav-group"
            open={(group.ids as readonly string[]).includes(active) ? true : undefined}>
            <summary>{language === "en" ? group.en : group.vi}</summary>
            <div className="hub-nav-links">
              {links.map((view) => {
                const current = view.id === active;
                return (
                  <Link
                    className={"project-workspace-nav-item" +
                      (current ? " project-workspace-nav-item-active" : "")}
                    href={root + view.suffix}
                    key={view.id}
                    aria-current={current ? "page" : undefined}
                    ref={current ? activeRef : undefined}
                  >
                    <strong>{language === "en"
                      ? (localized[view.id]?.en ?? view.label)
                      : (localized[view.id]?.vi ?? view.label)}</strong>
                    <span>{language === "en"
                      ? (localized[view.id]?.descriptionEn ?? view.description)
                      : (localized[view.id]?.descriptionVi ?? view.description)}</span>
                  </Link>
                );
              })}
            </div>
          </details>
        );
      })}
    </nav>
  );
}
