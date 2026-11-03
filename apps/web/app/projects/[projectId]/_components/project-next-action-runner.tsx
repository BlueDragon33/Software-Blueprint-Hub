"use client";

import { useRef, useState } from "react";
import {
  receiveGuidedCmdResult,
  startGuidedNextAction,
  type GuidedNextActionResult
} from "../actions";
import styles from "./project-action-guidance.module.css";

type NextKind = Parameters<typeof startGuidedNextAction>[2];

/** Presentation-only help from the authenticated, fresh server result.
 * No grant, prompt copy, external AI request, job dispatch or gate mutation.
 */
function assistanceSteps(result: GuidedNextActionResult): readonly string[] {
  if (result.state === "STALE") return [
    "Tải lại trang để nhận đúng ProjectProfile, WorkPackage và NEXT ACTION mới nhất.",
    "Đọc lại phạm vi rồi bấm hỗ trợ lần nữa. Không chạy theo checkpoint cũ."
  ];
  if (!result.generatedPlan || result.mode === "unavailable") return [
    "Kiểm tra quyền truy cập dự án và nguồn chuẩn. Không đoán quyền hoặc nguồn dữ liệu.",
    "Nếu vẫn bị chặn, chuyển thông báo lỗi cho người quản trị có thẩm quyền; không tự vượt gate."
  ];
  if (result.command) return [
    "Xác nhận đúng máy tính và checkout ứng với WorkPackage hiện hành.",
    "Chỉ chạy lệnh chẩn đoán chỉ đọc hiện trong khung CMD; không chạy lệnh tự suy diễn.",
    "Loại bỏ token, mật khẩu và dữ liệu cá nhân trước khi dán kết quả.",
    "Bấm tiếp nhận kết quả CMD; dữ liệu dán vẫn CHƯA XÁC MINH, không tự QA PASS."
  ];
  if (result.mode === "requires-granted-runner") return [
    "Đọc kết quả kiểm tra và xác định WorkPackage/Quality Gate đang chặn.",
    "Yêu cầu issuer và runner được cấp phép đúng phạm vi, gắn với HEAD và WorkPackage thực tế.",
    "Chỉ tiếp tục thao tác ghi sau khi có grant và bằng chứng kiểm thử; không tự duyệt hay deploy."
  ];
  return [
    "Xem các bước đã kiểm tra; kiểm tra nguồn SHA vì hiện có thể vẫn UNVERIFIED.",
    "Mở workspace được phân quyền nếu cần xem chi tiết nhiệm vụ.",
    "Tiếp tục từ Next Action hiện hành, giữ mọi Quality Gate chưa có bằng chứng ở trạng thái chờ."
  ];
}

export function ProjectNextActionRunner({
  projectId, profileVersion, actionKind, actionLabel
}: {
  readonly projectId: string;
  readonly profileVersion: number;
  readonly actionKind: NextKind;
  readonly actionLabel: string;
}) {
  const [busy,setBusy]=useState(false);
  const inFlight=useRef(false);
  const [result,setResult]=useState<GuidedNextActionResult|null>(null);
  const [commandOutput,setCommandOutput]=useState("");
  const [cmdStatus,setCmdStatus]=useState("");
  const [showAssistance,setShowAssistance]=useState(false);

  async function run(mode:"next"|"end-to-end", guided=false) {
    if (inFlight.current) return;
    inFlight.current=true;
    setBusy(true);
    setShowAssistance(guided);
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
    if (!result?.command || !commandOutput.trim() || inFlight.current) return;
    inFlight.current=true;
    setBusy(true);
    try {
      const response=await receiveGuidedCmdResult(
        projectId,profileVersion,actionKind,actionLabel,result.command.commandId,
        result.command.workPackageId,result.command.workPackageRecordVersion,commandOutput
      );
      setCmdStatus(response.detail);
      // Keep rejected text for correction; accepted text is not durable QA evidence.
      if (response.state==="UNVERIFIED_MANUAL_OUTPUT") setCommandOutput("");
    } catch {
      setCmdStatus("Không thể xác minh đầu ra. Không đóng Quality Gate.");
    } finally { inFlight.current=false; setBusy(false); }
  }

  return (
    <div className={styles.runWrap} aria-label="Điều phối NEXT ACTION">
      <button type="button" className="primary-button" disabled={busy} onClick={() => void run("next")}>
        {busy ? "Đang xử lý…" : "NEXT ACTION — TỰ LẬP KẾ HOẠCH & KIỂM TRA"}
      </button>
      <button type="button" className={styles.helpButton} disabled={busy}
        aria-pressed={showAssistance}
        onClick={() => void run("next", true)}>
        HỖ TRỢ NEXT ACTION — HƯỚNG DẪN TỪNG BƯỚC
      </button>
      <button type="button" className={styles.helpButton} disabled={busy}
        onClick={() => void run("end-to-end")}>
        KIỂM TRA TOÀN BỘ KẾ HOẠCH (TRONG QUYỀN HIỆN CÓ)
      </button>
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
          {showAssistance ? (
            <div className={styles.assistPanel} aria-label="Hỗ trợ NEXT ACTION theo Blueprint OS 1.3.0">
              <strong>Hướng dẫn xử lý đúng bước hiện hành</strong>
              <ol>{assistanceSteps(result).map((step,index)=><li key={index}>{step}</li>)}</ol>
              <p>Hỗ trợ chỉ dựa trên kết quả đọc có quyền. Không tự cấp grant, chứng nhận reviewer, QA PASS hay Production.</p>
            </div>
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
                disabled={busy || !commandOutput.trim()} onClick={() => void submitCmd()}>
                TIẾP NHẬN KẾT QUẢ CMD & PHÂN TÍCH
              </button>
            </div>
          ) : null}
          {result.nextHref ? (
            <a href={result.nextHref} className={styles.workflowLink}>
              MỞ WORKSPACE ĐÃ KIỂM TRA QUYỀN (KHÔNG TỰ THỰC THI)
            </a>
          ) : null}
        </section>
      ) : null}
      {cmdStatus ? <p role="status" className={styles.feedback}>{cmdStatus}</p> : null}
    </div>
  );
}
