"use client";
/** Candidate universal Next Action UI for existing authenticated Blueprint workspace.
 * All data must be resolved server-side after PROJECT_READ. No host/tab automation. */
import { useState } from "react";
import type { ReactNode } from "react";
import styles from "./universal-next-action.candidate.module.css";

export type NextActionView = Readonly<{
  projectId: string; projectName: string; workPackageId: string | null;
  sourceRevision: string | null; checkpointRef: string | null;
  state: "ready" | "blocked" | "complete" | "unverified";
  verifiedAt: string | null; reason: string | null;
  action: Readonly<{label:string;href:string;kind:"internal-navigation"|"external-handoff"}> | null;
}>;
export function UniversalNextActionCandidate({view,children}:{readonly view:NextActionView;readonly children?:ReactNode}) {
 const [expanded,setExpanded]=useState(false);
 const safePath=view.action?.kind==="internal-navigation" && /^\/(?!\/)[a-zA-Z0-9/_?=&%.-]*$/.test(view.action.href);
 const external=view.action?.kind==="external-handoff" && /^https:\/\//.test(view.action.href);
 const canNavigate=Boolean(view.action) && Boolean(safePath||external);
 const verified=Boolean(view.verifiedAt && /^[a-f0-9]{40}$/.test(view.sourceRevision??""));
 // Navigation to an existing authenticated page is allowed even without exact SHA; execution is not.
 const actionable=canNavigate && (safePath || verified);
 const label=actionable?"Tiếp tục công việc":view.state==="complete"?"Xem kết quả công việc":"Xem trạng thái công việc";
 return <section className={styles.panel} aria-label="Blueprint OS · Workspace" data-state={view.state}>
   <div className={styles.top}><div><p className={styles.kicker}>BLUEPRINT OS · WORKSPACE</p>
     <h2>{view.projectName}</h2></div><span className={styles.state}>{view.state==="ready"?"Sẵn sàng":view.state==="complete"?"Hoàn tất phạm vi":view.state==="blocked"?"Bị chặn":"Chưa xác minh"}</span></div>
   <div className={styles.summary}><strong>{view.workPackageId??"Chưa xác định Work Package"}</strong>
     <span>{view.checkpointRef?"Checkpoint: "+view.checkpointRef:"Chưa có checkpoint được cung cấp"}</span></div>
   {actionable ? <a className={styles.primary} href={view.action!.href} rel={external?"noopener noreferrer":undefined}
     target={external?"_blank":undefined}>{label}<span aria-hidden="true"> →</span></a>
     : <button className={styles.primary} type="button" onClick={()=>setExpanded(true)} aria-expanded={expanded}>{label}</button>}
   <button className={styles.detailsToggle} type="button" onClick={()=>setExpanded(x=>!x)} aria-expanded={expanded}>
     {expanded?"Ẩn chi tiết nguồn và giới hạn":"Xem nguồn, quyền và giới hạn"}
   </button>
   {expanded&&<div className={styles.details} role="status">
     <dl><dt>Trạng thái</dt><dd>{view.state}</dd>
       <dt>Source revision</dt><dd>{view.sourceRevision??"UNVERIFIED"}</dd>
       <dt>Đối chiếu lúc</dt><dd>{view.verifiedAt??"UNVERIFIED"}</dd>
       <dt>Checkpoint</dt><dd>{view.checkpointRef??"UNVERIFIED"}</dd>
       <dt>Nguyên nhân</dt><dd>{view.reason??(actionable?"Điều hướng nội bộ; không tự thực thi":"Thiếu quyền, nguồn hoặc hành động được hỗ trợ")}</dd>
       <dt>Hành động</dt><dd>{view.action?.kind??"Không có"}</dd></dl>
     <p>Workspace là nơi thống nhất công việc, prompt và Agent khi có runner được xác thực. Nút hiện tại chỉ mở Workspace; không tự thực thi hay cấp quyền reviewer, merge, ratify hoặc Production.</p>
     {children}
   </div>}
 </section>;
}
