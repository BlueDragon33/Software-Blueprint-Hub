"use client";
import {useEffect,useState} from "react";
type Draft={version:1;projectId:string;workPackageId:string|null;sourceRevision:string|null;checkpointRef:string|null;supplementKind:"addition"|"other";supplement:string;createdAt:string};
export function NextActionDraftInbox({projectId,currentSourceRevision}:{projectId:string;currentSourceRevision:string}){
 const [draft,setDraft]=useState<Draft|null>(null);
 const [status,setStatus]=useState("");
 const key="blueprint:next-action-draft:"+projectId;
 useEffect(()=>{
  try{
   const raw=window.sessionStorage.getItem(key);if(!raw)return;
   const v:unknown=JSON.parse(raw);
   if(!v||typeof v!=="object")return;
   const x=v as Partial<Draft>;
   if(x.version!==1||x.projectId!==projectId||typeof x.supplement!=="string"||x.supplement.length>4000||
      !["addition","other"].includes(x.supplementKind??"")||typeof x.createdAt!=="string")return;
   setDraft(x as Draft);
  }catch{setStatus("Bản nháp không hợp lệ hoặc không thể đọc. Không có nhiệm vụ nào được gửi.");}
 },[projectId,key]);
 if(!draft)return status?<p role="status">{status}</p>:null;
 const stale=!draft.sourceRevision||draft.sourceRevision!==currentSourceRevision;
 return <section className="workspace-section" aria-label="Nhiệm vụ đã duyệt từ Overview">
  <div className="workspace-section-heading"><div><p className="section-kicker">Next Action · Bản nháp chuyển tiếp</p>
   <h3>Hai luồng nhiệm vụ đang chờ xử lý</h3></div></div>
  <div className="prompt-card"><h4>Luồng 1 · Nhiệm vụ gốc</h4>
   <p>Work Package: {draft.workPackageId??"Chưa xác minh"} · Checkpoint: {draft.checkpointRef??"Chưa xác minh"}</p>
   <p>Source revision: {draft.sourceRevision??"UNVERIFIED"}</p>
   <p role="status">{stale?"Nguồn chưa xác minh hoặc đã thay đổi — không được thực thi.":"Source revision trùng nguồn hiện tại; vẫn cần kiểm tra quyền và gate."}</p>
   <h4>Luồng 2 · {draft.supplementKind==="addition"?"Bổ sung":"Nhiệm vụ khác"}</h4>
   <p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{draft.supplement||"Không có bổ sung"}</p>
   <p>Bản nháp chỉ lưu trong phiên trình duyệt. Chưa được nhập vào canonical Work, chưa dispatch Agent.</p>
   <button type="button" className="secondary-button" onClick={()=>{try{window.sessionStorage.removeItem(key);setDraft(null)}catch{setStatus("Không thể xóa bản nháp.")}}}>Xóa bản nháp</button>
  </div>
 </section>;
}
