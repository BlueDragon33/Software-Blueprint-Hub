"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  appSearchKey, groupLabels, groupOrder, matchesApp,
  type HubAppPresentation, type HubGroup
} from "../../src/lib/hub-app-directory";
import { useHubPreferences } from "./hub-preferences";
import styles from "./hub-launcher.module.css";

export interface HomeProject {
  readonly projectId: string;
  readonly name: string;
  readonly blueprintLevel: string;
  readonly updatedAt: string;
}

interface HubLauncherProps {
  readonly projects: readonly HomeProject[];
  readonly governedApps: readonly HubAppPresentation[];
  readonly canManageEcosystem: boolean;
}

type ModuleId = "compass" | "ecosystem" | "workflow" | "constitution" |
  "portfolio" | "knowledge" | "projects" | "settings";

const modules: ReadonlyArray<{
  id: ModuleId; icon: string; vi: string; en: string; descriptionVi: string; descriptionEn: string;
  href: string; restricted: boolean;
}> = [
  { id: "ecosystem", icon: "📱", vi: "Hệ sinh thái", en: "App ecosystem",
    descriptionVi: "Ứng dụng theo nhóm", descriptionEn: "Grouped applications",
    href: "/ecosystem", restricted: true },
  { id: "workflow", icon: "🕸️", vi: "Quy trình AI", en: "AI workflows",
    descriptionVi: "Sơ đồ node & phụ thuộc", descriptionEn: "Nodes & dependencies",
    href: "/projects/project%3Ablueprint-os/prompt/workflow", restricted: true },
  { id: "constitution", icon: "⚖️", vi: "Hiến pháp", en: "Constitution",
    descriptionVi: "Quy tắc & quyền hạn", descriptionEn: "Rules & authority",
    href: "/constitution", restricted: false },
  { id: "portfolio", icon: "🗃️", vi: "Danh mục", en: "Portfolio",
    descriptionVi: "Toàn cảnh dự án", descriptionEn: "Projects overview",
    href: "/portfolio", restricted: false },
  { id: "knowledge", icon: "📚", vi: "Thư viện", en: "Knowledge",
    descriptionVi: "Tài liệu dùng chung", descriptionEn: "Shared knowledge",
    href: "/knowledge", restricted: false },
  { id: "compass", icon: "🧭", vi: "La bàn", en: "Compass",
    descriptionVi: "Tiến độ có bằng chứng", descriptionEn: "Evidence-based progress",
    href: "/compass", restricted: false },
  { id: "projects", icon: "➕", vi: "Dự án mới", en: "New project",
    descriptionVi: "Tạo hồ sơ chuẩn", descriptionEn: "Create canonical profile",
    href: "/projects/new", restricted: false },
  { id: "settings", icon: "⚙️", vi: "Cài đặt", en: "Settings",
    descriptionVi: "Ngôn ngữ & hiển thị", descriptionEn: "Language & display",
    href: "/settings", restricted: false }
];

