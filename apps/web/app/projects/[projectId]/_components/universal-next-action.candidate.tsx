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
 const [reviewOpen,setReviewOpen]=useState(false);
 const [supplement,setSupplement]=useState("");
 const [supplementKind,setSupplementKind]=useState<"addition"|"other">("addition");
 const [approved,setApproved]=useState(false);
 const [feedback,setFeedback]=useState<string|null>(null);
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
   {!reviewOpen ? <button className={styles.primary} type="button" onClick={()=>setReviewOpen(true)}
     aria-expanded={false} aria-controls="ana-review">Xem và bổ sung nhiệm vụ →</button>
     : <div id="ana-review" className={styles.review} aria-label="Duyệt hai luồng nhiệm vụ">
       <div className={styles.stream}><h3>Luồng 1 · Nhiệm vụ hiện tại</h3>
         <p><strong>{view.workPackageId??"Chưa xác định Work Package"}</strong></p>
         <p>Trạng thái: {view.state}. Checkpoint: {view.checkpointRef??"UNVERIFIED"}.</p>
         <p>{view.reason??"Nội dung chi tiết sẽ được xác nhận trong Workspace từ nguồn dữ liệu có thẩm quyền."}</p>
       </div>
       <div className={styles.stream}><h3>Luồng 2 · Bổ sung hoặc nhiệm vụ khác</h3>
         <label htmlFor="ana-kind">Loại yêu cầu</label>
         <select id="ana-kind" value={supplementKind} onChange={e=>{setSupplementKind(e.target.value as "addition"|"other");setApproved(false)}}>
           <option value="addition">Bổ sung vào nhiệm vụ hiện tại</option><option value="other">Nhiệm vụ khác cần xếp lịch</option>
         </select>
         <label htmlFor="ana-supplement">Nội dung (không bắt buộc)</label>
         <textarea id="ana-supplement" maxLength={4000} rows={4} value={supplement}
           placeholder="Nhập điều chỉnh hoặc yêu cầu mới…" onChange={e=>{setSupplement(e.target.value);setApproved(false)}}/>
         <p className={styles.note}>Bản nháp chưa được lưu hoặc gửi. Không nhập dữ liệu nhạy cảm. Việc lưu và thực thi cần API Workspace được xác thực.</p>
       </div>
       <label className={styles.approval}><input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
         Tôi đã xem hai luồng và đồng ý chuyển sang Workspace để hoàn tất duyệt.</label>
       <button className={styles.primary} type="button" disabled={!approved || !actionable || !safePath}
         onClick={()=>{
           try {
             const payload={version:1,projectId:view.projectId,workPackageId:view.workPackageId,
               sourceRevision:view.sourceRevision,checkpointRef:view.checkpointRef,
               supplementKind,supplement:supplement.trim(),createdAt:new Date().toISOString()};
             window.sessionStorage.setItem("blueprint:next-action-draft:"+view.projectId,JSON.stringify(payload));
             window.location.assign(view.action!.href);
           } catch {
             setFeedback("Không thể chuyển bản nháp an toàn. Chưa gửi hoặc chạy nhiệm vụ.");
           }
         }}>Duyệt và mở Workspace →</button>
       {feedback&&<p role="alert">{feedback}</p>}
       <p className={styles.note}>Chỉ chuyển bản nháp trong phiên trình duyệt hiện tại. Chưa tạo Work Package, chưa chạy Agent và chưa ghi checkpoint. Workspace sẽ yêu cầu kiểm tra lại nguồn trước khi thực hiện.</p>
       <button className={styles.detailsToggle} type="button" onClick={()=>{setReviewOpen(false);setApproved(false)}}>Đóng · chưa thực hiện</button>
     </div>}
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
