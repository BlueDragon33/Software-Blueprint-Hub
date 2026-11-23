"use client";
import { useState } from "react";
import type { NextActionView } from "./universal-next-action.candidate";
import { buildConstitutionalNextPrompt } from "./constitutional-prompt-builder.mjs";
import styles from "./constitutional-support-panel.module.css";

/** Single pinned workspace entry. Approval only permits copying prompt text. */
export function ConstitutionalSupportPanel({ view }: { readonly view: NextActionView }) {
  const [requirements, setRequirements] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [draftSource, setDraftSource] = useState<string | null>(null);
  const [approved, setApproved] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sourceKey = JSON.stringify([view.projectId, view.sourceRevision, view.workPackageId, view.state, view.reason]);
  const currentDraft = draftSource === sourceKey ? draft : null;
  function generate() {
    const result = buildConstitutionalNextPrompt(view, requirements);
    setReviewOpen(true);
    setApproved(null);
    if (!result) {
      setDraft(null);
      setDraftSource(null);
      setMessage("Nguồn chưa được xác minh. Không thể tạo prompt suy đoán.");
      return;
    }
    setDraft(result);
    setDraftSource(sourceKey);
    setMessage("Đã tạo bản nháp dựa trên Next Action. Xem lại nội dung trước khi duyệt.");
  }
  async function copyApproved() {
    if (!currentDraft || approved !== currentDraft) return;
    try {
      await navigator.clipboard.writeText(currentDraft);
      setMessage("Đã sao chép prompt đã duyệt. Chưa thực thi Agent hoặc cấp quyền phát hành.");
    } catch {
      setMessage("Clipboard không khả dụng. Có thể chọn và sao chép nội dung thủ công.");
    }
  }
  return (
    <section id="blueprint-current-assistance" className={styles.panel}
      aria-labelledby="constitutional-assistance-title">
      <header className={styles.heading}>
        <h3 id="constitutional-assistance-title">Bảng nút dùng ngay cho công việc hiện tại</h3>
        <small>Đã ghim · Nguồn WorkPackage theo quyền truy cập</small>
      </header>
      <div className={styles.actions}>
        <a href="/constitution#constitution-authority-set-title">⚖ Theo Hiến pháp</a>
        <button type="button" onClick={generate} disabled={!view.sourceRevision}>✦ Tạo prompt tiếp theo</button>
      </div>
      <label htmlFor="constitutional-assistance-extra">Thêm yêu cầu riêng</label>
      <textarea id="constitutional-assistance-extra" rows={3} maxLength={2000} value={requirements}
        placeholder="Ví dụ: kiểm thử dark mode, giữ cấu trúc dữ liệu, ghi ảnh desktop/mobile..."
        onChange={event => {
          setRequirements(event.target.value);
          setApproved(null);
          setDraft(null);
          setMessage("Yêu cầu thay đổi. Tạo lại prompt và duyệt nội dung trước khi sao chép.");
        }} />
      {reviewOpen && (
        <div className={styles.review}>
          {currentDraft ? (
            <>
              <label htmlFor="constitutional-assistance-draft">Bản nháp — có thể chỉnh sửa trước khi duyệt</label>
              <textarea id="constitutional-assistance-draft" rows={9} maxLength={12000}
                value={currentDraft} onChange={event => {
                  setDraft(event.target.value);
                  setApproved(null);
                  setMessage("Nội dung đã chỉnh sửa, cần duyệt lại.");
                }} />
              <div className={styles.actions}>
                <button type="button" disabled={!currentDraft.trim() || approved === currentDraft}
                  onClick={() => {
                    setApproved(currentDraft);
                    setMessage("Chỉ duyệt nội dung PROMPT. Không phê duyệt QA, WorkPackage, merge hoặc Production.");
                  }}>Duyệt nội dung prompt</button>
                <button type="button" disabled={approved !== currentDraft}
                  onClick={() => { void copyApproved(); }}>Sao chép prompt đã duyệt</button>
                <button type="button" onClick={() => setReviewOpen(false)}>Thu gọn</button>
              </div>
            </>
          ) : <p role="status">Không có prompt hợp lệ; cần đối chiếu nguồn và tạo lại.</p>}
        </div>
      )}
      {message && <p role="status" className={styles.message}>{message}</p>}
      <p className={styles.note}>Không tự chạy Agent, thay đổi dữ liệu canonical, PASS Gate hoặc publish.
        Lưu nhiệm vụ PLANNED là hành động riêng, vẫn cần quyền và xác minh lại nguồn.</p>
    </section>
  );
}
