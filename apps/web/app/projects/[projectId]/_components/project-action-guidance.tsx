"use client";

import { useId, useState } from "react";
import styles from "./project-action-guidance.module.css";

/**
 * R33 candidate: contextual instructions accompany the real canonical CTA.
 * Guidance has no authority, dispatch, Work launch or state mutation.
 */
export function ProjectActionGuidance({
  projectId,
  profileVersion,
  actionTitle,
  reason
}: {
  readonly projectId: string;
  readonly profileVersion: number;
  readonly actionTitle: string;
  readonly reason: string;
}) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.helpButton}
        aria-expanded={open}
        aria-controls={detailId}
        onClick={() => setOpen((current) => !current)}
      >
        HƯỚNG DẪN {open ? "−" : "+"}
      </button>
      {open ? (
        <div id={detailId} role="region" aria-label="Hướng dẫn công việc tiếp theo" className={styles.helpPanel}>
          <p><strong>Dự án:</strong> {projectId} · <strong>Hồ sơ:</strong> v{profileVersion}</p>
          <ol>
            <li><strong>Việc cần xử lý:</strong> {actionTitle}</li>
            <li><strong>Căn cứ:</strong> {reason}</li>
            <li>
              Bấm nút <strong>NEXT ACTION — Tiếp tục nhiệm vụ</strong> bên dưới để kiểm tra lại
              quyền đọc dự án, phiên bản hồ sơ và loại hành động, rồi mở đúng trang làm việc.
              Nút này <strong>không tự chạy Work, sửa nguồn, phê duyệt hay xuất bản</strong>.
            </li>
            <li>
              Nếu thông tin đã thay đổi, đọc trạng thái mới trước khi thao tác.
              Chỉ yêu cầu con người khi có cổng quyền thực tế.
            </li>
          </ol>
          <p className={styles.boundary}>
            TRIỂN KHAI TỪ ĐẦU TỚI CUỐI chỉ khả dụng sau khi bộ thực thi được cấp quyền
            và tích hợp thật. Không có quyền đó thì không được tạo nút chạy giả.
          </p>
        </div>
      ) : null}
    </div>
  );
}
