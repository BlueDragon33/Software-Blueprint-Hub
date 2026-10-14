"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  appSearchKey, groupLabels, groupOrder, matchesApp,
  type HubAppPresentation, type HubGroup
} from "../../src/lib/hub-app-directory";
import { useHubPreferences } from "../_components/hub-preferences";
import styles from "./ecosystem.module.css";

interface Props {
  readonly apps: readonly HubAppPresentation[];
  readonly canonicalProjectIds: readonly string[];
  readonly initialAppId?: string;
}

export function EcosystemDirectory({ apps, canonicalProjectIds, initialAppId }: Props) {
  const { language } = useHubPreferences();
  const en = language === "en";
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<HubGroup | "all">("all");
  const [selectedId, setSelectedId] = useState(initialAppId ?? "");
  const provisioned = useMemo(() => new Set(canonicalProjectIds), [canonicalProjectIds]);
  const matches = apps.filter((app) => (group === "all" || app.group === group) && matchesApp(app, query));
  const selected = apps.find((app) => app.projectId === selectedId);
  const eligible = selected && provisioned.has(selected.projectId);
  return (
    <main className={styles.shell} lang={language}>
      <nav className={styles.breadcrumb}><Link href="/">{en ? "Home" : "Trang chủ"}</Link> / {en ? "Ecosystem" : "Hệ sinh thái"}</nav>
      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{en ? "APP MANAGER" : "QUẢN LÝ HỆ SINH THÁI"}</p>
          <h1>{en ? "Apps by purpose" : "Tìm ứng dụng theo công việc"}</h1>
          <p>{en
            ? "Related products are grouped together. Pick an icon to see its real connection and open the available content."
            : "Ứng dụng có liên quan được xếp chung nhóm. Chọn biểu tượng để xem kết nối thực tế và mở nội dung đang có."}</p>
        </div>
        <Link className={styles.back} href="/">{en ? "← Home screen" : "← Màn hình chính"}</Link>
      </header>
      <div className={styles.find}>
        <label htmlFor="ecosystem-search">{en ? "Find app" : "Tìm ứng dụng"}</label>
        <input id="ecosystem-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
          placeholder={en ? "Type an app, topic or repo…" : "Gõ tên ứng dụng, chủ đề hoặc repo…"} />
      </div>
      <div className={styles.filters} role="group" aria-label={en ? "Ecosystem filters" : "Lọc hệ sinh thái"}>
        <button type="button" aria-pressed={group === "all"} onClick={() => setGroup("all")}>{en ? "All" : "Tất cả"}</button>
        {groupOrder.map((item) => <button type="button" key={item}
          aria-pressed={group === item} onClick={() => setGroup(item)}>
          {groupLabels[item].icon} {en ? groupLabels[item].en : groupLabels[item].vi}
        </button>)}
      </div>
      <div className={styles.content}>
        <section className={styles.list} aria-label={en ? "Governed apps" : "Ứng dụng được quản lý"}>
          {matches.map((app) => <button className={styles.app} type="button"
            key={app.projectId} onClick={() => setSelectedId(app.projectId)}
            aria-pressed={selectedId === app.projectId}>
            <span className={styles.icon} aria-hidden="true">{app.icon}</span>
            <span><strong>{en ? app.en : app.vi}</strong>
              <small>{en ? groupLabels[app.group].en : groupLabels[app.group].vi}</small></span>
          </button>)}
          {!matches.length && <p>{en ? "No matching apps." : "Không có ứng dụng khớp tìm kiếm."}</p>}
        </section>
        <section className={styles.detail} aria-live="polite">
          {selected ? (
            <>
              <span className={styles.largeIcon} aria-hidden="true">{selected.icon}</span>
              <p className={styles.eyebrow}>{en ? "SELECTED APPLICATION" : "ỨNG DỤNG ĐANG CHỌN"}</p>
              <h2>{en ? selected.en : selected.vi}</h2>
              <p className={styles.status}>{eligible
                ? en ? "Canonical Project Profile available" : "Đã có hồ sơ dự án chuẩn"
                : en ? "Governed repository; no canonical Project Profile" : "Repository đã đăng ký quản lý; chưa có hồ sơ dự án chuẩn"}</p>
              <dl>
                <div><dt>Repository</dt><dd>{selected.repository}</dd></div>
                <div><dt>Branch</dt><dd>{selected.branch}</dd></div>
                <div><dt>Blueprint</dt><dd>{selected.blueprintLevel}</dd></div>
              </dl>
              <div className={styles.actions}>
                {eligible && (
                  <Link className={styles.primary} href={"/projects/" + encodeURIComponent(selected.projectId)}>
                    {en ? "Open workspace →" : "Mở nội dung dự án →"}
                  </Link>
                )}
                <a className={styles.secondary} href={"https://github.com/" + selected.repository}
                  target="_blank" rel="noopener noreferrer">
                  {en ? "View actual source ↗" : "Xem mã nguồn thực tế ↗"}
                </a>
              </div>
              {!eligible && <p className={styles.note}>{en
                ? "No verified in-app deployment URL is associated with this repository in the Hub. Source access does not imply the app has been published."
                : "Hub chưa xác minh được URL ứng dụng đang chạy cho repository này. Mở mã nguồn không đồng nghĩa ứng dụng đã được phát hành."}</p>}
              {selected.projectId === "project:application-management" && (
                <Link className={styles.crossLink} href="/projects/project%3Ablueprint-os/prompt/workflow">
                  {en ? "View the central Visa/KD-MID workflow →" : "Xem workflow Visa/KD-MID trong Hub →"}
                </Link>
              )}
            </>
          ) : (
            <div className={styles.emptyDetail}>
              <span aria-hidden="true">📱</span>
              <h2>{en ? "Choose an application" : "Chọn một ứng dụng"}</h2>
              <p>{en ? "Its verified links and status will appear here." : "Liên kết thực tế và trạng thái sẽ hiện tại đây."}</p>
            </div>
          )}
        </section>
      </div>
      <p className={styles.disclaimer}>{en
        ? "Only System Owners can browse this cross-repository catalog. No deployments, approvals or Project Profiles are invented."
        : "Chỉ System Owner được xem toàn bộ danh mục liên repository. Không tự tạo trạng thái triển khai, phê duyệt hay hồ sơ dự án."}</p>
    </main>
  );
}
