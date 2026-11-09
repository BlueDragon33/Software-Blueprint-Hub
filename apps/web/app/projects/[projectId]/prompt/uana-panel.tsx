"use client";

import { useState } from "react";
import { renderUanaDraft, type UanaChoiceId, type UanaProposal } from "@blueprint-os/application";
import styles from "./uana-panel.module.css";

export function UanaPanel({proposal,notice}:{
  readonly proposal: UanaProposal|null;
  readonly notice?: string;
}) {
  const [selected,setSelected]=useState<UanaChoiceId>(proposal?.recommendedId ?? "continue");
  const [preview,setPreview]=useState(false);
  const [draft,setDraft]=useState("");
  const [feedback,setFeedback]=useState("");

  function select(id:UanaChoiceId) {
    setSelected(id);
    setPreview(false);
    setDraft("");
    setFeedback("");
  }
  function showPreview() {
    if(!proposal) return;
    setDraft(renderUanaDraft(proposal,selected));
    setPreview(true);
    setFeedback("");
  }
  async function copyDraft() {
    if(!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      setFeedback("Đã sao chép. Dán vào ChatGPT Project đúng ngữ cảnh rồi gửi.");
    } catch {
      setFeedback("Không thể tự sao chép. Chọn toàn bộ nội dung ô bên trên để sao chép thủ công.");
    }
  }

  return <section className={styles.shell} aria-labelledby="uana-heading">
    <div className={styles.heading}>
      <div>
        <p className={styles.kicker}>UNIVERSAL ACTIVE NEXT ACTION · UANA v1.0</p>
        <h3 id="uana-heading">Gợi ý tiếp tục · {proposal?.context.projectName ?? "Chưa có nguồn"}</h3>
        <p>Đề xuất chỉ từ Work Package và Quality Gate thuộc dự án hiện tại.
          Chọn phương án, xem trước và chỉnh sửa trước khi chuyển sang ChatGPT.</p>
      </div>
      <span className={styles.status}>BẢN ĐỀ XUẤT</span>
    </div>

    {!proposal ? <p role="status" className={styles.empty}>
      {notice ?? "Không có Work Package chưa hoàn tất, hoặc Prompt Projection chưa được tạo/xác minh.
       Không tạo gợi ý hoặc giả định PASS."}
    </p> : <>
      <fieldset className={styles.choices} disabled={preview}>
        <legend>Chọn hướng xử lý cho đúng Work Package</legend>
        {proposal.options.map(option=><label className={styles.choice} key={option.id}
            data-selected={selected===option.id}>
          <input type="radio" name={"uana-"+proposal.context.projectId}
            value={option.id} checked={selected===option.id}
            onChange={()=>select(option.id)} />
          <span>
            <strong>{option.title}</strong>
            <small>{option.description}</small>
            <small>Work Package: {option.workPackageId}{option.isReviewOnly?" · Chỉ review":""}</small>
          </span>
        </label>)}
      </fieldset>

      {!preview ? <button className={styles.primary} type="button" onClick={showPreview}>
        Xem Active Next Action
      </button> : <div className={styles.preview}>
        <label htmlFor="uana-draft">Xem và chỉnh sửa nội dung tiếp tục</label>
        <textarea id="uana-draft" value={draft} onChange={e=>setDraft(e.target.value)}
          rows={14} spellCheck={false} maxLength={12000} aria-describedby="uana-authority-note"/>
        <div className={styles.buttons}>
          <button type="button" onClick={()=>{setPreview(false);setFeedback("");}}
            className={styles.secondary}>Quay lại chọn phương án</button>
          <button type="button" disabled={!draft.trim()} onClick={()=>void copyDraft()}
            className={styles.primary}>Sao chép để gửi</button>
          <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer"
            className={styles.secondary}>Mở ChatGPT</a>
        </div>
        {feedback?<p role="status" className={styles.feedback}>{feedback}</p>:null}
      </div>}
      <p id="uana-authority-note" className={styles.disclaimer}>
        UANA không tự gửi tin nhắn từ website Blueprint Hub vào ChatGPT.
        Trong giao diện ChatGPT, thao tác “Gửi” là một lượt mới do Owner chủ động thực hiện.
        Bản nháp này không ký duyệt, không cấp ProjectAuthority, không tự thay đổi dữ liệu
        nguồn hoặc cho phép phát hành Production.
      </p>
      <p className={styles.meta}>Nguồn: {proposal.context.sourceRevision.slice(0,25)}… ·
        Projection: {proposal.context.projectionId}</p>
    </>}
  </section>;
}
