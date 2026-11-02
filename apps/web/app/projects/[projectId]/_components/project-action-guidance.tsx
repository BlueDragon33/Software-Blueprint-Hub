"use client";

import { useId, useState } from "react";
import type { NextActionBlueprintCandidate } from "@blueprint-os/application";
import styles from "./project-action-guidance.module.css";

type Panel = "guidance" | "next" | "end-to-end";

/**
 * R33/R34 candidate. One Hub-owned blueprint powers all governed Project
 * Readiness screens. Prompt copy never runs a command or launches Work.
 */
export function ProjectActionGuidance({
  blueprint
}: {
  readonly blueprint: NextActionBlueprintCandidate;
}) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("guidance");
  const [copyStatus, setCopyStatus] = useState("");
  const detailId = useId();
  const source = panel === "next" ? blueprint.nextPrompt : blueprint.endToEndPrompt;

  async function copyPrompt() {
    setCopyStatus("");
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyStatus("Không thể tự sao chép. Hãy chọn nội dung trong ô để sao chép thủ công.");
      return;
    }
    try {
      await navigator.clipboard.writeText(source);
      setCopyStatus("Đã sao chép prompt. Chưa khởi chạy hay cấp quyền thực thi.");
    } catch {
      setCopyStatus("Trình duyệt chặn clipboard. Có thể chọn nội dung để sao chép thủ công.");
    }
  }

  return (
    <section className={styles.wrap} aria-label="Blueprint OS hướng dẫn và prompt thống nhất">
      <button
        type="button"
        className={styles.helpButton}
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((current) => !current)}
      >
        HƯỚNG DẪN · ĐỊNH HƯỚNG & PROMPT {open ? "−" : "+"}
      </button>
      {open ? (
        <div id={detailId} role="region" aria-label="Hướng dẫn Next Action" className={styles.helpPanel}>
          <p><strong>Ưu tiên:</strong> {blueprint.direction}</p>
          <p><strong>Dự án:</strong> {blueprint.projectId} · <strong>Hồ sơ:</strong> v{blueprint.profileVersion}</p>
          <p><strong>SHA nguồn:</strong> {blueprint.sourceRevision}</p>
          <div className={styles.tabs} role="group" aria-label="Chọn tài liệu hướng dẫn">
            <button type="button" aria-pressed={panel === "guidance"} onClick={() => { setPanel("guidance"); setCopyStatus(""); }}>
              Hướng dẫn
            </button>
            <button type="button" aria-pressed={panel === "next"} onClick={() => { setPanel("next"); setCopyStatus(""); }}>
              Prompt NEXT ACTION
            </button>
            <button type="button" aria-pressed={panel === "end-to-end"} onClick={() => { setPanel("end-to-end"); setCopyStatus(""); }}>
              Prompt từ đầu tới cuối
            </button>
          </div>
          {panel === "guidance" ? (
            <ol>
              {blueprint.guidance.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          ) : (
            <div className={styles.prompt}>
              <p className={styles.boundary}>
                {panel === "next"
                  ? "Prompt này mô tả MỘT bước ưu tiên, có ràng buộc quyền và bằng chứng."
                  : "Prompt này chỉ đề xuất chuỗi thực hiện liên tục trong phạm vi quyền đã cấp. Không tự mở Work/Codex."}
              </p>
              <textarea
                className={styles.promptText}
                aria-label={panel === "next" ? "Prompt bước tiếp theo" : "Prompt triển khai từ đầu tới cuối"}
                readOnly
                rows={10}
                value={source}
              />
              <button type="button" className={styles.copyButton} onClick={() => void copyPrompt()}>
                SAO CHÉP PROMPT {panel === "next" ? "NEXT ACTION" : "TỪ ĐẦU TỚI CUỐI"}
              </button>
              <p role="status" aria-live="polite">{copyStatus}</p>
            </div>
          )}
          <p className={styles.boundary}>
            NEXT ACTION bên ngoài chỉ điều hướng sau kiểm tra quyền/phiên bản trên máy chủ.
            Sao chép prompt không tạo quyền Work, điều khiển agent, phê duyệt hay xuất bản.
            R33/R34 hiện vẫn là dự thảo chờ phê chuẩn.
          </p>
        </div>
      ) : null}
    </section>
  );
}
