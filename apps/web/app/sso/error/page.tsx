import Link from "next/link";
import { AppShell } from "@blueprint-os/ui";

export const dynamic = "force-dynamic";

const messages: Readonly<Record<string, string>> = {
  "owner-identity-mismatch": "Email Google được App-Manager xác minh không trùng với email tài khoản chủ sở hữu Blueprint. Hệ thống không tự cấp quyền cho một danh tính khác.",
  "link-conflict": "Tài khoản này đang có liên kết khác hoặc đã bị thu hồi. Không thể tự ghi đè quyền đã được thiết lập.",
  "link-required": "Chưa có liên kết tài khoản hợp lệ cho ứng dụng này.",
  "invalid-flow": "Phiên mở ứng dụng đã hết hạn hoặc không khớp. Hãy mở lại từ App-Manager.",
  "exchange-failed": "Mã truy cập dùng một lần đã hết hạn hoặc không xác minh được. Hãy mở lại ứng dụng.",
  "identity-invalid": "Máy chủ không thể xác minh đúng danh tính và quyền truy cập.",
  "unavailable": "Chế độ mở ứng dụng từ App-Manager chưa sẵn sàng trên môi trường này.",
  "server-unavailable": "Kết nối dữ liệu tạm gián đoạn. Vui lòng thử lại.",
  "missing-principal": "Hồ sơ chủ sở hữu Blueprint không còn hợp lệ.",
  "link-requires-hub-owner": "Danh tính App-Manager không khớp với tài khoản chủ sở hữu Blueprint."
};

export default async function SsoErrorPage({
  searchParams
}: {
  readonly searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const params = await searchParams;
  const reason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const message = reason && Object.hasOwn(messages, reason)
    ? messages[reason] : "Không thể hoàn tất mở Blueprint vào lúc này.";
  return (
    <AppShell>
      <main className="hub-settings">
        <section className="hub-settings-panel" role="alert">
          <h1>Chưa thể mở Blueprint</h1>
          <p>{message}</p>
          <p>Không cần mở trang Cài đặt hoặc liên kết tài khoản thủ công. Vui lòng trở lại App-Manager để thử lại; nếu thông báo tiếp tục xuất hiện, cần đối chiếu quyền và email đã xác minh.</p>
          <Link className="primary-button" href="https://application-management.boiech-ai.workers.dev/">
            ← Trở lại App-Manager
          </Link>
        </section>
      </main>
    </AppShell>
  );
}
