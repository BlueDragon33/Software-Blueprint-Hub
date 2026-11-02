"use client";

import { useId, useState } from "react";
import type { NextActionBlueprintCandidate } from "@blueprint-os/application";
import styles from "./project-action-guidance.module.css";

/** Read-only contextual guidance; the separate runner owns the real action. */
export function ProjectActionGuidance({
  blueprint
}: {
  readonly blueprint: NextActionBlueprintCandidate;
}) {
  const [open,setOpen]=useState(false);
  const id=useId();
  return (
    <section className={styles.wrap} aria-label="Blueprint OS — hướng dẫn nhiệm vụ">
      <button type="button" className={styles.helpButton}
        aria-expanded={open} aria-controls={id}
        onClick={() => setOpen(value => !value)}>
        HƯỚNG DẪN · KẾ HOẠCH & ĐỊNH HƯỚNG {open ? "−" : "+"}
      </button>
      {open ? (
        <div id={id} role="region" aria-label="Hướng dẫn NEXT ACTION" className={styles.helpPanel}>
          <p><strong>Ưu tiên:</strong> {blueprint.direction}</p>
          <p><strong>ProjectProfile:</strong> {blueprint.projectId} · v{blueprint.profileVersion}</p>
          <p><strong>SHA nguồn:</strong> {blueprint.sourceRevision}</p>
          <ol>{blueprint.guidance.map((line,index)=><li key={index}>{line}</li>)}</ol>
          <p className={styles.boundary}>
            Khi bấm NEXT ACTION, Hub tự tạo prompt và kế hoạch từ checkpoint hiện hành,
            tự đọc và kiểm tra phần được phép, rồi hiện kết quả ngay tại đây.
            Không cần sao chép prompt. Phần cần runner có ký quyền sẽ được báo BLOCKED.
          </p>
          <p className={styles.boundary}>
            Với nhiệm vụ có mã CMD đã được ghi trong WorkPackage chuẩn, hệ thống hiện
            lệnh chẩn đoán chỉ đọc và ô dán kết quả. Không thực thi shell trên máy của bạn.
            Dữ liệu dán không tự được công nhận là bằng chứng QA.
          </p>
        </div>
      ) : null}
    </section>
  );
}
