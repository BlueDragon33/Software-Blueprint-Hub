import Link from "next/link";
import type { NextActionNavigation } from "../../src/lib/universal-next-action";

/** Same action affordance for every admitted or tracked project, never a fake executor. */
export function UniversalNextAction({ action }: { readonly action: NextActionNavigation }) {
  return (
    <section className="next-action-card universal-next-action"
      aria-label="Công việc tiếp theo" data-project-id={action.projectId}
      data-execution-authorized="false" data-next-action-state={action.state}>
      <p className="section-kicker">Công việc tiếp theo</p>
      <h2>{action.title}</h2>
      <p>{action.reason}</p>
      <div className="universal-next-action-controls">
        <Link className="primary-button" href={action.primary.href}>
          ↻ {action.primary.label}
        </Link>
        <Link className="secondary-button" href={action.secondary.href}>
          ☑ {action.secondary.label}
        </Link>
      </div>
      <p className="universal-next-action-caveat">
        {action.state === "onboarding-required"
          ? "Chưa có quyền thực thi liên tục. Hoàn thành hồ sơ và kiểm định theo đúng dự án trước."
          : "Đây là hướng dẫn thao tác, không phải lệnh chạy tự động. Chỉ hiển thị thực thi thật sau khi cấp quyền ký số, tiền kiểm và QA độc lập."}
      </p>
    </section>
  );
}