export function HubLauncher({ projects, governedApps, canManageEcosystem }: HubLauncherProps) {
  const { language, density, setLanguage } = useHubPreferences();
  const en = language === "en";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HubGroup | "all">("all");
  const canonical = useMemo(() => new Set(projects.map((item) => item.projectId)), [projects]);
  const filteredModules = modules.filter((module) =>
    (!module.restricted || canManageEcosystem) &&
    appSearchKey([module.vi, module.en, module.descriptionVi, module.descriptionEn].join(" "))
      .includes(appSearchKey(query))
  );
  const filteredApps = governedApps.filter((app) =>
    (category === "all" || app.group === category) && matchesApp(app, query));
  const extraProjects = projects.filter((item) =>
    !governedApps.some((app) => app.projectId === item.projectId) &&
    appSearchKey(item.name).includes(appSearchKey(query)));

  return (
    <div className={styles.launcher} data-density={density} lang={language}>
      <header className={styles.hero}>
        <div>
          <span className={styles.kicker}>BLUEPRINT OS · {en ? "CONTROL HUB" : "TRUNG TÂM ĐIỀU PHỐI"}</span>
          <h1>{en ? "Your apps, in one place." : "Ứng dụng của bạn, trong một nơi."}</h1>
          <p>{en
            ? "Find an app or function, then open it directly. Related tools stay in the same ecosystem."
            : "Tìm ứng dụng hoặc chức năng, chạm vào biểu tượng để mở. Công cụ liên quan được xếp chung một hệ sinh thái."}</p>
        </div>
        <div className={styles.languages} role="group" aria-label="Language / Ngôn ngữ">
          <button type="button" aria-pressed={!en} onClick={() => setLanguage("vi")}>VI</button>
          <button type="button" aria-pressed={en} onClick={() => setLanguage("en")}>EN</button>
        </div>
      </header>

      <div className={styles.searchBar}>
        <span aria-hidden="true">⌕</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder={en ? "Find apps, tools, workflows…" : "Tìm ứng dụng, công cụ, quy trình…"}
          aria-label={en ? "Search the Hub" : "Tìm kiếm trong Hub"}/>
        {query ? <button type="button" onClick={() => setQuery("")}
          aria-label={en ? "Clear search" : "Xóa tìm kiếm"}>×</button> : null}
      </div>

      {filteredModules.length ? (
        <section className={styles.section} aria-labelledby="hub-tool-heading">
          <div className={styles.sectionHeading}>
            <h2 id="hub-tool-heading">{en ? "Tools" : "Công cụ"}</h2>
            <span>{en ? "Tap to open" : "Chạm để mở"}</span>
          </div>
          <div className={styles.toolGrid}>
            {filteredModules.map((module) => (
              <Link key={module.id} href={module.href} className={styles.toolTile}
                title={en ? module.descriptionEn : module.descriptionVi}>
                <span className={styles.toolIcon} data-module={module.id} aria-hidden="true">{module.icon}</span>
                <strong>{en ? module.en : module.vi}</strong>
                <small>{en ? module.descriptionEn : module.descriptionVi}</small>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="hub-app-heading">
        <div className={styles.sectionHeading}>
          <div>
            <h2 id="hub-app-heading">{en ? "Applications & ecosystems" : "Ứng dụng & hệ sinh thái"}</h2>
            <p>{canManageEcosystem
              ? en
                ? "Governed repository ≠ installed application. Only confirmed canonical profiles open the workspace."
                : "Repository được quản lý chưa đồng nghĩa ứng dụng đã triển khai. Chỉ hồ sơ chuẩn có thật mới mở thẳng workspace."
              : en ? "Only projects you are authorized to access appear here." : "Chỉ hiển thị dự án bạn có quyền truy cập."}</p>
          </div>
          {canManageEcosystem ? (
            <Link className={styles.allApps} href="/ecosystem">{en ? "All apps →" : "Xem tất cả →"}</Link>
          ) : null}
        </div>
        {canManageEcosystem ? (
          <div className={styles.filters} role="group" aria-label={en ? "Filter application groups" : "Lọc nhóm ứng dụng"}>
            <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>
              {en ? "All" : "Tất cả"}
            </button>
            {groupOrder.map((group) => (
              <button type="button" key={group} aria-pressed={category === group}
                onClick={() => setCategory(group)}>
                <span aria-hidden="true">{groupLabels[group].icon} </span>
                {en ? groupLabels[group].en : groupLabels[group].vi}
              </button>
            ))}
          </div>
        ) : null}

        {(canManageEcosystem ? groupOrder : []).map((group) => {
          const apps = filteredApps.filter((item) => item.group === group);
          if (!apps.length) return null;
          return (
            <div className={styles.group} key={group}>
              <h3>{groupLabels[group].icon} {en ? groupLabels[group].en : groupLabels[group].vi}</h3>
              <div className={styles.appGrid}>
                {apps.map((app) => {
                  const provisioned = canonical.has(app.projectId);
                  return (
                    <Link key={app.projectId} className={styles.appTile}
                      href={provisioned ? "/projects/" + encodeURIComponent(app.projectId)
                        : "/ecosystem?app=" + encodeURIComponent(app.projectId)}
                      title={app.repository}>
                      <span className={styles.appIcon} data-group={group} aria-hidden="true">{app.icon}</span>
                      <strong>{en ? app.en : app.vi}</strong>
                      <small>{provisioned
                        ? en ? "Open workspace" : "Mở dự án"
                        : en ? "View app details" : "Xem thông tin"}</small>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        {extraProjects.length ? (
          <div className={styles.group}>
            <h3>📁 {en ? "My other projects" : "Dự án khác của tôi"}</h3>
            <div className={styles.appGrid}>
              {extraProjects.map((item) => (
                <Link key={item.projectId} className={styles.appTile}
                  href={"/projects/" + encodeURIComponent(item.projectId)}>
                  <span className={styles.appIcon} aria-hidden="true">📁</span>
                  <strong>{item.name}</strong>
                  <small>{item.blueprintLevel} · {en ? "Canonical" : "Hồ sơ chuẩn"}</small>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {!filteredApps.length && !extraProjects.length ? (
          <p className={styles.empty}>{en
            ? "No matching applications in the authorized catalog."
            : "Không tìm thấy ứng dụng phù hợp trong danh mục được phép xem."}</p>
        ) : null}
      </section>
      <footer className={styles.footer}>
        {en ? "Hub catalog is an index, not evidence of deployment or QA PASS."
          : "Danh mục Hub chỉ giúp tìm và mở nội dung; không tự xác nhận ứng dụng đã triển khai hay QA PASS."}
      </footer>
    </div>
  );
}
