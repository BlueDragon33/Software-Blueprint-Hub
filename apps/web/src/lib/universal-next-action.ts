/**
 * Presentation-only universal Next Action routing.
 *
 * A canonical readiness snapshot gives the next review/navigation target, NOT
 * permission to run a signed workflow. A tracked repository without a canonical
 * Profile must receive onboarding guidance, never invented READY state.
 *
 * Real execution requires separate canonical Project Authority, signed grant,
 * actual Gateway/Worker, independent QA and durable readback.
 */
export interface NextActionNavigation {
  readonly state: "canonical-guidance" | "onboarding-required";
  readonly projectId: string;
  readonly title: string;
  readonly reason: string;
  readonly primary: Readonly<{ label: string; href: string }>;
  readonly secondary: Readonly<{ label: string; href: string }>;
  readonly executionAuthorized: false;
}

export type CanonicalNextActionKind =
  | "define-gate" | "resolve-failed-gate" | "unblock-work"
  | "review-candidate" | "prepare-gate" | "continue-work" | "verify-release";

export function canonicalNextAction(input: {
  readonly projectId: string;
  readonly kind: CanonicalNextActionKind;
  readonly label: string;
  readonly reason: string;
}): NextActionNavigation {
  const root = "/projects/" + encodeURIComponent(input.projectId);
  const work = input.kind === "unblock-work" || input.kind === "continue-work";
  const release = input.kind === "verify-release";
  const primaryPage = release ? "/release-orchestration" : work ? "/roadmap" : "/quality";
  const secondaryPage = work ? "/quality" : "/roadmap";
  return Object.freeze({
    state: "canonical-guidance" as const,
    projectId: input.projectId,
    title: input.label,
    reason: input.reason,
    primary: Object.freeze({
      label: release ? "Kiểm tra điều kiện phát hành →" :
        work ? "Xem và xử lý Work Package →" : "Xem Quality Gates cần xử lý →",
      href: root + primaryPage
    }),
    secondary: Object.freeze({
      label: work ? "Xem bằng chứng QA" : "Xem lộ trình công việc",
      href: root + secondaryPage
    }),
    executionAuthorized: false as const
  });
}

export function trackedNextAction(input: {
  readonly projectId: string;
  readonly hasCanonicalProfile: boolean;
  readonly registrationState: "sealed-baseline" | "admitted-registration" | "pending-onboarding";
}): NextActionNavigation {
  const canonical = input.hasCanonicalProfile && input.registrationState !== "pending-onboarding";
  const root = "/projects/" + encodeURIComponent(input.projectId);
  if (canonical) {
    return Object.freeze({
      state: "canonical-guidance" as const,
      projectId: input.projectId,
      title: "Xác minh công việc tiếp theo theo từng dự án",
      reason: "Mở Tổng quan để đọc Next Action và các Quality Gate có thật. Có Profile không đồng nghĩa đã đủ quyền thực thi.",
      primary: Object.freeze({ label: "Mở Next Action của dự án →", href: root }),
      secondary: Object.freeze({ label: "Xem Quality Gates", href: root + "/quality" }),
      executionAuthorized: false as const
    });
  }
  const pending = input.registrationState === "pending-onboarding";
  return Object.freeze({
    state: "onboarding-required" as const,
    projectId: input.projectId,
    title: pending ? "Hoàn thiện tiếp nhận và xác minh thẩm quyền" :
      "Bổ sung Project Profile canonical",
    reason: pending
      ? "Repository mới được theo dõi ở trạng thái tiếp nhận; chưa có bằng chứng đăng ký và quyền thực thi đầy đủ."
      : "Repository được quản trị không tự động có Project Profile, Work Package hoặc Quality Gate canonical.",
    primary: Object.freeze({
      label: input.hasCanonicalProfile ? "Xem hồ sơ chuẩn đang có →" : "Xem quy trình tạo Project Profile →",
      href: input.hasCanonicalProfile ? root + "/profile" : "/projects/new"
    }),
    secondary: Object.freeze({
      label: "Xem hướng dẫn tiếp nhận dự án",
      href: "/ecosystem"
    }),
    executionAuthorized: false as const
  });
}
