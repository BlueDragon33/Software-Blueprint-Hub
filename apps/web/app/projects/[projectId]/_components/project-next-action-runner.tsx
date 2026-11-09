"use client";

import { useRef, useState } from "react";
import {
  receiveGuidedCmdResult,
  startGuidedNextAction,
  type GuidedNextActionResult
} from "../actions";
import styles from "./project-action-guidance.module.css";

type NextKind = Parameters<typeof startGuidedNextAction>[2];

export function ProjectNextActionRunner({
  projectId, profileVersion, actionKind, actionLabel, fallbackHref, actionChanged = false
}: {
  readonly projectId: string;
  readonly profileVersion: number;
  readonly actionKind: NextKind;
  readonly actionLabel: string;
  /** Navigation derived from the authorized canonical readiness snapshot. */
  readonly fallbackHref: string;
  readonly actionChanged?: boolean;
}) {
  const [busy,setBusy]=useState(false);
  const [scope,setScope]=useState<"next"|"end-to-end">("next");
  const inFlight=useRef(false);
  const [result,setResult]=useState<GuidedNextActionResult|null>(null);
  const [commandOutput,setCommandOutput]=useState("");
  const [cmdStatus,setCmdStatus]=useState("");

  async function run(mode:"next"|"end-to-end") {
    if (actionChanged || inFlight.current) return;
    inFlight.current=true;
    setBusy(true);
    setCmdStatus("");
    setCommandOutput("");
    setResult(null);
    try {
      // One click: server creates prompt/plan internally, reauthorizes and
      // executes every available read-only stage. No clipboard needed.
      setResult(await startGuidedNextAction(projectId,profileVersion,actionKind,actionLabel,mode));
    } catch {
      setCmdStatus("Không thể đọc nguồn chuẩn. Không có tác vụ nào được xác nhận hoàn thành.");
    } finally { inFlight.current=false; setBusy(false); }
  }

  async function submitCmd() {
    if (actionChanged || !result?.command || !commandOutput.trim() || inFlight.current) return;
    inFlight.current=true;
    setBusy(true);
    try {
      const response=await receiveGuidedCmdResult(
        projectId,profileVersion,actionKind,actionLabel,result.command.commandId,
        result.command.workPackageId,result.command.workPackageRecordVersion,commandOutput
      );
      setCmdStatus(response.detail);
      // Keep rejected text for correction. Accepted output is still untrusted:
      // discard it, then independently re-read the canonical checkpoint.
      // Never interpret pasted text as an issuer grant or Quality Gate PASS.
      if (response.state==="UNVERIFIED_MANUAL_OUTPUT") {
        setCommandOutput("");
        const refreshed = await startGuidedNextAction(
          projectId,profileVersion,actionKind,actionLabel,"next"
        );
        setResult(refreshed);
        setCmdStatus(response.detail + (
          refreshed.state==="STALE"
            ? " Checkpoint đã thay đổi; cần tải lại trước khi tiếp tục."
            : refreshed.state==="BLOCKED"
              ? " Đã kiểm tra lại: bước tiếp theo vẫn bị chặn bởi điều kiện/quyền hiện hành."
              : " Đã đọc lại checkpoint từ nguồn chuẩn. Kết quả CMD thủ công không đóng Quality Gate."
        ));
      }
    } catch {
      setCmdStatus("Không thể xác minh đầu ra. Không đóng Quality Gate.");
    } finally { inFlight.current=false; setBusy(false); }
  }

  return (
    <div className={styles.runWrap} aria-label="Điều phối NEXT ACTION">
      <label htmlFor="next-action-scope">Phạm vi kiểm tra</label>
      <select id="next-action-scope" className={styles.scopeSelect}
        value={scope} disabled={busy || actionChanged}
        onChange={event => setScope(event.target.value==="end-to-end"?"end-to-end":"next")}>
        <option value="next">Bước hiện hành</option>
        <option value="end-to-end">KIỂM TRA TOÀN BỘ KẾ HOẠCH (TRONG QUYỀN HIỆN CÓ)</option>
      </select>
      <button type="button" className="primary-button" disabled={busy || actionChanged} onClick={() => void run(scope)}>
        {busy ? "Đang xử lý…" : "NEXT ACTION — TỰ LẬP KẾ HOẠCH & KIỂM TRA"}
      </button>
      <a href={fallbackHref} className={styles.workflowLink}>
        MỞ BƯỚC TƯƠNG ỨNG TRONG DỰ ÁN (CHỈ ĐIỀU HƯỚNG)
      </a>
      {result ? (
        <section role="status" aria-live="polite" className={styles.runResult}>
          <strong>{result.title}</strong>
          <p>{result.detail}</p>
          <p>
            Nguồn: {result.readback?.currentSourceRevision ?? "UNVERIFIED"} ·
            WorkPackage đọc: {result.readback?.workPackagesRead ?? 0} ·
            Quality Gate đọc: {result.readback?.gatesRead ?? 0}
          </p>
          <p>Trạng thái: {result.state}. Không tự nâng QA PASS hoặc cấp quyền.</p>
          <p>Phạm vi: {result.scope==="next"?"Bước hiện hành":"Toàn bộ công việc có thể kiểm tra"}. Chưa chạy sửa mã.</p>
          {result.assistance ? (
            <section className={styles.assistPanel} aria-label="Hỗ trợ Action theo nhiệm vụ hiện hành">
              <strong>HỖ TRỢ ACTION — {result.assistance.focus==="quality-gate"
                ? "QUALITY GATE" : result.assistance.focus==="work-package"
                  ? "WORKPACKAGE" : "RELEASE"}</strong>
              <p><strong>Nhiệm vụ:</strong> {result.assistance.currentTask}</p>
              <p><strong>Vì sao ưu tiên:</strong> {result.assistance.whySelected}</p>
              <p><strong>Đối tượng:</strong> {result.assistance.targetId ?? "Chưa có ID mục tiêu"} ·
                {result.assistance.workStatus ?? "Chưa xác minh trạng thái"}
              </p>
              <strong>Bằng chứng cần chuẩn bị / đối chiếu</strong>
              <ul>{result.assistance.evidenceChecklist.map((item,index) =>
                <li key={index}>{item}</li>)}</ul>
              <p><strong>Điểm dừng bắt buộc:</strong> {result.assistance.stopRule}</p>
              <p>Đây là hướng dẫn từ checkpoint đã kiểm tra; không phải quyền ký, phê duyệt hoặc thực thi.</p>
            </section>
          ) : null}
          {result.inspectedSteps.length > 0 ? (
            <div>
              <strong>Đã thực hiện</strong>
              <ul>{result.inspectedSteps.map((step,index)=><li key={index}>{step}</li>)}</ul>
            </div>
          ) : null}
          {result.pendingSteps.length > 0 ? (
            <div>
              <strong>Chưa thực hiện / chờ điều kiện</strong>
              <ul>{result.pendingSteps.map((step,index)=><li key={index}>{step}</li>)}</ul>
            </div>
          ) : null}
          {result.state==="STALE" ? (
            <button type="button" className={styles.helpButton} onClick={() => window.location.reload()}>
              TẢI LẠI NEXT ACTION HIỆN HÀNH
            </button>
          ) : null}
          {result.command ? (
            <div className={styles.cmdPanel}>
              <strong>CMD — nhiệm vụ có bước chẩn đoán chỉ đọc</strong>
              <p>{result.command.instruction}</p>
              <code>{result.command.displayCommand}</code>
              <label htmlFor="next-action-cmd-output">Dán stdout/stderr sau khi đã loại bỏ dữ liệu nhạy cảm</label>
              <textarea id="next-action-cmd-output" value={commandOutput} rows={6}
                maxLength={24000} onChange={event => setCommandOutput(event.target.value)}
                placeholder="Dán kết quả CMD ở đây. Kết quả sẽ được phân tích, không tự xem là QA PASS."/>
              <button type="button" className={styles.helpButton}
                disabled={busy || actionChanged || !commandOutput.trim()} onClick={() => void submitCmd()}>
                TIẾP NHẬN KẾT QUẢ CMD & PHÂN TÍCH
              </button>
            </div>
          ) : null}

        </section>
      ) : null}
      {cmdStatus ? <p role="status" className={styles.feedback}>{cmdStatus}</p> : null}
    </div>
  );
}
