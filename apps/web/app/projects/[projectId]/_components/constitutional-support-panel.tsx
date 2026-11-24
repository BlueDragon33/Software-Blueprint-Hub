"use client";
import { useState } from "react";
import type { NextActionView } from "./universal-next-action.candidate";
import {
  buildConstitutionalNextPrompt,
  CONSTITUTIONAL_SUPPORT_DIRECTIONS
} from "./constitutional-prompt-builder.mjs";
import styles from "./constitutional-support-panel.module.css";

/** Pinned, keyboard-accessible guidance. Reviewing text never approves a QualityGate. */
export function ConstitutionalSupportPanel({ view }: { readonly view: NextActionView }) {
  const [direction, setDirection] = useState("p0-first");
  const [requirements, setRequirements] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [draftSource, setDraftSource] = useState<string | null>(null);
  const [approved, setApproved] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const sourceKey = JSON.stringify([
    view.projectId, view.sourceRevision, view.workPackageId, view.state,
    view.reason, direction, requirements
  ]);
  const currentDraft = draftSource === sourceKey ? draft : null;
  const isApproved = Boolean(currentDraft?.trim() && approved === currentDraft);
  const safeAction = view.action?.kind === "internal-navigation" &&
    /^\/(?!\/)[a-zA-Z0-9/_?=&%.-]*$/.test(view.action.href)
      ? view.action.href : null;

  function invalidate() {
    setApproved(null);
    setDraft(null);
    setDraftSource(null);
    setMessage("Định hướng hoặc yêu cầu đã thay đổi. Cần tạo và duyệt lại prompt.");
  }
  function generate() {
    const result = buildConstitutionalNextPrompt(view, requirements, direction);
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
    setMessage("Đã tạo bản nháp từ nguồn hiện tại. Kiểm tra và duyệt nội dung trước khi tiếp tục.");
  }
  async function copyApproved() {
    if (!isApproved || !currentDraft) return;
    try {
      await navigator.clipboard.writeText(currentDraft);
      setMessage("Đã sao chép prompt đã duyệt. Chưa chạy Agent hoặc cấp quyền phát hành.");
    } catch {
      setMessage("Clipboard không khả dụng. Hãy chọn và sao chép nội dung prompt thủ công.");
    }
  }
  function continueToWorkspace() {
    if (!isApproved || !safeAction) return;
    window.location.assign(safeAction);
  }
  return (
    <section id="blueprint-current-assistance" className={styles.panel}
      aria-labelledby="constitutional-assistance-title">
      <header className={styles.heading}>
        <h3 id="constitutional-assistance-title">Bảng hỗ trợ điều hướng</h3>
        <small>Đã ghim · Nguồn WorkPackage theo quyền truy cập</small>
      </header>
      <div className={styles.actions}>
        <a href="/constitution#constitution-authority-set-title">▣ Theo Hiến pháp</a>
        <button type="button" className={styles.primary} onClick={generate}
          disabled={!view.sourceRevision}>⌘ Tạo prompt tiếp theo</button>
      </div>
      <fieldset className={styles.guidance}>
        <legend>Định hướng của bạn</legend>
        {CONSTITUTIONAL_SUPPORT_DIRECTIONS.map(item => (
          <label className={styles.choice} key={item.id}>
            <input type="radio" name="constitutional-assistance-direction"
              value={item.id} checked={direction === item.id}
              onChange={() => { setDirection(item.id); invalidate(); }} />
            <span>{item.label}</span>
          </label>
        ))}
      </fieldset>
      <label htmlFor="constitutional-assistance-extra">Yêu cầu riêng</label>
      <textarea id="constitutional-assistance-extra" rows={3} maxLength={2000}
        value={requirements} placeholder="Ví dụ: kiểm tra dark mode, đóng P0 trước khi cải thiện P1…"
        onChange={event => { setRequirements(event.target.value); invalidate(); }} />
      {reviewOpen && (
        <div className={styles.review}>
          {currentDraft ? (
            <>
              <label htmlFor="constitutional-assistance-draft">Prompt được tạo · có thể chỉnh sửa trước khi duyệt</label>
              <textarea id="constitutional-assistance-draft" rows={9} maxLength={12000}
                value={currentDraft} onChange={event => {
                  setDraft(event.target.value);
                  setApproved(null);
                  setMessage("Nội dung đã chỉnh sửa, cần duyệt lại.");
                }} />
              <div className={styles.actions}>
                <button type="button" className={styles.outline}
                  disabled={!currentDraft.trim() || isApproved}
                  onClick={() => {
                    setApproved(currentDraft);
                    setMessage("Chỉ duyệt nội dung prompt. Không phê duyệt QA, merge hoặc Production.");
                  }}>{isApproved ? "✓ Đã duyệt prompt" : "✓ Duyệt prompt"}</button>
                <button type="button" className={styles.outline}
                  disabled={!isApproved} onClick={() => { void copyApproved(); }}>▢ Sao chép</button>
                <button type="button" className={styles.primary}
                  disabled={!isApproved || !safeAction}
                  onClick={continueToWorkspace}>➤ Thực hiện tiếp</button>
              </div>
            </>
          ) : <p role="status">Không có prompt hợp lệ; cần đối chiếu nguồn và tạo lại.</p>}
        </div>
      )}
      {message && <p role="status" className={styles.message}>{message}</p>}
      <p className={styles.note}>“Thực hiện tiếp” chỉ mở Workspace đã xác minh sau khi duyệt prompt;
        không tự gửi prompt, chạy Agent, công nhận P0/P1, mở G1 hoặc phát hành Production.</p>
    </section>
  );
}
