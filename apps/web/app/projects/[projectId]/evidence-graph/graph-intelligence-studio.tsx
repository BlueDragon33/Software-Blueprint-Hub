"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { GraphIntelligenceProjection, IntelligenceNode } from "@blueprint-os/application";
import { GRAPH_LIMITS, graphDomains, graphRelations, traceGraphImpact,
  type GraphDomain, type GraphRelation } from "../../../../../../packages/application/src/graph-intelligence-view";
import { useHubPreferences } from "../../../_components/hub-preferences";
import styles from "./graph-intelligence.module.css";

const W = 224, H = 112, GAP = 54, PAD = 28, COLUMNS = 3;

export function GraphIntelligenceStudio({ graph }: { readonly graph: GraphIntelligenceProjection }) {
  const { language } = useHubPreferences();
  const t = (vi: string, en: string) => language === "vi" ? vi : en;
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("overview");
  const [domain, setDomain] = useState<GraphDomain | "all">("all");
  const [relation, setRelation] = useState<GraphRelation | "all">("all");
  const [verification, setVerification] = useState("all");
  const [selectedId, setSelectedId] = useState("mechanism:constitution");
  const [zoom, setZoom] = useState(1);
  const [recordPage, setRecordPage] = useState(0);
  const [impactOnly, setImpactOnly] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const uid = useId();
  const selected = graph.nodes.find(n => n.id === selectedId) ?? graph.nodes[0];
  const impact = useMemo(() => selected ? traceGraphImpact(graph, selected.id,
    relation === "all" ? graphRelations : [relation]) : [], [graph, selected, relation]);
  const impacted = useMemo(() => new Set(impact.map(x => x.nodeId)), [impact]);
  const matched = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return graph.nodes.filter(n => (domain === "all" || n.domain === domain) &&
      (verification === "all" || n.verification === verification) &&
      (!impactOnly || impacted.has(n.id) || n.id === selected?.id) &&
      (q ? [n.label, n.recordId, n.owner, n.contract, n.source.reference].join(" ").toLocaleLowerCase().includes(q) :
        scope === "records" || n.kind === "mechanism" || n.kind === "project"));
  }, [graph, query, scope, domain, verification, impactOnly, impacted, selected]);
  const pageCount = Math.max(1, Math.ceil(matched.length / GRAPH_LIMITS.renderedNodes));
  const page = Math.min(recordPage, pageCount - 1);
  const visible = matched.slice(page * GRAPH_LIMITS.renderedNodes, (page + 1) * GRAPH_LIMITS.renderedNodes);
  const positions = new Map(visible.map((n, i) => [n.id, { x: PAD + i % COLUMNS * (W + GAP), y: PAD + Math.floor(i / COLUMNS) * (H + GAP) }]));
  const width = PAD * 2 + Math.min(COLUMNS, visible.length) * (W + GAP) - GAP;
  const height = PAD * 2 + Math.ceil(visible.length / COLUMNS) * (H + GAP) - GAP;
  const visibleEdges = graph.edges.filter(e => positions.has(e.from) && positions.has(e.to) &&
    e.kind !== "scopes" && (relation === "all" || e.relation === relation));
  const related = selected ? graph.edges.filter(e => e.kind !== "scopes" && (e.from === selected.id || e.to === selected.id) &&
    (relation === "all" || e.relation === relation)) : [];
  const findings = graph.findings.filter(f => !selected || f.nodeIds.includes(selected.id));
  const name = (id: string) => graph.nodes.find(n => n.id === id)?.label ?? id;
  const select = (id: string) => { setSelectedId(id); };
  const resetFilters = () => {
    setQuery(""); setDomain("all"); setVerification("all"); setScope("overview");
    setRelation("all"); setImpactOnly(false); setRecordPage(0);
  };
  function sourceLink(node: IntelligenceNode) {
    return graph.sourceCodeRevision
      ? "https://github.com/BlueDragon33/Software-Blueprint-Hub/blob/" + graph.sourceCodeRevision + "/" + node.source.codePath
      : null;
  }

  return <section className={styles.studio} aria-labelledby={uid + "-title"}>
    <header className={styles.header}>
      <div><p className={styles.kicker}>Blueprint OS</p>
        <h2 id={uid + "-title"}>Graph Intelligence Studio</h2>
        <p>{t("Khám phá các cơ chế độc lập, quan hệ và bằng chứng của dự án.", "Explore independent mechanisms, relationships and project evidence.")}</p></div>
      <span className={styles.badge}>{t("Phân tích quy tắc · không phải LLM", "Deterministic analysis · not an LLM")}</span>
    </header>
    <p className={styles.boundary}>{t("Projection chỉ đọc. Trạng thái được ghi nhận không thay thế kiểm chứng độc lập hoặc phê duyệt của con người.",
      "Read-only projection. Recorded state does not replace independent verification or human authorization.")}</p>
    <div className={styles.summary} aria-label={t("Tóm tắt nguồn", "Source summary")}>
      <span><strong>{graph.nodes.length}</strong> {t("bản ghi / contract", "records / contracts")}</span>
      <span><strong>{graph.edges.length}</strong> {t("quan hệ có kiểu", "typed relationships")}</span>
      <span><strong>{graph.findings.length}</strong> {t("phát hiện cần xem xét", "advisory findings")}</span>
      <span>Constitution {graph.policyVersion}</span>
    </div>
    <form className={styles.filters} onSubmit={e => e.preventDefault()} aria-label={t("Bộ lọc đồ thị", "Graph filters")}>
      <label>{t("Tìm kiếm", "Search graph")}<input type="search" value={query} onChange={e => { setQuery(e.target.value); setRecordPage(0); }}
        placeholder={t("Tên, mã, owner hoặc nguồn…", "Name, ID, owner or source…")} /></label>
      <label>{t("Phạm vi hiển thị", "View scope")}<select value={scope} onChange={e => { setScope(e.target.value); setRecordPage(0); }}>
        <option value="overview">{t("Tổng quan cơ chế", "Mechanism overview")}</option><option value="records">{t("Tất cả bản ghi", "All source records")}</option></select></label>
      <label>{t("Miền", "Domain")}<select value={domain} onChange={e => { setDomain(e.target.value as GraphDomain | "all"); setRecordPage(0); }}>
        <option value="all">{t("Mọi miền", "All domains")}</option>{graphDomains.map(d => <option key={d} value={d}>{d}</option>)}</select></label>
      <label>{t("Quan hệ", "Relationship")}<select value={relation} onChange={e => setRelation(e.target.value as GraphRelation | "all")}>
        <option value="all">{t("Mọi quan hệ", "All relationships")}</option>{graphRelations.map(r => <option key={r} value={r}>{r}</option>)}</select></label>
      <label>{t("Kiểm chứng", "Verification")}<select value={verification} onChange={e => { setVerification(e.target.value); setRecordPage(0); }}>
        <option value="all">{t("Mọi trạng thái", "All verification states")}</option>
        <option value="unverified">unverified</option><option value="recorded-pass">recorded-pass</option><option value="recorded-fail">recorded-fail</option></select></label>
      <button type="button" onClick={resetFilters}>{t("Xóa bộ lọc", "Reset filters")}</button>
    </form>
    <div className={styles.toolbar}>
      <div className={styles.actions} aria-label={t("Điều khiển sơ đồ", "Diagram controls")}>
        <button type="button" onClick={() => setZoom(z => Math.max(.5, z - .25))} disabled={zoom <= .5} aria-label={t("Thu nhỏ", "Zoom out")}>−</button>
        <output aria-label={t("Mức thu phóng", "Zoom level")}>{Math.round(zoom * 100)}%</output>
        <button type="button" onClick={() => setZoom(z => Math.min(2, z + .25))} disabled={zoom >= 2} aria-label={t("Phóng to", "Zoom in")}>+</button>
        <button type="button" onClick={() => { setZoom(1); viewport.current?.scrollTo({ left: 0, top: 0 }); }}>{t("Đặt lại khung nhìn", "Reset view")}</button>
        <button type="button" aria-pressed={impactOnly} onClick={() => { setImpactOnly(v => !v); setScope("records"); setRecordPage(0); }}>{t("Chỉ hiện tác động", "Impact only")}</button>
      </div>
      <p role="status" aria-live="polite">{visible.length}/{matched.length} {t("khớp bộ lọc", "matching nodes")} · {graph.nodes.length - visible.length} {t("ngoài khung nhìn", "outside this view")}</p>
    </div>
    <div className={styles.legend} aria-label={t("Chú giải quan hệ", "Relationship legend")}>
      {graphRelations.map(r => <span key={r} data-relation={r}>{r}</span>)}
    </div>
    {!visible.length ? <div className={styles.empty} role="status">
      {t("Không có bản ghi khớp bộ lọc. Dữ liệu nguồn không bị thay đổi.", "No source records match these filters. Source data has not changed.")}
      <button type="button" onClick={resetFilters}>{t("Hiện tổng quan", "Show overview")}</button>
    </div> : <>
      <p className={styles.hint}>{t("Cuộn hoặc kéo vùng trống để di chuyển; dùng Tab để chọn node. Mũi tên mô tả quan hệ, không phải hoàn thành.",
        "Scroll or drag the background to pan; Tab selects nodes. Arrows describe relationships, not completion.")}</p>
      <div className={styles.viewport} ref={viewport} tabIndex={0} role="region" aria-label={t("Đồ thị có thể cuộn", "Scrollable intelligence graph")}
        onPointerDown={e => {
          if ((e.target as HTMLElement).closest("button") || e.button !== 0) return;
          drag.current = { x: e.clientX, y: e.clientY, left: e.currentTarget.scrollLeft, top: e.currentTarget.scrollTop };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={e => {
          if (drag.current) { e.currentTarget.scrollLeft = drag.current.left + drag.current.x - e.clientX;
            e.currentTarget.scrollTop = drag.current.top + drag.current.y - e.clientY; }
        }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <div style={{ width: width * zoom, height: height * zoom }}>
          <div className={styles.canvas} style={{ width, height, transform: `scale(${zoom})` }}>
            <svg width={width} height={height} className={styles.connections} aria-hidden="true">
              <defs><marker id={uid + "-arrow"} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto-start-reverse">
                <path d="M0 0L8 4L0 8Z" fill="context-stroke" /></marker></defs>
              {visibleEdges.map(e => {
                const from = positions.get(e.from)!, to = positions.get(e.to)!;
                const x1 = from.x + W / 2, y1 = from.y + H, x2 = to.x + W / 2, y2 = to.y;
                return <path key={e.id} data-relation={e.relation} className={styles.edge}
                  data-selected={e.from === selected?.id || e.to === selected?.id}
                  d={`M${x1} ${y1} C${x1} ${y1 + 30},${x2} ${y2 - 30},${x2} ${y2}`}
                  markerEnd={`url(#${uid}-arrow)`} />;
              })}
            </svg>
            {visible.map(n => { const p = positions.get(n.id)!; return <button key={n.id} type="button"
              className={styles.node} style={{ left: p.x, top: p.y, width: W, height: H }}
              data-kind={n.kind} aria-pressed={selected?.id === n.id} aria-controls={uid + "-detail"}
              onClick={() => select(n.id)} title={n.label}>
              <span>{n.domain} · {n.kind}</span><strong>{n.label}</strong><small>{n.verification}</small>
            </button>; })}
          </div>
        </div>
      </div>
      {pageCount > 1 ? <nav className={styles.actions} aria-label={t("Trang bản ghi", "Record pages")}>
        <button type="button" disabled={page === 0} onClick={() => setRecordPage(page - 1)}>{t("Trước", "Previous page")}</button>
        <span>{page + 1}/{pageCount}</span><button type="button" disabled={page + 1 === pageCount} onClick={() => setRecordPage(page + 1)}>{t("Sau", "Next page")}</button>
        <span>{t("Phân tích vẫn dùng toàn bộ nguồn.", "Analysis still uses every source record.")}</span>
      </nav> : null}
    </>}
    {selected ? <section id={uid + "-detail"} className={styles.detail} aria-label={t("Chi tiết node", "Selected node details")}>
      <h3>{selected.label}</h3><p className={styles.hint}>{selected.recordId} · {selected.owner}</p>
      {!positions.has(selected.id) ? <p role="status">{t("Node đang chọn nằm ngoài bộ lọc; chi tiết vẫn theo nguồn đầy đủ.", "Selected node is outside the current view; details retain full-source context.")}</p> : null}
      <dl className={styles.states}>
        <div><dt>{t("Thực thi", "Execution")}</dt><dd>{selected.execution}</dd></div>
        <div><dt>{t("Kiểm chứng", "Verification")}</dt><dd>{selected.verification}</dd></div>
        <div><dt>{t("Phê duyệt", "Approval")}</dt><dd>{selected.approval}</dd></div>
      </dl>
      <details open><summary>{t("Contract & nguồn", "Contract & provenance")}</summary>
        <p>{selected.contract}</p><dl>
          <div><dt>{t("Loại nguồn", "Source kind")}</dt><dd>{selected.source.kind}</dd></div>
          <div><dt>{t("Tham chiếu", "Reference")}</dt><dd>{selected.source.reference}</dd></div>
          <div><dt>Revision</dt><dd>{selected.source.revision ?? t("Chưa xác minh", "Unverified")}</dd></div>
          <div><dt>SHA-256</dt><dd><code>{selected.source.digest}</code></dd></div>
          <div><dt>{t("Mã nguồn", "Source code")}</dt><dd>{sourceLink(selected)
            ? <a href={sourceLink(selected)!} target="_blank" rel="noreferrer">{selected.source.codePath}</a>
            : selected.source.codePath}</dd></div>
        </dl><p>{t("Digest mô tả nội dung nguồn đã đọc; không xác nhận tính đúng của artifact hoặc review.", "Digest identifies the loaded source content; it does not authenticate artifact bytes or reviewer authority.")}</p>
      </details>
      <details><summary>{t("Trách nhiệm & ràng buộc", "Responsibilities & constraints")}</summary>
        <ul>{selected.details.map((d, i) => <li key={i}>{d}</li>)}</ul></details>
      <details open><summary>{t("Quan hệ trực tiếp", "Direct relationships")} ({related.length})</summary>
        {related.length ? <ul className={styles.list}>{related.map(e => <li key={e.id}>
          <span className={styles.badge}>{e.relation} · {e.kind} · {e.provenance}</span>
          <p><button type="button" onClick={() => select(e.from)}>{name(e.from)}</button> → <button type="button" onClick={() => select(e.to)}>{name(e.to)}</button></p>
          <p>{e.explanation}</p></li>)}</ul> : <p>{t("Không có quan hệ khớp bộ lọc.", "No relationships match this filter.")}</p>}
      </details>
      <details><summary>{t("Tác động tiềm năng", "Potential impact")} ({impact.length})</summary>
        <p>{t("Đường đi theo loại quan hệ đã chọn. Đây là phạm vi cần kiểm tra, không phải lỗi hoặc lịch thực thi.", "Paths follow the selected relationship types. They identify review scope, not defects or an execution schedule.")}</p>
        <ul className={styles.list}>{impact.map(item => <li key={item.nodeId}>
          <button type="button" onClick={() => select(item.nodeId)}>{name(item.nodeId)}</button>
          <ol>{item.path.map(id => { const e = graph.edges.find(x => x.id === id)!; return <li key={id}>{name(e.from)} → {name(e.to)} · {e.kind}</li>; })}</ol>
        </li>)}</ul>
      </details>
      <details open={findings.length > 0}><summary>{t("Phát hiện tại node", "Node findings")} ({findings.length})</summary>
        <ul className={styles.list}>{findings.map(f => <li key={f.id}><strong>{f.code} · {f.severity}</strong>
          <p>{f.reason}</p><p>{f.recommendation}</p><small>Owner: {f.owner}</small></li>)}</ul>
      </details>
    </section> : <p role="status">{t("Chưa có nguồn đồ thị.", "No graph sources are available.")}</p>}
    <details className={styles.detail}><summary>{t("Tất cả phát hiện & revision", "All findings & revision")} ({graph.findings.length})</summary>
      <p>{t("Khuyến nghị từ quy tắc; quyền quyết định thuộc cơ chế sở hữu.", "Rule-based recommendations; decisions remain with the responsible domain.")}</p>
      <ul className={styles.list}>{graph.findings.map(f => <li key={f.id}><strong>{f.code}</strong><p>{f.reason}</p><p>{f.recommendation}</p>
        {f.nodeIds.map(id => <button type="button" key={id} onClick={() => select(id)}>{name(id)}</button>)}</li>)}</ul>
      <p>Projection: <code>{graph.fingerprint}</code></p>
      <p>Source code revision: <code>{graph.sourceCodeRevision ?? "UNVERIFIED"}</code></p>
    </details>
  </section>;
}
