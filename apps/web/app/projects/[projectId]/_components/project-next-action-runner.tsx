"use client";

import { useState } from "react";
import {
  receiveGuidedCmdResult,
  startGuidedNextAction,
  type GuidedNextActionResult
} from "../actions";
import styles from "./project-action-guidance.module.css";

type NextKind = Parameters<typeof startGuidedNextAction>[2];

export function ProjectNextActionRunner({
  projectId, profileVersion, actionKind, actionLabel
}: {
  readonly projectId: string;
  readonly profileVersion: number;
  readonly actionKind: NextKind;
  readonly actionLabel: string;
}) {
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<GuidedNextActionResult|null>(null);
  const [commandOutput,setCommandOutput]=useState("");
  const [cmdStatus,setCmdStatus]=useState("");

  async function run(mode:"next"|"end-to-end") {
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
    } finally { setBusy(false); }
  }

  async function submitCmd() {
    if (!result?.command || !commandOutput.trim() || busy) return;
    setBusy(true);
    try {
      const response=await receiveGuidedCmdResult(
        projectId,profileVersion,actionKind,actionLabel,result.command.commandId,
        result.command.workPackageId,result.command.workPackageRecordVersion,commandOutput
      );
      setCmdStatus(response.detail);
      // Never store command output, elevate grants or auto mark QA PASS.
      setCommandOutput("");
    } catch {
      setCmdStatus("Không thể xác minh đầu ra. Không đóng Quality Gate.");
    } finally { setBusy(false); }
  }

  return (
    <div className={styles.runWrap} aria-label="Điều phối NEXT ACTION">
      <button type="button" className="primary-button" disabled={busy} onClick={() => void run("next")}>
        {busy ? "Đang xử lý…" : "NEXT ACTION — TỰ LẬP KẾ HOẠCH & XỬ LÝ"}
      </button>
      <button type="button" className={styles.helpButton} disabled={busy}
        onClick={() => void run("end-to-end")}>
        TRIỂN KHAI TỪ ĐẦU TỚI CUỐI (TRONG QUYỀN HIỆN CÓ)
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
