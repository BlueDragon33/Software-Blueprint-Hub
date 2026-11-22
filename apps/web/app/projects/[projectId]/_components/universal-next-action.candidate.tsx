"use client";
/** Candidate universal Next Action UI for existing authenticated Blueprint workspace.
 * All data must be resolved server-side after PROJECT_READ. No host/tab automation. */
import { useRef, useState } from "react";
import { saveReviewedNextActionAction } from "../prompt/actions";
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
 const [feedback,setFeedback]=useState<string|null>(null);
 const [submitting,setSubmitting]=useState(false);
 const requestIdRef=useRef<string|null>(null);
 const safePath=view.action?.kind==="internal-navigation" && /^\/(?!\/)[a-zA-Z0-9/_?=&%.-]*$/.test(view.action.href);
 // One safe internal navigation action. A Git SHA is not the canonical Prompt source digest.
 const actionable=Boolean(safePath);

 async function approveAndContinue(){
   if(!actionable || !safePath || submitting)return;
   if(!view.sourceRevision){setFeedback("Nguồn chưa xác minh. Không thể ghi nhiệm vụ đã duyệt.");return;}
   setSubmitting(true);setFeedback(null);
   try{
     if(!requestIdRef.current)requestIdRef.current=window.crypto.randomUUID();
     const result=await saveReviewedNextActionAction({
       projectId:view.projectId,requestId:requestIdRef.current,
       sourceRevision:view.sourceRevision,kind:supplementKind,
       content:supplement,selectedWorkPackageId:view.workPackageId
     });
     if(!result.ok){setFeedback(result.message);return;}
     window.location.assign(view.action!.href);
   }catch{
     setFeedback("Lưu nhiệm vụ hoặc điều hướng thất bại. Không có Agent nào được kích hoạt.");
   }finally{setSubmitting(false);}
 }

 return <section className={styles.panel} aria-label="Blueprint OS · Workspace" data-state={view.state}>
   <div className={styles.top}><div><p className={styles.kicker}>BLUEPRINT OS · WORKSPACE</p>
     <h2>{view.projectName}</h2></div><span className={styles.state}>{view.state==="ready"?"Sẵn sàng":view.state==="complete"?"Hoàn tất phạm vi":view.state==="blocked"?"Bị chặn":"Chưa xác minh"}</span></div>
   <div className={styles.summary}><strong>{view.workPackageId??"Chưa xác định Work Package"}</strong>
     <span>{view.checkpointRef?"Checkpoint: "+view.checkpointRef:"Chưa có checkpoint được cung cấp"}</span></div>
   <div className={styles.actions}>
     <button className={styles.primary} type="button" disabled={!actionable}
       onClick={()=>{if(safePath && view.action)window.location.assign(view.action.href);}}>
       {view.state==="ready"?"Tiếp tục công việc →":view.state==="blocked"?"Mở Workspace · Gỡ nút thắt →":"Mở Workspace · Kiểm tra nguồn →"}
     </button>
     <button className={styles.detailsToggle} type="button" onClick={()=>setReviewOpen(open=>!open)}
       aria-expanded={reviewOpen} aria-controls="ana-review">
       {reviewOpen?"Ẩn kế hoạch và yêu cầu bổ sung":"Xem kế hoạch và bổ sung nhiệm vụ"}
     </button>
   </div>
   {reviewOpen && <div id="ana-review" className={styles.review} aria-label="Hai luồng nhiệm vụ">
       <div className={styles.stream}><h3>Luồng 1 · Nhiệm vụ hiện tại</h3>
         <p><strong>{view.workPackageId??"Chưa xác định Work Package"}</strong></p>
         <p>Trạng thái: {view.state}. Checkpoint: {view.checkpointRef??"UNVERIFIED"}.</p>
         <p>{view.reason??"Nội dung chi tiết sẽ được xác nhận trong Workspace từ nguồn dữ liệu có thẩm quyền."}</p>
       </div>
       <div className={styles.stream}><h3>Luồng 2 · Bổ sung hoặc nhiệm vụ khác</h3>
         <label htmlFor="ana-kind">Loại yêu cầu</label>
         <select id="ana-kind" value={supplementKind} onChange={e=>{setSupplementKind(e.target.value as "addition"|"other");requestIdRef.current=null;setFeedback(null)}}>
           <option value="addition">Bổ sung vào nhiệm vụ hiện tại</option><option value="other">Nhiệm vụ khác cần xếp lịch</option>
         </select>
         <label htmlFor="ana-supplement">Nội dung (không bắt buộc)</label>
         <textarea id="ana-supplement" maxLength={2000} rows={4} value={supplement}
           placeholder="Nhập điều chỉnh hoặc yêu cầu mới…" onChange={e=>{setSupplement(e.target.value);requestIdRef.current=null;setFeedback(null)}}/>
         <p className={styles.note}>Yêu cầu chưa được lưu trước khi duyệt. Sau duyệt sẽ ghi thành Work Package PLANNED trên máy chủ nếu tài khoản có quyền. Không nhập dữ liệu nhạy cảm.</p>
       </div>
       <button className={styles.primary} type="button" disabled={!actionable || !safePath || submitting}
         onClick={()=>{void approveAndContinue();}} aria-busy={submitting}>
         {submitting?"Đang đối chiếu nguồn và lưu…":supplement.trim()?"Lưu nhiệm vụ PLANNED và mở Workspace →":"Mở Workspace, không tạo nhiệm vụ mới →"}
       </button>
       {feedback&&<p role="alert">{feedback}</p>}
       <p className={styles.note}>Mọi yêu cầu bổ sung được lưu vào Work Package chuẩn với trạng thái PLANNED sau khi xác thực và kiểm tra phiên bản. Agent không tự chạy khi chưa có runner và quyền thực thi hợp lệ.</p>
       <button className={styles.detailsToggle} type="button" onClick={()=>setReviewOpen(false)}>Đóng · chưa thực hiện</button>
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
